"use strict";

(() => {
  const CURRENCY = "JOD";
  const SUB_KEY = "stockMindSubscription";
  const SCHEDULED_KEY = "stockMindScheduledSubscriptions";
  const PENDING_KEY = "stockMindPendingPlan";
  const PLANS = [
    { id: "one", name: "1 MONTH", months: 1, price: 19, note: "Flexible access, one month at a time." },
    { id: "three", name: "3 MONTHS", months: 3, price: 49, note: "A steady runway for smarter buying." },
    { id: "six", name: "6 MONTHS", months: 6, price: 89, note: "Best value for growing stores.", popular: true }
  ];
  const FEATURES = [
    "Premium access across all three AI services",
    "Unlimited analyses and detailed recommendations during your plan",
    "Demand forecasts based on reported sales history when available",
    "Save and download Before You Buy reports"
  ];
  const read = key => {
    try { return JSON.parse(localStorage.getItem(key) || "null"); }
    catch { return null; }
  };
  const account = read("stockMindUser") || read("stockMindAccount") || {};
  const ownerEmail = String(account.email || "").trim().toLowerCase();
  const belongsToAccount = item => Boolean(ownerEmail && item?.ownerEmail && String(item.ownerEmail).trim().toLowerCase() === ownerEmail);
  const saved = read(SUB_KEY);
  const activeSubscription = saved && Number(saved.expiresAt) > Date.now() && Number(saved.startedAt || 0) <= Date.now() &&
    belongsToAccount(saved) ? saved : null;
  const queue = read(SCHEDULED_KEY);
  const scheduledSubscriptions = (Array.isArray(queue) ? queue : [])
    .filter(item => item && Number(item.expiresAt) > Date.now() && Number(item.startsAt || item.startedAt) > Date.now() &&
      belongsToAccount(item))
    .sort((a, b) => Number(a.startsAt || a.startedAt) - Number(b.startsAt || b.startedAt));
  const container = document.getElementById("plans");
  const status = document.getElementById("subscription-status");
  const welcome = document.getElementById("subscription-welcome");
  if (new URLSearchParams(location.search).get("welcome") === "1") {
    if (welcome) welcome.hidden = false;
    const introKey = `stockMindSubscriptionIntroSeen:${ownerEmail || String(account.id || account.username || "seller").trim().toLowerCase()}`;
    try { localStorage.setItem(introKey, "true"); } catch { /* The welcome offer still displays for this visit. */ }
  }

  function planCard(plan) {
    const monthly = (plan.price / plan.months).toFixed(2);
    const original = 19 * plan.months;
    const saving = plan.months > 1 ? original - plan.price : 0;
    const current = activeSubscription?.planId === plan.id;
    const active = activeSubscription && plan.id === activeSubscription.planId;
    return `
      <article class="plan ${plan.popular ? "is-selected" : ""} ${current ? "is-current" : ""}">
        ${plan.popular ? '<div class="plan__badge">BEST VALUE</div>' : ""}
        ${current ? '<span class="plan__current">YOUR CURRENT PLAN</span>' : ""}
        <div class="plan__head">
          <div class="plan__name">${plan.name}</div>
          ${saving ? `<div class="plan__save">Save ${Math.round(saving / original * 100)}%</div>` : ""}
        </div>
        <div class="plan__price">
          <div class="plan__amount">${plan.price}</div>
          <div class="plan__per">${CURRENCY} / ${plan.months === 1 ? "month" : `${plan.months} months`}</div>
        </div>
        <p class="plan__sub">${plan.months > 1 ? `JOD ${monthly} per month · save JOD ${saving}` : plan.note}</p>
        <button class="plan__btn" type="button" data-plan="${plan.id}" ${active ? "aria-label='Review this plan'" : ""}>
          ${active ? "Review current plan" : "Continue with plan"}<span aria-hidden="true">→</span>
        </button>
        <div class="plan__divider"></div>
        <ul class="plan__features">${FEATURES.map(feature => `<li><span aria-hidden="true">✓</span><span>${feature}</span></li>`).join("")}</ul>
        <p class="plan__fine">One-time purchase · no automatic renewal</p>
      </article>`;
  }

  function render() {
    if (!container) return;
    container.innerHTML = PLANS.map(planCard).join("");
    if (activeSubscription && status) {
      const expiry = new Date(Number(activeSubscription.expiresAt));
      status.hidden = false;
      status.replaceChildren();
      const icon = document.createElement("span");
      icon.className = "subscription-status__icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = "✓";
      const details = document.createElement("span");
      const title = document.createElement("strong"); title.textContent = `Your ${Number(activeSubscription.months) || 0}-month access is active`;
      const next = scheduledSubscriptions[0];
      const nextDate = next ? new Date(Number(next.startsAt || next.startedAt)).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"}) : "";
      const note = document.createElement("small"); note.textContent = next
        ? `Available until ${expiry.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})}. Your next ${Number(next.months)}-month plan is scheduled to start ${nextDate}.`
        : `Available until ${expiry.toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"})}. A new plan you choose will begin after your current access ends.`;
      details.append(title,note);
      const link = document.createElement("a"); link.href = "ai-tools.html"; link.textContent = "Open AI tools →";
      status.append(icon,details,link);
    } else if (scheduledSubscriptions[0] && status) {
      const next = scheduledSubscriptions[0];
      status.hidden = false;
      status.replaceChildren();
      const icon = document.createElement("span"); icon.className = "subscription-status__icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = "◷";
      const details = document.createElement("span");
      const title = document.createElement("strong"); title.textContent = "Your next plan is scheduled";
      const startDate = new Date(Number(next.startsAt || next.startedAt)).toLocaleDateString(undefined,{year:"numeric",month:"long",day:"numeric"});
      const note = document.createElement("small"); note.textContent = `Your ${Number(next.months)}-month access starts ${startDate}.`;
      details.append(title,note); status.append(icon,details);
    }
  }

  container?.addEventListener("click", event => {
    const button = event.target.closest("[data-plan]");
    if (!button) return;
    const plan = PLANS.find(item => item.id === button.dataset.plan);
    if (!plan) return;
    try {
      sessionStorage.setItem(PENDING_KEY, plan.id);
      sessionStorage.setItem("stockMindPendingSubscriptionOwner", ownerEmail);
      window.location.href = `subscription-payment.html?plan=${encodeURIComponent(plan.id)}`;
    } catch {
      if (status) { status.hidden = false; status.textContent = "Your browser could not save the selected plan. Please allow site storage and try again."; }
    }
  });

  async function loadFooter() {
    const footer = document.getElementById("footer-container");
    if (!footer) return;
    try {
      const response = await fetch("../../components/footer.html");
      if (response.ok) footer.innerHTML = await response.text();
    } catch (error) { console.warn("Footer unavailable:", error); }
  }

  render();
  if (!activeSubscription && !scheduledSubscriptions.length && new URLSearchParams(location.search).get("expired") === "1" && status) {
    status.hidden = false;
    status.textContent = "Your previous Premium period has ended. Your Free allowances are available again across all three AI tools.";
  }
  loadFooter();
})();
