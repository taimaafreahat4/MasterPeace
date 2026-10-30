"use strict";

/* =========================================
   LIVE ORDER SUMMARY
   Updates the dark summary card while the seller types.
   Independent from ai-advisor.js (it only reads the form fields).
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const form = $("advisorForm");
    if (!form || !$("sumInvest")) return;

    const money = (value) => {
        const number = Number(value) || 0;
        const sign = number < 0 ? "-" : "";

        return `${sign}JOD ${Math.abs(number).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    function update() {
        const name = $("productName").value.trim();
        const cost = Number($("unitCost").value) || 0;
        const price = Number($("sellPrice").value) || 0;
        const qty = Math.max(0, Math.floor(Number($("plannedQty").value) || 0));

        const invest = cost * qty;
        const revenue = price * qty;
        const profit = revenue - invest;
        const unitProfit = price - cost;
        const margin = price > 0 ? (unitProfit / price) * 100 : 0;

        $("sumName").textContent = name || "Your product";
        $("sumInvest").textContent = money(invest);
        $("sumRevenue").textContent = money(revenue);
        $("sumProfit").textContent = money(profit);
        $("sumUnit").textContent = money(unitProfit);

        let level = "good";
        let note = "Healthy margin before shipping and platform fees.";

        if (cost <= 0 || price <= 0) {
            level = "idle";
            note = "Enter cost and price to see your margin.";
        } else if (margin < 0) {
            level = "bad";
            note = "You would be selling below your cost.";
        } else if (margin < 20) {
            level = "warn";
            note = "Thin margin. Shipping and fees may remove your profit.";
        }

        $("sumMargin").textContent =
            level === "idle" ? "0%" : `${margin.toFixed(1)}%`;

        // a 50% margin fills the whole bar
        $("sumMarginBar").style.width =
            `${Math.min(100, Math.max(0, margin) * 2)}%`;

        $("sumMarginBox").dataset.level = level;
        $("sumMarginNote").textContent = note;
    }

    form.addEventListener("input", update);
    form.addEventListener("change", update);

    // "Analyze another product" calls form.reset()
    form.addEventListener("reset", () => setTimeout(update, 0));

    update();
});