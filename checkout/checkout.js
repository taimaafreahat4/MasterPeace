document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("checkoutForm");
  const summaryItems = $("summaryItems");
  const emptyCartMessage = $("emptyCartMessage");
  const formError = $("formError");
  const cardFields = $("cardFields");

  function readCart() {
    try {
      const cart = JSON.parse(sessionStorage.getItem("stockMindCart") || "[]");
      return Array.isArray(cart) ? cart.filter(p => p && Number(p.price) >= 0 && Number(p.quantity) > 0) : [];
    } catch { return []; }
  }
  const money = amount => `JOD ${Number(amount || 0).toFixed(2)}`;
  const cart = readCart();
  const subtotal = cart.reduce((sum, p) => sum + Number(p.price) * Number(p.quantity), 0);
  const commission = subtotal * 0.05;
  const grandTotal = subtotal + commission;
  const units = cart.reduce((sum, p) => sum + (p.sellingMethod === "whole_lot" ? Number(p.lotUnits || 1) : Number(p.quantity)), 0);

  function renderSummary() {
    summaryItems.replaceChildren();
    cart.forEach(product => {
      const row = document.createElement("div");
      row.className = "summary-item";
      const image = document.createElement("div");
image.className = "summary-product-image";

const img = document.createElement("img");

img.src = product.image || "../images/default-product.png";
img.alt = product.name;

image.appendChild(img);
      const info = document.createElement("div");
      const name = document.createElement("div");
      name.className = "summary-product-name";
      name.textContent = product.name || "Wholesale product";
      const meta = document.createElement("div");
      meta.className = "summary-product-meta";
      meta.textContent = product.sellingMethod === "whole_lot"
        ? `Complete lot · ${product.lotUnits || 1} pieces (quantity locked)`
        : `Qty: ${product.quantity} units`;
      info.append(name, meta);
      const price = document.createElement("strong");
      price.className = "summary-product-price";
      price.textContent = money(Number(product.price) * Number(product.quantity));
      row.append(image, info, price);
      summaryItems.append(row);
    });
    emptyCartMessage.hidden = cart.length !== 0;
    $("itemCount").textContent = `${units} unit${units === 1 ? "" : "s"}`;
    $("subtotal").textContent = money(subtotal);
    $("shipping").textContent = "Calculated later";
    $("total").textContent = money(grandTotal);
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = cart.length === 0;
    submit.style.opacity = cart.length === 0 ? ".55" : "1";
  }

  function toggleCardFields() {
    const method = form.querySelector('input[name="paymentMethod"]:checked')?.value;
    cardFields.hidden = method !== "card";
    ["cardName", "cardNumber", "cardExpiry", "cardCvv"].forEach(id => {
      $(id).required = method === "card";
    });
  }
  form.querySelectorAll('input[name="paymentMethod"]').forEach(input => input.addEventListener("change", toggleCardFields));

  $("cardNumber").addEventListener("input", event => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 19);
    event.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });
  $("cardExpiry").addEventListener("input", event => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
    event.target.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
  });
  $("cardCvv").addEventListener("input", event => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    formError.textContent = "";
    if (!cart.length) {
      formError.textContent = "Your cart is empty. Please add products before checkout.";
      return;
    }
    if (!form.reportValidity()) return;
    // Revalidate marketplace listings before the demo order is created.
    let listingData = [];
    try { listingData = JSON.parse(localStorage.getItem("stockMindMarketplaceListings") || "[]"); }
    catch { formError.textContent = "Could not validate marketplace inventory."; return; }
    for (const item of cart.filter(p => p.marketplaceListingId)) {
      const product = listingData.find(p => String(p.id) === String(item.marketplaceListingId));
      if (!product || product.status === "reserved") {
        formError.textContent = `${item.name} is no longer available. Remove it from the cart.`;
        return;
      }
      if (item.sellingMethod === "whole_lot") {
        const lotPrice = Number(product.lotPrice) || Number(product.price) * Number(product.quantity);
        if (product.sellingMethod !== "whole_lot" || Number(item.quantity) !== 1 ||
            Number(item.lotUnits) !== Number(product.quantity) || Number(item.price) !== lotPrice) {
          formError.textContent = `The complete lot ${item.name} has changed. Remove and add it again.`;
          return;
        }
      } else if (Number(item.quantity) > Number(product.quantity) ||
          Number(item.quantity) < Number(product.minOrder || 1) ||
          Number(item.price) !== Number(product.price)) {
        formError.textContent = `${item.name}: quantity or price has changed. Update your cart.`;
        return;
      }
    }

    const method = form.querySelector('input[name="paymentMethod"]:checked')?.value || "card";
    if (method === "card") {
      const digits = $("cardNumber").value.replace(/\D/g, "");
      if (digits.length < 12 || digits.length > 19) {
        formError.textContent = "Please enter a valid demo card number.";
        $("cardNumber").focus();
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test($("cardExpiry").value)) {
        formError.textContent = "Enter the expiry date as MM/YY.";
        $("cardExpiry").focus();
        return;
      }
      if (!/^\d{3,4}$/.test($("cardCvv").value)) {
        formError.textContent = "Enter a 3- or 4-digit security code.";
        $("cardCvv").focus();
        return;
      }
    }

    // Save order details only for this tab/session. Never save card number or CVV.
    const order = {
      orderId: "SM-" + Date.now(),
      customer: {
        fullName: $("fullName").value.trim(),
        address: $("address").value.trim(),
        city: $("city").value.trim(),
        phone: $("phone").value.trim(),
        notes: $("notes").value.trim()
      },
      paymentMethod: method,
items: cart.map(p => ({
    id: p.id,
    name: p.name,
    image: p.image,
    price: Number(p.price),
    quantity: Number(p.quantity),
    sellingMethod: p.sellingMethod || "regular",
    lotUnits: p.sellingMethod === "whole_lot" ? Number(p.lotUnits) : null,
    marketplaceListingId: p.marketplaceListingId || null,
    seller: p.seller || "Stock Mind Supplier"
})),
      subtotal,
      shipping: null,
      commission,
      total: grandTotal,
      createdAt: new Date().toISOString(),
      status: "Demo order placed"
    };
    // Demo only: persist the order for buyer/seller order history.
    try {
      const previous = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      const orders = Array.isArray(previous) ? previous : [];
      localStorage.setItem("stockMindOrders", JSON.stringify([order, ...orders]));
      const changed = listingData.map(product => {
        const line = cart.find(item => String(item.marketplaceListingId) === String(product.id));
        if (!line) return product;
        if (line.sellingMethod === "whole_lot") return {...product, status: "reserved"};
        return {...product, quantity: Math.max(0, Number(product.quantity) - Number(line.quantity))};
      });
      localStorage.setItem("stockMindMarketplaceListings", JSON.stringify(changed));
    } catch (error) {
      console.error("Demo order could not be saved:", error);
      formError.textContent = "Could not save the order. Please try again.";
      return;
    }
    sessionStorage.setItem("stockMindLastOrder", JSON.stringify(order));
sessionStorage.removeItem("stockMindCart");

window.location.href = "confirmation/confirmation.html";  });

  renderSummary();
  toggleCardFields();
});
