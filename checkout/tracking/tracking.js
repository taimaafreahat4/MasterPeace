document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const queryId = new URLSearchParams(location.search).get("order");
  const ratingLinks = [...document.querySelectorAll("[data-tracking-rating]")];
  const steps = [...document.querySelectorAll("[data-order-step]")];
  const dateFormatter = new Intl.DateTimeFormat(undefined, {year:"numeric",month:"short",day:"numeric"});
  let order = null;
  function loadOrder() {
    order = null;
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
      $("statusBadge").className = "status-badge";
      $("shipmentTimeline").hidden = true;
      $("trackingArrival").hidden = true;
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
    const date = value => {
      const parsed = new Date(value || "");
      return Number.isNaN(parsed.getTime()) ? "—" : dateFormatter.format(parsed);
    };
    $("statusBadge").textContent = status;
    $("statusBadge").className = `status-badge status-${state}`;
    $("statusMessage").textContent = state === "shipped"
      ? (order.demoAutoDelivery
        ? "Your order is on the way. This demo shipment updates automatically."
        : "Your order is on the way.")
      : state === "delivered"
        ? "Your shipment has been delivered."
        : state === "cancelled"
          ? "This order was cancelled. Contact the seller if you need help."
          : (order.demoAutoDelivery
            ? "Your order is being prepared. This demo shipment updates automatically."
            : "Your order is being prepared. We’ll notify you when it ships.");
    $("orderNumber").textContent = `#${order.orderId}`;
    $("trackingBack").href = `../confirmation/confirmation.html?order=${encodeURIComponent(order.orderId)}`;
    $("trackingBackLabel").textContent = "Back to order confirmation";
    $("trackingNumber").textContent = state === "shipped" || state === "delivered" ? (order.trackingNumber || "—") : "Assigned when shipped";
    $("orderDate").textContent = date(order.createdAt);
    const deliveryEvent = [...(order.statusHistory || [])].reverse().find(item => String(item.status).toLowerCase() === "delivered");
    const arrival = date(state === "delivered" ? deliveryEvent?.at || order.updatedAt : order.estimatedDelivery);
    $("deliveryDateLabel").textContent = state === "delivered" ? "Delivered on" : "Estimated delivery";
    $("deliveryDate").textContent = arrival;
    $("trackingArrival").hidden = state === "cancelled" || arrival === "—";
    $("shipmentTimeline").hidden = state === "cancelled";
    steps.forEach(step => {
      const stepIndex = Number(step.dataset.orderStep);
      const active = stepIndex === index;
      step.classList.toggle("completed", stepIndex < index);
      step.classList.toggle("active", active);
      if (active) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    $("deliveryAction").hidden = state !== "shipped";
    $("feedbackAction").hidden = state !== "delivered";
    const feedbackUrl = `../feedback/feedback.html?order=${encodeURIComponent(order.orderId)}`;
    const savedRating = Number(order.feedback?.rating || order.rating);
    const hasFeedback = Boolean(order.feedback || order.rating);
    $("feedbackLink").href = feedbackUrl;
    $("feedbackLink").hidden = hasFeedback;
    $("feedbackSubmitted").hidden = !hasFeedback;
    $("feedbackHint").hidden = hasFeedback;
    $("trackingRatingLabel").textContent = savedRating ? `Your rating · ${savedRating} out of 5` : "Quick rating";

    ratingLinks.forEach(link => {
      const value = Number(link.dataset.trackingRating);
      const icon = link.querySelector("i");
      const filled = value <= savedRating;
      icon.classList.toggle("bi-star-fill", filled);
      icon.classList.toggle("bi-star", !filled);
      if (hasFeedback) {
        link.removeAttribute("href");
        link.setAttribute("aria-hidden", "true");
      } else {
        link.href = `${feedbackUrl}&rating=${value}`;
        link.removeAttribute("aria-hidden");
      }
    });
    const received = state === "delivered" || order.received;
    $("confirmDeliveryButton").disabled = received;
    $("confirmDeliveryLabel").textContent = received ? "Order received" : "Confirm receipt";
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
