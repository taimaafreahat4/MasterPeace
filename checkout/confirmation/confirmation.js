document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const requestedId = new URLSearchParams(location.search).get("order");
  const list = $("orderItems");
  const fallbackImage = "../../components/logo.png";
  const money = value => `JOD ${(Number(value) || 0).toFixed(2)}`;

  function loadOrder() {
    try {
      const orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      const match = requestedId && Array.isArray(orders)
        ? orders.find(item => item && String(item.orderId) === requestedId)
        : null;
      const order = match || JSON.parse(sessionStorage.getItem("stockMindLastOrder") || "null");
      return order?.orderId && (!requestedId || String(order.orderId) === requestedId) ? order : null;
    } catch {
      return null;
    }
  }

  function renderItems(items) {
    $("orderItemCount").textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
    list.replaceChildren();

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "order-item";
      const image = document.createElement("img");
      const originalImage = typeof item.image === "string" ? item.image : "";
      image.src = originalImage.replace(/^\.\.\/Images\//, "../../Images/") || fallbackImage;
      image.alt = "";
      image.loading = "lazy";
      image.onerror = () => { image.onerror = null; image.src = fallbackImage; };

      const info = document.createElement("div");
      info.className = "receipt-product";
      const name = document.createElement("strong");
      name.textContent = item.name || "Product";
      const quantity = document.createElement("span");
      quantity.textContent = item.sellingMethod === "whole_lot"
        ? `Complete lot · ${Number(item.lotUnits) || 1} pieces`
        : `Quantity: ${Number(item.quantity) || 1}`;
      info.append(name, quantity);

      const price = document.createElement("strong");
      price.className = "receipt-price";
      price.textContent = money(Number(item.price || 0) * Number(item.quantity || 1));
      row.append(image, info, price);
      list.append(row);
    }

    if (!items.length) {
      const message = document.createElement("p");
      message.className = "receipt-empty";
      message.textContent = "This order has no saved line items.";
      list.append(message);
    }
  }

  function render() {
    const order = loadOrder();
    $("confirmationDetails").hidden = !order;
    $("orderReference").hidden = !order;
    if (!order) {
      $("confirmationTitle").textContent = "Order unavailable";
      $("confirmationMessage").textContent = "Open your confirmation from the same browser where you placed the order.";
      $("confirmationIcon").className = "bi bi-receipt";
      return;
    }

    const status = String(order.status || "Processing");
    const state = status.toLowerCase();
    const cancelled = state === "cancelled";
    $("confirmationTitle").textContent = cancelled ? "Order cancelled" : "Order confirmed";
    $("confirmationMessage").textContent = cancelled
      ? "View the order details below."
      : "You’ll receive an in-site notification when your delivery status changes.";
    $("confirmationIcon").className = cancelled ? "bi bi-receipt" : "bi bi-check-lg";
    $("orderNumber").textContent = `#${order.orderId}`;
    $("orderTotal").textContent = money(order.total);
    $("orderStatus").textContent = status;
    $("orderStatus").dataset.state = state;
    $("viewOrderDetails").href = `../tracking/tracking.html?order=${encodeURIComponent(order.orderId)}`;
    renderItems(Array.isArray(order.items) ? order.items.filter(Boolean) : []);
  }

  render();
  window.addEventListener("pageshow", event => { if (event.persisted) render(); });
  window.addEventListener("stockMindOrdersUpdated", render);
  window.addEventListener("storage", event => { if (event.key === "stockMindOrders" || event.key === null) render(); });
});
