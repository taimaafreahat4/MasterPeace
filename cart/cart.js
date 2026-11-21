
(() => {
    "use strict";

    const CART_KEY = "stockMindCart";
    const USER_KEY = "stockMindUser";
    const RETURN_KEY = "stockMindReturnTo";

    const $ = (selector) => document.querySelector(selector);

    const itemsElement = $("#cartItems");
    const emptyElement = $("#emptyCart");
    const countElement = $("#productCount");
    const subtotalElement = $("#subtotal");
    const commissionElement = $("#commission");
    const shippingElement = $("#shipping");
    const totalElement = $("#total");
    const checkoutButton = $("#checkoutButton");
    const browseButton = $("#browseProducts");

    if (!itemsElement || !emptyElement || !checkoutButton) {
        console.error("Cart HTML is missing required elements.");
        return;
    }

    function getCart() {
        try {
            const value = sessionStorage.getItem(CART_KEY);
            const cart = value ? JSON.parse(value) : [];

            if (!Array.isArray(cart)) return [];

            const normalized = cart.filter(item => item && item.id != null && typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) && Number(item.price) >= 0)
                .map(item => {
                    const lot = item.sellingMethod === "whole_lot";
                    const minimum = lot ? 1 : Math.max(1, Math.floor(Number(item.minimum) || 1));
                    const maxQuantity = lot ? 1 : (Number.isFinite(Number(item.maxQuantity)) && Number(item.maxQuantity) > 0
                        ? Math.floor(Number(item.maxQuantity)) : null);
                    const quantity = lot ? 1 : Math.max(minimum, Math.floor(Number(item.quantity) || minimum));
                    let unitPrice = Number(item.unitPrice);
                    if (lot && (!Number.isFinite(unitPrice) || unitPrice <= 0)) {
                        let listings = [];
                        try { listings = JSON.parse(localStorage.getItem("stockMindMarketplaceListings") || "[]"); } catch {}
                        const listing = Array.isArray(listings) && listings.find(row => String(row.id) === String(item.marketplaceListingId || item.id));
                        unitPrice = Number(listing?.price);
                        if (!Number.isFinite(unitPrice) || unitPrice <= 0) unitPrice = Number(item.price) / Math.max(1, Number(item.lotUnits) || 1);
                    }
                    const price = lot ? unitPrice * Math.max(1, Number(item.lotUnits) || 1) : Number(item.price);
                    return {...item, id: String(item.id), price, ...(lot ? {unitPrice} : {}), minimum,
                        maxQuantity, quantity: maxQuantity ? Math.min(quantity, maxQuantity) : quantity};
                });
            if (JSON.stringify(normalized) !== JSON.stringify(cart)) sessionStorage.setItem(CART_KEY, JSON.stringify(normalized));
            return normalized;
        } catch (error) {
            console.error("Unable to read cart:", error);
            return [];
        }
    }

    function saveCart(cart) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
    }

    function money(value) {
        return `JOD ${Number(value || 0).toFixed(2)}`;
    }

    function createElement(tag, className, text) {
        const node = document.createElement(tag);

        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;

        return node;
    }

    function renderCart() {
        const cart = getCart();

        itemsElement.replaceChildren();

        const isEmpty = cart.length === 0;

        emptyElement.classList.toggle("hidden", !isEmpty);
        itemsElement.classList.toggle("hidden", isEmpty);
        checkoutButton.disabled = isEmpty;

        if (countElement) {
            const lotPieces = cart.reduce((sum, item) => sum + (item.sellingMethod === "whole_lot" ? Math.max(0, Number(item.lotUnits) || 0) : 0), 0);
            const regularUnits = cart.reduce((sum, item) => sum + (item.sellingMethod === "whole_lot" ? 0 : item.quantity), 0);
            const wholeLots = cart.filter(item => item.sellingMethod === "whole_lot").length;
            if (cart.length === 1 && wholeLots === 1) {
                countElement.textContent = `1 complete lot · ${lotPieces} pieces`;
            } else {
                const productLabel = `${cart.length} ${cart.length === 1 ? "product" : "products"}`;
                const quantityLabel = wholeLots && regularUnits
                    ? `${regularUnits} units + ${lotPieces} lot pieces`
                    : wholeLots
                    ? `${lotPieces} pieces in ${wholeLots} ${wholeLots === 1 ? "lot" : "lots"}`
                    : `${regularUnits} ${regularUnits === 1 ? "unit" : "units"}`;
                countElement.textContent = `${productLabel} · ${quantityLabel}`;
            }
        }

        if (isEmpty) {

    subtotalElement.textContent = money(0);

    if (commissionElement) {
        commissionElement.textContent = money(0);
    }

    shippingElement.textContent = "Calculated at checkout";

    totalElement.textContent = money(0);

    return;
}

        let subtotal = 0;

        cart.forEach((product) => {
            subtotal += product.price * product.quantity;

            const card = createElement("article", "cart-item");
            const imageBox = createElement("div", "cart-item-image");

            if (product.image) {
                const image = document.createElement("img");
                image.src = product.image;
                image.alt = product.name;
                image.loading = "lazy";

                image.addEventListener("error", () => {
                    image.remove();
                    imageBox.append(
                        createElement("span", "image-fallback", "🛍️")
                    );
                }, { once: true });

                imageBox.append(image);
            } else {
                imageBox.append(
                    createElement("span", "image-fallback", "🛍️")
                );
            }

            const info = createElement("div", "cart-item-info");
            info.append(
                createElement("h3", "cart-item-name", product.name),
                createElement(
                    "p",
                    "cart-item-seller",
                    product.seller || "Stock Mind Supplier"
                ),
                createElement(
                    "span",
                    "cart-item-category",
                    product.categoryName || "Wholesale"
                ),
                createElement(
                    "p",
                    "cart-minimum",
                    product.sellingMethod === "whole_lot"
                        ? `WHOLE LOT · ${product.lotUnits || 1} pieces sold together`
                        : `Minimum order: ${product.minimum} units`
                ),
                createElement(
    "p",
    "cart-commission",
    "Platform Commission: 5%"
),
            );

            const right = createElement("div", "cart-item-right");
            const priceBox = createElement("div", "cart-unit-price");
            priceBox.append(
                createElement("span", "", product.sellingMethod === "whole_lot"
                    ? `${money(product.unitPrice)} × ${Number(product.lotUnits || 1).toLocaleString()} pieces`
                    : "Unit price"),
                createElement("strong", "", money(product.price))
            );

            const quantityBox = createElement("div", "cart-quantity");

            const minus = createElement("button", "quantity-button", "−");
            minus.type = "button";
            minus.disabled = product.sellingMethod === "whole_lot" || product.quantity <= product.minimum;
            minus.setAttribute("aria-label", `Decrease ${product.name}`);
            minus.addEventListener("click", () => {
                changeQuantity(product.id, -1);
            });

            const quantity = createElement(
                "span",
                "quantity-value",
                String(product.quantity)
            );

            const plus = createElement("button", "quantity-button", "+");
            plus.type = "button";
            plus.disabled = product.sellingMethod === "whole_lot" || (product.maxQuantity != null && product.quantity >= product.maxQuantity);
            plus.setAttribute("aria-label", `Increase ${product.name}`);
            plus.addEventListener("click", () => {
                changeQuantity(product.id, 1);
            });

            if (product.sellingMethod === "whole_lot") {
                quantityBox.classList.add("is-whole-lot");
                quantityBox.append(createElement("span", "quantity-value", `Full lot · ${Number(product.lotUnits || 0).toLocaleString()} pieces`));
            } else {
                quantityBox.append(minus, quantity, plus);
            }

            const actions = createElement("div", "item-actions");
            actions.append(
                createElement(
                    "strong",
                    "line-total",
                    money(product.price * product.quantity)
                )
            );

            const remove = createElement("button", "remove-button", "Remove");
            remove.type = "button";
            remove.addEventListener("click", () => removeProduct(product.id));

            actions.append(remove);
            right.append(priceBox, quantityBox, actions);
            card.append(imageBox, info, right);
            itemsElement.append(card);
        });

       const commission = subtotal * 0.05;


subtotalElement.textContent = money(subtotal);


if (commissionElement) {
    commissionElement.textContent = money(commission);
}


shippingElement.textContent = "Calculated at checkout";


// إذا بدك العمولة تنضاف على المجموع:
totalElement.textContent = money(subtotal + commission);
    }

    function changeQuantity(productId, direction) {
        const cart = getCart();
        const product = cart.find((item) => item.id === productId);

        if (!product) return;

        if (product.sellingMethod === "whole_lot") return;
        product.quantity = Math.max(product.minimum, product.quantity + direction);
        if (product.maxQuantity != null) product.quantity = Math.min(product.quantity, product.maxQuantity);

        saveCart(cart);
        renderCart();
    }

    function removeProduct(productId) {
        const cart = getCart().filter((item) => item.id !== productId);

        saveCart(cart);
        renderCart();
    }

    
function isBuyerLoggedIn() {
    try {
        const rawUser = localStorage.getItem("stockMindUser");
        if (!rawUser) return false;

        const user = JSON.parse(rawUser);

        return (
            user &&
            user.loggedIn === true &&
            String(user.role || "").toLowerCase() === "buyer"
        );
    } catch (error) {
        console.error("Could not check login status:", error);
        return false;
    }
}


checkoutButton.addEventListener("click", () => {
    if (getCart().length === 0) return;

    // Go directly to checkout without redirecting to login.
    window.location.href = "../checkout/checkout.html";
});




    if (browseButton) {
        browseButton.addEventListener("click", () => {
            window.location.href = "../category/category.html";
        });
    }

    // Update if the cart changes in this tab.
    window.addEventListener("pageshow", renderCart);

    renderCart();
})();
