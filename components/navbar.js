/* =====================================================
   STOCK MIND - SHARED NAVBAR
   مكانه: components/navbar.js
===================================================== */

/* جذر المشروع محسوب من مكان هاد الملف (بيشتغل من أي صفحة) */
var NAVBAR_SRC  = (typeof NAVBAR_SRC !== "undefined" && NAVBAR_SRC) ||
                  (document.currentScript ? document.currentScript.src : "");
var NAVBAR_ROOT = NAVBAR_SRC ? new URL("../", NAVBAR_SRC).href : "/";
var NAVBAR_DEFAULT_AVATAR = NAVBAR_ROOT + "components/logo.png";


/* =====================================================
   STORAGE HELPERS
===================================================== */

function readNavbarStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.error("Could not read " + key, error);
        return fallback;
    }
}

/* المستخدم المسجّل دخوله (من login.js) + بيانات حسابه المحفوظة */
function getNavbarUser() {

    const session = readNavbarStorage("stockMindUser", null);

    if (!session || !session.loggedIn) return null;

    const saved = readNavbarStorage("stockMindAccount", null);

    const sameAccount =
        saved && saved.email && session.email &&
        String(saved.email).toLowerCase() === String(session.email).toLowerCase();

    /* ندمج بيانات الحساب المحفوظ بس إذا كان نفس الشخص */
    const merged = sameAccount ? { ...saved } : {};

    Object.keys(session).forEach(key => {
        if (session[key] !== "" && session[key] != null) {
            merged[key] = session[key];
        }
    });

    merged.loggedIn = true;

    return merged;
}


/* =====================================================
   INITIALIZE NAVBAR
   (بتتنفذ لحالها بعد ما النافبار يظهر بالصفحة)
===================================================== */

function initStockMindNavbar() {

    const user       = getNavbarUser();
    const isLoggedIn = Boolean(user);

    const guestButtons = document.getElementById("guestButtons");
    const userProfile  = document.getElementById("userProfile");

    /* قبل الدخول: Login + Sign Up | بعد الدخول: الصورة والاسم */
    if (guestButtons) guestButtons.hidden = isLoggedIn;
    if (userProfile)  userProfile.hidden  = !isLoggedIn;

    updateNavbarCartCount();
    updateNavbarFavoriteCount();
    setupNavbarMobileMenu();

    if (!isLoggedIn) {
        closeProfileDropdown();
        return;
    }

    /* ---------- بيانات المستخدم ---------- */

    const profileImage  = document.getElementById("profileImage");
    const username      = document.getElementById("username");
    const menuUserName  = document.getElementById("menuUserName");
    const menuUserEmail = document.getElementById("menuUserEmail");

    const displayName =
        user.name ||
        user.username ||
        (user.email ? String(user.email).split("@")[0] : "") ||
        "User";

    const displayRole = String(user.role || "Buyer");

    /* الصورة */
    if (profileImage) {
        profileImage.onerror = () => {
            profileImage.onerror = null;
            profileImage.src = NAVBAR_DEFAULT_AVATAR;
        };
        profileImage.src = user.image || NAVBAR_DEFAULT_AVATAR;
        profileImage.alt = displayName + " profile picture";
    }

    /* الاسم الأول جنب الصورة */
    if (username) {
        username.textContent = displayName.trim().split(" ")[0];
        username.title = displayName + " (" + displayRole + ")";
    }

    /* الاسم الكامل والإيميل داخل القائمة */
    if (menuUserName)  menuUserName.textContent  = displayName;
    if (menuUserEmail) menuUserEmail.textContent = user.email || "";

    setupRoleLinks(displayRole);
    setupProfileDropdown();
    setupNavbarLogout();
}


/* =====================================================
   روابط القائمة حسب الدور (Admin / Seller / Buyer)
===================================================== */

function setupRoleLinks(role) {
    const menu = document.getElementById("profileMenu");

    if (!menu) return;

    const normalizedRole = String(role || "buyer").toLowerCase();

    const dash = menu.querySelector('a[href*="dashboard"]');
    const edit = menu.querySelector('a[href*="profile.html"]');
    const settings = menu.querySelector('a[href*="settings.html"]');

    const setLabel = (link, text) => {
        const label = link && link.querySelector("span:last-child");

        if (label) {
            label.textContent = text;
        }
    };

    // Default routes for a buyer
    let routes = {
        dashboard: "buyer-dashboard/dashboard.html",
        dashboardLabel: "My Dashboard",
        profile: "profile/profile.html#edit-profile",
        settings: "settings/settings.html"
    };

    // Admin routes
    if (normalizedRole.includes("admin")) {
        routes = {
            dashboard: "admin/dashboard/dashboard.html",
            dashboardLabel: "Admin Dashboard",
            profile: "admin/profile/profile.html",
            settings: "admin/settings/settings.html"
        };
    }

    // Seller routes
    else if (normalizedRole.includes("seller")) {
        routes = {
            dashboard: "seller/stockmind_seller_center/dashboard.html",
            dashboardLabel: "Seller Dashboard",
            profile: "profile/profile.html#edit-profile",
            settings: "settings/settings.html"
        };
    }

    // Always use absolute project-root URLs
    if (dash) {
        dash.href = NAVBAR_ROOT + routes.dashboard;
        setLabel(dash, routes.dashboardLabel);
    }

    if (edit) {
        edit.href = NAVBAR_ROOT + routes.profile;
    }

    if (settings) {
        settings.href = NAVBAR_ROOT + routes.settings;
    }
}


/* =====================================================
   PROFILE DROPDOWN
===================================================== */

function setupProfileDropdown() {

    const trigger = document.getElementById("profileTrigger");
    const menu    = document.getElementById("profileMenu");
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
    const menu    = document.getElementById("profileMenu");

    if (menu)    menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
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

        /* بنمسح بيانات الدخول بس. الحساب المحفوظ والسلة والمفضلة بيضلوا */
        ["stockMindUser", "user"].forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        window.location.href = NAVBAR_ROOT + "home/index.html";
    });
}


/* =====================================================
   CART COUNTER
===================================================== */

function updateNavbarCartCount() {

    const cart  = readNavbarStorage("stockMindCart", []);
    const badge = document.getElementById("cartCount");

    if (!badge) return;

    badge.textContent = Array.isArray(cart) ? cart.length : 0;
}


/* =====================================================
   FAVORITES COUNTER
===================================================== */

function updateNavbarFavoriteCount() {

    const favorites = readNavbarStorage("stockMindFavorites", []);
    const badge     = document.getElementById("favoriteCount");

    if (!badge) return;

    badge.textContent = Array.isArray(favorites) ? favorites.length : 0;
}


/* =====================================================
   MOBILE MENU
===================================================== */

function setupNavbarMobileMenu() {

    const mobileMenu = document.getElementById("mobileMenu");
    const navInner   = document.getElementById("navInner");

    if (!mobileMenu || !navInner) return;
    if (mobileMenu.dataset.ready === "true") return;

    mobileMenu.dataset.ready = "true";

    mobileMenu.addEventListener("click", () => {
        const isOpen = navInner.classList.toggle("mobile-open");
        mobileMenu.setAttribute("aria-expanded", String(isOpen));
    });
}


/* =====================================================
   EVENTS (تحديث العدادات / تغيّر المستخدم)
===================================================== */

if (!window.stockMindNavbarEventsReady) {

    window.stockMindNavbarEventsReady = true;

    window.addEventListener("cartUpdated", updateNavbarCartCount);
    window.addEventListener("favoritesUpdated", updateNavbarFavoriteCount);
    window.addEventListener("userUpdated", initStockMindNavbar);

    window.addEventListener("storage", event => {
        if (
            event.key === "stockMindCart" ||
            event.key === "stockMindFavorites" ||
            event.key === "stockMindUser" ||
            event.key === "stockMindAccount"
        ) {
            initStockMindNavbar();
        }
    });
}


/* =====================================================
   AUTO START
   بيستنى النافبار يتحمّل بالصفحة وبعدين بيشغّله لحاله
===================================================== */

(function autoInitNavbar() {

    if (document.getElementById("guestButtons")) {
        initStockMindNavbar();
        return;
    }

    const obs = new MutationObserver(() => {
        if (document.getElementById("guestButtons")) {
            obs.disconnect();
            initStockMindNavbar();
        }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(() => obs.disconnect(), 15000);

})();