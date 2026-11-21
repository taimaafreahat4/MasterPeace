document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const orderId = new URLSearchParams(location.search).get("order");
  const form = $("feedbackForm");
  const stars = [...document.querySelectorAll("[data-rating]")];
  const tagButtons = [...document.querySelectorAll("[data-tag]")];
  let order = null;
  let selectedRating = 0;
  const trackingUrl = id => `../tracking/tracking.html?order=${encodeURIComponent(id || "")}`;

  function loadOrder() {
    try {
      const orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      order = Array.isArray(orders) ? orders.find(item => String(item.orderId) === String(orderId)) || null : null;
    } catch { order = null; }
  }

  function renderOrder() {
    loadOrder();
    const isDelivered = String(order?.status || "").toLowerCase() === "delivered";
    const feedbackAllowed = Boolean(order && isDelivered);
    $("feedbackUnavailable").hidden = feedbackAllowed;
    form.hidden = !feedbackAllowed;
    if (!order) {
      $("feedbackUnavailable").textContent = "We couldn’t find this order in the current browser. Open feedback from the order tracking page.";
      $("orderNumber").textContent = "Unavailable";
      $("feedbackProducts").textContent = "Order details unavailable";
      return;
    }

    $("orderNumber").textContent = `#${order.orderId}`;
    $("deliveryDate").textContent = order.updatedAt ? `Delivered ${new Date(order.updatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"})}` : "";
    $("orderTotal").textContent = `JOD ${Number(order.total || 0).toFixed(2)}`;
    $("backToTracking").href = trackingUrl(order.orderId);
    $("continueTracking").href = trackingUrl(order.orderId);
    const products = $("feedbackProducts");
    products.replaceChildren();
    (order.items || []).forEach(item => {
      const row = document.createElement("div"); row.className = "feedback-product__item";
      const imageWrap = document.createElement("div"); imageWrap.className = "feedback-product__image";
      if (item.image) {
        const image = document.createElement("img"); image.src = item.image; image.alt = item.name || "Ordered product";
        image.onerror = () => { image.onerror = null; image.remove(); imageWrap.textContent = "▤"; };
        imageWrap.append(image);
      } else imageWrap.textContent = "▤";
      const info = document.createElement("div");
      const name = document.createElement("strong"); name.textContent = item.name || "Marketplace product";
      const quantity = document.createElement("small"); quantity.textContent = `Quantity ${item.quantity || 1} · JOD ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}`;
      info.append(name,quantity); row.append(imageWrap,info); products.append(row);
    });

    $("feedbackUnavailable").textContent = "This feedback form is available after the order is marked as delivered.";
    if (order.feedback) {
      selectedRating = Number(order.feedback.rating) || 0;
      $("reviewText").value = order.feedback.review || "";
      const selectedTags = new Set(order.feedback.tags || []);
      tagButtons.forEach(button => button.classList.toggle("is-selected", selectedTags.has(button.dataset.tag)));
      $("feedbackSuccess").hidden = false;
      $("feedbackSuccess").textContent = "Your feedback is saved. You can update it any time from this order.";
      $("submitReview").innerHTML = 'Update feedback <span aria-hidden="true">→</span>';
    }
    updateRatingView();
    updateReviewCount();
  }

  function updateRatingView() {
    const labels = ["Select a rating","Poor","Fair","Good","Very good","Excellent"];
    stars.forEach(button => {
      const value = Number(button.dataset.rating);
      button.classList.toggle("is-active", value <= selectedRating);
      button.setAttribute("aria-checked", String(value === selectedRating));
      button.tabIndex = value === (selectedRating || 1) ? 0 : -1;
    });
    $("ratingLabel").textContent = labels[selectedRating] || labels[0];
  }
  function updateReviewCount() { $("reviewCount").textContent = `${$("reviewText").value.length} / 500`; }

  stars.forEach((button,index) => {
    const choose = () => { selectedRating = Number(button.dataset.rating); $("feedbackError").textContent = ""; updateRatingView(); };
    button.addEventListener("click", choose);
    button.addEventListener("keydown", event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); const direction = event.key === "ArrowRight" ? 1 : -1;
        const next = stars[(index + direction + stars.length) % stars.length]; next.focus(); next.click();
      }
    });
  });
  tagButtons.forEach(button => button.addEventListener("click", () => button.classList.toggle("is-selected")));
  $("reviewText").addEventListener("input", updateReviewCount);

  form.addEventListener("submit", event => {
    event.preventDefault();
    $("feedbackError").textContent = "";
    if (!order || String(order.status).toLowerCase() !== "delivered") {
      $("feedbackError").textContent = "You can rate this order after delivery is confirmed."; return;
    }
    if (!selectedRating) { $("feedbackError").textContent = "Choose a star rating before submitting."; stars[0].focus(); return; }
    const review = $("reviewText").value.trim();
    if (review && review.length < 5) { $("feedbackError").textContent = "Write at least 5 characters, or leave the review blank."; $("reviewText").focus(); return; }
    const feedback = {
      orderId: order.orderId,
      source: "order",
      name: order.buyerName || (() => { try { const account = JSON.parse(localStorage.getItem("stockMindUser") || "null"); return account?.loggedIn && account?.name ? account.name : ""; } catch { return ""; } })() || order.customer?.fullName || "Stock Mind customer",
      email: order.buyerEmail || order.customer?.email || "",
      role: order.buyerRole || "Buyer",
      rating: selectedRating,
      review,
      tags: tagButtons.filter(button => button.classList.contains("is-selected")).map(button => button.dataset.tag),
      submittedAt: new Date().toISOString(),
      approvalStatus: "pending_review",
      showOnHome: false
    };
    try {
      const orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      if (!Array.isArray(orders) || !orders.some(item => String(item.orderId) === String(order.orderId))) throw new Error("Order no longer exists.");
      order.feedback = feedback;
      order.rating = selectedRating;
      order.feedbackAt = feedback.submittedAt;
      localStorage.setItem("stockMindOrders", JSON.stringify(orders.map(item => String(item.orderId) === String(order.orderId) ? order : item)));
      sessionStorage.setItem("stockMindLastOrder", JSON.stringify(order));
      const allFeedback = JSON.parse(localStorage.getItem("stockMindFeedbacks") || "[]");
      const list = Array.isArray(allFeedback) ? allFeedback.filter(item => String(item.orderId) !== String(order.orderId)) : [];
      localStorage.setItem("stockMindFeedbacks", JSON.stringify([feedback,...list]));
      $("feedbackSuccess").hidden = false;
      $("feedbackSuccess").textContent = "Thanks for sharing your experience. It is saved with this order and will appear publicly only after admin approval.";
      $("submitReview").innerHTML = 'Update feedback <span aria-hidden="true">→</span>';
      window.dispatchEvent(new Event("stockMindOrdersUpdated"));
    } catch (error) {
      console.error("Could not save order feedback:", error);
      $("feedbackError").textContent = "We couldn’t save your feedback. Please try again.";
    }
  });

  renderOrder();
  window.addEventListener("storage", event => { if (event.key === "stockMindOrders") renderOrder(); });
});
