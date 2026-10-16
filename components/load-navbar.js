function loadStockMindNavbar(
    containerId = "navbar-container",
    componentPath = "../components/"
) {
    const container = document.getElementById(containerId);

    if (!container) {
        console.error("Navbar container not found:", containerId);
        return;
    }

    fetch(componentPath + "navbar.html")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Could not load navbar.html");
            }

            return response.text();
        })
        .then((html) => {
            container.innerHTML = html;

            // Initialize navbar buttons after the HTML is inserted.
            if (typeof window.initStockMindNavbar === "function") {
                window.initStockMindNavbar();
            } else {
                console.warn(
                    "initStockMindNavbar() was not found in navbar.js"
                );
            }

            // Fallback for the mobile menu, without double-binding it.
            const menu = container.querySelector("#mobileMenu");
            const nav = container.querySelector("#navInner");

            if (
                menu &&
                nav &&
                typeof window.initStockMindNavbar !== "function" &&
                !menu.dataset.stockMindBound
            ) {
                menu.dataset.stockMindBound = "true";

                menu.addEventListener("click", () => {
                    nav.classList.toggle("mobile-open");
                });
            }
        })
        .catch((error) => {
            console.error("Navbar loading failed:", error);
        });
}