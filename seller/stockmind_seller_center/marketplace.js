
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


    // Older listings have no sellingMethod; treat them as regular products.
    const isLot = product => product?.sellingMethod === "whole_lot";
    const stockOf = product => Math.max(0, Math.floor(Number(product?.quantity) || 0));
    const minOf = product => Math.max(1, Math.floor(Number(product?.minOrder) || 1));
    const lotTotal = product => {
        // For every NEW listing, product.price is the per-piece price.
        // The complete lot is sold as one cart line for this total.
        const unitPrice = Number(product?.price) || 0;
        return Math.round(unitPrice * stockOf(product) * 100) / 100;
    };
    let methodFilter = "all";

    function updateFormMethod() {
        const lot = $("m-method")?.value === "whole_lot";
        $("m-price-label").textContent = lot ? "Price per piece (JOD) *" : "Price per unit (JOD) *";
        $("m-quantity-label").textContent = lot ? "Pieces included in this complete lot *" : "Available quantity *";
        $("min-order-field").hidden = lot;
        $("m-min").disabled = lot;
        $("method-help").textContent = lot
            ? "All pieces are sold together. Total lot price = price per piece × pieces included."
            : "The buyer chooses a quantity, respecting the minimum order.";
    }
    $("m-method")?.addEventListener("change", updateFormMethod);
    form.addEventListener("reset", () => setTimeout(updateFormMethod, 0));
    updateFormMethod();

    /* =========================================
       SHARED NAVBAR CART — SAME AS CATEGORY
       sessionStorage: stockMindCart
    ========================================= */
    const CART_KEY = "stockMindCart";
    function readSharedCart() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(CART_KEY) || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch { return []; }
    }
    function saveSharedCart(cart) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
    }
    function addToCart(product) {
        const wholeLot = isLot(product);
        const stock = stockOf(product);
        const minimum = minOf(product);
        if (product.status === "reserved" || stock < (wholeLot ? 1 : minimum)) {
            toast("This listing is unavailable.");
            return;
        }
        if (product.ownerId === String(D.currentUser()?.email||"").toLowerCase()) {toast("You cannot buy your own listing.");return;}
        const id = String(product.id);
        const cart = readSharedCart();
        const existing = cart.find(item => String(item.id) === id);
        if (wholeLot && existing) {
            toast("This entire lot is already in your cart.");
            return;
        }
        const quantity = wholeLot ? 1 : minimum;
        if (existing) {
            if (Number(existing.quantity) + quantity > stock) {
                toast(`Only ${stock} units are available.`);
                return;
            }
            existing.quantity += quantity;
        } else {
            cart.push({
                id, name: product.name,
                price: wholeLot ? lotTotal(product) : Number(product.price),
                quantity, minimum: wholeLot ? 1 : minimum,
                maxQuantity: wholeLot ? 1 : stock,
                sellingMethod: wholeLot ? "whole_lot" : "regular",
                lotUnits: wholeLot ? stock : null,
                marketplaceListingId: id,
                categoryName: product.category || "Marketplace",
                seller: product.seller || "Stock Mind Seller",
                image: product.image || defaultImage
            });
        }
        try {
            saveSharedCart(cart);
            toast(wholeLot ? "Entire lot added to the main cart." : "Product added to the main cart.");
        } catch (error) {
            console.error(error);
            toast("Unable to save the cart.");
        }
    }

    /* =========================================
       OPEN AND PREFILL LISTING FORM
    ========================================= */

    function openForm(prefill = null) {
        formCard.hidden = false;

        if (prefill) {
            $("m-method").value = prefill.sellingMethod === "whole_lot" ? "whole_lot" : "regular";
            updateFormMethod();
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
                if (methodFilter !== "all" && (isLot(product) ? "whole_lot" : "regular") !== methodFilter) return false;
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
            const lot = isLot(product);
            const reserved = product.status === "reserved";

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
                            <span class="sm-pill">${category}</span><span class="sm-pill sm-sale-type ${lot ? 'lot-type' : ''}">${lot ? 'Whole Lot' : 'By Quantity'}</span>
                            <span class="sm-muted">${location}</span>
                        </div>

                        <h3 style="font-size:16px;margin:12px 0 5px">
                            ${name}
                        </h3>

                        <p class="sm-muted" style="margin:0">
                            ${seller} · ${condition}
                        </p>

                        <div class="sm-market-price">
                            ${money(lot ? lotTotal(product) : price)}
                            <span class="sm-muted"
                                  style="font-size:11px;font-weight:500">
                                ${lot ? '/ entire lot' : '/ unit'}
                            </span>
                        </div>

                        <p class="sm-muted">
                            ${lot ? `${quantity} pieces × ${money(price)} each · Sold together only` : `${quantity} units · Minimum order ${minOrder}`}
                        </p>

                        <p class="sm-muted">${description}</p>

                        <div class="sm-market-actions">

                            <button
                                class="sm-btn sm-btn-primary request-btn"
                                type="button"
                                data-id="${id}" ${reserved || quantity < 1 || product.ownerId === String(D.currentUser()?.email||"").toLowerCase() ? 'disabled' : ''}>
                                ${reserved ? 'Reserved' : product.ownerId === String(D.currentUser()?.email||"").toLowerCase() ? 'Your listing' : lot ? 'Add entire lot' : 'Add to cart'}
                            </button>

                            <button
                                class="sm-btn sm-btn-secondary remove-btn"
                                type="button"
                                data-id="${id}"
                                title="Remove your listing"
                                aria-label="Remove ${name}"
                                ${product.ownerId === String(D.currentUser()?.email||"").toLowerCase() ? '' : 'hidden'}>
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

                addToCart(product);
            });
        });


        /* Remove demo listing */

        grid.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", async () => {
                const listing = getListings().find(x => String(x.id) === button.dataset.id);
                if (!listing || listing.ownerId !== String(D.currentUser()?.email||"").toLowerCase()) return toast("Only your own listing can be removed.");
                if (!confirm(`Remove ${listing.name}?`)) return;
                try {await D.removeListing(listing.id);render();toast("Listing removed.");}
                catch(error){toast(error.message);}
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

    document.querySelectorAll("[data-method-filter]").forEach(button => {
        button.addEventListener("click", () => {
            methodFilter = button.dataset.methodFilter;
            document.querySelectorAll("[data-method-filter]").forEach(b =>
                b.classList.toggle("is-active", b === button));
            render();
        });
    });

    search.addEventListener("input", render);

    categoryFilter.addEventListener("change", render);


    /* =========================================
       PUBLISH PRODUCT
    ========================================= */

    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const quantity = Math.floor(
            Number($("m-quantity").value)
        );

        const sellingMethod = $("m-method").value;
        const wholeLot = sellingMethod === "whole_lot";
        const minOrder = wholeLot ? quantity : Math.floor(Number($("m-min").value) || 1);

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

            price: price,
            lotPrice: wholeLot ? Number((price * quantity).toFixed(2)) : null,
            sellingMethod,
            status: "available",

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
                await D.saveListing(product);

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
                "Product published for both sellers."
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

    D.refreshListings().then(render).catch(error=>{
        console.error(error);
        toast("Please sign in using a demo seller account and start the Node server: " + error.message);
    });
    window.addEventListener("focus",()=>D.refreshListings().then(render).catch(()=>{}));

});
