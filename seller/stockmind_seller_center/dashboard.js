/* =========================================================
   STOCK MIND — SELLER DASHBOARD
   Data-driven dashboard, charts and inventory priorities.
   No external chart library required.
   ========================================================= */

(() => {
    "use strict";

    const AGE_SLOW_DAYS = 40;
    const AGE_CRITICAL_DAYS = 60;
    const LOW_STOCK_COVER_DAYS = 14;
    const LOW_MARGIN_PERCENT = 15;
    const MAX_CHART_PRODUCTS = 5;
    const MAX_TABLE_PRODUCTS = 10;
    const MAX_ACTIONS = 6;

    const COLORS = {
        healthy: "#269a76",
        slow: "#e2a13b",
        critical: "#d95d6a",
        unknown: "#a2acbe",
        purple: "#8064e9",
        blue: "#4c7ce9",
        green: "#269a76",
        amber: "#dc982c"
    };

    const $ = (selector) => document.querySelector(selector);

    /* -----------------------------------------------------
       GENERAL HELPERS
       ----------------------------------------------------- */

    function numberOrNull(value) {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return null;
        }

        const result = Number(value);

        return Number.isFinite(result) ? result : null;
    }

    function firstNumber(object, keys) {
        for (const key of keys) {
            if (
                object &&
                Object.prototype.hasOwnProperty.call(object, key)
            ) {
                const value = numberOrNull(object[key]);

                if (value !== null) {
                    return value;
                }
            }
        }

        return null;
    }

    function firstText(object, keys, fallback = "") {
        for (const key of keys) {
            const value = object && object[key];

            if (value !== null && value !== undefined) {
                const text = String(value).trim();

                if (text !== "") {
                    return text;
                }
            }
        }

        return fallback;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function formatNumber(value, decimals = 0) {
        if (!Number.isFinite(Number(value))) {
            return "—";
        }

        return new Intl.NumberFormat(undefined, {
            maximumFractionDigits: decimals,
            minimumFractionDigits: 0
        }).format(Number(value));
    }

    function formatAmount(value) {
        if (!Number.isFinite(Number(value))) {
            return "—";
        }

        return new Intl.NumberFormat(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0
        }).format(Number(value));
    }

    function formatPercent(value) {
        if (!Number.isFinite(Number(value))) {
            return "—";
        }

        return `${formatNumber(value, 1)}%`;
    }

    function getArrayFromGetter(dataObject, methodName) {
        try {
            if (
                !dataObject ||
                typeof dataObject[methodName] !== "function"
            ) {
                return [];
            }

            const value = dataObject[methodName]();

            return Array.isArray(value) ? value : [];
        } catch (error) {
            console.error(
                `Stock Mind: Could not read ${methodName}().`,
                error
            );

            return [];
        }
    }

    /* -----------------------------------------------------
       READ INVENTORY FIELDS
       Supports common names used by seller inventory data.
       ----------------------------------------------------- */

    function getProductName(product, index = 0) {
        return firstText(
            product,
            ["name", "productName", "title", "itemName", "label"],
            `Product ${index + 1}`
        );
    }

    function getProductID(product, index = 0) {
        return firstText(
            product,
            ["id", "productId", "sku", "code"],
            `product-${index}`
        );
    }

    function getSold(product) {
        const value = firstNumber(product, [
            "sold",
            "quantitySold",
            "unitsSold",
            "soldQuantity",
            "totalSold"
        ]);

        return {
            value: value === null ? 0 : Math.max(0, value),
            known: value !== null
        };
    }

    function getPurchased(product) {
        return firstNumber(product, [
            "purchased",
            "quantityPurchased",
            "initialQuantity",
            "originalQuantity",
            "unitsPurchased"
        ]);
    }

    function getStock(product) {
        const purchased = getPurchased(product);
        const sold = getSold(product).value;

        /*
         * When initial/purchased quantity is available, calculate:
         * remaining stock = purchased quantity - sold quantity.
         */

        if (purchased !== null) {
            const rawRemaining = purchased - sold;

            return {
                units: Math.max(0, rawRemaining),
                known: true,
                negativeCalculation: rawRemaining < 0
            };
        }

        /*
         * Otherwise use an explicit on-hand or quantity field.
         * Here quantity is treated as current stock, not original
         * purchased stock, when no original quantity is recorded.
         */

        const remaining = firstNumber(product, [
            "remaining",
            "remainingQuantity",
            "quantityOnHand",
            "availableQuantity",
            "inStock",
            "stock",
            "quantity",
            "qty"
        ]);

        if (remaining === null) {
            return {
                units: 0,
                known: false,
                negativeCalculation: false
            };
        }

        return {
            units: Math.max(0, remaining),
            known: true,
            negativeCalculation: remaining < 0
        };
    }

    function getStockAge(product) {
        const age = firstNumber(product, [
            "days",
            "daysHeld",
            "ageDays",
            "daysInStock",
            "stockAge",
            "age"
        ]);

        if (age === null || age < 0) {
            return null;
        }

        return age;
    }

    function getUnitCost(product) {
        const cost = firstNumber(product, [
            "unitCost",
            "costPrice",
            "cost",
            "purchasePrice",
            "buyPrice"
        ]);

        if (cost === null || cost < 0) {
            return null;
        }

        return cost;
    }

    function getSellPrice(product) {
        const price = firstNumber(product, [
            "sellPrice",
            "sellingPrice",
            "price",
            "retailPrice"
        ]);

        if (price === null || price < 0) {
            return null;
        }

        return price;
    }

    function getCategory(product) {
        return firstText(
            product,
            ["category", "categoryName", "type", "department"],
            "Uncategorized"
        );
    }

    function getProductImage(product) {
        const image = firstText(
            product,
            ["image", "imageUrl", "imageURL", "thumbnail", "photo"],
            ""
        );

        if (!image) {
            return "";
        }

        /*
         * Accept ordinary image URLs and local project paths.
         * Reject other URL schemes in image attributes.
         */

        const safeURL =
            /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(image) ||
            /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(image);

        return safeURL ? image : "";
    }

    /* -----------------------------------------------------
       NORMALIZE PRODUCTS
       ----------------------------------------------------- */

    function normalizeProduct(product, index) {
        const soldData = getSold(product);
        const stockData = getStock(product);
        const purchased = getPurchased(product);
        const days = getStockAge(product);
        const cost = getUnitCost(product);
        const sellPrice = getSellPrice(product);

        const units = stockData.units;
        const sold = soldData.value;

        const stockCost =
            cost !== null && stockData.known
                ? units * cost
                : null;

        let sellThrough = null;

        if (purchased !== null && purchased > 0 && soldData.known) {
            sellThrough = Math.min(100, (sold / purchased) * 100);
        } else if (stockData.known && soldData.known) {
            const totalObserved = units + sold;

            if (totalObserved > 0) {
                sellThrough = Math.min(
                    100,
                    (sold / totalObserved) * 100
                );
            }
        }

        let marginPercent = null;

        if (
            cost !== null &&
            sellPrice !== null &&
            sellPrice > 0
        ) {
            marginPercent = ((sellPrice - cost) / sellPrice) * 100;
        }

        const salesPace =
            soldData.known && days !== null && days > 0
                ? sold / days
                : null;

        const estimatedStockCover =
            salesPace !== null && salesPace > 0 && stockData.known
                ? units / salesPace
                : null;

        let status = "unknown";

        if (days !== null) {
            if (days >= AGE_CRITICAL_DAYS) {
                status = "critical";
            } else if (days >= AGE_SLOW_DAYS) {
                status = "slow";
            } else {
                status = "healthy";
            }
        }

        return {
            raw: product,
            id: getProductID(product, index),
            name: getProductName(product, index),
            category: getCategory(product),
            image: getProductImage(product),

            units,
            stockKnown: stockData.known,
            negativeCalculation: stockData.negativeCalculation,

            sold,
            soldKnown: soldData.known,
            purchased,

            days,
            cost,
            sellPrice,

            stockCost,
            sellThrough,
            marginPercent,
            salesPace,
            estimatedStockCover,

            status
        };
    }

    /* -----------------------------------------------------
       FOOTER
       ----------------------------------------------------- */

    function loadFooter() {
        const footer = document.getElementById("footer-container");

        if (!footer) {
            return;
        }

        fetch("../../components/footer.html")
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Footer could not be loaded.");
                }

                return response.text();
            })
            .then((html) => {
                footer.innerHTML = html;
            })
            .catch((error) => {
                console.error("Stock Mind footer loading error:", error);
            });
    }

    /* -----------------------------------------------------
       METRIC CARDS
       ----------------------------------------------------- */

    function renderMetrics(products, listings, savedAnalyses) {
        const knownStock = products.filter((p) => p.stockKnown);

        const totalUnits = knownStock.reduce(
            (sum, product) => sum + product.units,
            0
        );

        const unitsAtRisk = knownStock
            .filter(
                (product) =>
                    product.days !== null &&
                    product.days >= AGE_SLOW_DAYS
            )
            .reduce((sum, product) => sum + product.units, 0);

        const knownCostProducts = products.filter(
            (product) => product.stockCost !== null
        );

        const totalStockCost = knownCostProducts.reduce(
            (sum, product) => sum + product.stockCost,
            0
        );

        $("#metric-on-hand").textContent =
            formatNumber(totalUnits);

        $("#metric-products").textContent =
            formatNumber(products.length);

        $("#metric-at-risk").textContent =
            formatNumber(unitsAtRisk);

        $("#metric-capital").textContent =
            knownCostProducts.length > 0
                ? formatAmount(totalStockCost)
                : "N/A";

        $("#metric-listings").textContent =
            formatNumber(listings.length);

        $("#metric-analyses").textContent =
            formatNumber(savedAnalyses.length);

        const status = $("#dashboard-data-status");

        if (status) {
            status.textContent =
                `${products.length} inventory product record(s) loaded` +
                ` · ${knownStock.length} with readable stock quantities`;
        }
    }

    /* -----------------------------------------------------
       DONUT CHART — STOCK AGE
       ----------------------------------------------------- */

    function renderAgeChart(products) {
        const donut = $("#age-donut");
        const legend = $("#age-legend");
        const totalLabel = $("#age-total");
        const note = $("#age-note");

        const classified = products.filter(
            (product) => product.days !== null
        );

        const counts = {
            healthy: classified.filter(
                (product) => product.days < AGE_SLOW_DAYS
            ).length,

            slow: classified.filter(
                (product) =>
                    product.days >= AGE_SLOW_DAYS &&
                    product.days < AGE_CRITICAL_DAYS
            ).length,

            critical: classified.filter(
                (product) => product.days >= AGE_CRITICAL_DAYS
            ).length
        };

        const data = [
            {
                key: "healthy",
                label: `Under ${AGE_SLOW_DAYS} days`,
                value: counts.healthy,
                color: COLORS.healthy
            },
            {
                key: "slow",
                label: `${AGE_SLOW_DAYS}–${AGE_CRITICAL_DAYS - 1} days`,
                value: counts.slow,
                color: COLORS.slow
            },
            {
                key: "critical",
                label: `${AGE_CRITICAL_DAYS}+ days`,
                value: counts.critical,
                color: COLORS.critical
            }
        ];

        const total = classified.length;

        totalLabel.textContent = formatNumber(total);

        if (total === 0) {
            donut.className = "db-donut-empty";
            donut.innerHTML = "<span>—</span>";

            legend.innerHTML = `
                <div class="db-legend-item">
                    <span class="db-legend-color"
                          style="background:${COLORS.unknown}"></span>
                    <div class="db-legend-copy">
                        <span class="db-legend-label">Age data unavailable</span>
                        <strong class="db-legend-value">0 products classified</strong>
                    </div>
                </div>
            `;

            note.textContent =
                "Add days-in-stock information to classify products by age.";

            return;
        }

        const radius = 48;
        const circumference = 2 * Math.PI * radius;
        let cumulativeLength = 0;

        const segments = data
            .filter((item) => item.value > 0)
            .map((item) => {
                const length =
                    (item.value / total) * circumference;

                const segment = `
                    <circle
                        class="db-donut-segment"
                        cx="60"
                        cy="60"
                        r="${radius}"
                        stroke="${item.color}"
                        stroke-dasharray="${length} ${circumference - length}"
                        stroke-dashoffset="${-cumulativeLength}"
                    />
                `;

                cumulativeLength += length;

                return segment;
            })
            .join("");

        donut.className = "";
        donut.innerHTML = `
            <svg viewBox="0 0 120 120"
                 role="img"
                 aria-label="Stock age breakdown">
                <circle
                    class="db-donut-track"
                    cx="60"
                    cy="60"
                    r="${radius}"
                />
                ${segments}
            </svg>
        `;

        legend.innerHTML = data
            .map((item) => `
                <div class="db-legend-item">
                    <span class="db-legend-color"
                          style="background:${item.color}"></span>

                    <div class="db-legend-copy">
                        <span class="db-legend-label">
                            ${escapeHTML(item.label)}
                        </span>
                        <strong class="db-legend-value">
                            ${formatNumber(item.value)}
                            <span style="color:#a0a9b9;font-weight:600">
                                (${formatPercent((item.value / total) * 100)})
                            </span>
                        </strong>
                    </div>
                </div>
            `)
            .join("");

        const missingAge = products.length - classified.length;

        note.textContent = missingAge > 0
            ? `${missingAge} product(s) excluded because their stock age is not recorded.`
            : "Each product is counted once using its recorded days in stock.";
    }

    /* -----------------------------------------------------
       BAR CHART HELPER
       ----------------------------------------------------- */

    function renderBars(container, items, options = {}) {
        const {
            emptyMessage = "Not enough recorded information to display this chart.",
            colorClass = "",
            formatValue = (value) => formatNumber(value)
        } = options;

        if (!container) {
            return;
        }

        if (!items.length) {
            container.innerHTML = `
                <div class="db-empty-chart">
                    ${escapeHTML(emptyMessage)}
                </div>
            `;

            return;
        }

        const maxValue = Math.max(
            ...items.map((item) => Math.max(0, item.value)),
            0
        );

        container.innerHTML = items
            .map((item) => {
                const percentage = maxValue > 0
                    ? Math.max(0, (item.value / maxValue) * 100)
                    : 0;

                return `
                    <div class="db-bar-row"
                         title="${escapeHTML(item.name)}: ${escapeHTML(formatValue(item.value))}">

                        <span class="db-bar-label">
                            ${escapeHTML(item.name)}
                        </span>

                        <div class="db-bar-track"
                             role="img"
                             aria-label="${escapeHTML(item.name)}">

                            <div
                                class="db-bar-fill ${colorClass}"
                                style="width:${percentage}%"
                            ></div>
                        </div>

                        <span class="db-bar-value">
                            ${escapeHTML(formatValue(item.value))}
                        </span>
                    </div>
                `;
            })
            .join("");
    }

    /* -----------------------------------------------------
       REMAINING STOCK CHART
       ----------------------------------------------------- */

    function renderStockChart(products) {
        const stockedProducts = products
            .filter(
                (product) =>
                    product.stockKnown &&
                    product.units > 0
            )
            .sort((a, b) => b.units - a.units)
            .slice(0, MAX_CHART_PRODUCTS)
            .map((product) => ({
                name: product.name,
                value: product.units
            }));

        renderBars($("#stock-bars"), stockedProducts, {
            colorClass: "db-bar-blue",
            emptyMessage:
                "No positive remaining quantities were found in the available inventory records."
        });
    }

    /* -----------------------------------------------------
       ESTIMATED SALES PACE CHART
       ----------------------------------------------------- */

    function renderSalesPaceChart(products) {
        const items = products
            .filter(
                (product) =>
                    product.soldKnown &&
                    product.days !== null &&
                    product.days > 0
            )
            .sort((a, b) => {
                return (b.salesPace ?? 0) - (a.salesPace ?? 0);
            })
            .slice(0, MAX_CHART_PRODUCTS)
            .map((product) => ({
                name: product.name,
                value: product.salesPace ?? 0
            }));

        renderBars($("#sales-pace-chart"), items, {
            colorClass: "db-bar-green",
            formatValue: (value) => `${formatNumber(value, 2)}/d`,
            emptyMessage:
                "Sales pace cannot be calculated yet. Products need recorded units sold and a positive number of days."
        });
    }

    /* -----------------------------------------------------
       CATEGORY COST CHART
       ----------------------------------------------------- */

    function renderCategoryChart(products) {
        const container = $("#category-chart");
        const note = $("#category-note");

        const categories = new Map();

        let productsWithCost = 0;
        let totalCostValue = 0;

        products.forEach((product) => {
            if (product.stockCost === null) {
                return;
            }

            productsWithCost += 1;
            totalCostValue += product.stockCost;

            const current = categories.get(product.category) || 0;

            categories.set(
                product.category,
                current + product.stockCost
            );
        });

        if (productsWithCost === 0) {
            container.innerHTML = `
                <div class="db-empty-chart">
                    Add unit cost information to your inventory products
                    to compare the cost value of your stock by category.
                </div>
            `;

            note.textContent =
                "Category cost totals are unavailable because unit cost fields were not found.";

            return;
        }

        const items = [...categories.entries()]
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        if (!items.length) {
            container.innerHTML = `
                <div class="db-empty-chart">
                    No category totals are available.
                </div>
            `;

            return;
        }

        const maxValue = Math.max(
            ...items.map((item) => item.value),
            0
        );

        container.innerHTML = items
            .map((item) => {
                const width = maxValue > 0
                    ? (item.value / maxValue) * 100
                    : 0;

                return `
                    <div class="db-category-row">
                        <span class="db-category-name"
                              title="${escapeHTML(item.name)}">
                            ${escapeHTML(item.name)}
                        </span>

                        <div class="db-category-track"
                             role="img"
                             aria-label="${escapeHTML(item.name)} cost value">

                            <div
                                class="db-category-fill"
                                style="width:${width}%"
                            ></div>
                        </div>

                        <span class="db-category-value">
                            ${formatAmount(item.value)}
                        </span>
                    </div>
                `;
            })
            .join("");

        const missingCost = products.length - productsWithCost;

        note.textContent =
            `${formatAmount(totalCostValue)} total estimated stock cost across ` +
            `${productsWithCost} product(s) with recorded unit costs` +
            (missingCost > 0
                ? ` · ${missingCost} product(s) excluded due to missing cost data.`
                : ".");
    }

    /* -----------------------------------------------------
       DATA QUALITY PANEL
       ----------------------------------------------------- */

    function renderDataQuality(products) {
        const container = $("#data-quality-list");

        const total = products.length;

        if (total === 0) {
            container.innerHTML = `
                <div class="db-quality-row">
                    <span class="db-quality-dot db-quality-warning"></span>
                    <span>No inventory product records were returned.</span>
                </div>
            `;

            return;
        }

        const stockKnown = products.filter(
            (product) => product.stockKnown
        ).length;

        const ageKnown = products.filter(
            (product) => product.days !== null
        ).length;

        const costKnown = products.filter(
            (product) => product.cost !== null
        ).length;

        const salesKnown = products.filter(
            (product) => product.soldKnown
        ).length;

        const negative = products.filter(
            (product) => product.negativeCalculation
        ).length;

        const checks = [
            {
                label: `Stock quantities available for ${stockKnown} of ${total} products.`,
                good: stockKnown === total,
                empty: stockKnown === 0
            },
            {
                label: `Stock age available for ${ageKnown} of ${total} products.`,
                good: ageKnown === total,
                empty: ageKnown === 0
            },
            {
                label: `Unit cost available for ${costKnown} of ${total} products.`,
                good: costKnown === total,
                empty: costKnown === 0
            },
            {
                label: `Units sold recorded for ${salesKnown} of ${total} products.`,
                good: salesKnown === total,
                empty: salesKnown === 0
            }
        ];

        if (negative > 0) {
            checks.push({
                label:
                    `${negative} product(s) have sold quantities greater than recorded purchased quantities. Please verify these records.`,
                good: false,
                empty: false
            });
        }

        container.innerHTML = checks
            .map((check) => {
                let className = "";

                if (check.empty) {
                    className = "db-quality-warning";
                } else if (!check.good) {
                    className = "db-quality-warning";
                }

                return `
                    <div class="db-quality-row">
                        <span class="db-quality-dot ${className}"></span>
                        <span>${escapeHTML(check.label)}</span>
                    </div>
                `;
            })
            .join("");
    }

    /* -----------------------------------------------------
       PRODUCT STATUS
       ----------------------------------------------------- */

    function getStatusInfo(product) {
        switch (product.status) {
            case "healthy":
                return {
                    label: "Under 40 days",
                    className: "db-status-healthy"
                };

            case "slow":
                return {
                    label: "Slow-moving",
                    className: "db-status-slow"
                };

            case "critical":
                return {
                    label: "Aged stock",
                    className: "db-status-critical"
                };

            default:
                return {
                    label: "Age unknown",
                    className: "db-status-unknown"
                };
        }
    }

    /* -----------------------------------------------------
       INVENTORY DETAILS TABLE
       ----------------------------------------------------- */

    function renderInventoryTable(products) {
        const tbody = $("#inventory-table-body");
        const summary = $("#inventory-table-summary");

        if (!products.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="db-table-empty">
                        No inventory records were returned.
                        Add products in My Inventory to populate this section.
                    </td>
                </tr>
            `;

            summary.textContent = "No inventory product records available.";

            return;
        }

        const statusRank = {
            critical: 0,
            slow: 1,
            healthy: 2,
            unknown: 3
        };

        const sorted = [...products].sort((a, b) => {
            const statusDifference =
                statusRank[a.status] - statusRank[b.status];

            if (statusDifference !== 0) {
                return statusDifference;
            }

            const ageA = a.days ?? -1;
            const ageB = b.days ?? -1;

            if (ageA !== ageB) {
                return ageB - ageA;
            }

            return (b.stockCost ?? -1) - (a.stockCost ?? -1);
        });

        const visible = sorted.slice(0, MAX_TABLE_PRODUCTS);

        tbody.innerHTML = visible
            .map((product) => {
                const status = getStatusInfo(product);
                const image = product.image
                    ? `
                        <img
                            src="${escapeHTML(product.image)}"
                            alt=""
                            loading="lazy"
                            onerror="this.style.display='none'"
                        >
                    `
                    : escapeHTML(
                        product.name.trim().charAt(0).toUpperCase() || "P"
                    );

                const ageLabel = product.days === null
                    ? "—"
                    : `${formatNumber(product.days)} days`;

                const sellThrough = product.sellThrough === null
                    ? "—"
                    : formatPercent(product.sellThrough);

                const stockCost = product.stockCost === null
                    ? "—"
                    : formatAmount(product.stockCost);

                return `
                    <tr>
                        <td>
                            <div class="db-product-cell">
                                <div class="db-product-avatar">
                                    ${image}
                                </div>

                                <div class="db-product-info">
                                    <strong title="${escapeHTML(product.name)}">
                                        ${escapeHTML(product.name)}
                                    </strong>
                                    <span>${escapeHTML(product.category)}</span>
                                </div>
                            </div>
                        </td>

                        <td>
                            <span class="db-table-number">
                                ${product.stockKnown
                                    ? formatNumber(product.units)
                                    : "—"}
                            </span>
                        </td>

                        <td>
                            <span class="db-table-number">
                                ${product.soldKnown
                                    ? formatNumber(product.sold)
                                    : "—"}
                            </span>
                        </td>

                        <td>${ageLabel}</td>

                        <td>${sellThrough}</td>

                        <td>
                            <span class="db-table-number">
                                ${stockCost}
                            </span>
                        </td>

                        <td>
                            <span class="db-stock-status ${status.className}">
                                ${escapeHTML(status.label)}
                            </span>
                        </td>
                    </tr>
                `;
            })
            .join("");

        summary.textContent =
            `Showing ${formatNumber(visible.length)} of ` +
            `${formatNumber(products.length)} inventory product(s).`;
    }

    /* -----------------------------------------------------
       PRIORITY ACTIONS
       One highest-priority action per product.
       These are rule-based inventory checks, not predictions.
       ----------------------------------------------------- */

    function getProductAction(product) {
        if (!product.stockKnown || product.units <= 0) {
            return null;
        }

        const candidates = [];

        if (
            product.days !== null &&
            product.days >= AGE_CRITICAL_DAYS
        ) {
            candidates.push({
                score: 100,
                severity: "red",
                tag: "High priority",
                icon: "!",
                title: "Review aged inventory",
                description:
                    `${formatNumber(product.units)} unit(s) remain and ` +
                    `the recorded stock age is ${formatNumber(product.days)} days. ` +
                    "Check demand, pricing and whether part of this stock should be listed.",
                linkLabel: "Review product"
            });
        }

        if (
            product.cost !== null &&
            product.sellPrice !== null &&
            product.sellPrice < product.cost
        ) {
            candidates.push({
                score: 95,
                severity: "red",
                tag: "Margin check",
                icon: "↘",
                title: "Selling price is below unit cost",
                description:
                    `The recorded selling price is ${formatAmount(product.sellPrice)} ` +
                    `while unit cost is ${formatAmount(product.cost)}. ` +
                    "Verify these values before making another sale.",
                linkLabel: "Review pricing"
            });
        }

        if (
            product.estimatedStockCover !== null &&
            product.estimatedStockCover <= LOW_STOCK_COVER_DAYS &&
            product.sold > 0
        ) {
            candidates.push({
                score: 80,
                severity: "purple",
                tag: "Check stock",
                icon: "↗",
                title: "Check remaining stock",
                description:
                    `About ${formatNumber(product.estimatedStockCover, 1)} days of stock ` +
                    "are suggested by current units and the aggregate sold-per-day average. " +
                    "Verify recent demand before reordering.",
                linkLabel: "Review stock"
            });
        }

        if (
            product.days !== null &&
            product.days >= AGE_SLOW_DAYS &&
            product.days < AGE_CRITICAL_DAYS
        ) {
            candidates.push({
                score: 70,
                severity: "amber",
                tag: "Needs review",
                icon: "◷",
                title: "Review slow-moving stock",
                description:
                    `${formatNumber(product.units)} unit(s) remain after ` +
                    `${formatNumber(product.days)} recorded days. ` +
                    "Consider checking sales, pricing and possible marketplace demand.",
                linkLabel: "Review product"
            });
        }

        if (
            product.marginPercent !== null &&
            product.marginPercent >= 0 &&
            product.marginPercent < LOW_MARGIN_PERCENT
        ) {
            candidates.push({
                score: 60,
                severity: "amber",
                tag: "Margin check",
                icon: "%",
                title: "Review the gross margin",
                description:
                    `The recorded gross margin is ${formatPercent(product.marginPercent)}. ` +
                    "Check whether the price adequately covers your intended costs.",
                linkLabel: "Review pricing"
            });
        }

        if (!candidates.length) {
            return null;
        }

        candidates.sort((a, b) => b.score - a.score);

        return {
            product,
            ...candidates[0]
        };
    }

    function renderAttentionList(products) {
        const container = $("#attention-list");

        const actions = products
            .map((product) => getProductAction(product))
            .filter(Boolean)
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_ACTIONS);

        if (!actions.length) {
            container.innerHTML = `
                <div class="db-panel db-empty-panel">
                    <strong style="display:block;color:#253451;margin-bottom:6px">
                        No urgent flags were calculated.
                    </strong>

                    No priority rule matched the available records.
                    This is not a guarantee that every product is performing well:
                    missing stock-age, cost or sales data can limit the checks.
                    <div style="margin-top:12px">
                        <a href="inventory.html" class="db-attention-link">
                            Review inventory →
                        </a>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML = actions
            .map((action) => {
                const iconClass =
                    action.severity === "red"
                        ? "db-attention-red"
                        : action.severity === "green"
                            ? "db-attention-green"
                            : action.severity === "purple"
                                ? "db-attention-purple"
                                : "";

                const tagClass =
                    action.severity === "red"
                        ? "db-tag-red"
                        : action.severity === "green"
                            ? "db-tag-green"
                            : action.severity === "purple"
                                ? "db-tag-purple"
                                : "";

                return `
                    <article class="db-attention-card">
                        <div class="db-attention-icon ${iconClass}"
                             aria-hidden="true">
                            ${escapeHTML(action.icon)}
                        </div>

                        <div class="db-attention-content">
                            <div class="db-attention-top">
                                <h3>${escapeHTML(action.title)}</h3>

                                <span class="db-attention-tag ${tagClass}">
                                    ${escapeHTML(action.tag)}
                                </span>
                            </div>

                            <p>
                                <strong style="color:#455572">
                                    ${escapeHTML(action.product.name)}:
                                </strong>
                                ${escapeHTML(action.description)}
                            </p>

                            <a href="inventory.html"
                               class="db-attention-link">
                                ${escapeHTML(action.linkLabel)} →
                            </a>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    /* -----------------------------------------------------
       SAVED ANALYSES
       ----------------------------------------------------- */

    function getSavedAnalyses() {
        try {
            const raw = localStorage.getItem("stockMindSavedAnalyses");

            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);

            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn(
                "Stock Mind: Saved analyses could not be read.",
                error
            );

            return [];
        }
    }

    /* -----------------------------------------------------
       MAIN INITIALIZATION
       ----------------------------------------------------- */

    function initDashboard() {
        loadFooter();

        const dataObject = window.StockMindSellerData;

        if (
            !dataObject ||
            typeof dataObject.getInventory !== "function"
        ) {
            console.error(
                "Stock Mind: StockMindSellerData.getInventory() is unavailable."
            );

            $("#dashboard-data-status").textContent =
                "Inventory data could not be loaded. Check seller-data.js.";

            $("#age-note").textContent =
                "The dashboard requires the existing seller inventory data module.";

            $("#stock-bars").innerHTML = `
                <div class="db-empty-chart">
                    Inventory data could not be loaded.
                    Check that seller-data.js loads successfully.
                </div>
            `;

            $("#sales-pace-chart").innerHTML = `
                <div class="db-empty-chart">
                    Sales pace is unavailable until inventory data loads.
                </div>
            `;

            $("#category-chart").innerHTML = `
                <div class="db-empty-chart">
                    Category cost data is unavailable until inventory data loads.
                </div>
            `;

            $("#attention-list").innerHTML = `
                <div class="db-panel db-empty-panel">
                    The inventory data module was not found.
                    Verify the seller-data.js script path and console errors.
                </div>
            `;

            $("#inventory-table-body").innerHTML = `
                <tr>
                    <td colspan="7" class="db-table-empty">
                        Inventory data could not be loaded.
                    </td>
                </tr>
            `;

            renderDataQuality([]);

            return;
        }

        const rawInventory = getArrayFromGetter(
            dataObject,
            "getInventory"
        );

        const listings = getArrayFromGetter(
            dataObject,
            "getListings"
        );

        const products = rawInventory.map(
            (product, index) => normalizeProduct(product, index)
        );

        const savedAnalyses = getSavedAnalyses();

        renderMetrics(products, listings, savedAnalyses);
        renderAgeChart(products);
        renderStockChart(products);
        renderSalesPaceChart(products);
        renderCategoryChart(products);
        renderDataQuality(products);
        renderAttentionList(products);
        renderInventoryTable(products);

        console.info("Stock Mind dashboard initialized.", {
            inventoryProducts: products.length,
            listings: listings.length,
            savedAnalyses: savedAnalyses.length
        });
    }

    document.addEventListener("DOMContentLoaded", initDashboard);
})();