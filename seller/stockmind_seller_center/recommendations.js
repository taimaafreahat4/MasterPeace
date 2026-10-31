/* =========================================================
   STOCK MIND — RECOMMENDATIONS + DEMO FORECAST
   Inventory actions + animated timeline + SVG chart
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const root = $("recommendations-list");
    const empty = $("rec-empty");
    const D = window.StockMindSellerData;

    let inventory = [];
    let analyzedProducts = [];
    let selectedDiscountProduct = null;

    /* =====================================================
       HELPERS
       ===================================================== */

    const number = value => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

    const money = value => {
        if (D && typeof D.money === "function") {
            return D.money(value);
        }

        return `JOD ${number(value).toFixed(2)}`;
    };

    const wait = milliseconds =>
        new Promise(resolve => setTimeout(resolve, milliseconds));

    const formatNumber = value =>
        Math.round(value).toLocaleString("en-US");

    /* =====================================================
       FOOTER
       ===================================================== */

    async function loadFooter() {
        const footer = $("footer-container");
        if (!footer) return;

        try {
            const response = await fetch("../../components/footer.html");

            if (!response.ok) {
                throw new Error(`Footer loading failed: ${response.status}`);
            }

            footer.innerHTML = await response.text();
        } catch (error) {
            console.error("Footer loading failed:", error);
        }
    }

    loadFooter();

    /* =====================================================
       FORECAST DEMO DATA
       All forecast numbers below are simulated examples.
       ===================================================== */

    const FORECASTS = {
        heater: {
            name: "Electric Heater",
            purchased: 100,
            sold: 25,
            remaining: 75,
            stockAgeDays: 60,

            demandMin: 10,
            demandMax: 16,
            risk: 78,

            actual: [14, 12, 10, 8, 6, 4],
            future: [4, 3, 3, 2],
            futureLow: [3, 2, 2, 1],
            futureHigh: [5, 4, 4, 3],

            insight:
                "Remaining stock is much higher than the simulated demand range for the next 30 days.",

            actionTitle: "Review surplus stock",

            action:
                "Consider listing part of the surplus or testing a controlled discount. Review actual sales before changing prices or ordering more."
        },

        fan: {
            name: "Electric Fan",
            purchased: 90,
            sold: 30,
            remaining: 60,
            stockAgeDays: 48,

            demandMin: 20,
            demandMax: 28,
            risk: 42,

            actual: [3, 4, 5, 6, 7, 8],
            future: [8, 7, 6, 5],
            futureLow: [6, 6, 5, 4],
            futureHigh: [10, 9, 8, 7],

            insight:
                "The simulated sales pattern is improving, but remaining stock is still higher than estimated 30-day demand.",

            actionTitle: "Monitor stock movement",

            action:
                "Review weekly sales and available stock before reordering. The example forecast is not proof that actual demand will continue to increase."
        }
    };

    /* =====================================================
       FORECAST REFERENCES
       ===================================================== */

    const forecastModule = $("demand-forecast");
    const productSelect = $("fd-product-select");
    const runButton = $("fd-run-button");
    const chart = $("fd-chart");
    const timeline = $("fd-timeline");
    const progressTrack = $("fd-progress-track");

    const timelineSteps = timeline
        ? Array.from(timeline.querySelectorAll("[data-step]"))
        : [];

    let forecastRunId = 0;

    function getSelectedForecast() {
        if (!productSelect) return FORECASTS.heater;

        return FORECASTS[productSelect.value] || FORECASTS.heater;
    }

    /* =====================================================
       FORECAST RISK LABELS
       ===================================================== */

    function getForecastRisk(score) {
        if (score >= 70) {
            return {
                label: "High risk",
                heading: "High dead-stock risk",
                className: "is-high"
            };
        }

        if (score >= 40) {
            return {
                label: "Moderate risk",
                heading: "Moderate dead-stock risk",
                className: "is-medium"
            };
        }

        return {
            label: "Low risk",
            heading: "Lower dead-stock risk",
            className: "is-low"
        };
    }

    /* =====================================================
       DRAW THE FORECAST CHART
       ===================================================== */

    function drawForecastChart(product) {
        if (!chart) return;

        const width = 720;
        const height = 260;

        const left = 42;
        const right = 700;
        const top = 22;
        const bottom = 194;

        const plotHeight = bottom - top;

        const allValues = [
            ...product.actual,
            ...product.futureHigh
        ];

        const maxValue = Math.max(
            10,
            Math.ceil(Math.max(...allValues) / 5) * 5
        );

        const x = index =>
            left + ((right - left) * index) / 9;

        const y = value =>
            bottom - (value / maxValue) * plotHeight;

        const actualPoints = product.actual.map((value, index) => ({
            x: x(index),
            y: y(value),
            value
        }));

        const futurePoints = product.future.map((value, index) => ({
            x: x(index + 6),
            y: y(value),
            value
        }));

        const lowPoints = product.futureLow.map((value, index) => ({
            x: x(index + 6),
            y: y(value),
            value
        }));

        const highPoints = product.futureHigh.map((value, index) => ({
            x: x(index + 6),
            y: y(value),
            value
        }));

        const linePath = points =>
            points.map((point, index) =>
                `${index === 0 ? "M" : "L"} ` +
                `${point.x.toFixed(1)} ${point.y.toFixed(1)}`
            ).join(" ");

        const actualPath = linePath(actualPoints);

        const lastActual = actualPoints[actualPoints.length - 1];

        const forecastPath = linePath([
            lastActual,
            ...futurePoints
        ]);

        const bandPath = [
            `M ${lastActual.x} ${lastActual.y}`,
            ...highPoints.map(point => `L ${point.x} ${point.y}`),
            ...lowPoints.slice().reverse().map(
                point => `L ${point.x} ${point.y}`
            ),
            `L ${lastActual.x} ${lastActual.y}`,
            "Z"
        ].join(" ");

        const grid = Array.from({ length: 5 }, (_, index) => {
            const value = maxValue - (maxValue * index) / 4;
            const yPosition = top + (plotHeight * index) / 4;

            return `
                <line
                    class="fd-chart-grid"
                    x1="${left}"
                    y1="${yPosition}"
                    x2="${right}"
                    y2="${yPosition}"
                />

                <text
                    class="fd-chart-label"
                    x="${left - 10}"
                    y="${yPosition + 3.5}"
                    text-anchor="end"
                >${Math.round(value)}</text>
            `;
        }).join("");

        const labels = [
            "-5w", "-4w", "-3w", "-2w", "-1w",
            "Today", "+1w", "+2w", "+3w", "+4w"
        ].map((label, index) => `
            <text
                class="fd-chart-label"
                x="${x(index)}"
                y="${bottom + 22}"
                text-anchor="middle"
            >${label}</text>
        `).join("");

        const actualDots = actualPoints.map(point => `
            <circle
                class="fd-chart-point"
                cx="${point.x}"
                cy="${point.y}"
                r="4"
            >
                <title>${point.value} simulated sales units</title>
            </circle>
        `).join("");

        const forecastDots = futurePoints.map(point => `
            <circle
                class="fd-chart-future-point"
                cx="${point.x}"
                cy="${point.y}"
                r="4"
            >
                <title>${point.value} simulated forecast units</title>
            </circle>
        `).join("");

        chart.innerHTML = `
            <svg
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Simulated past and future sales for ${esc(product.name)}"
            >
                <defs>
                    <linearGradient
                        id="fdBandGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop offset="0%"
                              stop-color="#e86fa9"
                              stop-opacity=".22" />

                        <stop offset="100%"
                              stop-color="#e86fa9"
                              stop-opacity=".025" />
                    </linearGradient>
                </defs>

                ${grid}

                <path class="fd-chart-band" d="${bandPath}"></path>

                <path class="fd-chart-actual" d="${actualPath}"></path>

                <path class="fd-chart-forecast"
                      d="${forecastPath}"></path>

                <line class="fd-chart-divider"
                      x1="${x(5.5)}"
                      y1="${top}"
                      x2="${x(5.5)}"
                      y2="${bottom}"></line>

                ${actualDots}
                ${forecastDots}

                <text
                    class="fd-chart-future-label"
                    x="${x(6) + 8}"
                    y="${top + 12}"
                >FORECAST →</text>

                ${labels}
            </svg>
        `;
    }

    /* =====================================================
       UPDATE FORECAST CARDS
       ===================================================== */

    function updateForecastDisplay(product) {
        if (!forecastModule) return;

        const risk = getForecastRisk(product.risk);

        const midpoint =
            (product.demandMin + product.demandMax) / 2;

        const excess = Math.max(
            0,
            Math.round(product.remaining - midpoint)
        );

        const comparisonMaximum = Math.max(
            product.remaining,
            midpoint,
            1
        );

        $("fd-demand-value").textContent =
            `${product.demandMin}–${product.demandMax} units`;

        $("fd-stock-value").textContent =
            `${formatNumber(product.remaining)} units`;

        $("fd-stock-caption").textContent =
            `${formatNumber(product.purchased)} purchased · ` +
            `${formatNumber(product.sold)} sold`;

        $("fd-risk-value").textContent =
            `${product.risk}%`;

        $("fd-risk-caption").textContent =
            `${risk.label} · demo score`;

        $("fd-excess-value").textContent =
            `${formatNumber(excess)} units`;

        $("fd-compare-stock").textContent =
            `${formatNumber(product.remaining)} units`;

        $("fd-compare-demand").textContent =
            `${formatNumber(midpoint)} units`;

        $("fd-stock-bar").style.width =
            `${(product.remaining / comparisonMaximum) * 100}%`;

        $("fd-demand-bar").style.width =
            `${(midpoint / comparisonMaximum) * 100}%`;

        const riskStrip = $("fd-risk-strip");

        riskStrip.classList.remove("is-high", "is-medium", "is-low");
        riskStrip.classList.add(risk.className);

        $("fd-risk-strip-icon").textContent =
            product.risk >= 70 ? "!" :
            product.risk >= 40 ? "~" : "✓";

        $("fd-risk-heading").textContent = risk.heading;
        $("fd-risk-detail").textContent = product.insight;

        $("fd-action-title").textContent = product.actionTitle;
        $("fd-action-description").textContent = product.action;

        $("fd-chart-summary").textContent =
            `${product.name}: the solid purple line represents simulated ` +
            "past sales; the dashed pink line represents simulated future demand.";

        drawForecastChart(product);
    }

    /* =====================================================
       RESET TIMELINE
       ===================================================== */

    function resetTimeline() {
        timelineSteps.forEach(step => {
            step.classList.remove("is-active", "is-complete");
        });

        $("fd-timeline-status").textContent = "Preparing demo…";
        $("fd-status-dot").classList.add("is-running");

        $("fd-progress-label").textContent = "0%";
        $("fd-progress-fill").style.width = "0%";

        progressTrack.setAttribute("aria-valuenow", "0");

        $("fd-stage-description").textContent =
            "Starting the simulated forecasting workflow.";

        $("fd-stage-counter").textContent =
            `0 / ${timelineSteps.length} stages complete`;

        timeline.style.setProperty("--fd-line-progress", "0%");
        timeline.style.setProperty("--fd-mobile-line-progress", "0px");
    }

    /* =====================================================
       ANIMATE FORECAST TIMELINE
       ===================================================== */

    async function runForecast() {
        if (!forecastModule || !productSelect || !runButton || !timeline) {
            return;
        }

        const runId = ++forecastRunId;
        const product = getSelectedForecast();

        const stageNames = [
            "Collecting inventory data…",
            "Analyzing sales movement…",
            "Estimating future demand…",
            "Evaluating dead-stock risk…",
            "Generating recommendation…"
        ];

        const stageDescriptions = [
            `Loading the simulated stock details for ${product.name}: ${product.remaining} units remain.`,
            `Reviewing six illustrative weekly sales values for ${product.name}.`,
            `Showing a simulated 30-day demand range of ${product.demandMin}–${product.demandMax} units.`,
            `Comparing remaining stock with the demo demand range and a simulated risk score of ${product.risk}%.`,
            `Preparing the illustrative recommendation: ${product.actionTitle.toLowerCase()}.`
        ];

        runButton.disabled = true;
        runButton.classList.add("is-running");
        forecastModule.classList.add("is-processing");

        $("fd-run-label").textContent = "Running…";

        resetTimeline();

        updateForecastDisplay(product);

        for (let index = 0; index < timelineSteps.length; index++) {
            if (runId !== forecastRunId) return;

            timelineSteps.forEach((step, stepIndex) => {
                step.classList.toggle("is-active", stepIndex === index);
                step.classList.toggle("is-complete", stepIndex < index);
            });

            const progress = Math.round(
                (index / Math.max(1, timelineSteps.length)) * 100
            );

            $("fd-timeline-status").textContent = stageNames[index];

            $("fd-stage-description").textContent =
                stageDescriptions[index];

            $("fd-progress-label").textContent =
                `${progress}%`;

            $("fd-progress-fill").style.width =
                `${progress}%`;

            progressTrack.setAttribute(
                "aria-valuenow",
                String(progress)
            );

            $("fd-stage-counter").textContent =
                `${index} / ${timelineSteps.length} stages complete`;

            timeline.style.setProperty(
                "--fd-line-progress",
                `${(index / Math.max(1, timelineSteps.length - 1)) * 82}%`
            );

            const timelineRect = timeline.getBoundingClientRect();

            const node = timelineSteps[index].querySelector(".fd-step-node");
            const nodeRect = node.getBoundingClientRect();

            const mobileProgress = Math.max(
                0,
                nodeRect.top + nodeRect.height / 2 -
                    timelineRect.top - 18
            );

            timeline.style.setProperty(
                "--fd-mobile-line-progress",
                `${mobileProgress}px`
            );

            await wait(720);
        }

        if (runId !== forecastRunId) return;

        timelineSteps.forEach(step => {
            step.classList.remove("is-active");
            step.classList.add("is-complete");
        });

        $("fd-timeline-status").textContent = "Demo forecast complete";
        $("fd-status-dot").classList.remove("is-running");

        $("fd-progress-label").textContent = "100%";
        $("fd-progress-fill").style.width = "100%";

        progressTrack.setAttribute("aria-valuenow", "100");

        $("fd-stage-description").textContent =
            `The demo workflow for ${product.name} is complete. ` +
            "Validate all figures against real dated sales before making business decisions.";

        $("fd-stage-counter").textContent =
            `${timelineSteps.length} / ${timelineSteps.length} stages complete`;

        timeline.style.setProperty("--fd-line-progress", "82%");

        if (timelineSteps.length) {
            const lastNode =
                timelineSteps[timelineSteps.length - 1]
                    .querySelector(".fd-step-node");

            const timelineRect = timeline.getBoundingClientRect();
            const nodeRect = lastNode.getBoundingClientRect();

            timeline.style.setProperty(
                "--fd-mobile-line-progress",
                `${Math.max(
                    0,
                    nodeRect.top + nodeRect.height / 2 -
                    timelineRect.top - 18
                )}px`
            );
        }

        runButton.classList.remove("is-running");
        runButton.disabled = false;
        $("fd-run-label").textContent = "Run again";

        forecastModule.classList.remove("is-processing");
    }

    /* Start the demo timeline once when the page opens. */
    if (forecastModule && productSelect && runButton && chart && timeline) {
        productSelect.addEventListener("change", runForecast);
        runButton.addEventListener("click", runForecast);

        updateForecastDisplay(getSelectedForecast());
        // Run the animated demo only when the seller requests it.
        // This keeps the overview calm and avoids surprise animations.
    } else {
        console.warn("Forecast demo HTML is incomplete.");
    }

    /* =====================================================
       INVENTORY RECOMMENDATION ENGINE
       ===================================================== */

    if (!root || !empty) {
        console.error("Recommendation HTML elements are missing.");
        return;
    }

    if (!D || typeof D.getInventory !== "function") {
        $("rec-data-title").textContent = "Inventory data unavailable";

        $("rec-data-description").textContent =
            "Check seller-data.js and the saved inventory records.";

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

        $("rec-count").textContent = "0 products";
        empty.hidden = true;
        return;
    }

    /* =====================================================
       INVENTORY DATA HELPERS
       ===================================================== */

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
      Optional sales-history format:
      product.salesHistory = [
        { date: "2026-09-01", quantity: 5 },
        { date: "2026-09-14", quantity: 3 }
      ]

      Aliases supported: salesRecords or history.
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

    /* =====================================================
       PRODUCT ANALYSIS
       ===================================================== */

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

        /* Aggregate historical average, not a recent trend. */
        const dailyVelocity = days > 0 ? sold / days : 0;

        const daysCover = dailyVelocity > 0
            ? remaining / dailyVelocity
            : Infinity;

        const capital = remaining * unitCost;

        const marginPct = sellPrice > 0
            ? ((sellPrice - unitCost) / sellPrice) * 100
            : 0;

        const datedHistory = getDatedSales(product);

        /* Explainable rule-based stock risk score. */
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
        } else if (days >= 45 && sellThrough < 40) {
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
                `Sales have reached ${Math.round(sellThrough)}% of the purchase, and estimated gross margin is ${marginPct.toFixed(1)}%.`;
        } else if (
            days >= 35 &&
            (sellThrough < 50 || daysCover > 45)
        ) {
            actionType = "branch";
            actionTitle = "Review transfer options";

            recommendation =
                "Compare actual sales and available stock by branch. Transfer only if another branch shows stronger demand.";

            reason =
                "Stock age or estimated coverage suggests comparing other sales channels before applying a markdown.";
        } else if (priority === "high" || priority === "medium") {
            actionType = marginPct >= 15 ? "discount" : "marketplace";

            actionTitle = marginPct >= 15
                ? "Review pricing options"
                : "Consider listing surplus";

            recommendation = marginPct >= 15
                ? "Compare a discounted-price scenario against the current gross margin before deciding."
                : "Since price reductions may leave little margin, consider a marketplace listing or bundle instead.";

            reason =
                `Remaining stock is ${remaining} units and recorded holding age is ${days} days.`;
        } else if (sellThrough >= 70 && days < 30) {
            actionType = "monitor";
            actionTitle = "Keep monitoring demand";

            recommendation =
                "Sell-through looks strong for this purchase. Monitor sales and check replenishment against actual demand.";

            reason =
                `${Math.round(sellThrough)}% of the recorded purchase has sold within ${days} days.`;
        } else {
            actionType = "monitor";
            actionTitle = "Continue monitoring";

            recommendation =
                "Available data does not indicate an immediate high-priority action. Review stock and sales as new records arrive.";

            reason =
                `The product has ${remaining} units remaining and ${days} recorded holding days.`;
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
            raw: product
        };
    }

    /* =====================================================
       SUMMARY METRICS AND DATA NOTE
       ===================================================== */

    function renderMetrics(allProducts, stockProducts) {
        const flagged = stockProducts.filter(
            product =>
                product.priority === "high" ||
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

    function renderDataSource(allProducts) {
        const datedCount = allProducts.filter(
            product => product.datedHistory
        ).length;

        if (datedCount > 0) {
            $("rec-data-title").textContent =
                "Historical sales records detected";

            $("rec-data-description").textContent =
                `${datedCount} product record(s) contain dated sales. ` +
                "Where available, the page can compare recent and preceding 30-day activity. " +
                "The Forecast module below still uses separate demo values.";

            $("rec-data-badge").textContent = "DATED HISTORY";
        } else {
            $("rec-data-title").textContent =
                "Recommendations based on recorded inventory";

            $("rec-data-description").textContent =
                "Your current inventory records contain cumulative quantities and stock age. " +
                "The page calculates inventory risk without inventing monthly sales trends. " +
                "The separate Forecast module uses labelled simulated data.";

            $("rec-data-badge").textContent = "AGGREGATE DATA";
        }
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

    function getEvidenceText(product) {
        return {
            soldText: `${product.sold} of ${product.purchased} units sold`,

            ageText: product.days > 0
                ? `Recorded age: ${product.days} days`
                : "Holding age not recorded",

            coverageText: product.dailyVelocity > 0
                ? `Approximately ${Math.round(product.daysCover)} days of stock at the recorded average sales pace`
                : "Coverage cannot be estimated because recorded sales are zero"
        };
    }

    /* =====================================================
       RENDER INVENTORY RECOMMENDATION CARDS
       ===================================================== */

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

            const historyHTML = product.datedHistory
                ? `
                    <div class="rec-evidence-item">
                        <span>Recent vs previous 30 days</span>
                        <strong>${esc(product.datedHistory.trend)}</strong>
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

                        ${historyHTML}

                        <div class="rec-evidence-item">
                            <span>Recorded gross margin</span>
                            <strong>${
                                product.sellPrice > 0
                                    ? `${product.marginPct.toFixed(1)}%`
                                    : "Unavailable"
                            }</strong>
                            <small>Before operating costs and fees</small>
                        </div>
                    </div>

                    <div class="rec-sellthrough">
                        <div class="rec-sellthrough-heading">
                            <span>Purchase sell-through</span>
                            <strong>${product.sellThrough.toFixed(1)}%</strong>
                        </div>

                        <div class="rec-progress"
                             role="progressbar"
                             aria-label="Purchase sell-through"
                             aria-valuemin="0"
                             aria-valuemax="100"
                             aria-valuenow="${Math.round(product.sellThrough)}">
                            <span style="width:${sellThroughWidth}%"></span>
                        </div>
                    </div>

                    <p class="rec-card-footnote">${esc(product.reason)}</p>

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

                        <a class="rec-action-button" href="inventory.html">
                            Review inventory
                        </a>

                    </div>

                </article>
            `;
        }).join("");
    }

    /* =====================================================
       MARKETPLACE LISTING DRAFT
       ===================================================== */

    function createMarketplaceDraft(product) {
        if (product.remaining <= 0) {
            showMessage("No remaining stock is available to list.");
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
            showMessage(
                "Could not prepare the listing. Please check browser storage."
            );
        }
    }

    /* =====================================================
       DISCOUNT SIMULATOR
       ===================================================== */

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
            Number.isFinite(margin)
                ? `${margin.toFixed(1)}%`
                : "Unavailable";

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
                "Scenario only. This calculates price and gross margin; it does not predict how many extra units a discount will sell.";

            warning.style.background = "#f7f4ff";
            warning.style.color = "#66548f";
        }
    }

    function openDiscountSimulator(product) {
        if (product.sellPrice <= 0) {
            showMessage("A valid selling price is needed to simulate a discount.");
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

    /* =====================================================
       RECOMMENDATION CARD BUTTONS
       ===================================================== */

    if (root) {
        root.addEventListener("click", event => {
            const button = event.target.closest("[data-action]");
            if (!button) return;

            const product = analyzedProducts.find(
                item => String(item.id) === button.dataset.id
            );

            if (!product) {
                showMessage("The product was not found in inventory.");
                return;
            }

            if (button.dataset.action === "marketplace") {
                createMarketplaceDraft(product);
            }

            if (button.dataset.action === "discount") {
                openDiscountSimulator(product);
            }
        });
    }

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

    /* =====================================================
       SEARCH AND FILTERS
       ===================================================== */

    $("rec-search").addEventListener("input", renderCards);
    $("rec-priority").addEventListener("change", renderCards);
    $("rec-action").addEventListener("change", renderCards);

    $("rec-reset-filters").addEventListener("click", () => {
        $("rec-search").value = "";
        $("rec-priority").value = "all";
        $("rec-action").value = "all";

        renderCards();
    });

    /* =====================================================
       INITIALIZE INVENTORY DATA
       ===================================================== */

    function initialize() {
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
                    <p>Refresh after checking seller-data.js.</p>
                </div>
            `;

            $("metric-products").textContent = "—";
            $("metric-attention").textContent = "—";
            $("metric-units").textContent = "—";
            $("metric-capital").textContent = "—";

            $("rec-count").textContent = "0 products";
            empty.hidden = true;
            return;
        }

        const analyzed = inventory.map(analyzeProduct);

        const inStock = analyzed.filter(
            product => product.remaining > 0
        );

        inStock.sort((a, b) => {
            const priorityOrder = {
                high: 3,
                medium: 2,
                low: 1
            };

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