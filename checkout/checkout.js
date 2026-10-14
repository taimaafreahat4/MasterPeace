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
  const units = cart.reduce((sum, p) => sum + Number(p.quantity), 0);

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
      meta.textContent = `Qty: ${product.quantity} units`;
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
    $("total").textContent = money(subtotal);
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
    quantity: Number(p.quantity)
})),
      subtotal,
      shipping: null,
      total: subtotal,
      createdAt: new Date().toISOString(),
      status: "Demo order placed"
    };
    sessionStorage.setItem("stockMindLastOrder", JSON.stringify(order));
sessionStorage.removeItem("stockMindCart");

window.location.href = "confirmation/confirmation.html";  });

  renderSummary();
  toggleCardFields();
});
