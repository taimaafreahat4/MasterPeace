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

    // Keep Navbar cart working even when served from a nested project folder.
    const cartLink = document.querySelector(".navbar-cart-link");
    if (cartLink) cartLink.href = NAVBAR_ROOT + "cart/cart.html";
    updateNavbarCartCount();
    updateNavbarFavoriteCount();
    setupNavbarNotifications();
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
    const storeProfile = document.getElementById("sellerStoreProfileLink");
    const edit = document.getElementById("editProfileLink");
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

    if (storeProfile) {
        const isSeller = normalizedRole.includes("seller");
        storeProfile.hidden = !isSeller;
        if (isSeller) storeProfile.href = NAVBAR_ROOT + "seller/stockmind_seller_center/store-profile.html";
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

    let cart = [];
    try { cart = JSON.parse(sessionStorage.getItem("stockMindCart") || "[]"); }
    catch { cart = []; }
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

function getStockMindNotifications() {
    const saved = readNavbarStorage("stockMindNotifications", []);
    return Array.isArray(saved) ? saved : [];
}

function stockMindNotificationHref(item) {
    if (item?.kind === "seller-listing") {
        return `${NAVBAR_ROOT}seller/stockmind_seller_center/marketplace.html`;
    }
    if (item?.kind === "feedback-review") {
        return `${NAVBAR_ROOT}home/index.html#testimonials`;
    }
    if (item?.kind === "subscription" && item.orderId) {
        return `${NAVBAR_ROOT}seller/stockmind_seller_center/subscription-confirmation.html?order=${encodeURIComponent(item.orderId)}`;
    }
    return item?.orderId
        ? `${NAVBAR_ROOT}checkout/tracking/tracking.html?order=${encodeURIComponent(item.orderId)}`
        : "#";
}

function stockMindNotificationIcon(kind) {
    if (kind === "shipping") return "🚚";
    if (kind === "delivered") return "✓";
    if (kind === "subscription") return "✦";
    if (kind === "seller-listing") return "▦";
    if (kind === "feedback-review") return "✦";
    return "▣";
}

function notificationBelongsToViewer(item) {
    const user = getNavbarUser();
    const email = String(user?.email || sessionStorage.getItem("stockMindGuestEmail") || "").trim().toLowerCase();
    const userId = String(user?.id || user?.username || "");
    if (item.recipientEmail && String(item.recipientEmail).trim().toLowerCase() !== email) return false;
    if (item.recipientUserId && userId && String(item.recipientUserId) !== userId) return false;
    if (item.recipientEmail || item.recipientUserId) return Boolean(email || userId);
    return true;
}

const surfacedNotificationIds = new Set(getStockMindNotifications().map(item => item.id));

function renderNavbarNotifications() {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationCount");
    if (!list || !badge) return;
    const visible = getStockMindNotifications().filter(notificationBelongsToViewer);
    const unread = visible.filter(item => !item.readAt).length;
    badge.textContent = unread > 99 ? "99+" : String(unread);
    badge.hidden = unread === 0;
    const summary = document.getElementById("notificationSummary");
    if (summary) summary.textContent = unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You're all caught up";
    list.replaceChildren();
    if (!visible.length) {
        const empty = document.createElement("div");
        empty.className = "notification-empty";
        empty.innerHTML = "<span aria-hidden=\"true\">♧</span>No updates yet. Order and delivery updates will appear here.";
        list.append(empty);
        return;
    }
    visible.slice(0, 15).forEach(item => {
        const link = document.createElement("a");
        link.className = `notification-item${item.readAt ? "" : " is-unread"}`;
        link.dataset.notificationId = item.id;
        link.dataset.kind = item.kind || "order";
        link.href = stockMindNotificationHref(item);
        const icon = document.createElement("span");
        icon.className = "notification-item__icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = stockMindNotificationIcon(item.kind);
        const copy = document.createElement("span"); copy.className = "notification-item__copy";
        const title = document.createElement("strong"); title.textContent = item.title || "Order update";
        const message = document.createElement("small"); message.textContent = item.message || "There is an update to your order.";
        const time = document.createElement("time"); time.dateTime = item.createdAt || ""; time.textContent = item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now";
        copy.append(title, message, time); link.append(icon, copy); list.append(link);
    });
}

function showOrderToast(item) {
    const toast = document.createElement("div"); toast.className = "stock-mind-toast";
    const icon = document.createElement("span"); icon.className = "stock-mind-toast__icon"; icon.textContent = stockMindNotificationIcon(item.kind);
    const copy = document.createElement("span"); copy.className = "stock-mind-toast__copy";
    const title = document.createElement("strong"); title.textContent = item.title || "Order update";
    const message = document.createElement("small"); message.textContent = item.message || "There is an update to your order."; copy.append(title, message);
    if (item.orderId) { const link = document.createElement("a"); link.className = "stock-mind-toast__link"; link.href = stockMindNotificationHref(item); link.textContent = item.kind === "subscription" ? "View subscription →" : "View order →"; copy.append(link); }
    const close = document.createElement("button"); close.type = "button"; close.className = "stock-mind-toast__close"; close.setAttribute("aria-label", "Dismiss notification"); close.textContent = "×"; close.addEventListener("click", () => toast.remove());
    toast.append(icon, copy, close); document.body.append(toast); requestAnimationFrame(() => toast.classList.add("is-visible"));
    setTimeout(() => { toast.classList.remove("is-visible"); setTimeout(() => toast.remove(), 250); }, 6500);
}

function announceOrderNotification(item) {
    if (!item?.id || surfacedNotificationIds.has(item.id) || !notificationBelongsToViewer(item)) return;
    surfacedNotificationIds.add(item.id); showOrderToast(item);
    if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification(item.title || "Order update", {body:item.message || "There is an update to your order.",icon:`${NAVBAR_ROOT}components/logo.png`,tag:item.id}); } catch (_) {}
    }
}

function addStockMindNotification(data) {
    if (!data) return null;
    const all = getStockMindNotifications();
    const duplicate = data.orderId && all.find(item => item.orderId === data.orderId && item.kind === data.kind && item.recipientEmail === data.recipientEmail);
    if (duplicate) return duplicate;
    const item = {id:`notice-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,kind:data.kind || "order",orderId:data.orderId || "",recipientEmail:data.recipientEmail || "",recipientUserId:data.recipientUserId || "",title:data.title || "Order update",message:data.message || "There is an update to your order.",createdAt:new Date().toISOString(),readAt:""};
    try { localStorage.setItem("stockMindNotifications", JSON.stringify([item,...all].slice(0,60))); }
    catch (error) { console.warn("Could not save notification:", error); return null; }
    renderNavbarNotifications(); announceOrderNotification(item);
    window.dispatchEvent(new Event("stockMindNotificationsUpdated"));
    return item;
}

function setupNavbarNotifications() {
    const trigger = document.getElementById("notificationTrigger");
    const panel = document.getElementById("notificationPanel");
    const wrap = document.getElementById("navbarNotifications");
    if (!trigger || !panel) return;
    renderNavbarNotifications();
    if (trigger.dataset.ready === "true") return;
    trigger.dataset.ready = "true";
    trigger.addEventListener("click", event => { event.stopPropagation(); panel.hidden = !panel.hidden; trigger.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) renderNavbarNotifications(); });
    panel.addEventListener("click", event => {
        const link = event.target.closest("[data-notification-id]"); if (!link) return;
        const all = getStockMindNotifications(); const item = all.find(note => note.id === link.dataset.notificationId);
        if (item && !item.readAt) { item.readAt = new Date().toISOString(); localStorage.setItem("stockMindNotifications", JSON.stringify(all)); }
    });
    document.getElementById("markNotificationsRead")?.addEventListener("click", () => {
        const ids = new Set(getStockMindNotifications().filter(notificationBelongsToViewer).map(item => item.id));
        const now = new Date().toISOString();
        localStorage.setItem("stockMindNotifications", JSON.stringify(getStockMindNotifications().map(item => ids.has(item.id) && !item.readAt ? {...item,readAt:now} : item)));
        renderNavbarNotifications();
    });
    document.getElementById("enableDesktopNotifications")?.addEventListener("click", async () => {
        if (!("Notification" in window)) return;
        if (Notification.permission === "default") await Notification.requestPermission();
        const button = document.getElementById("enableDesktopNotifications");
        if (button) button.textContent = Notification.permission === "granted" ? "Desktop alerts on" : "Desktop alerts blocked";
    });
    document.addEventListener("click", event => { if (!wrap?.contains(event.target)) { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", event => { if (event.key === "Escape") { panel.hidden = true; trigger.setAttribute("aria-expanded", "false"); } });
}

window.addStockMindNotification = addStockMindNotification;
window.updateNavbarNotifications = renderNavbarNotifications;

/* Demo order lifecycle: delivery events are saved per buyer and appear in-app. */
const demoOrderTimers = new Map();
function setStockMindOrderStatus(orderId, nextStatus) {
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]"); } catch (_) {}
    const index = orders.findIndex(order => String(order.orderId) === String(orderId));
    if (index < 0) return {ok:false, message:"Order not found."};
    const order = orders[index];
    const current = String(order.status || "Processing").toLowerCase();
    const next = String(nextStatus || "").toLowerCase();
    const allowed = {processing:["shipped","cancelled"], shipped:["delivered"], delivered:[], cancelled:[]};
    if (current === next) return {ok:true, order};
    if (!allowed[current]?.includes(next)) return {ok:false, message:`Cannot change order from ${order.status} to ${nextStatus}.`};
    const label = next.charAt(0).toUpperCase() + next.slice(1);
    const now = new Date().toISOString();
    order.status = label;
    order.updatedAt = now;
    order.statusHistory = [...(Array.isArray(order.statusHistory) ? order.statusHistory : []), {status:label,at:now}];
    if (next === "shipped") order.trackingNumber = order.trackingNumber || `TRK-${String(orderId).replace(/\D/g, "").slice(-8)}`;
    orders[index] = order;
    try {
        localStorage.setItem("stockMindOrders", JSON.stringify(orders));
        localStorage.setItem("stockMindLastOrder", JSON.stringify(order));
        sessionStorage.setItem("stockMindLastOrder", JSON.stringify(order));
    } catch (error) { return {ok:false, message:"Could not save the order update."}; }
    const recipientEmail = String(order.buyerAccountEmail || order.buyerEmail || order.customer?.email || "").trim().toLowerCase();
    const recipientUserId = order.buyerId || "";
    const notices = {
        shipped:{kind:"shipping",title:"Your order is on the way",message:`Order ${order.orderId} has been handed over for delivery.`},
        delivered:{kind:"delivered",title:"Your order was delivered",message:`Order ${order.orderId} has arrived. You can now share your feedback.`},
        cancelled:{kind:"cancelled",title:"Order cancelled",message:`Order ${order.orderId} was cancelled.`}
    };
    addStockMindNotification({...notices[next],orderId:order.orderId,recipientEmail,recipientUserId});
    window.dispatchEvent(new Event("stockMindOrdersUpdated"));
    scheduleDemoOrderProgress(order);
    return {ok:true,order};
}

function scheduleDemoOrderProgress(order) {
    if (!order?.orderId) return;
    const prior = demoOrderTimers.get(String(order.orderId));
    if (prior) clearTimeout(prior);
    demoOrderTimers.delete(String(order.orderId));
    if (!order.demoAutoDelivery) return;
    const status = String(order.status || "Processing").toLowerCase();
    let nextStatus = "";
    let dueAt = 0;
    if (status === "processing") { nextStatus = "shipped"; dueAt = Date.parse(order.demoShippingAt || "") || Date.now() + 3500; }
    else if (status === "shipped") { nextStatus = "delivered"; dueAt = Date.parse(order.demoDeliveredAt || "") || Date.now() + 8500; }
    if (!nextStatus) return;
    const timer = setTimeout(() => {
        const result = setStockMindOrderStatus(order.orderId, nextStatus);
        if (result.ok) window.dispatchEvent(new Event("stockMindOrdersUpdated"));
    }, Math.max(250, dueAt - Date.now()));
    demoOrderTimers.set(String(order.orderId), timer);
}

function initializeDemoOrderProgress() {
    try {
        const orders = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
        if (Array.isArray(orders)) orders.forEach(scheduleDemoOrderProgress);
    } catch (_) {}
}

window.setStockMindOrderStatus = setStockMindOrderStatus;
initializeDemoOrderProgress();


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
        if (event.key === "stockMindNotifications") renderNavbarNotifications();
        if (event.key === "stockMindOrders") initializeDemoOrderProgress();
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
