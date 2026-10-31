
(() => {
    "use strict";

    const CART_KEY = "stockMindCart";
    const COMMISSION_RATE = 0.05;

    const $ = selector => document.querySelector(selector);

    const itemsElement = $("#cartItems");
    const emptyElement = $("#emptyCart");
    const countElement = $("#cartItemCount");
    const subtotalElement = $("#subtotal");
    const commissionElement = $("#commission");
    const shippingElement = $("#shipping");
    const totalElement = $("#total");
    const checkoutButton = $("#checkoutButton");

    if (!itemsElement || !emptyElement || !checkoutButton) {
        console.error("Cart HTML elements are missing.");
        return;
    }

    function money(value) {
        return `JOD ${Number(value || 0).toFixed(2)}`;
    }

    function element(tag, className = "", text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function getCart() {
        try {
            const data = JSON.parse(
                sessionStorage.getItem(CART_KEY) || "[]"
            );

            if (!Array.isArray(data)) return [];

            return data.filter(item =>
                item &&
                item.id != null &&
                typeof item.name === "string" &&
                Number.isFinite(Number(item.price)) &&
                Number(item.price) >= 0
            ).map(item => {
                const lot = item.sellingMethod === "whole_lot";
                const minimum = lot
                    ? 1
                    : Math.max(1, Math.floor(Number(item.minimum) || 1));

                const maxQuantity = lot
                    ? 1
                    : Number(item.maxQuantity) > 0
                      ? Math.floor(Number(item.maxQuantity))
                      : null;

                let quantity = lot
                    ? 1
                    : Math.max(
                        minimum,
                        Math.floor(Number(item.quantity) || minimum)
                    );

                if (maxQuantity !== null) {
                    quantity = Math.min(quantity, maxQuantity);
                }

                return {
                    ...item,
                    id: String(item.id),
                    price: Number(item.price),
                    sellingMethod: lot ? "whole_lot" : "regular",
                    lotUnits: lot
                        ? Math.max(1, Math.floor(Number(item.lotUnits) || 1))
                        : null,
                    minimum,
                    maxQuantity,
                    quantity
                };
            });
        } catch (error) {
            console.error("Cart reading error:", error);
            return [];
        }
    }

    function saveCart(cart) {
        sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new Event("cartUpdated"));
    }

    function addInfoRow(container, label, value) {
        const row = element("span");
        const strong = element("strong", "", value);
        row.append(label + " ", strong);
        container.append(row);
    }

    function renderCart() {
        const cart = getCart();

        itemsElement.replaceChildren();

        const empty = cart.length === 0;

        emptyElement.classList.toggle("hidden", !empty);
        itemsElement.classList.toggle("hidden", empty);
        checkoutButton.disabled = empty;

        if (countElement) {
            countElement.textContent =
                `${cart.length} ${cart.length === 1 ? "product" : "products"}`;
        }

        let subtotal = 0;

        cart.forEach(product => {
            const lot = product.sellingMethod === "whole_lot";

            // For whole lots, price is the COMPLETE lot price.
            const lineTotal = product.price * product.quantity;

            const units = lot ? product.lotUnits : product.quantity;

            const unitPrice = lot
                ? product.price / product.lotUnits
                : product.price;

            subtotal += lineTotal;

            const card = element("article", "cart-item");

            // Product image
            const imageBox = element("div", "cart-item-image");

            if (product.image) {
                const image = document.createElement("img");
                image.src = product.image;
                image.alt = product.name;
                image.loading = "lazy";

                image.onerror = () => {
                    image.remove();
                    imageBox.append(
                        element("span", "image-fallback", "🛍️")
                    );
                };

                imageBox.append(image);
            } else {
                imageBox.append(
                    element("span", "image-fallback", "🛍️")
                );
            }

            // Product information
            const info = element("div", "cart-item-info");

            info.append(
                element("h3", "cart-item-name", product.name),
                element(
                    "p",
                    "cart-item-seller",
                    product.seller || "Stock Mind Seller"
                ),
                element(
                    "span",
                    "cart-item-category",
                    product.categoryName || "Marketplace"
                )
            );

            if (lot) {
                info.append(
                    element("div", "lot-label", "WHOLE LOT · SOLD TOGETHER")
                );
            }

            const details = element("div", "cart-product-details");

            addInfoRow(details, "Pieces:", String(units));
            addInfoRow(details, "Price / piece:", money(unitPrice));

            info.append(details);

            // Right column
            const right = element("div", "cart-item-right");

            right.append(
                element("span", "item-price-label", "Products subtotal"),
                element("strong", "item-price", money(lineTotal))
            );

            if (lot) {
                right.append(
                    element(
                        "div",
                        "locked-lot",
                        "Complete lot · fixed quantity"
                    )
                );
            } else {
                const quantityBox = element("div", "cart-quantity");

                const minus = element("button", "quantity-button", "−");
                minus.type = "button";
                minus.disabled = product.quantity <= product.minimum;
                minus.onclick = () => changeQuantity(product.id, -1);

                const quantity = element(
                    "span",
                    "quantity-value",
                    String(product.quantity)
                );

                const plus = element("button", "quantity-button", "+");
                plus.type = "button";
                plus.disabled =
                    product.maxQuantity !== null &&
                    product.quantity >= product.maxQuantity;

                plus.onclick = () => changeQuantity(product.id, 1);

                quantityBox.append(minus, quantity, plus);
                right.append(quantityBox);
            }

            const remove = element(
                "button",
                "remove-button",
                "Remove item"
            );

            remove.type = "button";
            remove.onclick = () => removeProduct(product.id);

            right.append(remove);
            card.append(imageBox, info, right);
            itemsElement.append(card);
        });

        const commission = Math.round(subtotal * COMMISSION_RATE * 100) / 100;
        const total = subtotal + commission;

        subtotalElement.textContent = money(subtotal);
        commissionElement.textContent = money(commission);
        shippingElement.textContent = "Calculated at checkout";
        totalElement.textContent = money(total);
    }

    function changeQuantity(productId, direction) {
        const cart = getCart();
        const item = cart.find(product => product.id === productId);

        if (!item || item.sellingMethod === "whole_lot") return;

        const nextQuantity = item.quantity + direction;

        item.quantity = Math.max(item.minimum, nextQuantity);

        if (item.maxQuantity !== null) {
            item.quantity = Math.min(item.quantity, item.maxQuantity);
        }

        saveCart(cart);
        renderCart();
    }

    function removeProduct(productId) {
        const cart = getCart().filter(item => item.id !== productId);

        saveCart(cart);
        renderCart();
    }

    checkoutButton.addEventListener("click", () => {
        if (!getCart().length) return;
        window.location.href = "../checkout/checkout.html";
    });

    async function loadFooter() {
        const footer = $("#footer-container");

        if (!footer) return;

        try {
            const response = await fetch(
                "../components/footer.html"
            );

            if (response.ok) {
                footer.innerHTML = await response.text();
            }
        } catch (error) {
            console.warn("Footer loading failed:", error);
        }
    }

    window.addEventListener("pageshow", renderCart);
    window.addEventListener("cartUpdated", renderCart);

    renderCart();
    loadFooter();
})();
