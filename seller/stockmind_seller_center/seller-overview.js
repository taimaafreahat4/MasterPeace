"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const D = window.StockMindSellerData;
    const body = document.getElementById("overview-listings-body");
    const tableWrap = document.getElementById("overview-table-wrap");
    const empty = document.getElementById("overview-empty");
    const status = document.getElementById("dashboard-data-status");
    window.addEventListener("storage", event => {
        if (event.key === "stockMindMarketplaceListings") window.location.reload();
    });
    const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
    try {
        if (!D || typeof D.getCurrentSellerListings !== "function") throw new Error("Seller listing data is unavailable.");
        const listings = D.getCurrentSellerListings().filter(item => Number(item.quantity) > 0 && item.status !== "removed");
        const published = listings.filter(item => (item.approvalStatus || "approved") === "approved");
        const pending = listings.filter(item => item.approvalStatus === "pending_review").length;
        const units = published.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        const value = published.reduce((sum, item) => sum + (item.sellingMethod === "whole_lot" ? Number(item.lotPrice || item.price || 0) : Number(item.price || 0) * Number(item.quantity || 0)), 0);
        document.getElementById("overview-listing-count").textContent = published.length.toLocaleString();
        document.getElementById("overview-unit-count").textContent = units.toLocaleString();
        document.getElementById("overview-value").textContent = `JOD ${value.toFixed(2)}`;
        body.innerHTML = listings.slice(0, 8).map(item => { const approval = item.approvalStatus || "approved"; const label = approval === "pending_review" ? "Pending admin review" : approval === "rejected" ? "Not approved" : item.status || "Available"; const tone = approval === "pending_review" ? "amber" : approval === "rejected" ? "red" : item.status === "sold" ? "amber" : "green"; return `<tr><td>${escapeHTML(item.name)}</td><td>${escapeHTML(item.category)}</td><td>${Number(item.quantity).toLocaleString()}</td><td>${item.sellingMethod === "whole_lot" ? `JOD ${Number(item.lotPrice || item.price || 0).toFixed(2)} / lot` : `JOD ${Number(item.price || 0).toFixed(2)} / unit`}</td><td><span class="sm-pill ${tone}">${escapeHTML(label)}</span></td></tr>`; }).join("");
        empty.hidden = listings.length > 0;
        tableWrap.hidden = listings.length === 0;
        status.textContent = `${published.length} approved listing${published.length === 1 ? "" : "s"} are visible to buyers.${pending ? ` ${pending} ${pending === 1 ? "product is" : "products are"} waiting for admin review.` : ""}`;
    } catch (error) {
        console.error("Could not load seller surplus listings:", error);
        status.textContent = "Could not load your listings. Open Marketplace to review your products.";
        empty.hidden = true;
        tableWrap.hidden = false;
        body.innerHTML = `<tr><td colspan="5">Your listings are temporarily unavailable.</td></tr>`;
    }
    const footer = document.getElementById("footer-container");
    if (footer) {
        try { const response = await fetch("../../components/footer.html"); if (response.ok) footer.innerHTML = await response.text(); }
        catch (error) { console.warn("Footer could not be loaded.", error); }
    }
});
