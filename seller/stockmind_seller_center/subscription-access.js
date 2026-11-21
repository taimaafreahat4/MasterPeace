"use strict";

(() => {
  const SUB_KEY = "stockMindSubscription";
  const QUEUE_KEY = "stockMindScheduledSubscriptions";
  const monthId = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const limits = {
    beforeYouBuy: { count: 1, period: "lifetime" },
    recommendations: { count: 1, period: "lifetime" },
    forecast: { count: 1, period: "lifetime" }
  };
  const read = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; }
    catch { return fallback; }
  };
  const account = read("stockMindUser", {}) || {};
  const savedAccount = read("stockMindAccount", {}) || {};
  const email = String(account.email || savedAccount.email || "").trim().toLowerCase();
  const accountKey = email || String(account.id || account.username || "guest").trim().toLowerCase();
  const usageKey = `stockMindAiUsage:${accountKey}`;

  function getSubscription() {
    const now = Date.now();
    let subscription = read(SUB_KEY, null);
    const matches = item => Boolean(email && item?.ownerEmail && String(item.ownerEmail).trim().toLowerCase() === email);
    if (subscription && Number(subscription.expiresAt) > now && Number(subscription.startedAt || 0) <= now && matches(subscription)) return subscription;
    const queue = read(QUEUE_KEY, []);
    const dueIndex = Array.isArray(queue) ? queue.findIndex(item => item && matches(item) && Number(item.expiresAt) > now && Number(item.startsAt || item.startedAt || 0) <= now) : -1;
    if (dueIndex < 0) return null;
    const [next] = queue.splice(dueIndex, 1);
    subscription = { ...next, startedAt: Number(next.startsAt || next.startedAt), status: "active" };
    try { localStorage.setItem(SUB_KEY, JSON.stringify(subscription)); localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
    return subscription;
  }

  function usage() {
    const saved = read(usageKey, {});
    return saved && typeof saved === "object" ? saved : {};
  }

  function used(feature) {
    const saved = usage(), quota = limits[feature];
    if (!quota) return 0;
    const counts = quota.period === "lifetime" ? saved.lifetime : saved.month === monthId() ? saved.counts : null;
    let count = Math.max(0, Number(counts?.[feature]) || 0);
    // Keep the old monthly recommendation allowance from resetting into a new free trial.
    if (feature === "recommendations" && count === 0) {
      const legacyMonthUse = saved.month === monthId() && Number(saved.counts?.recommendations) > 0;
      const previousAnalyses = read(`stockMindRecommendationProducts:${accountKey}`, []);
      if (legacyMonthUse || (Array.isArray(previousAnalyses) && previousAnalyses.length > 0)) count = 1;
    }
    return count;
  }
  function isPremium() { return Boolean(getSubscription()); }
  function limit(feature) { return limits[feature]?.count ?? 0; }
  function canUse(feature) { return isPremium() || used(feature) < limit(feature); }

  function record(feature) {
    if (!Object.hasOwn(limits, feature) || !canUse(feature)) return false;
    if (isPremium()) return true;
    const quota = limits[feature], saved = usage();
    if (quota.period === "lifetime") {
      saved.lifetime = saved.lifetime || {};
      saved.lifetime[feature] = (Number(saved.lifetime[feature]) || 0) + 1;
    } else {
      if (saved.month !== monthId()) { saved.month = monthId(); saved.counts = {}; }
      saved.counts = saved.counts || {};
      saved.counts[feature] = (Number(saved.counts[feature]) || 0) + 1;
    }
    try { localStorage.setItem(usageKey, JSON.stringify(saved)); }
    catch { return false; }
    updateNotices();
    return true;
  }

  const labels = { beforeYouBuy: "Before You Buy", recommendations: "AI Recommendations", forecast: "Demand Forecast" };
  function message(feature) {
    if (isPremium()) return "Premium active · advanced access is available across all three AI tools.";
    const left = Math.max(0, limit(feature) - used(feature));
    if (limits[feature]?.period === "lifetime") {
      return left ? `Free plan · Your first ${labels[feature] || "AI"} analysis is free.` : `Free plan · Your first ${labels[feature] || "AI"} analysis has been used.`;
    }
    return `Free plan · ${left} of ${limit(feature)} ${labels[feature] || "AI"} analyses left this month.`;
  }

  function renderNotice(element, feature) {
    if (!element) return;
    element.classList.add("sm-access-notice");
    element.replaceChildren();
    const copy = document.createElement("span");
    copy.textContent = message(feature);
    element.append(copy);
    if (!isPremium()) {
      const link = document.createElement("a");
      link.href = "subscription.html";
      link.textContent = used(feature) >= limit(feature) ? "View Premium" : "Premium details";
      element.append(link);
    }
  }

  function updateNotices() {
    document.querySelectorAll("[data-ai-usage]").forEach(element => renderNotice(element, element.dataset.aiUsage));
  }

  function notifyLimit(feature, target) {
    if (target) {
      const period = limits[feature]?.period === "lifetime" ? "free trial" : "free monthly allowance";
      target.textContent = `You’ve used your ${period} for ${labels[feature] || "this AI tool"}. Premium unlocks continued access across all three AI tools.`;
      target.classList.add("sm-access-limit");
      if (!target.querySelector("a")) {
        const link = document.createElement("a"); link.href = "subscription.html"; link.textContent = "Compare plans"; target.append(" ", link);
      }
    }
    return false;
  }

  function mountNotices() {
    const placements = [
      ["beforeYouBuy", document.getElementById("advisorForm")],
      ["recommendations", document.getElementById("recommendation-product-form")],
      ["forecast", document.getElementById("demand-forecast")]
    ];
    placements.forEach(([feature, target]) => {
      if (!target || target.parentElement.querySelector(`[data-ai-usage="${feature}"]`)) return;
      const notice = document.createElement("div"); notice.dataset.aiUsage = feature;
      target.before(notice); renderNotice(notice, feature);
    });
    const freeUsage = document.getElementById("free-plan-usage");
    if (freeUsage) ["beforeYouBuy", "recommendations", "forecast"].forEach(feature => {
      const row = document.createElement("li"); row.dataset.aiUsage = feature; renderNotice(row, feature); freeUsage.append(row);
    });
  }

  window.StockMindAccess = { isPremium, used, limit, canUse, record, message, renderNotice, notifyLimit, usageKey };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountNotices, { once: true });
  else mountNotices();
})();
