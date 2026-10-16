
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       LOAD SHARED FOOTER
    ========================================= */

    async function loadFooter() {
        const footerContainer =
            document.getElementById("footer-container");

        if (!footerContainer) {
            console.warn("Footer container was not found.");
            return;
        }

        try {
            const response = await fetch(
                "../../components/footer.html"
            );

            if (!response.ok) {
                throw new Error(
                    `Footer loading failed: HTTP ${response.status}`
                );
            }

            footerContainer.innerHTML = await response.text();

        } catch (error) {
            console.error("Footer loading error:", error);
        }
    }

    // Load the footer independently of inventory rendering.
    loadFooter();


    /* =========================================
       GET INVENTORY DATA
    ========================================= */

    const D = window.StockMindSellerData;

    const inventoryRoot =
        document.getElementById("inventory-metrics");

    const tableBody =
        document.getElementById("inventory-body");

    const searchInput =
        document.getElementById("inventory-search");

    const emptyMessage =
        document.getElementById("inventory-empty");

    if (!inventoryRoot || !tableBody || !searchInput || !emptyMessage) {
        console.error("Inventory HTML is missing required elements.");
        return;
    }

    if (!D || typeof D.getInventory !== "function") {
        console.error(
            "StockMindSellerData is unavailable. Check seller-data.js."
        );

        inventoryRoot.innerHTML = `
            <article class="sm-card">
                <h3>Inventory data unavailable</h3>
                <p>Please check seller-data.js and reload the page.</p>
            </article>
        `;

        return;
    }


    /* =========================================
       HELPERS
    ========================================= */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function money(value) {
        if (typeof D.money === "function") {
            return D.money(value);
        }

        return `JOD ${Number(value || 0).toFixed(2)}`;
    }

    function getRemaining(product) {
        return Math.max(
            0,
            Number(product.purchased || 0) -
            Number(product.sold || 0)
        );
    }

    function isSlowMoving(product) {
        return Number(product.days || 0) >= 40;
    }


    /* =========================================
       RENDER INVENTORY
    ========================================= */

    function renderInventory() {
        let allProducts;

        try {
            allProducts = D.getInventory();

            if (!Array.isArray(allProducts)) {
                throw new Error("Inventory data must be an array.");
            }
        } catch (error) {
            console.error("Could not read inventory:", error);

            tableBody.innerHTML = "";
            emptyMessage.hidden = false;
            emptyMessage.textContent =
                "Could not load inventory data.";

            return;
        }

        const query = searchInput.value
            .trim()
            .toLowerCase();

        const filteredProducts = allProducts.filter(product => {
            const searchableText = [
                product.name,
                product.category,
                product.location
            ].join(" ").toLowerCase();

            return searchableText.includes(query);
        });


        /* =====================================
           CALCULATE METRICS
        ===================================== */

        const totalUnits = allProducts.reduce(
            (sum, product) => sum + getRemaining(product),
            0
        );

        const slowMovingUnits = allProducts
            .filter(isSlowMoving)
            .reduce(
                (sum, product) => sum + getRemaining(product),
                0
            );

        const remainingCapital = allProducts.reduce(
            (sum, product) => {
                const remaining = getRemaining(product);
                const cost = Number(product.unitCost || 0);

                return sum + remaining * cost;
            },
            0
        );


        /* =====================================
           DISPLAY METRIC CARDS
        ===================================== */

        inventoryRoot.innerHTML = `
            <article class="sm-card">
                <div class="sm-metric-label">
                    Units on hand
                </div>

                <div class="sm-metric-value">
                    ${totalUnits.toLocaleString()}
                </div>

                <div class="sm-muted">
                    Across all products
                </div>
            </article>

            <article class="sm-card">
                <div class="sm-metric-label">
                    Slow-moving units
                </div>

                <div class="sm-metric-value">
                    ${slowMovingUnits.toLocaleString()}
                </div>

                <div class="sm-muted">
                    Held for 40 days or more
                </div>
            </article>

            <article class="sm-card">
                <div class="sm-metric-label">
                    Capital in remaining stock
                </div>

                <div
                    class="sm-metric-value"
                    style="font-size:23px">
                    ${money(remainingCapital)}
                </div>

                <div class="sm-muted">
                    Based on approximate unit cost
                </div>
            </article>

            <article class="sm-card">
                <div class="sm-metric-label">
                    Tracked products
                </div>

                <div class="sm-metric-value">
                    ${allProducts.length}
                </div>

                <div class="sm-muted">
                    Products in your inventory
                </div>
            </article>
        `;


        /* =====================================
           DISPLAY INVENTORY TABLE
        ===================================== */

        tableBody.innerHTML = filteredProducts.map(product => {
            const remaining = getRemaining(product);
            const slow = isSlowMoving(product);

            const image = product.image
                ? escapeHTML(product.image)
                : "";

            const name = escapeHTML(product.name || "Unnamed product");
            const category = escapeHTML(product.category || "Uncategorized");
            const location = escapeHTML(product.location || "Location not set");

            return `
                <tr>
                    <td>
                        <div class="sm-product">

                            ${
                                image
                                    ? `
                                        <img
                                            class="sm-thumb"
                                            src="${image}"
                                            alt="${name}"
                                            loading="lazy">
                                    `
                                    : `
                                        <div
                                            class="sm-thumb"
                                            aria-hidden="true">
                                            📦
                                        </div>
                                    `
                            }

                            <div>
                                <strong>${name}</strong>

                                <span class="sm-muted">
                                    ${category} · ${location}
                                </span>
                            </div>
                        </div>
                    </td>

                    <td>
                        ${Number(product.purchased || 0)}
                    </td>

                    <td>
                        ${Number(product.sold || 0)}
                    </td>

                    <td>
                        <strong>${remaining}</strong>
                    </td>

                    <td>
                        ${Number(product.days || 0)} days
                    </td>

                    <td>
                        <span class="sm-pill ${slow ? "amber" : "green"}">
                            ${slow ? "Slow-moving" : "Healthy"}
                        </span>
                    </td>

                    <td>
                        <a
                            class="sm-btn sm-btn-secondary"
                            href="recommendations.html"
                            style="padding:8px 10px;font-size:11px">
                            Review
                        </a>
                    </td>
                </tr>
            `;
        }).join("");


        /* =====================================
           EMPTY SEARCH RESULTS
        ===================================== */

        emptyMessage.hidden = filteredProducts.length > 0;

        if (filteredProducts.length === 0) {
            emptyMessage.textContent = query
                ? "No matching products found. Try another search."
                : "Your inventory is currently empty.";
        }
    }


    /* =========================================
       SEARCH
    ========================================= */

    searchInput.addEventListener("input", renderInventory);


    /* =========================================
       INITIAL RENDER
    ========================================= */

    renderInventory();

});
