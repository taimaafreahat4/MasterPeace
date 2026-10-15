
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =========================
    // ELEMENTS
    // =========================

    const $ = (selector) => document.querySelector(selector);

    const productsGrid = $("#productsGrid");
    const categoryButtons = document.querySelectorAll(".category-card");
    const sortSelect = $("#sortSelect");
    const trendsButton = $("#trendsButton");
    const resultsCount = $("#resultsCount");

    const productDetailsPage = $("#productDetailsPage");
    const backToProducts = $("#backToProducts");

    const detailsCategory = $("#detailsCategory");
    const detailsCategoryName = $("#detailsCategoryName");
    const detailsBrand = $("#detailsBrand");
    const detailsMinimum = $("#detailsMinimum");
    const minimumOrderText = $("#minimumOrderText");
    const quantityMinimum = $("#quantityMinimum");

    const detailsEmoji = $("#detailsEmoji");
    const thumbnails = document.querySelectorAll(".thumbnail");

    const minusButton = $("#minusButton");
    const plusButton = $("#plusButton");
    const quantityValue = $("#quantityValue");
    const unitPrice = $("#unitPrice");
    const totalPrice = $("#totalPrice");
    const totalCalculation = $("#totalCalculation");
    const addToCartButton = $("#addToCartButton");

    const categoriesSection = $(".categories-section");
    const productsSection = $(".products-section");

    if (!productsGrid) {
        console.error("Missing #productsGrid in category.html");
        return;
    }

    // =========================
    // CATEGORIES
    // =========================

    const categoryNames = {
        clothing: "Clothing",
        cosmetics: "Cosmetics",
        electronics: "Electronics",
        home: "Home & Living",
        books: "Books",
        grocery: "Grocery",
        sports: "Sports",
        bags: "Bags & Accessories",
        auto: "Automotive"
    };

    // Accept both category slugs and the labels
    // used in the seller form.
    function normalizeCategory(value) {
        const category = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ")
            .replace(/\s+/g, " ");

        const aliases = {
            "clothing": "clothing",
            "clothes": "clothing",
            "fashion": "clothing",

            "cosmetic": "cosmetics",
            "cosmetics": "cosmetics",
            "beauty": "cosmetics",

            "electronic": "electronics",
            "electronics": "electronics",

            "home": "home",
            "home living": "home",
            "home & living": "home",

            "book": "books",
            "books": "books",

            "grocery": "grocery",
            "groceries": "grocery",
            "food": "grocery",

            "sport": "sports",
            "sports": "sports",

            "bag": "bags",
            "bags": "bags",
            "bags & accessories": "bags",
            "accessories": "bags",

            "auto": "auto",
            "automotive": "auto",
            "car": "auto"
        };

        return aliases[category] || "";
    }

    // =========================
    // ORIGINAL PRODUCTS
    // =========================

    const categoryProducts = {
        clothing: [
            {
                id: "clothing-001",
                name: "Classic T-Shirt",
                price: 6,
                oldPrice: 9,
                minimumOrder: 20,
                sold: 1250,
                badge: "Trends",
                brand: "Stock Mind",
                colors: ["#111111", "#ffffff", "#d9d9d9"],
                images: [
                    "../Images/clothes/G74258s.webp",
                    "../Images/clothes/G74258s2.webp",
                    "../Images/clothes/G74258s4.webp",
                    "../Images/clothes/G74258s5.webp"
                ]
            }
        ],

        cosmetics: [
            {
                id: "cosmetics-001",
                name: "Cosmetic Product",
                price: 8,
                oldPrice: 12,
                minimumOrder: 10,
                sold: 980,
                badge: "Trends",
                brand: "Stock Mind",
                colors: ["#111111", "#d9b08c", "#e8c7b8"],
                images: [
                    "../Images/cosmatics/p1.png",
                    "../Images/cosmatics/p2.png",
                    "../Images/cosmatics/p3.png",
                    "../Images/cosmatics/p4.png"
                ]
            }
        ],

        electronics: [
            {
                id: "electronics-001",
                name: "Electronic Product",
                price: 25,
                oldPrice: 35,
                minimumOrder: 5,
                sold: 620,
                badge: "Trends",
                brand: "Stock Mind",
                colors: ["#111111", "#ffffff", "#808080"],
                images: [
                    "../Images/electronic/p1.jpg",
                    "../Images/electronic/p2.jpg",
                    "../Images/electronic/p3.jpg",
                    "../Images/electronic/p4.jpg"
                ]
            }
        ],

        home: [
    {
        id: "home-001",
        name: "Home & Living Product",
        price: 25,
        oldPrice: 35,
        minimumOrder: 1,
        sold: 0,
        badge: "Trends",
        brand: "Stock Mind",
        colors: ["#d9d0c3", "#ffffff", "#808080"],
        images: [
            "../Images/home/m1.avif",
            "../Images/home/m2.avif",
            "../Images/home/m3.avif",
            "../Images/home/m4.avif"
        ]
    }
],
        books: [],
        grocery: [],
        sports: [],
        bags: [],
        auto: []
    };

    // =========================
    // SELLER PRODUCTS
    // =========================

    function readSellerProducts() {
        // Supports the main key and a few earlier key names.
        const storageKeys = [
            "stockMindSellerProducts",
            "sellerProducts",
            "stockMindProducts"
        ];

        for (const key of storageKeys) {
            try {
                const saved = JSON.parse(localStorage.getItem(key) || "[]");

                if (Array.isArray(saved) && saved.length > 0) {
                    return saved;
                }
            } catch (error) {
                console.warn("Could not read seller products:", key, error);
            }
        }

        return [];
    }

    function addSellerProductsToCategories() {
        const sellerProducts = readSellerProducts();

        sellerProducts.forEach((item, index) => {
            if (!item || typeof item !== "object") return;

            const category = normalizeCategory(
                item.category || item.categoryName
            );

            // Do not show a seller's item in unrelated categories.
            if (!category || !categoryProducts[category]) return;

            const productId = String(
                item.id || `seller-${index}-${item.name || "product"}`
            );

            // Prevent duplicate products.
            const alreadyExists = categoryProducts[category].some(
                product => String(product.id) === productId
            );

            if (alreadyExists) return;

            let images = [];

            if (Array.isArray(item.images)) {
                images = item.images;
            } else if (Array.isArray(item.photos)) {
                images = item.photos;
            } else if (item.image) {
                images = [item.image];
            }

            // Keep only usable image strings.
            images = images.filter(
                image => typeof image === "string" && image.trim() !== ""
            );

            categoryProducts[category].push({
                id: productId,
                name: String(item.name || item.title || "Seller Product"),
                price: Number(item.price || item.sellingPrice || 0),
                oldPrice: 0,
                minimumOrder: 1,
                quantity: Math.max(0, Number(item.quantity) || 0),
                sold: 0,
                badge: "",
                brand: String(item.brand || item.seller || "Seller"),
                colors: [],
                images: images,
                condition: item.condition || "New",
                description: item.description || "",
                sellerProduct: true
            });
        });
    }

    // Important: define categoryProducts before adding seller products.
    addSellerProductsToCategories();

    // =========================
    // STATE
    // =========================

    let currentCategory = "clothing";
    let currentProduct = null;
    let currentQuantity = 1;
    let trendsOnly = false;
    let mainImageIndex = 0;

    const CART_KEY = "stockMindCart";

    // =========================
    // HELPERS
    // =========================

    function money(value) {
        return `JOD ${Number(value || 0).toFixed(2)}`;
    }

    function getPrice(product) {
        return Number(product.price) || 0;
    }

    function getMinimum(product) {
        if (product.sellerProduct) return 1;

        return Math.max(
            1,
            Math.floor(Number(product.minimumOrder) || 1)
        );
    }

    function getProductImage(product, index = 0) {
        if (
            Array.isArray(product.images) &&
            product.images.length > 0
        ) {
            return product.images[
                ((index % product.images.length) + product.images.length)
                % product.images.length
            ];
        }

        return "";
    }

    function getCart() {
        try {
            const cart = JSON.parse(
                sessionStorage.getItem(CART_KEY) || "[]"
            );

            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    }

function saveCart(cart) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));

    updateCartCount();

    window.dispatchEvent(new Event("cartUpdated"));
}
function updateCartCount() {
    const cart = getCart();

    const count = cart.length;

    document.querySelectorAll(
        "[data-cart-count], .cart-count"
    ).forEach(badge => {
        badge.textContent = String(count);
        badge.hidden = count === 0;
    });
}

    function showNotice(message) {
        let notice = $("#categoryNotice");

        if (!notice) {
            notice = document.createElement("div");
            notice.id = "categoryNotice";
            notice.setAttribute("role", "status");

            notice.style.cssText = `
                position:fixed;
                right:24px;
                bottom:24px;
                z-index:9999;
                max-width:calc(100% - 32px);
                padding:14px 20px;
                border-radius:12px;
                background:#061735;
                color:white;
                box-shadow:0 8px 30px rgba(0,0,0,.18);
                font:600 14px Arial,sans-serif;
            `;

            document.body.appendChild(notice);
        }

        notice.textContent = message;
        notice.hidden = false;

        clearTimeout(showNotice.timer);

        showNotice.timer = setTimeout(() => {
            notice.hidden = true;
        }, 2800);
    }

    // =========================
    // CART
    // =========================

    function addProductToCart(product, quantity) {
        if (!product) return;

        if (
            product.sellerProduct &&
            Number(product.quantity) <= 0
        ) {
            showNotice("This product is out of stock.");
            return;
        }

        const minimum = getMinimum(product);
        const amount = Math.max(
            minimum,
            Math.floor(Number(quantity) || minimum)
        );

        if (
            product.sellerProduct &&
            amount > Number(product.quantity)
        ) {
            showNotice(
                `Only ${product.quantity} units are available.`
            );
            return;
        }

        const cart = getCart();
        const existing = cart.find(
            item => String(item.id) === String(product.id)
        );

        if (existing) {
            const newQuantity = Number(existing.quantity || 0) + amount;

            if (
                product.sellerProduct &&
                newQuantity > Number(product.quantity)
            ) {
                showNotice(
                    `Only ${product.quantity} units are available.`
                );
                return;
            }

            existing.quantity = newQuantity;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: getPrice(product),
                minimum: minimum,
                quantity: amount,
                category: currentCategory,
                categoryName: categoryNames[currentCategory] || currentCategory,
                image: getProductImage(product, 0),
                seller: product.brand || "Stock Mind Supplier"
            });
        }

        saveCart(cart);
        showNotice(`${product.name} added to your cart.`);
    }

    // =========================
    // PRODUCT LIST
    // =========================

    function showProducts(category) {
        currentCategory = category;

        productsGrid.replaceChildren();

        let products = [];

        if (category === "all") {
            Object.keys(categoryProducts).forEach(categoryKey => {
                categoryProducts[categoryKey].forEach(product => {
                    products.push({
                        product,
                        category: categoryKey
                    });
                });
            });
        } else {
            products = (categoryProducts[category] || []).map(product => ({
                product,
                category
            }));
        }

        if (trendsOnly) {
            products = products.filter(
                entry => entry.product.badge === "Trends"
            );
        }

        const sortValue = sortSelect?.value || "recommended";

        if (sortValue === "price-low") {
            products.sort(
                (a, b) => getPrice(a.product) - getPrice(b.product)
            );
        } else if (sortValue === "price-high") {
            products.sort(
                (a, b) => getPrice(b.product) - getPrice(a.product)
            );
        } else if (sortValue === "name") {
            products.sort(
                (a, b) => a.product.name.localeCompare(b.product.name)
            );
        }

        if (resultsCount) {
            resultsCount.textContent =
                `${products.length} ${products.length === 1 ? "product" : "products"}`;
        }

        if (products.length === 0) {
            const empty = document.createElement("div");
            empty.className = "no-products";

            const title = document.createElement("h3");
            title.textContent = "No products available yet";

            const text = document.createElement("p");
            text.textContent =
                "Products for this category will be added soon.";

            empty.append(title, text);
            productsGrid.appendChild(empty);
            return;
        }

        products.forEach(entry => {
            productsGrid.appendChild(
                createProductCard(entry.product, entry.category)
            );
        });
    }

    // =========================
    // PRODUCT CARD
    // =========================

    function createProductCard(product, category) {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageBox = document.createElement("div");
        imageBox.className = "product-image";
        // FAVORITE BUTTON

const favoriteButton = document.createElement("button");

favoriteButton.className = "favorite-button";

favoriteButton.innerHTML = "♡";

favoriteButton.type = "button";


function getFavorites(){

    return JSON.parse(
        localStorage.getItem("stockMindFavorites")
        || "[]"
    );

}



function saveFavorites(items){

    localStorage.setItem(
        "stockMindFavorites",
        JSON.stringify(items)
    );

}



function updateFavoriteIcon(){

    const favorites = getFavorites();

    const exists = favorites.some(
        item => item.id === product.id
    );


    favoriteButton.innerHTML =
    exists ? "♥" : "♡";


    favoriteButton.classList.toggle(
        "active",
        exists
    );

}


updateFavoriteIcon();



favoriteButton.onclick = function(e){

    e.stopPropagation();


    let favorites = getFavorites();


    const exists = favorites.some(
        item=>item.id === product.id
    );


    if(exists){

        favorites =
        favorites.filter(
            item=>item.id !== product.id
        );


    }else{


        favorites.push({

            id:product.id,

            name:product.name,

            price:product.price,

            image:getProductImage(product,0),

            brand:product.brand

        });


    }


    saveFavorites(favorites);


    updateFavoriteIcon();


    if(window.updateFavoriteCount){

        window.updateFavoriteCount();

    }


};





imageBox.appendChild(favoriteButton);

        if (product.badge) {
            const badge = document.createElement("span");
            badge.className = "product-badge";
            badge.textContent = `✦ ${product.badge}`;
            imageBox.appendChild(badge);
        }

        const image = document.createElement("img");
        image.className = "product-main-photo";
        image.alt = product.name;
        image.loading = "lazy";

        const firstImage = getProductImage(product, 0);

        if (firstImage) {
            image.src = firstImage;
        } else {
            image.hidden = true;
        }

        const fallback = document.createElement("div");
        fallback.className = "image-error";
        fallback.textContent = "🛍️";
        fallback.hidden = Boolean(firstImage);

        imageBox.append(image, fallback);

        image.addEventListener("error", () => {
            image.hidden = true;
            fallback.hidden = false;
        });

        // Rotate through the product's own photos while hovering.
        let hoverInterval = null;
        let imageIndex = 0;

        imageBox.addEventListener("mouseenter", () => {
            if (!product.images || product.images.length < 2) return;

            clearInterval(hoverInterval);

            hoverInterval = setInterval(() => {
                imageIndex = (imageIndex + 1) % product.images.length;
                image.src = product.images[imageIndex];
            }, 1500);
        });

        imageBox.addEventListener("mouseleave", () => {
            clearInterval(hoverInterval);
            imageIndex = 0;

            const originalImage = getProductImage(product, 0);

            if (originalImage) {
                image.src = originalImage;
            }
        });

        const cartButton = document.createElement("button");
        cartButton.className = "product-cart-button add-to-cart-text";
        cartButton.type = "button";
        cartButton.textContent = "Add to Cart";
        cartButton.setAttribute(
            "aria-label",
            `Add ${product.name} to cart`
        );

        imageBox.appendChild(cartButton);

        const info = document.createElement("div");
        info.className = "product-info";

        const brand = document.createElement("div");
        brand.className = "product-brand";
        brand.textContent = `${product.brand || "Stock Mind"} ✦`;

        const name = document.createElement("h3");
        name.className = "product-name";
        name.textContent = product.name;

        const priceRow = document.createElement("div");
        priceRow.className = "product-price-row";

        const price = document.createElement("strong");
        price.className = "product-price";
        price.textContent = money(product.price);
        priceRow.appendChild(price);

        if (Number(product.oldPrice) > getPrice(product)) {
            const oldPrice = document.createElement("span");
            oldPrice.className = "product-old-price";
            oldPrice.textContent = money(product.oldPrice);
            priceRow.appendChild(oldPrice);
        }

        const meta = document.createElement("div");
        meta.className = "product-meta";

        const sold = document.createElement("span");
        sold.textContent = product.sellerProduct
            ? `${product.quantity} available`
            : `${Number(product.sold || 0).toLocaleString()} sold`;

        const minimum = document.createElement("span");
        minimum.textContent = product.sellerProduct
            ? "Seller listing"
            : `Min. ${getMinimum(product)}`;

        meta.append(sold, minimum);

        const bottom = document.createElement("div");
        bottom.className = "product-bottom";

        const colors = document.createElement("div");
        colors.className = "color-options";

        (product.colors || []).forEach((color, index) => {
            const dot = document.createElement("span");
            dot.className = `color-dot${index === 0 ? " active" : ""}`;
            dot.style.backgroundColor = color;
            colors.appendChild(dot);
        });

        const detailsButton = document.createElement("button");
        detailsButton.className = "view-details-button";
        detailsButton.type = "button";
        detailsButton.textContent = "View details";

        bottom.append(colors, detailsButton);
        info.append(brand, name, priceRow, meta, bottom);
        card.append(imageBox, info);

        cartButton.addEventListener("click", () => {
            currentCategory = category;
            addProductToCart(product, getMinimum(product));
        });

        detailsButton.addEventListener("click", () => {
            openProductDetails(product, category);
        });

        // Clicking the photo opens product details.
        image.addEventListener("click", () => {
            openProductDetails(product, category);
        });

        return card;
    }

    // =========================
    // PRODUCT DETAILS
    // =========================

    function openProductDetails(product, category) {
        currentProduct = product;
        currentCategory = category;
        currentQuantity = getMinimum(product);
        mainImageIndex = 0;

        if (categoriesSection) categoriesSection.style.display = "none";
        if (productsSection) productsSection.style.display = "none";
        if (productDetailsPage) productDetailsPage.style.display = "block";

        if (detailsCategory) {
            detailsCategory.textContent = categoryNames[category] || category;
        }

        if (detailsCategoryName) {
            detailsCategoryName.textContent =
                categoryNames[category] || category;
        }

        if (detailsBrand) {
            detailsBrand.textContent = product.brand || "Stock Mind";
        }

        if (detailsMinimum) {
            detailsMinimum.textContent = product.sellerProduct
                ? `${product.quantity} units available`
                : `${getMinimum(product)} units`;
        }

        if (minimumOrderText) {
            minimumOrderText.textContent = product.sellerProduct
                ? "1 unit"
                : `${getMinimum(product)} units`;
        }

        if (quantityMinimum) {
            quantityMinimum.textContent = String(getMinimum(product));
        }

        const firstImage = getProductImage(product, 0);
        setMainProductImage(firstImage);

        thumbnails.forEach((thumbnail, index) => {
            thumbnail.replaceChildren();
            thumbnail.classList.toggle("active", index === 0);

            const imageUrl = getProductImage(product, index);

            if (!imageUrl) {
                thumbnail.hidden = true;
                return;
            }

            thumbnail.hidden = false;

            const image = document.createElement("img");
            image.src = imageUrl;
            image.alt = `${product.name} image ${index + 1}`;

            image.addEventListener("error", () => {
                thumbnail.hidden = true;
            }, { once: true });

            thumbnail.appendChild(image);

            thumbnail.onclick = () => {
                mainImageIndex = index;
                setMainProductImage(imageUrl);

                thumbnails.forEach(item => {
                    item.classList.remove("active");
                });

                thumbnail.classList.add("active");
            };
        });

        if (plusButton) {
            plusButton.disabled = product.sellerProduct &&
                currentQuantity >= Number(product.quantity);
        }

        updateTotal();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function setMainProductImage(imageUrl) {
        if (!detailsEmoji) return;

        detailsEmoji.replaceChildren();

        if (!imageUrl) {
            detailsEmoji.textContent = "🛍️";
            return;
        }

        const image = document.createElement("img");
        image.className = "details-main-photo";
        image.src = imageUrl;
        image.alt = currentProduct?.name || "Product";

        image.addEventListener("error", () => {
            image.remove();
            detailsEmoji.textContent = "🛍️";
        }, { once: true });

        detailsEmoji.appendChild(image);
    }

    function updateTotal() {
        if (!currentProduct) return;

        const price = getPrice(currentProduct);
        const total = currentQuantity * price;

        if (quantityValue) {
            quantityValue.textContent = String(currentQuantity);
        }

        if (unitPrice) {
            unitPrice.textContent = money(price);
        }

        if (totalPrice) {
            totalPrice.textContent = money(total);
        }

        if (totalCalculation) {
            totalCalculation.textContent =
                `${currentQuantity} units × ${money(price)}`;
        }

        if (minusButton) {
            minusButton.disabled =
                currentQuantity <= getMinimum(currentProduct);
        }

        if (plusButton) {
            plusButton.disabled = currentProduct.sellerProduct &&
                currentQuantity >= Number(currentProduct.quantity);
        }
    }

    // =========================
    // QUANTITY BUTTONS
    // =========================

    minusButton?.addEventListener("click", () => {
        if (!currentProduct) return;

        currentQuantity = Math.max(
            getMinimum(currentProduct),
            currentQuantity - 1
        );

        updateTotal();
    });

    plusButton?.addEventListener("click", () => {
        if (!currentProduct) return;

        if (
            currentProduct.sellerProduct &&
            currentQuantity >= Number(currentProduct.quantity)
        ) {
            showNotice("You reached the available quantity.");
            return;
        }

        currentQuantity++;
        updateTotal();
    });

    addToCartButton?.addEventListener("click", () => {
        if (!currentProduct) return;

        addProductToCart(currentProduct, currentQuantity);
    });

    backToProducts?.addEventListener("click", () => {
        if (productDetailsPage) {
            productDetailsPage.style.display = "none";
        }

        if (categoriesSection) categoriesSection.style.display = "";
        if (productsSection) productsSection.style.display = "";

        currentProduct = null;

        showProducts(currentCategory);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    // =========================
    // CATEGORY BUTTONS
    // =========================

    categoryButtons.forEach(button => {
        button.addEventListener("click", () => {
            categoryButtons.forEach(item => {
                item.classList.remove("active");
            });

            button.classList.add("active");

            currentCategory = normalizeCategory(button.dataset.category)
                || button.dataset.category
                || "clothing";

            trendsOnly = false;
            trendsButton?.classList.remove("active");

            showProducts(currentCategory);
        });
    });

    sortSelect?.addEventListener("change", () => {
        showProducts(currentCategory);
    });

    trendsButton?.addEventListener("click", () => {
        trendsOnly = !trendsOnly;
        trendsButton.classList.toggle("active", trendsOnly);
        showProducts(currentCategory);
    });

    // =========================
    // NAVBAR CART LINK
    // =========================

    document.querySelectorAll(
        "[data-open-cart], .navbar-cart-link"
    ).forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            window.location.href = "../cart/cart.html";
        });
    });

    // =========================
    // START PAGE
    // =========================

    updateCartCount();

    const activeCategory = $(".category-card.active");

    currentCategory = normalizeCategory(activeCategory?.dataset.category)
        || activeCategory?.dataset.category
        || "clothing";

    showProducts(currentCategory);
});
