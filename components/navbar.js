
/* =====================================================
   STOCK MIND - SHARED NAVBAR
===================================================== */

function readNavbarStorage(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
    } catch (error) {
        console.error("Could not read " + key, error);
        return fallback;
    }
}

/* =====================================================
   INITIALIZE NAVBAR
   Call this AFTER navbar.html is inserted into the page.
===================================================== */

function initStockMindNavbar() {
    
const sessionUser = readNavbarStorage("stockMindUser", null);
const savedAccount = readNavbarStorage("stockMindAccount", null);

const user = sessionUser
    ? { ...(savedAccount || {}), ...sessionUser }
    : null;


    const guestButtons = document.getElementById("guestButtons");
    const userProfile = document.getElementById("userProfile");

    const isLoggedIn = Boolean(user && user.loggedIn);

    /* Show guest buttons before login */
    if (guestButtons) {
        guestButtons.hidden = isLoggedIn;
    }

    /* Show profile only after login */
    if (userProfile) {
        userProfile.hidden = !isLoggedIn;
    }

    /* Update cart and favorites regardless of login status */
    updateNavbarCartCount();
    updateNavbarFavoriteCount();

    /* Mobile navigation */
    setupNavbarMobileMenu();

    /* No profile data to populate if user is logged out */
    if (!isLoggedIn) {
        closeProfileDropdown();
        return;
    }

    /* Profile information */
    const profileImage = document.getElementById("profileImage");
    const username = document.getElementById("username");
    const menuUserName = document.getElementById("menuUserName");
    const menuUserEmail = document.getElementById("menuUserEmail");

    const displayName = user.name || user.username || "User";
    const displayRole = user.role || "Buyer";

    if (profileImage) {
        profileImage.src = user.image || "/components/logo.png";
        profileImage.alt = displayName + " profile picture";
    }

    /* Role appears underneath the profile image */
    if (username) {
        username.textContent = displayRole;
    }

    if (menuUserName) {
        menuUserName.textContent = displayName;
    }

    if (menuUserEmail) {
        menuUserEmail.textContent = user.email || "";
    }

    setupProfileDropdown();
    setupNavbarLogout();
}

/* =====================================================
   PROFILE DROPDOWN
===================================================== */

function setupProfileDropdown() {
    const trigger = document.getElementById("profileTrigger");
    const menu = document.getElementById("profileMenu");
    const profile = document.getElementById("userProfile");

    if (!trigger || !menu || !profile) return;

    if (trigger.dataset.ready === "true") return;
    trigger.dataset.ready = "true";

    trigger.addEventListener("click", event => {
        event.stopPropagation();

        const shouldOpen = menu.hidden;

        menu.hidden = !shouldOpen;
        trigger.setAttribute("aria-expanded", String(shouldOpen));
    });

    menu.addEventListener("click", event => {
        event.stopPropagation();
    });

    document.addEventListener("click", event => {
        if (!profile.contains(event.target)) {
            closeProfileDropdown();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeProfileDropdown();
        }
    });
}

function closeProfileDropdown() {
    const trigger = document.getElementById("profileTrigger");
    const menu = document.getElementById("profileMenu");

    if (menu) {
        menu.hidden = true;
    }

    if (trigger) {
        trigger.setAttribute("aria-expanded", "false");
    }
}

/* =====================================================
   LOG OUT
===================================================== */

function setupNavbarLogout() {
    const logoutButton = document.getElementById("logoutBtn");

    if (!logoutButton) return;
    if (logoutButton.dataset.ready === "true") return;

    logoutButton.dataset.ready = "true";

    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("stockMindUser");

        /* Keep the saved account, cart, and favorites */
        window.location.href = "/home/index.html";
    });
}

/* =====================================================
   CART COUNTER
===================================================== */

function updateNavbarCartCount() {
    const cart = readNavbarStorage("stockMindCart", []);
    const badge = document.getElementById("cartCount");

    if (!badge) return;

    const items = Array.isArray(cart) ? cart : [];

    const count = items.reduce((total, item) => {
        const quantity = Number(item.quantity) || 1;
        return total + quantity;
    }, 0);

    badge.textContent = count;
}

/* =====================================================
   FAVORITES COUNTER
===================================================== */

function updateNavbarFavoriteCount() {
    const favorites = readNavbarStorage("stockMindFavorites", []);
    const badge = document.getElementById("favoriteCount");

    if (!badge) return;

    badge.textContent = Array.isArray(favorites)
        ? favorites.length
        : 0;
}

/* =====================================================
   MOBILE MENU
===================================================== */

function setupNavbarMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    const navInner = document.getElementById("navInner");

    if (!mobileMenu || !navInner) return;
    if (mobileMenu.dataset.ready === "true") return;

    mobileMenu.dataset.ready = "true";

    mobileMenu.addEventListener("click", () => {
        const isOpen = navInner.classList.toggle("mobile-open");

        mobileMenu.setAttribute("aria-expanded", String(isOpen));
    });
}

/* =====================================================
   UPDATE COUNTERS WHEN CART OR FAVORITES CHANGE
===================================================== */

if (!window.stockMindNavbarEventsReady) {
    window.stockMindNavbarEventsReady = true;

    window.addEventListener("cartUpdated", () => {
        updateNavbarCartCount();
    });

    window.addEventListener("favoritesUpdated", () => {
        updateNavbarFavoriteCount();
    });

    window.addEventListener("storage", event => {
        if (
            event.key === "stockMindCart" ||
            event.key === "stockMindFavorites" ||
            event.key === "stockMindUser"
        ) {
            initStockMindNavbar();
        }
    });
}
