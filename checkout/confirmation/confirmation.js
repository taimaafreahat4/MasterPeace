document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const requestedId = new URLSearchParams(location.search).get("order");
  let order = null;
  try {
    const orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
    if (requestedId && Array.isArray(orders)) order = orders.find(item => String(item.orderId) === requestedId) || null;
    if (!order) order = JSON.parse(sessionStorage.getItem("stockMindLastOrder") || "null");
  } catch { order = null; }
  if (!order || (requestedId && String(order.orderId) !== requestedId)) {
    $("orderNumber").textContent = "Order unavailable";
    $("orderTotal").textContent = "—";
    $("orderStatus").textContent = "—";
    $("viewOrderDetails").disabled = true;
    return;
  }
  $("orderNumber").textContent = `#${order.orderId}`;
  $("orderTotal").textContent = `JOD ${Number(order.total || 0).toFixed(2)}`;
  $("orderStatus").textContent = order.status || "Processing";
  const items = $("orderItems");
  (Array.isArray(order.items) ? order.items : []).forEach(item => {
    const row = document.createElement("div"); row.className = "order-item";
    const image = document.createElement("img"); image.src = item.image || "../../components/logo.png"; image.alt = item.name || "Product";
    image.onerror = () => { image.onerror = null; image.src = "../../components/logo.png"; };
    const info = document.createElement("div"); info.className = "product-info";
    const name = document.createElement("strong"); name.textContent = item.name || "Product";
    const quantity = document.createElement("span");
    quantity.textContent = item.sellingMethod === "whole_lot"
      ? `Complete lot · ${Number(item.lotUnits) || 1} pieces`
      : `Quantity: ${Number(item.quantity) || 1}`;
    info.append(name,quantity);
    const price = document.createElement("strong"); price.textContent = `JOD ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}`;
    row.append(image,info,price); items.append(row);
  });
  $("viewOrderDetails").addEventListener("click", () => {
    window.location.assign(`../tracking/tracking.html?order=${encodeURIComponent(order.orderId)}`);
  });
});
