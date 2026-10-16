(() => {
    "use strict";

    const PAGE_ITEMS = [
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

    function mountSellerTabs() {
        const mount = document.getElementById("seller-tabs-mount");

        if (!mount || mount.dataset.ready === "true") {
            return;
        }

        mount.dataset.ready = "true";

        // Always show the seller navigation when a page opens.
        // Clear the old saved collapsed state.
        try {
            localStorage.removeItem("stockMindSellerNavCollapsed");
        } catch (error) {
            // Navigation still works if storage is unavailable.
        }

        const activePage =
            document.body.dataset.sellerPage || "dashboard";

        mount.innerHTML = `
            <nav class="sm-seller-tabs" aria-label="Seller navigation">

                <div class="sm-seller-tabs__inner">

                    ${PAGE_ITEMS.map((item) => `
                        <a
                            class="sm-seller-tab ${
                                item.id === activePage ? "is-active" : ""
                            }"
                            href="${item.href}"
                            ${
                                item.id === activePage
                                    ? 'aria-current="page"'
                                    : ""
                            }
                        >
                            <span
                                class="sm-seller-tab__icon"
                                aria-hidden="true"
                            >${item.icon}</span>

                            <span>${item.label}</span>
                        </a>
                    `).join("")}

                </div>

                <button
                    class="sm-seller-tabs__toggle"
                    type="button"
                    aria-expanded="true"
                    aria-label="Toggle seller navigation"
                >
                    <span class="toggle-label">Seller navigation</span>
                    <span class="toggle-arrow">⌃</span>
                </button>

            </nav>
        `;

        const nav = mount.querySelector(".sm-seller-tabs");
        const toggle = mount.querySelector(".sm-seller-tabs__toggle");
        const arrow = mount.querySelector(".toggle-arrow");

        // The curtain can still be collapsed manually.
        // Its state will not be saved between pages.
        toggle.addEventListener("click", () => {
            const isCollapsed = nav.classList.toggle("is-collapsed");

            toggle.setAttribute(
                "aria-expanded",
                String(!isCollapsed)
            );

            arrow.textContent = isCollapsed ? "⌄" : "⌃";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            mountSellerTabs,
            { once: true }
        );
    } else {
        mountSellerTabs();
    }
})();