
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
        .then(response => {
            if (!response.ok) {
                throw new Error("Could not load navbar");
            }

            return response.text();
        })
        .then(html => {
            container.innerHTML = html;

            if (typeof initStockMindNavbar === "function") {
                initStockMindNavbar();
            }

            const menu = container.querySelector("#mobileMenu");
            const nav = container.querySelector("#navInner");

            if (menu && nav) {
                menu.addEventListener("click", () => {
                    nav.classList.toggle("mobile-open");
                });
            }
        })
        .catch(error => {
            console.error("Navbar loading failed:", error);
        });
}
