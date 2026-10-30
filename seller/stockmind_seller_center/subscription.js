
"use strict";

const CURRENCY = "JOD";

const PLANS = [
  { id: "one", name: "1 MONTH", months: 1, period: "month", price: 19 },
  { id: "three", name: "3 MONTHS", months: 3, period: "3 months", price: 49 },
  { id: "six", name: "6 MONTHS", months: 6, period: "6 months", price: 89, popular: true }
];

const FEATURES = [
  "AI Recommendations page access",
  "Unlimited product analysis before you buy",
  "Demand insights for your market",
  "Location fit and seasonal demand",
  "Purchase guidance based on your stock and margin",
  "Seller Center dashboard and inventory tools"
];

const CHECK_ICON = "✓";

function planCard(plan) {
  const saving = plan.months > 1
    ? Math.max(0, Math.round(
        (1 - plan.price / (19 * plan.months)) * 100
      ))
    : 0;

  const monthly = (plan.price / plan.months).toFixed(2);

  return `
    <article class="plan ${plan.popular ? "is-selected" : ""}">

      ${plan.popular
        ? '<div class="plan__badge">BEST VALUE</div>'
        : ""}

      <div class="plan__head">
        <div class="plan__name">${plan.name}</div>
        ${saving
          ? `<div class="plan__save">Save ${saving}%</div>`
          : ""}
      </div>

      <div class="plan__price">
        <div class="plan__amount">${plan.price}</div>
        <div class="plan__per">
          ${CURRENCY} / ${plan.period}
        </div>
      </div>

      <p class="plan__sub">
        ${plan.months > 1
          ? `Only ${monthly} JOD per month`
          : "Flexible, one month at a time"}
      </p>

      <button
        class="plan__btn"
        type="button"
        data-plan="${plan.id}">
        Select plan
      </button>

      <div class="plan__divider"></div>

      <ul class="plan__features">
        ${FEATURES.map(feature => `
          <li>
            <span style="color:#7c3aed;font-weight:bold">
              ${CHECK_ICON}
            </span>
            <span>${feature}</span>
          </li>
        `).join("")}
      </ul>

    </article>
  `;
}

const plansContainer = document.getElementById("plans");

if (plansContainer) {
  plansContainer.innerHTML = PLANS.map(planCard).join("");

  plansContainer.addEventListener("click", event => {
    const button = event.target.closest("[data-plan]");
    if (!button) return;

    const plan = PLANS.find(
      item => item.id === button.dataset.plan
    );

    if (!plan) return;

    sessionStorage.setItem(
      "stockMindPendingPlan",
      plan.id
    );

    window.location.href =
      "subscription-payment.html?plan=" +
      encodeURIComponent(plan.id);
  });
}

async function loadFooter() {
  const footer = document.getElementById("footer-container");
  if (!footer) return;

  try {
    const response = await fetch("../../components/footer.html");

    if (response.ok) {
      footer.innerHTML = await response.text();
    }
  } catch (error) {
    console.warn("Footer unavailable:", error);
  }
}

loadFooter();
