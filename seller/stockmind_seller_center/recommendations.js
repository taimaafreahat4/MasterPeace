
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const D = window.StockMindSellerData;
    const root = $("recommendations-list");
    const empty = $("rec-empty");

    if (!root || !empty) {
        console.error("Recommendations HTML elements are missing.");
        return;
    }

    /* =========================================
       LOAD SHARED NAVIGATION FOOTER
    ========================================= */

    async function loadFooter() {
        const footer = $("footer-container");
        if (!footer) return;

        try {
            const response = await fetch("../../components/footer.html");

            if (!response.ok) {
                throw new Error(`Footer error: ${response.status}`);
            }

            footer.innerHTML = await response.text();
        } catch (error) {
            console.error("Footer loading failed:", error);
        }
    }

    loadFooter();

    if (!D || typeof D.getInventory !== "function") {
        root.innerHTML = `
            <article class="rec-empty">
                <h3>Inventory data is unavailable</h3>
                <p>Check seller-data.js and refresh the page.</p>
            </article>
        `;
        return;
    }

    /* =========================================
       HELPERS
    ========================================= */

    const money = value => {
        if (typeof D.money === "function") return D.money(value);
        return `JOD ${Number(value || 0).toFixed(2)}`;
    };

    const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);

    const number = value => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    function getRemaining(product) {
        return Math.max(
            0,
            number(product.purchased ?? product.quantity) -
            number(product.sold)
        );
    }

    function getDaysHeld(product) {
        return Math.max(
            0,
            number(product.days ?? product.daysHeld ?? product.ageDays)
        );
    }

    /*
     * Optional dated history format:
     *
     * product.salesHistory = [
     *   { date: "2026-09-01", quantity: 5 },
     *   { date: "2026-09-14", quantity: 3 }
     * ]
     *
     * Also supports salesRecords or history arrays.
     */

    function getDatedSales(product) {
        const records =
            product.salesHistory ||
            product.salesRecords ||
            product.history;

        if (!Array.isArray(records)) return null;

        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        let recent = 0;
        let previous = 0;
        let validRecords = 0;

        records.forEach(record => {
            if (!record || typeof record !== "object") return;

            const dateValue =
                record.date ||
                record.soldAt ||
                record.createdAt;

            const timestamp = Date.parse(dateValue);

            if (!Number.isFinite(timestamp)) return;

            const age = now - timestamp;

            if (age < 0 || age >= thirtyDays * 2) return;

            const units = Math.max(
                0,
                number(
                    record.quantity ??
                    record.units ??
                    record.qty ??
                    record.sold
                )
            );

            validRecords++;

            if (age < thirtyDays) {
                recent += units;
            } else {
                previous += units;
            }
        });

        if (validRecords === 0) return null;

        let trend = "Not enough dated data";

        if (previous > 0) {
            const change = ((recent - previous) / previous) * 100;

            trend = change >= 10
                ? `Up ${Math.round(change)}%`
                : change <= -10
                    ? `Down ${Math.abs(Math.round(change))}%`
                    : "Broadly stable";
        } else if (recent > 0) {
            trend = "Recent activity";
        } else {
            trend = "No sales in these periods";
        }

        return {
            recent,
            previous,
            trend,
            records: validRecords
        };
    }

    /* =========================================
       BUILD DATA-BASED PRODUCT INDICATORS
    ========================================= */

    function analyzeProduct(product) {
        const purchased = Math.max(
            0,
            number(product.purchased ?? product.quantity)
        );

        const sold = Math.max(0, number(product.sold));
        const remaining = getRemaining(product);
        const days = getDaysHeld(product);

        const unitCost = Math.max(
            0,
            number(product.unitCost ?? product.costPrice ?? product.cost)
        );

        const sellPrice = Math.max(
            0,
            number(product.sellPrice ?? product.sellingPrice ?? product.price)
        );

        const sellThrough = purchased > 0
            ? Math.min(100, (sold / purchased) * 100)
            : 0;

        /*
         * This velocity uses aggregate units sold divided by
         * recorded holding age. It is not a recent sales trend.
         */
        const dailyVelocity = days > 0 ? sold / days : 0;

        const daysCover = dailyVelocity > 0
            ? remaining / dailyVelocity
            : Infinity;

        const capital = remaining * unitCost;

        const marginPct = sellPrice > 0
            ? ((sellPrice - unitCost) / sellPrice) * 100
            : 0;

        const datedHistory = getDatedSales(product);

        /* Calculate an explainable stock-risk score. */
        let risk = 0;

        if (days >= 60) risk += 32;
        else if (days >= 45) risk += 24;
        else if (days >= 30) risk += 13;

        if (days >= 30 && sellThrough < 20) {
            risk += 26;
        } else if (days >= 30 && sellThrough < 40) {
            risk += 17;
        } else if (days >= 20 && sellThrough < 50) {
            risk += 10;
        }

        if (remaining > 0 && dailyVelocity === 0 && days >= 20) {
            risk += 20;
        }

        if (Number.isFinite(daysCover)) {
            if (daysCover > 60) risk += 18;
            else if (daysCover > 30) risk += 10;
        }

        if (sellThrough >= 75 && days < 30) {
            risk -= 12;
        }

        if (remaining === 0) {
            risk = 0;
        }

        risk = Math.max(0, Math.min(100, Math.round(risk)));

        const priority = risk >= 60
            ? "high"
            : risk >= 32
                ? "medium"
                : "low";

        let actionType = "monitor";
        let actionTitle = "Monitor stock movement";
        let recommendation = "";
        let reason = "";

        if (remaining === 0) {
            actionTitle = "Review replenishment";
            recommendation =
                "No units remain. Review recent demand and supplier lead time before deciding whether to reorder.";
            reason = "Current recorded stock is depleted.";
        } else if (
            days >= 45 &&
            sellThrough < 40
        ) {
            actionType = "marketplace";
            actionTitle = "List surplus stock";
            recommendation =
                "Consider listing part of the remaining stock on the marketplace to reach buyers beyond your store.";
            reason =
                `Only ${Math.round(sellThrough)}% of the recorded purchase has sold after ${days} days.`;
        } else if (
            days >= 30 &&
            sellThrough < 50 &&
            marginPct >= 15
        ) {
            actionType = "discount";
            actionTitle = "Evaluate a controlled discount";
            recommendation =
                "Simulate a small markdown and review the remaining gross margin before changing the actual selling price.";
            reason =
                `Sales have reached ${Math.round(sellThrough)}% of the purchase, and the product has an estimated gross margin of ${marginPct.toFixed(1)}% at its current price.`;
        } else if (
            days >= 35 &&
            (sellThrough < 50 || daysCover > 45)
        ) {
            actionType = "branch";
            actionTitle = "Review transfer options";
            recommendation =
                "Compare actual sales and available stock by branch. Transfer only if another branch has evidence of stronger demand.";
            reason =
                "Stock age or estimated remaining coverage suggests comparing other sales channels before applying a markdown.";
        } else if (priority === "high" || priority === "medium") {
            actionType = marginPct >= 15 ? "discount" : "marketplace";
            actionTitle = marginPct >= 15
                ? "Review pricing options"
                : "Consider listing surplus";
            recommendation = marginPct >= 15
                ? "Compare a discounted-price scenario against current gross margin before deciding."
                : "Since price reductions may leave little margin, consider a marketplace listing or bundle instead.";
            reason =
                `Remaining stock is ${remaining} units and the recorded holding age is ${days} days.`;
        } else if (
            sellThrough >= 70 &&
            days < 30
        ) {
            actionType = "monitor";
            actionTitle = "Keep monitoring demand";
            recommendation =
                "Sell-through appears strong against this purchase. Maintain visibility and review replenishment against actual sales.";
            reason =
                `${Math.round(sellThrough)}% of the recorded purchase has sold within ${days} days.`;
        } else {
            actionType = "monitor";
            actionTitle = "Continue monitoring";
            recommendation =
                "The available data does not indicate an immediate high-priority action. Review stock and sales again as new records come in.";
            reason =
                `The product has ${remaining} units remaining and ${days} recorded holding days.`;
        }

        let trendLabel = "No dated sales history";

        if (datedHistory) {
            trendLabel = datedHistory.trend;
        }

        return {
            id: product.id,
            name: product.name || "Unnamed product",
            image: product.image || "",
            category: product.category || "Uncategorized",
            location: product.location || "Location not specified",
            condition: product.condition || "New",

            purchased,
            sold,
            remaining,
            days,

            unitCost,
            sellPrice,
            sellThrough,
            dailyVelocity,
            daysCover,
            capital,
            marginPct,

            risk,
            priority,
            actionType,
            actionTitle,
            recommendation,
            reason,

            datedHistory,
            trendLabel,
            raw: product
        };
    }

    /* =========================================
       HUMAN-READABLE DATA EVIDENCE
    ========================================= */

    function getEvidenceText(product) {
        const soldText =
            `${product.sold} of ${product.purchased} units sold`;

        const ageText = product.days > 0
            ? `Recorded age: ${product.days} days`
            : "Holding age not recorded";

        let coverageText;

        if (product.dailyVelocity > 0) {
            coverageText =
                `Approx. ${Math.round(product.daysCover)} days of stock at the recorded average pace`;
        } else {
            coverageText =
                "Coverage cannot be estimated because recorded sales are zero";
        }

        return {
            soldText,
            ageText,
            coverageText
        };
    }

    function priorityLabel(priority) {
        return {
            high: "High priority",
            medium: "Needs attention",
            low: "Monitor"
        }[priority] || "Monitor";
    }

    function formatDays(value) {
        return Number.isFinite(value)
            ? `${Math.round(value)} days`
            : "Not estimable";
    }

    /* =========================================
       SUMMARY METRICS
    ========================================= */

    function renderMetrics(allProducts, stockProducts) {
        const flagged = stockProducts.filter(
            product => product.priority === "high" ||
                       product.priority === "medium"
        );

        const capitalAtRisk = flagged.reduce(
            (sum, product) => sum + product.capital,
            0
        );

        const unitsAtRisk = flagged.reduce(
            (sum, product) => sum + product.remaining,
            0
        );

        $("metric-products").textContent =
            allProducts.length.toLocaleString();

        $("metric-attention").textContent =
            flagged.length.toLocaleString();

        $("metric-units").textContent =
            unitsAtRisk.toLocaleString();

        $("metric-capital").textContent = money(capitalAtRisk);
    }

    /* =========================================
       DISPLAY DATA SOURCE TRANSPARENCY
    ========================================= */

    function renderDataSource(allProducts) {
        const datedCount = allProducts.filter(
            product => product.datedHistory
        ).length;

        const title = $("rec-data-title");
        const description = $("rec-data-description");
        const badge = $("rec-data-badge");

        if (datedCount > 0) {
            title.textContent = "Historical sales records detected";

            description.textContent =
                `${datedCount} product records include dated sales entries. ` +
                "Recent and preceding 30-day activity can be compared where data exists. " +
                "Other products use aggregate inventory totals.";

            badge.textContent = "DATED HISTORY";
        } else {
            title.textContent = "Recommendations based on recorded inventory";

            description.textContent =
                "This data currently contains cumulative purchased/sold quantities and stock age. " +
                "The page uses these figures to calculate risk; it will not invent monthly sales trends.";

            badge.textContent = "AGGREGATE DATA";
        }
    }

    /* =========================================
       RENDER PRODUCT CARDS
    ========================================= */

    let analyzedProducts = [];
    let selectedDiscountProduct = null;

    function renderCards() {
        const query = $("rec-search").value.trim().toLowerCase();
        const priorityFilter = $("rec-priority").value;
        const actionFilter = $("rec-action").value;

        const filtered = analyzedProducts.filter(product => {
            const searchText = [
                product.name,
                product.category,
                product.location
            ].join(" ").toLowerCase();

            const matchesSearch = searchText.includes(query);

            const matchesPriority =
                priorityFilter === "all" ||
                product.priority === priorityFilter;

            const matchesAction =
                actionFilter === "all" ||
                product.actionType === actionFilter;

            return matchesSearch && matchesPriority && matchesAction;
        });

        $("rec-count").textContent =
            `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;

        empty.hidden = filtered.length > 0;

        if (filtered.length === 0) {
            root.innerHTML = "";
            return;
        }

        root.innerHTML = filtered.map(product => {
            const evidence = getEvidenceText(product);
            const imageHTML = product.image
                ? `<img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy">`
                : "📦";

            const sellThroughWidth = Math.max(
                0,
                Math.min(100, product.sellThrough)
            );

            const salesHistoryHTML = product.datedHistory
                ? `
                    <div class="rec-evidence-item">
                        <span>Recent vs previous 30 days</span>
                        <strong>${esc(product.trendLabel)}</strong>
                        <small>
                            Recent: ${product.datedHistory.recent} units ·
                            Previous: ${product.datedHistory.previous} units
                        </small>
                    </div>
                `
                : `
                    <div class="rec-evidence-item">
                        <span>Sales trend</span>
                        <strong>Not available</strong>
                        <small>
                            Dated sales records are required to compare periods.
                        </small>
                    </div>
                `;

            return `
                <article class="rec-card priority-${product.priority}">

                    <div class="rec-card-head">

                        <div class="rec-product-image">
                            ${imageHTML}
                        </div>

                        <div class="rec-product-info">
                            <h3>${esc(product.name)}</h3>

                            <div class="rec-product-meta">
                                <span>${esc(product.category)}</span>
                                <span>·</span>
                                <span>${esc(product.location)}</span>
                            </div>

                            <div style="margin-top:8px">
                                <span class="rec-priority ${product.priority}">
                                    <span class="rec-priority-dot"></span>
                                    ${priorityLabel(product.priority)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="rec-insight">
                        <span class="rec-insight-label">
                            Suggested next action
                        </span>

                        <h4>${esc(product.actionTitle)}</h4>

                        <p>${esc(product.recommendation)}</p>
                    </div>

                    <div class="rec-evidence-label">
                        Why this recommendation?
                    </div>

                    <div class="rec-evidence">

                        <div class="rec-evidence-item">
                            <span>Remaining units</span>
                            <strong>${product.remaining.toLocaleString()}</strong>
                            <small>${product.purchased.toLocaleString()} purchased</small>
                        </div>

                        <div class="rec-evidence-item">
                            <span>Units sold</span>
                            <strong>${product.sold.toLocaleString()}</strong>
                            <small>${product.days} recorded holding days</small>
                        </div>

                        <div class="rec-evidence-item">
                            <span>Capital in remaining stock</span>
                            <strong>${money(product.capital)}</strong>
                            <small>At recorded purchase cost</small>
                        </div>

                        <div class="rec-evidence-item">
                            <span>Stock coverage estimate</span>
                            <strong>${formatDays(product.daysCover)}</strong>
                            <small>Uses cumulative sales divided by holding days</small>
                        </div>

                        ${salesHistoryHTML}

                        <div class="rec-evidence-item">
                            <span>Recorded gross margin</span>
                            <strong>${product.sellPrice > 0
                                ? `${product.marginPct.toFixed(1)}%`
                                : "Unavailable"}</strong>
                            <small>Before operating costs and fees</small>
                        </div>

                    </div>

                    <div class="rec-sellthrough">
                        <div class="rec-sellthrough-heading">
                            <span>Purchase sell-through</span>
                            <strong>${product.sellThrough.toFixed(1)}%</strong>
                        </div>

                        <div
                            class="rec-progress"
                            role="progressbar"
                            aria-label="Purchase sell-through"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            aria-valuenow="${Math.round(product.sellThrough)}">

                            <span style="width:${sellThroughWidth}%"></span>
                        </div>
                    </div>

                    <p class="rec-card-footnote">
                        ${esc(product.reason)}
                    </p>

                    <div class="rec-card-actions">

                        <button
                            type="button"
                            class="rec-action-button primary"
                            data-action="marketplace"
                            data-id="${esc(product.id)}">
                            List surplus ↗
                        </button>

                        <button
                            type="button"
                            class="rec-action-button"
                            data-action="discount"
                            data-id="${esc(product.id)}">
                            Simulate discount
                        </button>

                        <a
                            class="rec-action-button"
                            href="inventory.html">
                            Review inventory
                        </a>
                    </div>

                </article>
            `;
        }).join("");
    }

    /* =========================================
       MARKETPLACE DRAFT
    ========================================= */

    function createMarketplaceDraft(product) {
        if (product.remaining <= 0) {
            alert("No remaining stock is available to list.");
            return;
        }

        const draft = {
            name: product.raw.name || "",
            category: product.raw.category || "Other",
            condition: product.raw.condition || "New",
            quantity: product.remaining,
            price: product.sellPrice || product.unitCost || 0,
            minOrder: 1,
            location: product.raw.location || "Amman, Jordan",
            seller: "My Store",
            image: product.raw.image || "",
            description:
                "Surplus stock prepared from Stock Mind inventory recommendations."
        };

        try {
            if (typeof D.write === "function") {
                D.write("stockMindPrelistProduct", draft);
            } else {
                localStorage.setItem(
                    "stockMindPrelistProduct",
                    JSON.stringify(draft)
                );
            }

            window.location.href = "marketplace.html?newListing=1";
        } catch (error) {
            console.error("Could not prepare marketplace listing:", error);
            alert("Could not prepare the listing. Please check browser storage.");
        }
    }

    /* =========================================
       DISCOUNT SIMULATOR
    ========================================= */

    function updateDiscountScenario() {
        if (!selectedDiscountProduct) return;

        const product = selectedDiscountProduct;
        const rate = number($("discount-rate").value);
        const currentPrice = product.sellPrice;
        const cost = product.unitCost;

        const newPrice = currentPrice * (1 - rate / 100);
        const profit = newPrice - cost;
        const margin = newPrice > 0
            ? (profit / newPrice) * 100
            : -Infinity;

        $("discount-original").textContent = money(currentPrice);
        $("discount-new-price").textContent = money(newPrice);
        $("discount-profit").textContent = money(profit);

        $("discount-margin").textContent =
            Number.isFinite(margin) ? `${margin.toFixed(1)}%` : "Unavailable";

        const warning = $("discount-warning");

        if (newPrice < cost) {
            warning.textContent =
                "Warning: this price is below recorded unit cost and would create a gross loss per unit before other costs.";
            warning.style.background = "#fff0f2";
            warning.style.color = "#b52f48";
        } else if (margin < 10) {
            warning.textContent =
                "Caution: the remaining gross margin is below 10%. Review fees and operating costs before applying this discount.";
            warning.style.background = "#fff5e5";
            warning.style.color = "#916019";
        } else {
            warning.textContent =
                "Scenario only. This calculates the price and gross margin; it does not predict how many extra units the discount will sell.";
            warning.style.background = "#f7f4ff";
            warning.style.color = "#66548f";
        }
    }

    function openDiscountSimulator(product) {
        if (product.sellPrice <= 0) {
            alert("A valid selling price is needed to simulate a discount.");
            return;
        }

        selectedDiscountProduct = product;

        $("discount-product-name").textContent = product.name;
        $("discount-rate").value = "10";

        updateDiscountScenario();

        $("discount-modal").hidden = false;
        $("discount-rate").focus();
    }

    function closeDiscountSimulator() {
        $("discount-modal").hidden = true;
        selectedDiscountProduct = null;
    }

    /* =========================================
       EVENT DELEGATION FOR CARD ACTIONS
    ========================================= */

    root.addEventListener("click", event => {
        const button = event.target.closest("[data-action]");

        if (!button) return;

        const product = analyzedProducts.find(
            item => String(item.id) === button.dataset.id
        );

        if (!product) {
            alert("Product was not found in the current inventory.");
            return;
        }

        if (button.dataset.action === "marketplace") {
            createMarketplaceDraft(product);
        }

        if (button.dataset.action === "discount") {
            openDiscountSimulator(product);
        }
    });

    $("discount-rate").addEventListener(
        "change",
        updateDiscountScenario
    );

    document.querySelectorAll("[data-close-discount]").forEach(button => {
        button.addEventListener("click", closeDiscountSimulator);
    });

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !$("discount-modal").hidden
        ) {
            closeDiscountSimulator();
        }
    });

    /* =========================================
       SEARCH AND FILTERS
    ========================================= */

    $("rec-search").addEventListener("input", renderCards);
    $("rec-priority").addEventListener("change", renderCards);
    $("rec-action").addEventListener("change", renderCards);

    $("rec-reset-filters").addEventListener("click", () => {
        $("rec-search").value = "";
        $("rec-priority").value = "all";
        $("rec-action").value = "all";

        renderCards();
    });

    /* =========================================
       INITIAL DATA LOAD
    ========================================= */

    function initialize() {
        let inventory;

        try {
            inventory = D.getInventory();

            if (!Array.isArray(inventory)) {
                throw new Error("Inventory data must be an array.");
            }
        } catch (error) {
            console.error("Inventory loading failed:", error);

            $("rec-data-title").textContent = "Could not load inventory";
            $("rec-data-description").textContent =
                "Check seller-data.js and your saved inventory data.";

            $("rec-data-badge").textContent = "LOAD ERROR";

            root.innerHTML = `
                <div class="rec-empty">
                    <h3>Inventory data unavailable</h3>
                    <p>Refresh the page after checking seller-data.js.</p>
                </div>
            `;

            $("metric-products").textContent = "—";
            $("metric-attention").textContent = "—";
            $("metric-units").textContent = "—";
            $("metric-capital").textContent = "—";

            empty.hidden = true;
            return;
        }

        const analyzed = inventory.map(analyzeProduct);

        /* Only products with available stock belong in surplus actions. */
        const inStock = analyzed.filter(product => product.remaining > 0);

        inStock.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };

            return (
                priorityOrder[b.priority] - priorityOrder[a.priority] ||
                b.risk - a.risk ||
                b.capital - a.capital
            );
        });

        analyzedProducts = inStock;

        renderDataSource(analyzed);
        renderMetrics(inventory, inStock);
        renderCards();
    }

    initialize();
});
