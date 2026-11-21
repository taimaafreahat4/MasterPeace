/* =========================================================
   STOCK MIND — PRODUCT RECOMMENDATIONS + SALES-PACE FORECAST
   Seller product analysis, suggested actions and SVG forecast
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const root = $("recommendations-list");
    const empty = $("rec-empty");
    const D = window.StockMindSellerData;
    const productAnalysisForm = $("recommendation-product-form");
    const productImageInput = $("analysis-image");
    const productImagePreview = $("analysis-image-preview");

    let inventory = [];
    let analyzedProducts = [];
    let selectedDiscountProduct = null;
    let selectedAnalysisImage = "";

    const manualAnalysisStorageKey = () =>
        `stockMindRecommendationProducts:${String(D?.currentSellerEmail?.() || "anonymous").toLowerCase()}`;

    function readManualAnalyses() {
        const saved = D?.read?.(manualAnalysisStorageKey(), []);
        return Array.isArray(saved) ? saved : [];
    }

    function readImageAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("Could not read the selected photo."));
            reader.readAsDataURL(file);
        });
    }

    productImageInput?.addEventListener("change", async () => {
        const file = productImageInput.files?.[0];
        selectedAnalysisImage = "";
        if (!file) {
            productImagePreview.hidden = true;
            productImagePreview.removeAttribute("src");
            return;
        }
        if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 1.5 * 1024 * 1024) {
            productImageInput.setCustomValidity("Choose a PNG, JPG, or WEBP image up to 1.5 MB.");
            productImageInput.reportValidity();
            productImageInput.value = "";
            productImageInput.setCustomValidity("");
            productImagePreview.hidden = true;
            return;
        }
        try {
            selectedAnalysisImage = await readImageAsDataURL(file);
            productImagePreview.src = selectedAnalysisImage;
            productImagePreview.hidden = false;
        } catch (error) {
            productImageInput.setCustomValidity(error.message);
            productImageInput.reportValidity();
            productImageInput.setCustomValidity("");
        }
    });

    productAnalysisForm?.addEventListener("submit", async event => {
        event.preventDefault();
        const access = window.StockMindAccess;
        if (access && !access.canUse("recommendations")) {
            access.notifyLimit("recommendations", $("analysis-form-message"));
            return;
        }
        if (!productAnalysisForm.reportValidity()) return;
        const message = $("analysis-form-message");
        const file = productImageInput.files?.[0];
        if (!file || !selectedAnalysisImage) {
            message.textContent = "Please select a product photo before running the analysis.";
            return;
        }
        const submitButton = productAnalysisForm.querySelector("[type=submit]");
        submitButton.disabled = true;
        message.textContent = "Preparing your product analysis…";
        const profile = window.StockMindStoreProfile?.get(D?.currentSeller?.());
        const now = new Date().toISOString();
        const product = {
            id: `analysis-${Date.now()}`,
            name: $("analysis-name").value.trim(),
            category: $("analysis-category").value,
            quantity: Number($("analysis-quantity").value),
            purchased: Number($("analysis-quantity").value),
            sellPrice: Number($("analysis-price").value),
            sales30Days: $("analysis-sales-30").value === "" ? null : Number($("analysis-sales-30").value),
            days: Number($("analysis-age").value),
            condition: $("analysis-condition").value,
            image: selectedAnalysisImage,
            location: [profile?.locationDetails, profile?.city, profile?.country].filter(Boolean).join(", ") || "Store location not provided",
            seller: profile?.storeName || "My Store",
            dateAdded: now,
            isSurplusListing: true,
            isDraftAnalysis: true
        };
        try {
            const entries = readManualAnalyses();
            entries.unshift(product);
            D.write(manualAnalysisStorageKey(), entries);
            access?.record("recommendations");
            $("rec-search").value = "";
            $("rec-priority").value = "all";
            $("rec-action").value = "all";
            initialize();
            productAnalysisForm.reset();
            selectedAnalysisImage = "";
            productImagePreview.hidden = true;
            productImagePreview.removeAttribute("src");
            message.textContent = `${product.name} analyzed. See its recommendation below.`;
            document.getElementById(`rec-item-${product.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (error) {
            console.error("Product analysis could not be saved:", error);
            message.textContent = "Could not save this analysis in this browser. Try a smaller photo or remove older analyses.";
        } finally {
            submitButton.disabled = false;
        }
    });

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
       PRODUCT FORECAST REFERENCES
       ===================================================== */

    const forecastModule = $("demand-forecast");
    const productSelect = $("fd-product-select");
    const userProductsGroup = $("fd-user-products");
    const horizonSelect = $("fd-horizon-select");
    const forecastSalesEntry = $("fd-sales-entry");
    const forecastSalesInput = $("fd-sales-30");
    const runButton = $("fd-run-button");
    const chart = $("fd-chart");
    const timeline = $("fd-timeline");
    const progressTrack = $("fd-progress-track");

    const timelineSteps = timeline
        ? Array.from(timeline.querySelectorAll("[data-step]"))
        : [];

    let forecastRunId = 0;

    const forecastSalesStorageKey = () =>
        `stockMindForecastSales:${String(D?.currentSellerEmail?.() || "anonymous").toLowerCase()}`;

    function savedForecastSales(productId) {
        if (!D?.read) return null;
        const saved = D.read(forecastSalesStorageKey(), {});
        const value = Number(saved?.[String(productId)]);
        return Number.isFinite(value) && saved?.[String(productId)] !== "" ? value : null;
    }

    function refreshForecastProducts() {
        if (!productSelect || !userProductsGroup) return;
        const previous = productSelect.value;
        const products = inventory.filter(product => product.isDraftAnalysis || product.isPublishedSurplus);
        userProductsGroup.innerHTML = products.length
            ? products.map(product => `<option value="product:${esc(product.id)}">${esc(product.name)} · ${Number(product.quantity).toLocaleString()} units</option>`).join("")
            : "";
        const previousProductExists = products.some(product => `product:${product.id}` === previous);
        if (previousProductExists) productSelect.value = previous;
        else if (products.length) {
            const preferred = products.find(product => product.isDraftAnalysis) || products[0];
            productSelect.value = `product:${preferred.id}`;
        } else productSelect.value = "";
        if (runButton) runButton.disabled = products.length === 0 || (window.StockMindAccess && !window.StockMindAccess.canUse("forecast"));
        updateForecastSelection();
    }

    function updateForecastSelection() {
        const value = productSelect?.value || "";
        const product = value.startsWith("product:")
            ? inventory.find(item => String(item.id) === value.slice("product:".length))
            : null;
        if (!forecastSalesEntry || !forecastSalesInput) return;
        if (!product) {
            forecastSalesEntry.hidden = true;
            forecastSalesInput.value = "";
            if (runButton) runButton.disabled = true;
            updateForecastDisplay(null);
            return;
        }

        forecastSalesEntry.hidden = !product;
        if (product) {
            const recorded = product.sales30Days ?? savedForecastSales(product.id);
            forecastSalesInput.value = recorded == null ? "" : recorded;
            forecastSalesInput.dataset.productId = product.id;
        } else {
            forecastSalesInput.value = "";
            delete forecastSalesInput.dataset.productId;
        }
        updateForecastDisplay(getSelectedForecast());
    }

    function getSelectedForecast() {
        if (!productSelect || !productSelect.value.startsWith("product:")) return null;
        const value = productSelect.value;
        const source = inventory.find(item => String(item.id) === value.slice("product:".length));
        if (source) {
            const salesInputValue = forecastSalesInput?.value;
            const sales30Days = salesInputValue !== "" && Number.isFinite(Number(salesInputValue))
                ? Number(salesInputValue)
                : (source.sales30Days ?? savedForecastSales(source.id));
            const horizonDays = Math.max(1, Number(horizonSelect?.value) || 30);
            if (sales30Days == null) {
                return { name: source.name, remaining: Number(source.quantity) || 0, needsSalesData: true, horizonDays };
            }
            const pacePerDay = Math.max(0, Number(sales30Days)) / 30;
            const midpoint = pacePerDay * horizonDays;
            const demandMin = Math.max(0, Math.floor(midpoint * 0.8));
            const demandMax = Math.max(demandMin, Math.ceil(midpoint * 1.2));
            const remaining = Math.max(0, Number(source.quantity) || 0);
            const risk = remaining === 0 ? 0 : Math.max(0, Math.min(100, Math.round(((remaining - demandMax) / remaining) * 100)));
            const periodMarkers = [1, 2, 3].map(part => Math.max(1, Math.round((horizonDays * part) / 4)));
            const actionTitle = sales30Days === 0
                ? "Review price and buyer reach"
                : remaining > demandMax * 1.5
                    ? "Consider a bulk offer"
                    : "Keep the listing available";
            const action = sales30Days === 0
                ? "No sales were recorded in the last 30 days. Check your sales records, then consider improving the offer or minimum order to reach more business buyers."
                : remaining > demandMax * 1.5
                    ? `At the recent sales pace, projected demand is ${demandMin}–${demandMax} units over ${horizonDays} days, below the ${remaining} units available. Consider a bulk offer or staged lot pricing.`
                    : `At the recent sales pace, projected demand is ${demandMin}–${demandMax} units over ${horizonDays} days. Keep availability current and review actual sales before changing price.`;
            const dailyForecast = pacePerDay;
            return {
                name: source.name,
                purchased: remaining,
                sold: Number(sales30Days),
                remaining,
                demandMin,
                demandMax,
                risk,
                actual: [pacePerDay],
                future: Array(4).fill(dailyForecast),
                futureLow: Array(4).fill(dailyForecast * 0.8),
                futureHigh: Array(4).fill(dailyForecast * 1.2),
                chartLabels: ["30d avg", ...periodMarkers.map(day => `Day ${day}`), `Day ${horizonDays}`],
                horizonDays,
                sales30Days: Number(sales30Days),
                stockCaption: `${Number(sales30Days).toLocaleString()} sold in last 30 days · recent pace projected forward`,
                insight: `Projection uses ${Number(sales30Days).toLocaleString()} recorded sales over the last 30 days and assumes the same pace continues. It does not account for seasonality or market changes.`,
                actionTitle,
                action
            };
        }
        return null;
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

        const actualCount = product.actual.length;
        const futureCount = product.future.length;
        const pointCount = Math.max(2, actualCount + futureCount);
        const allValues = [
            ...product.actual,
            ...product.futureHigh
        ];

        const maxObservedValue = Math.max(...allValues);
        const maxValue = Math.max(1, Number((maxObservedValue * 1.25).toPrecision(2)));

        const x = index =>
            left + ((right - left) * index) / (pointCount - 1);

        const y = value =>
            bottom - (value / maxValue) * plotHeight;

        const actualPoints = product.actual.map((value, index) => ({
            x: x(index),
            y: y(value),
            value
        }));

        const futurePoints = product.future.map((value, index) => ({
            x: x(index + actualCount),
            y: y(value),
            value
        }));

        const lowPoints = product.futureLow.map((value, index) => ({
            x: x(index + actualCount),
            y: y(value),
            value
        }));

        const highPoints = product.futureHigh.map((value, index) => ({
            x: x(index + actualCount),
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
                >${maxValue >= 10 ? Math.round(value) : value.toFixed(1)}</text>
            `;
        }).join("");

        const labels = (product.chartLabels || [
            "-5w", "-4w", "-3w", "-2w", "-1w", "Today", "+1w", "+2w", "+3w", "+4w"
        ]).map((label, index) => `
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
                <title>${point.value.toFixed(2)} units per day · recent baseline</title>
            </circle>
        `).join("");

        const forecastDots = futurePoints.map(point => `
            <circle
                class="fd-chart-future-point"
                cx="${point.x}"
                cy="${point.y}"
                r="4"
            >
                <title>${point.value.toFixed(2)} estimated units per day</title>
            </circle>
        `).join("");

        chart.innerHTML = `
            <svg
                viewBox="0 0 ${width} ${height}"
                role="img"
                aria-label="Estimated demand pace for ${esc(product.name)}"
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
                    x1="${x(actualCount - 0.5)}"
                      y1="${top}"
                    x2="${x(actualCount - 0.5)}"
                      y2="${bottom}"></line>

                ${actualDots}
                ${forecastDots}

                <text
                    class="fd-chart-future-label"
                    x="${x(actualCount) + 8}"
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
        if (!product) {
            $("fd-demand-value").textContent = "Add a product";
            $("fd-demand-caption").textContent = "A product analysis is needed first";
            $("fd-stock-value").textContent = "—";
            $("fd-stock-caption").textContent = "Choose one of your analyzed products";
            $("fd-risk-value").textContent = "—";
            $("fd-risk-caption").textContent = "Waiting for product data";
            $("fd-excess-value").textContent = "—";
            $("fd-period-chip").textContent = "PRODUCT FORECAST";
            $("fd-compare-demand-label").textContent = "Forecast demand";
            $("fd-compare-demand").textContent = "—";
            $("fd-risk-detail").textContent = "Add or analyze a product above to build a product-specific forecast.";
            $("fd-action-title").textContent = "No product selected";
            $("fd-action-description").textContent = "Your analyzed products will appear in the product selector here.";
            $("fd-notice-text").textContent = "The forecast uses recorded sales for your selected product. No sample products or generated sales are used.";
            chart.innerHTML = `<div class="fd-chart-empty">Analyze a product above and it will appear in this forecast selector.</div>`;
            return;
        }

        if (window.StockMindAccess && !window.StockMindAccess.canUse("forecast")) {
            forecastSalesEntry.hidden = true;
            $("fd-demand-value").textContent = "Premium preview";
            $("fd-demand-caption").textContent = "Your free forecast preview has been used";
            $("fd-stock-value").textContent = `${formatNumber(product.remaining)} units`;
            $("fd-stock-caption").textContent = "Available for this product";
            $("fd-risk-value").textContent = "—";
            $("fd-risk-caption").textContent = "Upgrade to run another forecast";
            $("fd-excess-value").textContent = "—";
            $("fd-period-chip").textContent = "PREMIUM FORECAST";
            $("fd-compare-demand-label").textContent = "Forecast demand";
            $("fd-compare-demand").textContent = "Premium required";
            $("fd-risk-detail").textContent = "The free plan includes one forecast preview. Upgrade for continued product-specific forecasts.";
            $("fd-action-title").textContent = "Continue with Premium";
            $("fd-action-description").textContent = "Run forecasts for your analyzed products during your active Premium plan.";
            chart.innerHTML = `<div class="fd-chart-empty">Your free forecast preview has been used. <a href="subscription.html">View Premium plans</a> to continue forecasting.</div>`;
            if (runButton) runButton.disabled = true;
            return;
        }

        const notice = $("fd-notice-text");
        const forecastNotice = $("fd-demo-notice");
        if (forecastNotice) forecastNotice.classList.add("is-live-forecast");
        if (product.needsSalesData) {
            $("fd-demand-value").textContent = "Sales data needed";
            $("fd-demand-caption").textContent = "Enter recorded sales to continue";
            $("fd-stock-value").textContent = `${formatNumber(product.remaining)} units`;
            $("fd-stock-caption").textContent = "Available for this product";
            $("fd-risk-value").textContent = "—";
            $("fd-risk-caption").textContent = "Forecast awaits sales data";
            $("fd-excess-value").textContent = "—";
            $("fd-period-chip").textContent = `${product.horizonDays}-DAY OUTLOOK`;
            $("fd-compare-demand-label").textContent = `${product.horizonDays}-day demand estimate`;
            $("fd-compare-demand").textContent = "Enter sales data";
            $("fd-risk-detail").textContent = "Enter this product’s actual sales from the last 30 days to estimate demand.";
            $("fd-action-title").textContent = "Add recent sales information";
            $("fd-action-description").textContent = "The forecast cannot estimate demand from quantity and photo alone. Use the product’s recorded orders or sales for the last 30 days.";
            if (notice) notice.textContent = "For a product-specific forecast, enter the actual number of units sold in the last 30 days. The app will project that recent pace over your selected period.";
            chart.innerHTML = `<div class="fd-chart-empty">Enter recent sales above, then press Forecast to build this product’s outlook.</div>`;
            return;
        }

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

        $("fd-demand-caption").textContent = `Estimated demand over ${product.horizonDays} days`;

        $("fd-stock-value").textContent =
            `${formatNumber(product.remaining)} units`;

        $("fd-stock-caption").textContent = product.stockCaption ||
            `${formatNumber(product.purchased)} purchased · ${formatNumber(product.sold)} sold`;

        $("fd-risk-value").textContent =
            `${product.risk}%`;

        $("fd-risk-caption").textContent = `${risk.label} · stock above projected demand`;

        $("fd-excess-value").textContent =
            `${formatNumber(excess)} units`;
        $("fd-excess-caption").textContent = "Current surplus quantity minus projected midpoint";
        $("fd-period-chip").textContent = `${product.horizonDays}-DAY FORECAST`;
        $("fd-compare-demand-label").textContent = `${product.horizonDays}-day demand midpoint`;

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
        $("fd-risk-detail").textContent = `${product.insight} Risk estimates the share of current stock above the forecast’s upper demand range.`;

        $("fd-action-title").textContent = product.actionTitle;
        $("fd-action-description").textContent = product.action;

        $("fd-chart-summary").textContent = `${product.name}: recent daily sales pace is projected forward. The shaded range is an illustrative ±20% scenario, not a guarantee.`;

        if (notice) notice.textContent = `Estimate based on ${Number(product.sales30Days).toLocaleString()} actual units sold in the last 30 days, projected at the same average pace. A ±20% range shows uncertainty; seasonality and market changes are not included.`;
        $("fd-actual-legend").textContent = "30-day average pace";
        $("fd-forecast-legend").textContent = "Projected daily pace ±20%";

        drawForecastChart(product);
    }

    /* =====================================================
       RESET TIMELINE
       ===================================================== */

    function resetTimeline() {
        timelineSteps.forEach(step => {
            step.classList.remove("is-active", "is-complete");
        });

        $("fd-timeline-status").textContent = "Preparing forecast…";
        $("fd-status-dot").classList.add("is-running");

        $("fd-progress-label").textContent = "0%";
        $("fd-progress-fill").style.width = "0%";

        progressTrack.setAttribute("aria-valuenow", "0");

        $("fd-stage-description").textContent =
            "Starting the product forecasting workflow.";

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

        if (productSelect.value.startsWith("product:")) {
            const productId = productSelect.value.slice("product:".length);
            const salesValue = forecastSalesInput?.value ?? "";
            const sales = Number(salesValue);
            if (salesValue === "" || !Number.isInteger(sales) || sales < 0) {
                forecastSalesInput.setCustomValidity("Enter a whole number of units sold during the last 30 days. Enter 0 if there were no sales.");
                forecastSalesInput.reportValidity();
                forecastSalesInput.setCustomValidity("");
                forecastSalesInput.focus();
                return;
            }
            const history = D.read(forecastSalesStorageKey(), {});
            history[productId] = sales;
            D.write(forecastSalesStorageKey(), history);
        }

        const runId = ++forecastRunId;
        const product = getSelectedForecast();
        if (!product || product.needsSalesData) return;
        const access = window.StockMindAccess;
        if (access && !access.canUse("forecast")) {
            access.notifyLimit("forecast", document.querySelector('[data-ai-usage="forecast"]'));
            return;
        }

        const stageNames = [
            "Reading product details…",
            "Checking the recent demand baseline…",
            `Projecting the next ${product.horizonDays} days…`,
            "Comparing demand with the available surplus…",
            "Preparing a suggested next step…"
        ];

        const stageDescriptions = [
            `Loading ${product.name}: ${formatNumber(product.remaining)} units are available.`,
            `Using ${formatNumber(product.sales30Days)} recorded sales from the last 30 days.`,
            `Estimating ${product.demandMin}–${product.demandMax} units of demand over ${product.horizonDays} days.`,
            `Comparing the estimated demand with ${formatNumber(product.remaining)} available units.`,
            `Suggested next step: ${product.actionTitle.toLowerCase()}.`
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

        $("fd-timeline-status").textContent = "Product forecast complete";
        $("fd-status-dot").classList.remove("is-running");

        $("fd-progress-label").textContent = "100%";
        $("fd-progress-fill").style.width = "100%";

        progressTrack.setAttribute("aria-valuenow", "100");

        $("fd-stage-description").textContent = `The ${product.horizonDays}-day forecast for ${product.name} is complete. It assumes the last 30-day sales pace continues.`;

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
        $("fd-run-label").textContent = "Forecast again";

        forecastModule.classList.remove("is-processing");
        access?.record("forecast");
    }

    /* Run only when the seller asks for a forecast. */
    if (forecastModule && productSelect && runButton && chart && timeline) {
        productSelect.addEventListener("change", updateForecastSelection);
        horizonSelect?.addEventListener("change", updateForecastSelection);
        runButton.addEventListener("click", runForecast);
        $("fd-forecast-jump")?.addEventListener("click", event => {
            event.preventDefault();
            forecastModule.scrollIntoView({ behavior: "smooth", block: "start" });
            window.setTimeout(runForecast, 450);
        });

        updateForecastDisplay(getSelectedForecast());
    } else {
        console.warn("Forecast HTML is incomplete.");
    }

    /* =====================================================
       INVENTORY RECOMMENDATION ENGINE
       ===================================================== */

    if (!root || !empty) {
        console.error("Recommendation HTML elements are missing.");
        return;
    }

    if (!D || typeof D.getCurrentSellerListings !== "function") {
        $("rec-data-title").textContent = "Seller listing data unavailable";

        $("rec-data-description").textContent =
            "Check seller-data.js and your saved marketplace listings.";

        $("rec-data-badge").textContent = "LOAD ERROR";

        root.innerHTML = `
            <div class="rec-empty">
                <h3>Seller listing data unavailable</h3>
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

        const capital = product.isSurplusListing
            ? (product.sellingMethod === "whole_lot" ? sellPrice : remaining * sellPrice)
            : remaining * unitCost;

        const marginPct = sellPrice > 0
            ? ((sellPrice - unitCost) / sellPrice) * 100
            : 0;

        const datedHistory = getDatedSales(product);

        /* Surplus listings are assessed by lot size and listing age only. */
        let risk = 0;
        if (product.isSurplusListing) {
            if (days >= 45) risk += 55;
            else if (days >= 30) risk += 38;
            else if (days >= 14) risk += 22;
            if (remaining >= 100) risk += 20;
            else if (remaining >= 50) risk += 10;
        } else {
            if (days >= 60) risk += 32;
            else if (days >= 45) risk += 24;
            else if (days >= 30) risk += 13;

            if (days >= 30 && sellThrough < 20) risk += 26;
            else if (days >= 30 && sellThrough < 40) risk += 17;
            else if (days >= 20 && sellThrough < 50) risk += 10;

            if (remaining > 0 && dailyVelocity === 0 && days >= 20) risk += 20;
            if (Number.isFinite(daysCover)) {
                if (daysCover > 60) risk += 18;
                else if (daysCover > 30) risk += 10;
            }
            if (sellThrough >= 75 && days < 30) risk -= 12;
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
        } else if (product.isSurplusListing && days >= 30) {
            actionType = "marketplace";
            actionTitle = product.isDraftAnalysis ? "List this long-held surplus" : "Refresh this surplus listing";
            recommendation = product.isDraftAnalysis
                ? "This product has been surplus for a while. Publish the lot with a clear photo, quantity, and price so other businesses can assess it."
                : "This lot has been listed for a while. Review its photos, description, and asking price to help it reach the right business buyer.";
            reason = product.isDraftAnalysis
                ? `You reported ${days} days as surplus and ${remaining.toLocaleString()} available units. Sales are not assumed.`
                : `${remaining.toLocaleString()} units are offered in a listing that has been live for ${days} days. Marketplace order history is not available for this analysis.`;
        } else if (product.isSurplusListing && remaining >= 100) {
            actionType = "marketplace";
            actionTitle = "Promote this bulk lot";
            recommendation = "This is a sizable surplus lot. Make the total quantity, minimum order, and lot price clear so other businesses can assess it quickly.";
            reason = `${remaining.toLocaleString()} units are currently offered. Recommendations use the listing quantity and age, without assuming sales.`;
        } else if (product.isSurplusListing) {
            actionType = "monitor";
            actionTitle = "Keep the listing clear";
            recommendation = "Your surplus listing is active. Keep its availability and product details up to date as the lot changes.";
            reason = product.isDraftAnalysis
                ? `${remaining.toLocaleString()} units · surplus age reported as ${days} days. Sales are not assumed.`
                : `${remaining.toLocaleString()} units are offered${days ? ` · listed ${days} days ago` : ""}. Order history is not available for this analysis.`;
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

            reason = product.isSurplusListing
                ? `${remaining.toLocaleString()} units are offered${days ? ` · listing age ${days} days` : ""}. Sales are not assumed.`
                : `The product has ${remaining} units remaining and ${days} recorded holding days.`;
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
                "Product forecasts use the seller-entered recent sales baseline.";

            $("rec-data-badge").textContent = "DATED HISTORY";
        } else {
            $("rec-data-title").textContent =
                "Recommendations based on your surplus listings";

            $("rec-data-description").textContent =
                "Lot size and the age you entered, or time since publication for existing listings, are used to identify products worth reviewing. Marketplace sales history is not assumed. " +
                "Product forecasts use the seller-entered recent sales baseline.";

            $("rec-data-badge").textContent = "LISTING DATA";
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
            soldText: product.raw.isSurplusListing
                ? `${product.remaining.toLocaleString()} units currently offered`
                : `${product.sold} of ${product.purchased} units sold`,

            ageText: product.days > 0
                ? `Recorded age: ${product.days} days`
                : "Holding age not recorded",

            coverageText: product.raw.isSurplusListing
                ? "Marketplace sales history is not available"
                : product.dailyVelocity > 0
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
                <article class="rec-card priority-${product.priority}" id="rec-item-${esc(product.id)}">

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

                        ${product.raw.isSurplusListing ? `
                            <div class="rec-evidence-item"><span>Available lot quantity</span><strong>${product.remaining.toLocaleString()}</strong><small>As entered in your listing</small></div>
                            <div class="rec-evidence-item"><span>${product.raw.isDraftAnalysis ? "Time as surplus" : "Listing age"}</span><strong>${product.days} days</strong><small>${product.raw.isDraftAnalysis ? "Provided by you" : "Since publication"}</small></div>
                            <div class="rec-evidence-item"><span>Condition</span><strong>${esc(product.condition)}</strong><small>Keep this clear in the listing</small></div>
                            <div class="rec-evidence-item"><span>Asking price</span><strong>${money(product.sellPrice)}</strong><small>Sales history is not assumed</small></div>
                            <div class="rec-evidence-item"><span>Potential listing value</span><strong>${money(product.capital)}</strong><small>Based on quantity and asking price</small></div>
                        ` : `
                            <div class="rec-evidence-item"><span>Remaining units</span><strong>${product.remaining.toLocaleString()}</strong><small>${product.purchased.toLocaleString()} purchased</small></div>
                            <div class="rec-evidence-item"><span>Units sold</span><strong>${product.sold.toLocaleString()}</strong><small>${product.days} recorded holding days</small></div>
                            <div class="rec-evidence-item"><span>Capital in remaining stock</span><strong>${money(product.capital)}</strong><small>At recorded purchase cost</small></div>
                            <div class="rec-evidence-item"><span>Stock coverage estimate</span><strong>${formatDays(product.daysCover)}</strong><small>Uses cumulative sales divided by holding days</small></div>
                            ${historyHTML}
                            <div class="rec-evidence-item"><span>Recorded gross margin</span><strong>${product.sellPrice > 0 ? `${product.marginPct.toFixed(1)}%` : "Unavailable"}</strong><small>Before operating costs and fees</small></div>
                        `}
                    </div>

                    ${product.raw.isSurplusListing ? "" : `<div class="rec-sellthrough">
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
                    </div>`}

                    <p class="rec-card-footnote">${esc(product.reason)}</p>

                    <div class="rec-card-actions">

                        ${product.raw.isSurplusListing
                            ? product.raw.isPublishedSurplus
                                ? `<a class="rec-action-button primary" href="marketplace.html">Manage listing ↗</a>`
                                : `<button type="button" class="rec-action-button primary" data-action="marketplace" data-id="${esc(product.id)}">List this surplus ↗</button>`
                            : `<button type="button" class="rec-action-button primary" data-action="marketplace" data-id="${esc(product.id)}">List surplus ↗</button>`}

                        ${product.raw.isSurplusListing ? "" : `<button
                            type="button"
                            class="rec-action-button"
                            data-action="discount"
                            data-id="${esc(product.id)}">
                            Simulate discount
                        </button>`}

                        ${product.raw.isSurplusListing ? "" : `<a class="rec-action-button" href="marketplace.html">
                            View listings
                        </a>`}

                        ${product.raw.isDraftAnalysis ? `<button type="button" class="rec-action-button" data-action="remove-analysis" data-id="${esc(product.id)}">Remove analysis</button>` : ""}

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
                seller: product.raw.seller || "My Store",
            image: product.raw.image || "",
            description:
                "Surplus stock prepared from a Stock Mind product analysis."
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
                showMessage("The product could not be found in this analysis.");
                return;
            }

            if (button.dataset.action === "marketplace") {
                createMarketplaceDraft(product);
            }

            if (button.dataset.action === "discount") {
                openDiscountSimulator(product);
            }

            if (button.dataset.action === "remove-analysis" && product.raw.isDraftAnalysis) {
                const remaining = readManualAnalyses().filter(item => String(item.id) !== String(product.id));
                D.write(manualAnalysisStorageKey(), remaining);
                initialize();
                showMessage("Product removed from your analysis list.");
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
            const listings = D.getCurrentSellerListings();
            if (!Array.isArray(listings)) throw new Error("Seller listings must be an array.");
            inventory = listings.filter(item => Number(item.quantity) > 0 && item.status !== "removed").map(item => {
                const published = Date.parse(item.dateAdded || item.createdAt || "");
                const days = Number.isFinite(published) ? Math.max(0, Math.floor((Date.now() - published) / 86400000)) : 0;
                return {
                    ...item,
                    id: item.id,
                    purchased: Number(item.quantity) || 0,
                    sold: 0,
                    days,
                    unitCost: 0,
                    sellPrice: Number(item.sellingMethod === "whole_lot" ? item.lotPrice : item.price) || 0,
                    isSurplusListing: true,
                    isPublishedSurplus: true
                };
            });
            const submittedProducts = readManualAnalyses().map(item => ({
                ...item,
                purchased: Number(item.quantity) || 0,
                sellPrice: Number(item.sellPrice) || 0,
                isSurplusListing: true,
                isDraftAnalysis: true
            }));
            inventory.push(...submittedProducts);
            refreshForecastProducts();
        } catch (error) {
            console.error("Inventory loading failed:", error);

            $("rec-data-title").textContent = "Could not load inventory";

            $("rec-data-description").textContent =
                "Check seller-data.js and your saved marketplace listings.";

            $("rec-data-badge").textContent = "LOAD ERROR";

            root.innerHTML = `
                <div class="rec-empty">
                    <h3>Seller listing data unavailable</h3>
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
