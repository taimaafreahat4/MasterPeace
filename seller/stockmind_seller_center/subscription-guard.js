"use strict";

(() => {
  const SUB_KEY = "stockMindSubscription";
  const QUEUE_KEY = "stockMindScheduledSubscriptions";
  const PLAN_PAGE = "subscription.html";
  const now = Date.now();
  let subscription = null;
  let queue = [];
  let session = null;
  try {
    subscription = JSON.parse(localStorage.getItem(SUB_KEY) || "null");
    const savedQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    queue = Array.isArray(savedQueue) ? savedQueue : [];
    session = JSON.parse(localStorage.getItem("stockMindUser") || "null");
  } catch { /* Continue to the plan page if browser storage is unavailable. */ }

  const ownerEmail = String(session?.email || "").trim().toLowerCase();
  const belongsToUser = item => !item?.ownerEmail || !ownerEmail || String(item.ownerEmail).toLowerCase() === ownerEmail;
  const active = subscription && Number(subscription.expiresAt) > now &&
    Number(subscription.startedAt || 0) <= now && belongsToUser(subscription);
  if (active) return;

  // Keep only unexpired queued plans and activate the first due plan for this account.
  const validQueue = queue.filter(item => item && Number(item.expiresAt) > now);
  const dueIndex = validQueue.findIndex(item => belongsToUser(item) && Number(item.startsAt || item.startedAt || 0) <= now);
  if (dueIndex >= 0) {
    const next = validQueue.splice(dueIndex, 1)[0];
    const promoted = {
      ...next,
      startedAt: Number(next.startsAt || next.startedAt),
      status: "active"
    };
    try {
      localStorage.setItem(SUB_KEY, JSON.stringify(promoted));
      localStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
    } catch { /* The page is still protected if activation cannot be persisted. */ }
    if (Number(promoted.expiresAt) > now) return;
  } else {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
      if (subscription && Number(subscription.expiresAt) <= now) localStorage.removeItem(SUB_KEY);
    } catch { /* Redirect below remains the safe fallback. */ }
  }

  const hasExpiredAccess = subscription && Number(subscription.expiresAt) <= now && belongsToUser(subscription);
  window.location.replace(hasExpiredAccess ? `${PLAN_PAGE}?expired=1` : PLAN_PAGE);
})();
