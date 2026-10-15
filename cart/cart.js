
(() => {
    "use strict";

    const CART_KEY = "stockMindCart";
    const USER_KEY = "stockMindUser";
    const RETURN_KEY = "stockMindReturnTo";

    const $ = (selector) => document.querySelector(selector);

    const itemsElement = $("#cartItems");
    const emptyElement = $("#emptyCart");
    const countElement = $("#cartItemCount");
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

            return cart.filter((item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) &&
                Number(item.price) >= 0
            ).map((item) => ({
                ...item,
                price: Number(item.price),
                minimum: Math.max(20, Math.floor(Number(item.minimum) || 20)),
                quantity: Math.max(
                    Math.max(20, Math.floor(Number(item.minimum) || 20)),
                    Math.floor(Number(item.quantity) || 20)
                )
            }));
        } catch (error) {
            console.error("Unable to read cart:", error);
            return [];
        }
    }

    function saveCart(cart) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
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
    countElement.textContent =
        `${cart.length} ${cart.length === 1 ? "product" : "products"}`;
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
                    `Minimum order: ${product.minimum} units`
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
                createElement("span", "", "Unit price"),
                createElement("strong", "", money(product.price))
            );

            const quantityBox = createElement("div", "cart-quantity");

            const minus = createElement("button", "quantity-button", "−");
            minus.type = "button";
            minus.disabled = product.quantity <= product.minimum;
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
            plus.setAttribute("aria-label", `Increase ${product.name}`);
            plus.addEventListener("click", () => {
                changeQuantity(product.id, 1);
            });

            quantityBox.append(minus, quantity, plus);

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

        product.quantity = Math.max(
            product.minimum,
            product.quantity + direction
        );

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

    if (!isBuyerLoggedIn()) {
        // Save the intended destination before asking the guest to log in.
        sessionStorage.setItem(RETURN_KEY, "cart");

        window.location.href = "../login/login.html?return=cart";
        return;
    }

    // The buyer is already logged in. Do not ask for login again.
    window.location.href = "../checkout/checkout.html";
});


    checkoutButton.addEventListener("click", () => {
        if (getCart().length === 0) return;

        if (!isBuyerLoggedIn()) {
            sessionStorage.setItem(RETURN_KEY, "cart");
            window.location.href = "../login/login.html?return=cart";
            return;
        }

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
const checkoutButton = document.getElementById("checkoutButton");

if (checkoutButton) {
    checkoutButton.addEventListener("click", function () {

        const loggedInUser = localStorage.getItem("loggedInUser");

        if (!loggedInUser) {
            sessionStorage.setItem(
                "redirectAfterLogin",
                "../checkout/checkout.html"
            );

            window.location.href = "../login/login.html";
            return;
        }

        window.location.href = "../checkout/checkout.html";
    });
}
