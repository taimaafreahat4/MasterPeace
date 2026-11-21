(() => {
    "use strict";
    const parseRows = key => {
        try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
        catch { return []; }
    };

    function updateBadges() {
        const pendingProducts = parseRows("stockMindMarketplaceListings").filter(item => item?.sellerListed && item.approvalStatus === "pending_review").length;
        const feedbackRows = ["stockMindFeedbacks","stockMindSiteFeedback"].flatMap(parseRows);
        const pendingFeedback = feedbackRows.filter(item => !item.approvalStatus || item.approvalStatus === "pending_review").length;
        [["admin-pending-products",pendingProducts],["admin-pending-feedback",pendingFeedback]].forEach(([id,count]) => {
            const badge = document.getElementById(id);
            if (!badge) return;
            badge.textContent = count > 99 ? "99+" : String(count);
            badge.hidden = count === 0;
            badge.setAttribute("aria-label",`${count} waiting for review`);
        });
    }

    function initializeSidebar() {
        const sidebar = document.querySelector(".admin-sidebar");
        if (!sidebar) return;
        const path = location.pathname.toLowerCase();
        const hash = location.hash.toLowerCase();
        const route = hash === "#feedback" ? "feedback" :
            path.includes("products") ? "products" :
            path.includes("users") ? "users" :
            path.includes("sellers") ? "sellers" :
            path.includes("orders") ? "orders" :
            path.includes("settings") ? "settings" :
            path.includes("profile") ? "profile" : "dashboard";
        sidebar.querySelectorAll("[data-admin-link]").forEach(link => {
            const active = link.dataset.adminLink === route;
            link.classList.toggle("active",active);
            if (active) link.setAttribute("aria-current","page"); else link.removeAttribute("aria-current");
        });
        updateBadges();
    }

    document.addEventListener("adminSidebarReady",initializeSidebar);
    document.addEventListener("DOMContentLoaded",initializeSidebar,{once:true});
    document.addEventListener("click",event => {
        const logout = event.target.closest("#logoutBtn");
        if (!logout) return;
        event.preventDefault();
        localStorage.removeItem("stockMindUser");
        localStorage.removeItem("user");
        window.location.href = "../../home/index.html";
    });
    window.addEventListener("storage",updateBadges);
    window.addEventListener("stockMindListingsUpdated",updateBadges);
    window.addEventListener("stockMindFeedbackUpdated",updateBadges);
})();
