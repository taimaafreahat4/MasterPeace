
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sellerProductsGrid");
    if (!container) return;

    const sources = ["sellerProducts", "stockMindSellerProducts", "stockMindProducts", "stockMindMarketplaceListings"];
    const productsById = new Map();
    try {
        sources.forEach(key => {
            const rows = JSON.parse(localStorage.getItem(key) || "[]");
            if (!Array.isArray(rows)) return;
            rows.forEach((product, index) => {
                if (!product || typeof product !== "object") return;
                const id = String(product.id || `${key}-${index}-${product.name || "product"}`);
                productsById.set(id, {...(productsById.get(id) || {}), ...product});
            });
        });
    } catch {
        container.textContent = "Could not load seller products.";
        return;
    }

    const products = [...productsById.values()];
    products.slice().reverse().forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card seller-product-card";

        const img = document.createElement("img");
        img.src = product.image || product.images?.[0] || product.photos?.[0] || "";
        img.alt = product.name;
        img.className = "seller-product-image";

        const name = document.createElement("h3");
        name.textContent = product.name;

        const price = document.createElement("p");
        const isLot = product.sellingMethod === "whole_lot";
        const displayedPrice = isLot ? Number(product.lotPrice) || Number(product.price) * Number(product.quantity) : Number(product.price);
        price.textContent = `JOD ${Number(displayedPrice || 0).toFixed(2)}${isLot ? " · complete lot" : " / unit"}`;

        const quantity = document.createElement("p");
        quantity.textContent = isLot ? `Whole lot: ${product.quantity} pieces` : `Quantity: ${product.quantity}`;

        const description = document.createElement("p");
        description.textContent = product.description;

        card.append(img, name, price, quantity, description);
        container.appendChild(card);
    });

    if (products.length === 0) {
        container.textContent = "No seller products have been added yet.";
    }
});
