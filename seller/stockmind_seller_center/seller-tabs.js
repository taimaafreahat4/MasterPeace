
"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const mount = document.getElementById("seller-tabs-mount");

    if (!mount) {
        console.error("Seller tabs mount is missing!");
        return;
    }

    const pages = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: "⌂",
            href: "dashboard.html"
        },
        {
            id: "ai-advisor",
            label: "Before You Buy",
            icon: "◈",
            href: "ai-advisor.html"
        },
        {
            id: "inventory",
            label: "Inventory",
            icon: "▦",
            href: "inventory.html"
        },
        {
            id: "recommendations",
            label: "AI Recommendations",
            icon: "✧",
            href: "recommendations.html"
        },
        {
            id: "marketplace",
            label: "Marketplace",
            icon: "◇",
            href: "marketplace.html"
        }
    ];

    // Determine the active page.
    const currentFile = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const pageMap = {
        "dashboard.html": "dashboard",
        "ai-advisor.html": "ai-advisor",
        "inventory.html": "inventory",
        "recommendations.html": "recommendations",
        "marketplace.html": "marketplace",
        "add-product.html": "marketplace"
    };

    const activePage = pageMap[currentFile] || "dashboard";

    // Build the seller navigation curtain.
    mount.innerHTML = `
        <nav class="sm-seller-tabs" aria-label="Seller navigation">

            <div class="sm-seller-tabs__inner">
                ${pages.map(page => `
                    <a
                        class="sm-seller-tab ${
                            page.id === activePage ? "is-active" : ""
                        }"
                        href="${page.href}"
                        ${page.id === activePage
                            ? 'aria-current="page"'
                            : ""}
                    >
                        <span class="sm-seller-tab__icon"
                              aria-hidden="true">${page.icon}</span>

                        <span>${page.label}</span>
                    </a>
                `).join("")}
            </div>

            <button
                class="sm-seller-tabs__toggle"
                type="button"
                aria-expanded="true"
                aria-label="Collapse seller navigation"
                title="Collapse seller navigation">

                <span class="toggle-label">Seller navigation</span>
                <span class="toggle-arrow">⌃</span>

            </button>

        </nav>
    `;

    const nav = mount.querySelector(".sm-seller-tabs");
    const toggle = mount.querySelector(".sm-seller-tabs__toggle");
    const arrow = mount.querySelector(".toggle-arrow");

    const STORAGE_KEY = "stockMindSellerNavCollapsed";

    // Restore the saved state.
    let collapsed = false;

    try {
        collapsed = localStorage.getItem(STORAGE_KEY) === "true";
    } catch (error) {
        console.warn("Could not restore seller navigation state.", error);
    }

    function updateCurtain(isCollapsed) {
        nav.classList.toggle("is-collapsed", isCollapsed);

        toggle.setAttribute(
            "aria-expanded",
            String(!isCollapsed)
        );

        toggle.setAttribute(
            "aria-label",
            isCollapsed
                ? "Expand seller navigation"
                : "Collapse seller navigation"
        );

        toggle.title = isCollapsed
            ? "Expand seller navigation"
            : "Collapse seller navigation";

        arrow.textContent = isCollapsed ? "⌄" : "⌃";
    }

    updateCurtain(collapsed);

    // Open and close the seller curtain.
    toggle.addEventListener("click", function () {
        collapsed = !nav.classList.contains("is-collapsed");

        updateCurtain(collapsed);

        try {
            localStorage.setItem(
                STORAGE_KEY,
                String(collapsed)
            );
        } catch (error) {
            console.warn("Could not save seller navigation state.", error);
        }
    });
});
