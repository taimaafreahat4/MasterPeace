
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sellerProductsGrid");
    if (!container) return;

    let products;

    try {
        products = JSON.parse(
            localStorage.getItem("stockMindSellerProducts") || "[]"
        );
    } catch {
        container.textContent = "Could not load seller products.";
        return;
    }

    products.slice().reverse().forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card seller-product-card";

        const img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name;
        img.className = "seller-product-image";

        const name = document.createElement("h3");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = `JOD ${Number(product.price).toFixed(2)}`;

        const quantity = document.createElement("p");
        quantity.textContent = `Quantity: ${product.quantity}`;

        const description = document.createElement("p");
        description.textContent = product.description;

        card.append(img, name, price, quantity, description);
        container.appendChild(card);
    });

    if (products.length === 0) {
        container.textContent = "No seller products have been added yet.";
    }
});
