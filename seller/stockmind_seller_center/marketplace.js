
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       LOAD SHARED FOOTER
    ========================================= */

    async function loadFooter() {
        const footer = document.getElementById("footer-container");

        if (!footer) {
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

            footer.innerHTML = await response.text();

        } catch (error) {
            console.error("Footer loading error:", error);
        }
    }

    loadFooter();


    /* =========================================
       GET PAGE ELEMENTS
    ========================================= */

    const D = window.StockMindSellerData;

    const $ = id => document.getElementById(id);

    const form = $("marketplace-form");
    const formCard = $("listing-form-card");
    const grid = $("market-grid");
    const search = $("market-search");
    const categoryFilter = $("market-category-filter");
    const emptyMessage = $("market-empty");

    if (!form || !formCard || !grid || !search ||
        !categoryFilter || !emptyMessage) {
        console.error("Marketplace HTML is missing required elements.");
        return;
    }

    if (!D || typeof D.getListings !== "function") {
        grid.innerHTML = "";
        emptyMessage.hidden = false;
        emptyMessage.textContent =
            "Marketplace data could not be loaded. Check seller-data.js.";

        console.error("StockMindSellerData is unavailable.");
        return;
    }

    const defaultImage =
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80";

    let prefilledImage = "";


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

    function toast(message) {
        let element = document.querySelector(".sm-toast");

        if (!element) {
            element = document.createElement("div");
            element.className = "sm-toast";
            element.setAttribute("role", "status");
            document.body.appendChild(element);
        }

        element.textContent = message;

        clearTimeout(window.__smMarketplaceToastTimer);

        window.__smMarketplaceToastTimer = setTimeout(() => {
            element.remove();
        }, 3500);
    }

    function setSelectValue(select, value) {
        if (!select || value == null) {
            return;
        }

        const wanted = String(value).trim().toLowerCase();

        const option = [...select.options].find(item =>
            item.value.trim().toLowerCase() === wanted ||
            item.textContent.trim().toLowerCase() === wanted
        );

        if (option) {
            select.value = option.value;
        }
    }

    function getListings() {
        const rows = D.getListings();

        if (!Array.isArray(rows)) {
            throw new Error("Marketplace listings must be an array.");
        }

        return rows;
    }


    /* =========================================
       OPEN AND PREFILL LISTING FORM
    ========================================= */

    function openForm(prefill = null) {
        formCard.hidden = false;

        if (prefill) {
            $("m-name").value = prefill.name || "";

            setSelectValue(
                $("m-category"),
                prefill.category || "Other"
            );

            $("m-price").value = prefill.price ?? "";
            $("m-quantity").value = prefill.quantity ?? 1;
            $("m-min").value = prefill.minOrder ?? 1;
            $("m-location").value =
                prefill.location || "Amman, Jordan";

            $("m-seller").value =
                prefill.seller || "My Store";

            setSelectValue(
                $("m-condition"),
                prefill.condition || "New"
            );

            const image = String(prefill.image || "");

            prefilledImage = image;

            $("m-image").value =
                image.startsWith("http") ? image : "";

            $("m-description").value =
                prefill.description || "";
        }

        formCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    /* =========================================
       RENDER MARKETPLACE PRODUCTS
    ========================================= */

    function render() {
        let rows;

        try {
            const allListings = getListings();

            const query = search.value.trim().toLowerCase();
            const category = categoryFilter.value;

            rows = allListings.filter(product => {
                const matchesCategory =
                    !category || product.category === category;

                const searchableText = [
                    product.name,
                    product.category,
                    product.seller,
                    product.location
                ].map(value => String(value || "").toLowerCase());

                const matchesSearch = searchableText.some(value =>
                    value.includes(query)
                );

                return matchesCategory && matchesSearch;
            });

        } catch (error) {
            console.error("Marketplace loading error:", error);

            grid.innerHTML = "";
            emptyMessage.hidden = false;
            emptyMessage.textContent =
                "Could not load marketplace products.";

            $("market-count").textContent =
                "Unable to load listings";

            return;
        }

        $("market-count").textContent =
            `${rows.length} listing${rows.length === 1 ? "" : "s"} available`;

        grid.innerHTML = rows.map(product => {
            const image = escapeHTML(product.image || defaultImage);
            const name = escapeHTML(product.name || "Unnamed product");
            const category = escapeHTML(product.category || "Other");
            const location = escapeHTML(
                product.location || "Location not specified"
            );
            const seller = escapeHTML(
                product.seller || "Stock Mind Seller"
            );
            const condition = escapeHTML(product.condition || "New");
            const description = escapeHTML(
                product.description || "Wholesale or surplus product listing."
            );

            const price = Number(product.price || 0);
            const quantity = Math.max(
                0,
                Number(product.quantity || 0)
            );

            const minOrder = Math.max(
                1,
                Number(product.minOrder || 1)
            );

            const id = escapeHTML(product.id);

            return `
                <article class="sm-card sm-market-card">

                    <img
                        class="sm-market-image"
                        src="${image}"
                        alt="${name}"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='${defaultImage}'">

                    <div class="sm-market-body">

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:7px;
                            align-items:center;
                        ">
                            <span class="sm-pill">${category}</span>
                            <span class="sm-muted">${location}</span>
                        </div>

                        <h3 style="font-size:16px;margin:12px 0 5px">
                            ${name}
                        </h3>

                        <p class="sm-muted" style="margin:0">
                            ${seller} · ${condition}
                        </p>

                        <div class="sm-market-price">
                            ${money(price)}
                            <span class="sm-muted"
                                  style="font-size:11px;font-weight:500">
                                / unit
                            </span>
                        </div>

                        <p class="sm-muted">
                            ${quantity} units · Minimum order ${minOrder}
                        </p>

                        <p class="sm-muted">${description}</p>

                        <div class="sm-market-actions">

                            <button
                                class="sm-btn sm-btn-primary request-btn"
                                type="button"
                                data-id="${id}">
                                Request product
                            </button>

                            <button
                                class="sm-btn sm-btn-secondary remove-btn"
                                type="button"
                                data-id="${id}"
                                title="Remove demo listing"
                                aria-label="Remove ${name}">
                                ×
                            </button>

                        </div>

                    </div>
                </article>
            `;
        }).join("");

        emptyMessage.hidden = rows.length > 0;


        /* Request product - demo only */

        grid.querySelectorAll(".request-btn").forEach(button => {
            button.addEventListener("click", () => {
                const product = rows.find(
                    item => String(item.id) === button.dataset.id
                );

                if (!product) {
                    toast("Product was not found.");
                    return;
                }

                toast(
                    `Demo request selected: ${product.name}. ` +
                    "Real orders require checkout and backend integration."
                );
            });
        });


        /* Remove demo listing */

        grid.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", () => {
                try {
                    const remaining = getListings().filter(
                        item => String(item.id) !== button.dataset.id
                    );

                    if (typeof D.write !== "function" || !D.LISTINGS_KEY) {
                        throw new Error(
                            "Marketplace storage functions are unavailable."
                        );
                    }

                    D.write(D.LISTINGS_KEY, remaining);

                    render();

                    toast("Listing removed from this browser demo.");

                } catch (error) {
                    console.error("Could not remove listing:", error);
                    toast("Could not remove this listing.");
                }
            });
        });
    }


    /* =========================================
       OPEN / CLOSE FORM
    ========================================= */

    $("open-listing").addEventListener("click", () => {
        openForm();
    });

    $("close-form").addEventListener("click", () => {
        formCard.hidden = true;
    });


    /* =========================================
       SEARCH AND CATEGORY FILTER
    ========================================= */

    search.addEventListener("input", render);

    categoryFilter.addEventListener("change", render);


    /* =========================================
       PUBLISH PRODUCT
    ========================================= */

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const quantity = Math.floor(
            Number($("m-quantity").value)
        );

        const minOrder = Math.floor(
            Number($("m-min").value) || 1
        );

        const price = Number($("m-price").value);

        if (
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isFinite(quantity) ||
            quantity < 1 ||
            minOrder < 1 ||
            minOrder > quantity
        ) {
            toast(
                "Check the price, quantity, and minimum order quantity."
            );
            return;
        }

        const typedImage = $("m-image").value.trim();

        const product = {
            id: "seller-" + Date.now(),

            name: $("m-name").value.trim(),

            category: $("m-category").value,

            price,

            quantity,

            minOrder,

            location: $("m-location").value.trim(),

            seller: $("m-seller").value.trim() || "My Store",

            condition: $("m-condition").value,

            image: typedImage || prefilledImage || defaultImage,

            description: $("m-description").value.trim(),

            sellerListed: true,

            dateAdded: new Date().toISOString()
        };

        if (!product.name) {
            toast("Please enter a product name.");
            return;
        }

        try {
            /* Save using the existing seller data component */

            if (typeof D.saveListing === "function") {
                D.saveListing(product);

            } else if (
                typeof D.write === "function" &&
                D.LISTINGS_KEY &&
                typeof D.getListings === "function"
            ) {
                const listings = D.getListings();

                listings.unshift(product);

                D.write(D.LISTINGS_KEY, listings);

            } else {
                throw new Error(
                    "Marketplace save function is unavailable."
                );
            }

            /*
             * Maintain the existing sellerProducts key used by
             * the project's other product/category code.
             */

            try {
                const oldProducts = JSON.parse(
                    localStorage.getItem("sellerProducts") || "[]"
                );

                if (Array.isArray(oldProducts)) {
                    const exists = oldProducts.some(
                        item => String(item.id) === product.id
                    );

                    if (!exists) {
                        oldProducts.unshift(product);

                        localStorage.setItem(
                            "sellerProducts",
                            JSON.stringify(oldProducts)
                        );
                    }
                }
            } catch (storageError) {
                console.warn(
                    "Could not update sellerProducts:",
                    storageError
                );
            }

            localStorage.removeItem("stockMindPrelistProduct");

            form.reset();

            $("m-location").value = "Amman, Jordan";
            $("m-seller").value = "My Store";
            $("m-min").value = "1";

            prefilledImage = "";

            formCard.hidden = true;

            search.value = "";
            categoryFilter.value = "";

            render();

            toast(
                "Product published to this browser's Marketplace demo."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {
            console.error("Could not publish product:", error);

            toast(
                "Could not publish the product. Check seller-data.js."
            );
        }
    });


    /* =========================================
       HANDLE AI RECOMMENDATION PRE-FILL
    ========================================= */

    try {
        const pending = D.read
            ? D.read("stockMindPrelistProduct", null)
            : JSON.parse(
                localStorage.getItem("stockMindPrelistProduct") || "null"
            );

        const params = new URLSearchParams(window.location.search);

        if (params.get("newListing") === "1" && pending) {
            openForm(pending);
        }
    } catch (error) {
        console.error("Could not load prefilled listing:", error);
    }


    /* =========================================
       INITIALIZE
    ========================================= */

    render();

});
