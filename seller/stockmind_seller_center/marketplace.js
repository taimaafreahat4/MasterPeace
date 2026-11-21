
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
    const currentSeller = D?.currentSeller?.() || null;
    const currentSellerEmail = String(currentSeller?.email || "").trim().toLowerCase();
    const currentSellerId = String(currentSeller?.id || currentSeller?.username || currentSellerEmail).trim().toLowerCase();
    const storeProfileApi = window.StockMindStoreProfile;
    const currentStoreProfile = currentSeller && storeProfileApi?.get(currentSeller);
    if (!currentSeller) {
        window.location.replace("../../login/login.html?role=seller");
        return;
    }
    if (!currentStoreProfile || !storeProfileApi.isComplete(currentSeller)) {
        window.location.replace("store-profile.html?mode=setup");
        return;
    }
    const currentStoreName = String(currentStoreProfile.storeName || currentSeller?.storeName || (currentSeller?.name ? currentSeller.name + "'s Store" : "My Store"));
    const businessCategory = String(currentStoreProfile.businessCategory || "other").toLowerCase();
    const categoryLabels = {electronics:"Phones & Electronics",home:"Home & Living",clothes:"Clothes & Fashion",books:"Books & Stationery",toys_baby:"Toys & Baby",cosmetics:"Cosmetics & Beauty",accessories:"Bags & Accessories",sports:"Sports",grocery:"Grocery",other:"Other"};
    const ownsListing = product => Boolean(currentSellerEmail && product?.sellerListed && String(product.sellerEmail || "").toLowerCase() === currentSellerEmail);

    const form = $("marketplace-form");
    const formCard = $("listing-form-card");
    const grid = $("market-grid");
    const search = $("market-search");
    const categoryFilter = $("market-category-filter");
    const emptyMessage = $("market-empty");
    const storeContext = $("store-market-context");

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

    function canonicalCategory(value) {
        const key = String(value || "").trim().toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
        const aliases = {"electronics":"electronics","phones electronics":"electronics","phone electronics":"electronics","home living":"home","home":"home","clothes":"clothes","clothing":"clothes","clothes fashion":"clothes","books":"books","books stationery":"books","toys baby":"toys_baby","toy baby":"toys_baby","baby products":"toys_baby","cosmetics":"cosmetics","cosmetics beauty":"cosmetics","bags accessories":"accessories","accessories":"accessories","sports":"sports","grocery":"grocery","other":"other"};
        return aliases[key] || "other";
    }

    const allowedCategory = businessCategory in categoryLabels ? businessCategory : "other";
    const storeCategoryLabel = categoryLabels[allowedCategory];
    if (storeContext) {
        storeContext.replaceChildren();
        const text = document.createElement("span");
        text.textContent = `Marketplace is showing ${storeCategoryLabel} listings for ${currentStoreProfile.storeName}. Your own listings remain visible for management.`;
        const edit = document.createElement("a");
        edit.href = "store-profile.html";
        edit.textContent = "Edit store category";
        storeContext.append(text, edit);
    }

    const matchingFilterOption = [...categoryFilter.options].find(option => canonicalCategory(option.textContent) === allowedCategory);
    [...categoryFilter.options].forEach(option => {
        if (!option.value) return;
        option.disabled = canonicalCategory(option.textContent) !== allowedCategory;
    });
    if (matchingFilterOption) categoryFilter.value = matchingFilterOption.value;

    const defaultImage =
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80";

    let prefilledImage = "";
    let uploadedImageData = "";


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

    function showImagePreview(source) {
        const preview = $("m-image-preview");
        if (!preview) return;
        preview.replaceChildren();
        if (!source) {
            const placeholder = document.createElement("span");
            placeholder.textContent = "Product photo preview";
            preview.appendChild(placeholder);
            return;
        }
        const image = document.createElement("img");
        image.src = source;
        image.alt = "Selected product photo preview";
        image.onerror = () => showImagePreview("");
        preview.appendChild(image);
    }

    $("m-image-file")?.addEventListener("change", async event => {
        const file = event.target.files?.[0];
        if (!file) {
            uploadedImageData = "";
            showImagePreview($("m-image")?.value.trim() || prefilledImage);
            return;
        }
        if (!file.type.startsWith("image/")) {
            event.target.value = "";
            toast("Please choose a valid image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            event.target.value = "";
            toast("Choose an image smaller than 5 MB.");
            return;
        }

        try {
            uploadedImageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(new Error("Could not read image."));
                reader.onload = () => {
                    const sourceImage = new Image();
                    sourceImage.onerror = () => reject(new Error("Invalid image file."));
                    sourceImage.onload = () => {
                        const maxDimension = 1400;
                        const scale = Math.min(1, maxDimension / Math.max(sourceImage.width, sourceImage.height));
                        const canvas = document.createElement("canvas");
                        canvas.width = Math.max(1, Math.round(sourceImage.width * scale));
                        canvas.height = Math.max(1, Math.round(sourceImage.height * scale));
                        canvas.getContext("2d").drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL("image/jpeg", 0.82));
                    };
                    sourceImage.src = String(reader.result);
                };
                reader.readAsDataURL(file);
            });
            $("m-image").value = "";
            showImagePreview(uploadedImageData);
        } catch (error) {
            uploadedImageData = "";
            event.target.value = "";
            showImagePreview("");
            toast("This image could not be loaded. Try another file.");
        }
    });

    $("m-image")?.addEventListener("input", event => {
        if (event.target.value.trim()) {
            uploadedImageData = "";
            $("m-image-file").value = "";
            showImagePreview(event.target.value.trim());
        } else if (!uploadedImageData) {
            showImagePreview(prefilledImage);
        }
    });

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
    const lotTotal = product => Number(product?.price) * stockOf(product);
    let methodFilter = "all";

    function updateFormMethod() {
        const lot = $("m-method")?.value === "whole_lot";
        $("m-price-label").textContent = "Price per unit (JOD) *";
        $("m-quantity-label").textContent = lot ? "Pieces included in this complete lot *" : "Available quantity *";
        $("min-order-field").hidden = lot;
        $("m-min").disabled = lot;
        $("m-min").max = $("m-quantity").value || "";
        $("method-help").textContent = lot
            ? "Enter the price for one piece. The full lot total is unit price × pieces."
            : "The buyer chooses a quantity, respecting the minimum order.";
    }
    $("m-method")?.addEventListener("change", updateFormMethod);
    $("m-quantity")?.addEventListener("input", updateFormMethod);
    form.addEventListener("reset", () => setTimeout(() => {
        updateFormMethod();
        uploadedImageData = "";
        showImagePreview("");
    }, 0));
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
        if (ownsListing(product)) {
            toast("You cannot buy your own listing. Sign in as another seller to purchase it.");
            return;
        }
        const wholeLot = isLot(product);
        const stock = stockOf(product);
        const minimum = minOf(product);
        if (product.status !== "available" || stock < (wholeLot ? 1 : minimum)) {
            toast("This listing is unavailable.");
            return;
        }
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
                unitPrice: Number(product.price),
                quantity, minimum: wholeLot ? 1 : minimum,
                maxQuantity: wholeLot ? 1 : stock,
                sellingMethod: wholeLot ? "whole_lot" : "regular",
                lotUnits: wholeLot ? stock : null,
                marketplaceListingId: id,
                categoryName: product.category || "Marketplace",
                condition: product.condition || "New",
                seller: product.seller || "Stock Mind Seller",
                sellerId: product.sellerId || "",
                sellerEmail: product.sellerEmail || "",
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
            showImagePreview(image);

            $("m-description").value =
                prefill.description || "";
        } else {
            $("m-seller").value = currentStoreName;
            setSelectValue($("m-category"), allowedCategory);
            $("m-location").value = [currentStoreProfile.locationDetails,currentStoreProfile.city,currentStoreProfile.country].filter(Boolean).join(", ");
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
                const own = ownsListing(product);
                const isApproved = product.approvalStatus === "approved";
                const matchesApproval = own || isApproved;
                const matchesStoreCategory = own || canonicalCategory(product.category) === allowedCategory;
                if (!matchesApproval || !matchesStoreCategory) return false;
                if (methodFilter !== "all" && (isLot(product) ? "whole_lot" : "regular") !== methodFilter) return false;
                const matchesCategory = !category || own || canonicalCategory(product.category) === canonicalCategory(category);

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
            const sold = product.status === "sold" || quantity < 1;
            const own = ownsListing(product);
            const approvalStatus = product.approvalStatus || "approved";
            const waitingApproval = own && approvalStatus === "pending_review";
            const rejected = own && approvalStatus === "rejected";
            const approvalLabel = waitingApproval ? "Pending admin review" : rejected ? "Not approved · remove and submit again" : "Approved for marketplace";

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

                        ${own ? `<p class="sm-listing-review-status ${waitingApproval ? 'is-pending' : rejected ? 'is-rejected' : 'is-approved'}">${approvalLabel}</p>` : ""}

                        <div class="sm-market-price">
                            ${money(lot ? lotTotal(product) : price)}
                            <span class="sm-muted"
                                  style="font-size:11px;font-weight:500">
                                ${lot ? '/ entire lot' : '/ unit'}
                            </span>
                        </div>

                        <p class="sm-muted">
                            ${lot ? `${quantity} pieces · Sold together only` : `${quantity} units · Minimum order ${minOrder}`}
                        </p>

                        <p class="sm-muted">${description}</p>

                        <div class="sm-market-actions">

                            <button
                                class="sm-btn sm-btn-primary request-btn"
                                type="button"
                                data-id="${id}" ${reserved || sold || own ? 'disabled' : ''}>
                                ${own ? waitingApproval ? 'Awaiting approval' : rejected ? 'Not approved' : 'Your listing' : reserved ? 'Reserved' : sold ? 'Sold' : lot ? 'Add entire lot' : 'Add to cart'}
                            </button>

                            <button
                                class="sm-btn sm-btn-secondary remove-btn"
                                type="button"
                                data-id="${id}"
                                title="Remove your listing"
                                aria-label="Remove ${name}"
                                ${own ? '' : 'hidden'}>
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
            button.addEventListener("click", () => {
                try {
                    const selected = getListings().find(item => String(item.id) === button.dataset.id);
                    if (!ownsListing(selected)) {
                        toast("Only your own demo listings can be removed.");
                        return;
                    }
                    if (!confirm(`Remove ${selected.name} from the Marketplace?`)) return;
                    const remaining = getListings().filter(
                        item => String(item.id) !== button.dataset.id
                    );

                    if (typeof D.write !== "function" || !D.LISTINGS_KEY) {
                        throw new Error(
                            "Marketplace storage functions are unavailable."
                        );
                    }

                    D.write(D.LISTINGS_KEY, remaining);
                    const old = JSON.parse(localStorage.getItem("sellerProducts") || "[]");
                    if (Array.isArray(old)) localStorage.setItem("sellerProducts", JSON.stringify(old.filter(item => String(item.id) !== button.dataset.id)));
                    const remainingCart = readSharedCart().filter(item => String(item.id) !== button.dataset.id);
                    saveSharedCart(remainingCart);
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

    window.addEventListener("storage", event => {
        if (event.key === D.LISTINGS_KEY) render();
    });


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

            price,
            lotPrice: wholeLot ? Number((price * quantity).toFixed(2)) : null,
            sellingMethod,
            status: "available",
            approvalStatus: "pending_review",

            quantity,

            minOrder,

            location: $("m-location").value.trim(),

            seller: $("m-seller").value.trim() || "My Store",
            sellerId: currentSellerId,
            sellerEmail: currentSellerEmail,

            condition: $("m-condition").value,

            image: uploadedImageData || typedImage || prefilledImage || defaultImage,

            description: $("m-description").value.trim(),

            sellerListed: true,

            dateAdded: new Date().toISOString()
        };

        if (!product.name) {
            toast("Please enter a product name.");
            return;
        }
        if (!currentSellerEmail) {
            toast("Log in with a seller account before publishing a listing.");
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
            $("m-seller").value = currentStoreName;
            $("m-min").value = "1";

            prefilledImage = "";
            uploadedImageData = "";
            showImagePreview("");

            formCard.hidden = true;

            search.value = "";
            categoryFilter.value = "";

            render();

            toast("Product submitted for admin review. It will appear to buyers after approval.");
            window.dispatchEvent(new Event("stockMindListingsUpdated"));

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

        if (params.get("newListing") === "1") {
            openForm(pending || null);
            if (pending) localStorage.removeItem("stockMindPrelistProduct");
        }
    } catch (error) {
        console.error("Could not load prefilled listing:", error);
    }


    /* =========================================
       INITIALIZE
    ========================================= */

    render();

});
