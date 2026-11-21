"use strict";

(() => {
  const PLAN_KEY = "stockMindPendingPlan";
  const DETAILS_KEY = "stockMindPendingBilling";
  const ORDER_KEY = "stockMindLastSubscriptionOrder";
  const SUB_KEY = "stockMindSubscription";
  const SCHEDULED_KEY = "stockMindScheduledSubscriptions";
  const CURRENCY = "JOD";
  const PLANS = [
    { id: "one", months: 1, label: "1 month", price: 19 },
    { id: "three", months: 3, label: "3 months", price: 49 },
    { id: "six", months: 6, label: "6 months", price: 89 }
  ];
  const $ = id => document.getElementById(id);
  const read = (store, key) => { try { return JSON.parse(store.getItem(key) || "null"); } catch { return null; } };
  const save = (store, key, value) => store.setItem(key, JSON.stringify(value));
  const account = read(localStorage, "stockMindUser") || {};
  const savedAccount = read(localStorage, "stockMindAccount") || {};
  const sameAccount = account.email && savedAccount.email && String(account.email).toLowerCase() === String(savedAccount.email).toLowerCase();
  const user = sameAccount ? { ...savedAccount, ...account } : account;
  const ownerEmail = String(user.email || "").trim().toLowerCase();
  const params = new URLSearchParams(location.search);
  const queryPlan = params.get("plan");
  const pendingPlan = sessionStorage.getItem(PLAN_KEY);
  let selectedId = PLANS.some(plan => plan.id === queryPlan) ? queryPlan : pendingPlan;
  if (!PLANS.some(plan => plan.id === selectedId)) selectedId = "six";
  let currentStep = 1;
  const stages = [...document.querySelectorAll("[data-checkout-step]")];
  const progressSteps = [...document.querySelectorAll("[data-progress-step]")];
  const nextButtons = [...document.querySelectorAll("[data-next]")];
  const backButtons = [...document.querySelectorAll("[data-back]")];
  const planSelect = $("plan-select");
  const form = $("checkout-form");

  function plan() { return PLANS.find(item => item.id === selectedId) || PLANS[2]; }
  function money(value) { return `${CURRENCY} ${Number(value).toFixed(2)}`; }
  function renderPlan() {
    planSelect.innerHTML = PLANS.map(item => `<option value="${item.id}">${item.label[0].toUpperCase()}${item.label.slice(1)} · ${money(item.price)}</option>`).join("");
    planSelect.value = selectedId;
    const chosen = plan();
    $("selected-plan-card").innerHTML = `<span class="selected-plan__identity"><span class="selected-plan__icon" aria-hidden="true">✦</span><span><strong>Stock Mind Premium</strong><small>${chosen.label[0].toUpperCase()}${chosen.label.slice(1)} · all three AI tools</small></span></span><span class="selected-plan__price">${money(chosen.price)}<small> total</small></span>`;
    $("summary-period").textContent = `${chosen.months} ${chosen.months === 1 ? "month" : "months"}`;
    $("summary-price").textContent = money(chosen.price);
    $("summary-total").textContent = money(chosen.price);
    const savings = chosen.months > 1 ? 19 * chosen.months - chosen.price : 0;
    $("summary-savings-row").hidden = savings === 0;
    $("summary-savings").textContent = `− ${money(savings)}`;
    sessionStorage.setItem(PLAN_KEY, chosen.id);
  }

  function showStep(step) {
    currentStep = Math.max(1, Math.min(3, step));
    stages.forEach(section => {
      const active = Number(section.dataset.checkoutStep) === currentStep;
      section.hidden = !active;
      section.classList.toggle("is-active", active);
    });
    progressSteps.forEach(item => {
      const number = Number(item.dataset.progressStep);
      item.classList.toggle("is-active", number === currentStep);
      item.classList.toggle("is-complete", number < currentStep);
      if (number === currentStep) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    $("checkout-error").textContent = "";
    document.querySelector(".checkout-page").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showFieldError(input, message) {
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", Boolean(message));
    field.querySelector(".field-error").textContent = message || "";
  }

  function validateBilling() {
    const name = $("billing-name");
    const email = $("billing-email");
    const fullName = name.value.trim();
    const address = email.value.trim();
    const nameValid = fullName.length >= 2;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address);
    showFieldError(name, nameValid ? "" : "Enter your full name.");
    showFieldError(email, emailValid ? "" : "Enter a valid email address.");
    if (!nameValid) { name.focus(); return false; }
    if (!emailValid) { email.focus(); return false; }
    try {
      save(sessionStorage, DETAILS_KEY, {
        name: fullName, email: address.toLowerCase(), store: $("billing-store").value.trim(),
        country: $("billing-country").value
      });
    } catch { $("checkout-error").textContent = "Your browser could not save checkout details. Allow site storage and try again."; return false; }
    return true;
  }

  function safeAddMonths(startTime, months) {
    const result = new Date(startTime);
    const preferredDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(preferredDay, lastDay));
    return result.getTime();
  }

  function currentActiveSubscription() {
    const saved = read(localStorage, SUB_KEY);
    if (!saved || Number(saved.expiresAt) <= Date.now() || Number(saved.startedAt || 0) > Date.now()) return null;
    if (!ownerEmail || !saved.ownerEmail || String(saved.ownerEmail).trim().toLowerCase() !== ownerEmail) return null;
    return saved;
  }

  function currentAccessEnd() {
    const active = currentActiveSubscription();
    const queue = read(localStorage, SCHEDULED_KEY) || [];
    const ownQueue = Array.isArray(queue) ? queue.filter(item =>
      item && Number(item.expiresAt) > Date.now() && ownerEmail && item.ownerEmail && String(item.ownerEmail).trim().toLowerCase() === ownerEmail
    ) : [];
    return Math.max(active?.expiresAt || 0, ...ownQueue.map(item => Number(item.expiresAt) || 0));
  }

  function completeDemoOrder() {
    const error = $("checkout-error");
    const billing = read(sessionStorage, DETAILS_KEY);
    if (!billing || !billing.name || !billing.email) { error.textContent = "Add your billing details before confirming the order."; showStep(2); return; }
    if (!$("confirm-demo").checked) { error.textContent = "Confirm that you understand this is a no-charge demo order."; $("confirm-demo").focus(); return; }
    const chosen = plan();
    const startAt = Math.max(Date.now(), currentAccessEnd());
    const orderId = `SM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const order = {
      orderId, status: startAt > Date.now() ? "scheduled" : "demo-active", mode: "demo", currency: CURRENCY,
      planId: chosen.id, planLabel: chosen.label, months: chosen.months, amount: chosen.price,
      customerName: billing.name, email: billing.email, store: billing.store,
      country: billing.country, createdAt: Date.now(), startsAt: startAt,
      expiresAt: safeAddMonths(startAt, chosen.months), ownerEmail
    };
    const subscription = {
      planId: chosen.id, months: chosen.months, startedAt: order.startsAt,
      expiresAt: order.expiresAt, mode: "demo", orderId, ownerEmail,
      customerName: billing.name, email: billing.email, status: "active"
    };
    try {
      save(localStorage, ORDER_KEY, order);
      if (startAt > Date.now()) {
        const queue = read(localStorage, SCHEDULED_KEY);
        const scheduled = Array.isArray(queue) ? queue : [];
        scheduled.push({ ...subscription, status: "scheduled" });
        scheduled.sort((a,b) => Number(a.startsAt) - Number(b.startsAt));
        save(localStorage, SCHEDULED_KEY, scheduled);
      } else {
        save(localStorage, SUB_KEY, subscription);
      }
      sessionStorage.removeItem(PLAN_KEY);
      sessionStorage.removeItem(DETAILS_KEY);
      window.location.assign(`subscription-confirmation.html?order=${encodeURIComponent(orderId)}`);
    } catch {
      error.textContent = "Could not save the demo order. Check available browser storage and try again.";
    }
  }

  function loadSavedBilling() {
    const billing = read(sessionStorage, DETAILS_KEY) || {};
    $("billing-name").value = billing.name || user.name || user.username || "";
    $("billing-email").value = billing.email || user.email || "";
    $("billing-store").value = billing.store || user.storeName || "";
    $("billing-country").value = billing.country || user.country || "Jordan";
  }

  planSelect.addEventListener("change", () => { selectedId = planSelect.value; renderPlan(); });
  nextButtons.forEach(button => button.addEventListener("click", () => {
    if (currentStep === 1) showStep(2);
    else if (currentStep === 2 && validateBilling()) showStep(3);
  }));
  backButtons.forEach(button => button.addEventListener("click", () => showStep(currentStep - 1)));
  $("complete-demo").addEventListener("click", completeDemoOrder);
  [$("billing-name"),$("billing-email")].forEach(input => input.addEventListener("input", () => showFieldError(input, "")));
  form.addEventListener("submit", event => event.preventDefault());

  async function loadFooter() {
    try { const response = await fetch("../../components/footer.html"); if (response.ok) $("footer-container").innerHTML = await response.text(); }
    catch (error) { console.warn("Footer unavailable:", error); }
  }

  renderPlan();
  loadSavedBilling();
  loadFooter();
})();
