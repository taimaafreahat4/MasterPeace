document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const queryId = new URLSearchParams(location.search).get("order");
  let order = null;
  function loadOrder() {
    try {
      const list = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      if (Array.isArray(list) && queryId) order = list.find(item => String(item.orderId) === queryId) || null;
      if (!order) order = JSON.parse(sessionStorage.getItem("stockMindLastOrder") || "null");
      if (order && queryId && String(order.orderId) !== queryId) order = null;
    } catch { order = null; }
  }
  function render() {
    loadOrder();
    if (!order) {
      $("statusBadge").textContent = "Order not found";
      $("orderNumber").textContent = "Unavailable";
      $("trackingNumber").textContent = "—";
      $("orderDate").textContent = "—";
      $("deliveryDate").textContent = "—";
      $("statusMessage").textContent = "We couldn’t find this order in the current browser. Open the notification or order confirmation again.";
      $("deliveryAction").hidden = true;
      $("feedbackAction").hidden = true;
      return;
    }
    const status = String(order.status || "Processing");
    const state = status.toLowerCase();
    const index = state === "delivered" ? 3 : state === "shipped" ? 2 : state === "processing" ? 1 : 0;
    const date = value => value ? new Date(value).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "—";
    $("statusBadge").textContent = status;
    $("statusBadge").className = `status-badge status-${state}`;
    $("statusMessage").textContent = state === "shipped"
      ? (order.demoAutoDelivery
        ? "Your order is on the way. We’ve added a notification. This demo order will be marked delivered automatically in a few seconds."
        : "Your order is on the way. A delivery update has been added to your notifications.")
      : state === "delivered"
        ? "This order is marked as delivered. You can leave feedback below."
        : state === "cancelled"
          ? "This order was cancelled. Contact the seller if you need help."
          : (order.demoAutoDelivery
            ? "Demo delivery is active: this order will be shipped in a few seconds, then marked delivered automatically for your feedback."
            : "Your order is being prepared. We’ll notify you when it is handed over for delivery.");
    $("orderNumber").textContent = `#${order.orderId}`;
    $("trackingBack").href = `../confirmation/confirmation.html?order=${encodeURIComponent(order.orderId)}`;
    $("trackingBack").textContent = "← Back to order confirmation";
    $("trackingNumber").textContent = state === "shipped" || state === "delivered" ? (order.trackingNumber || "—") : "Assigned when shipped";
    $("orderDate").textContent = date(order.createdAt);
    const deliveryEvent = [...(order.statusHistory || [])].reverse().find(item => String(item.status).toLowerCase() === "delivered");
    $("deliveryDateLabel").textContent = state === "delivered" ? "Delivered on" : "Estimated Delivery";
    $("deliveryDate").textContent = date(state === "delivered" ? deliveryEvent?.at || order.updatedAt : order.estimatedDelivery);
    document.querySelectorAll("[data-order-step]").forEach(step => {
      const stepIndex = Number(step.dataset.orderStep);
      step.classList.toggle("completed",stepIndex < index);
      step.classList.toggle("active",stepIndex === index);
      const circle = step.querySelector(".circle");
      if (circle && stepIndex <= index) circle.textContent = "✓";
      if (circle && stepIndex === 2 && index === 2) circle.textContent = "🚚";
      if (circle && stepIndex === 3 && index < 3) circle.textContent = "···";
    });
    document.querySelectorAll("[data-order-line]").forEach(line => line.classList.toggle("completed-line",Number(line.dataset.orderLine) < index));
    $("deliveryAction").hidden = state !== "shipped";
    $("feedbackAction").hidden = state !== "delivered";
    $("feedbackLink").href = `../../checkout/feedback/feedback.html?order=${encodeURIComponent(order.orderId)}`;
    $("feedbackLink").hidden = Boolean(order.feedback || order.rating);
    $("feedbackSubmitted").hidden = !order.feedback && !order.rating;
    const received = state === "delivered" || order.received;
    $("confirmDeliveryButton").disabled = received;
    $("confirmDeliveryButton").textContent = received ? "✓ Order received" : "✓ Yes, I received it";
    if (received) $("deliveryMessage").textContent = "This delivery is marked complete. Thank you for confirming.";
  }
  render();

  $("confirmDeliveryButton").addEventListener("click", () => {
    if (!order || String(order.status).toLowerCase() !== "shipped") return;
    if (typeof window.setStockMindOrderStatus === "function") {
      const result = window.setStockMindOrderStatus(order.orderId,"delivered");
      if (!result.ok) { $("deliveryMessage").textContent = result.message; return; }
      result.order.received = true;
      const orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      localStorage.setItem("stockMindOrders",JSON.stringify(orders.map(item=>String(item.orderId)===String(order.orderId)?result.order:item)));
      sessionStorage.setItem("stockMindLastOrder",JSON.stringify(result.order));
    } else {
      order.status = "Delivered"; order.received = true;
      sessionStorage.setItem("stockMindLastOrder",JSON.stringify(order));
    }
    render();
  });

  window.addEventListener("storage",event=>{if(event.key==="stockMindOrders")render();});
  window.addEventListener("stockMindOrdersUpdated",render);
});
