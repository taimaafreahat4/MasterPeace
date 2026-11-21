"use strict";

(() => {
  const $ = id => document.getElementById(id);
  let order = null;
  try { order = JSON.parse(localStorage.getItem("stockMindLastSubscriptionOrder") || "null"); } catch { order = null; }
  const requestedId = new URLSearchParams(location.search).get("order");
  const validOrder = order && requestedId && order.orderId === requestedId;
  if (!validOrder) {
    $("confirmation-eyebrow").textContent = "ORDER DETAILS UNAVAILABLE";
    $("confirmation-title").textContent = "We couldn’t find that order.";
    $("confirmation-lead").textContent = "Return to the plans page to review your subscription status.";
    $("demo-banner").hidden = true;
    $("receipt-status").textContent = "NOT FOUND";
    $("receipt-order").textContent = requestedId || "—";
  } else {
    const date = time => new Date(Number(time)).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
    const scheduled = Number(order.startsAt) > Number(order.createdAt) + 1000;
    const owner = (() => { try { return JSON.parse(localStorage.getItem("stockMindUser") || "null") || {}; } catch { return {}; } })();
    const amount = Number(order.amount);
    const subscriptionNotice = scheduled
      ? `Your ${order.planLabel} plan is confirmed at ${order.currency || "JOD"} ${amount.toFixed(2)} and starts ${date(order.startsAt)}. Demo checkout: no payment was charged.`
      : `Your ${order.planLabel} plan is active at ${order.currency || "JOD"} ${amount.toFixed(2)}. Demo checkout: no payment was charged.`;
    window.addStockMindNotification?.({
      kind: "subscription",
      orderId: order.orderId,
      recipientEmail: String(order.ownerEmail || owner.email || order.email || "").trim().toLowerCase(),
      recipientUserId: String(owner.id || owner.username || ""),
      title: scheduled ? "Subscription scheduled" : "Subscription confirmed",
      message: subscriptionNotice
    });
    $("confirmation-eyebrow").textContent = order.mode === "demo" ? "DEMO ORDER CONFIRMED" : "ORDER CONFIRMED";
    $("confirmation-title").textContent = scheduled ? "Your next plan is scheduled." : "Your plan is ready.";
    $("confirmation-lead").textContent = scheduled
      ? `Your ${order.planLabel} of Stock Mind Premium starts after your current access ends.`
      : `Your ${order.planLabel} of Stock Mind Premium is active.`;
    $("demo-banner").hidden = order.mode !== "demo";
    $("receipt-status").textContent = order.mode === "demo"
      ? (scheduled ? "DEMO SCHEDULED" : "DEMO ACTIVE")
      : String(order.status || "CONFIRMED").toUpperCase();
    $("receipt-order").textContent = order.orderId;
    $("receipt-plan").textContent = `${order.planLabel[0].toUpperCase()}${order.planLabel.slice(1)} · Stock Mind Premium`;
    $("receipt-start").textContent = date(order.startsAt);
    $("receipt-expiry").textContent = date(order.expiresAt);
    $("receipt-email").textContent = order.email || "—";
    $("receipt-total").textContent = `${order.currency || "JOD"} ${Number(order.amount).toFixed(2)}`;
  }

  fetch("../../components/footer.html").then(response => response.ok ? response.text() : "")
    .then(html => { if (html) $("footer-container").innerHTML = html; })
    .catch(error => console.warn("Footer unavailable:", error));
})();
