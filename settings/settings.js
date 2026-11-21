
/* =========================================
   STOCK MIND - SETTINGS LOGIC
========================================= */

const SETTINGS_USER_KEY = "stockMindUser";
const SETTINGS_ACCOUNT_KEY = "stockMindAccount";
const SETTINGS_PREFIX = "stockMindPreferences_";

let settingsUser = null;
let settingsAccount = null;
let preferencesKey = "";


/* =========================================
   LOCAL STORAGE HELPERS
========================================= */

function settingsReadStorage(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        console.error("Could not read " + key, error);
        return fallback;
    }
}

function settingsShowMessage(id, message, type = "success") {
    const element = document.getElementById(id);

    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", type === "error");
}


/* =========================================
   LOAD NAVBAR AND FOOTER
========================================= */

async function settingsLoadSharedComponents() {
    try {
        const response = await fetch("../components/navbar.html");

        if (!response.ok) {
            throw new Error("Navbar could not be loaded");
        }

        const html = await response.text();
        document.getElementById("navbar").innerHTML = html;

        if (typeof initStockMindNavbar === "function") {
            initStockMindNavbar();
        } else {
            console.warn("initStockMindNavbar() was not found.");
        }

        const menu = document.getElementById("mobileMenu");
        const nav = document.getElementById("navInner");

        if (menu && nav) {
            menu.addEventListener("click", () => {
                nav.classList.toggle("mobile-open");
            });
        }
    } catch (error) {
        console.error("Navbar error:", error);
    }

    try {
        const response = await fetch("../components/footer.html");

        if (!response.ok) {
            throw new Error("Footer could not be loaded");
        }

        document.getElementById("footer-container").innerHTML =
            await response.text();
    } catch (error) {
        console.error("Footer error:", error);
    }
}


/* =========================================
   CHECK SESSION
========================================= */

function settingsCheckSession() {
    settingsUser = settingsReadStorage(SETTINGS_USER_KEY);
    settingsAccount = settingsReadStorage(SETTINGS_ACCOUNT_KEY);

    if (!settingsUser || settingsUser.loggedIn !== true) {
        window.location.replace("../login/login.html");
        return false;
    }

    const identity = String(
        settingsUser.email || settingsUser.username || ""
    ).trim().toLowerCase();

    preferencesKey = SETTINGS_PREFIX + (
        identity || "current-user"
    );

    return true;
}


/* =========================================
   NOTIFICATION AND SHOPPING PREFERENCES
========================================= */

function getDefaultPreferences() {
    return {
        notifyOrders: true,
        notifyShipping: true
    };
}

function loadPreferences() {
    const saved = settingsReadStorage(
        preferencesKey,
        getDefaultPreferences()
    );

    const preferences = {
        ...getDefaultPreferences(),
        ...(saved && typeof saved === "object" ? saved : {})
    };

    document.getElementById("notifyOrders").checked =
        Boolean(preferences.notifyOrders);

    document.getElementById("notifyShipping").checked =
        Boolean(preferences.notifyShipping);

}

function collectPreferences() {
    return {
        notifyOrders: document.getElementById("notifyOrders").checked,
        notifyShipping: document.getElementById("notifyShipping").checked
    };
}

function setupSavePreferences() {
    const save = () => {
        try {
            localStorage.setItem(preferencesKey, JSON.stringify(collectPreferences()));
            settingsShowMessage("preferencesMessage", "Saved.");
        } catch (error) {
            console.error("Could not save preferences", error);
            settingsShowMessage("preferencesMessage", "Could not save settings in this browser.", "error");
        }
    };

    ["notifyOrders", "notifyShipping"].forEach(id => {
        document.getElementById(id).addEventListener("change", save);
    });
}

function setupRoleSettings() {
    const role = String(settingsUser?.role || "buyer").trim().toLowerCase();
    const isSeller = role === "seller";

    document.getElementById("settingsRoleLabel").textContent =
        isSeller ? "SELLER ACCOUNT" : "BUYER ACCOUNT";
    document.getElementById("sellerStoreRow").hidden = !isSeller;
    document.getElementById("notificationIntro").textContent = isSeller
        ? "Choose the order and delivery updates for your store."
        : "Choose the order and delivery updates you want to receive.";
    document.getElementById("orderNotificationTitle").textContent = isSeller
        ? "Store Order Updates"
        : "Order Updates";
    document.getElementById("orderNotificationDescription").textContent = isSeller
        ? "Updates about purchases and activity on your listings."
        : "Order confirmations and changes to your purchases.";
    document.getElementById("accountIntro").textContent = isSeller
        ? "Manage your personal profile and store details."
        : "Manage your profile and account session.";
}


/* =========================================
   SHOW / HIDE PASSWORDS
========================================= */

function setupShowPasswords() {
    document.getElementById("showPasswords").addEventListener(
        "change",
        event => {
            const type = event.target.checked ? "text" : "password";

            document.getElementById("currentPassword").type = type;
            document.getElementById("newPassword").type = type;
            document.getElementById("confirmPassword").type = type;
        }
    );
}


/* =========================================
   PASSWORD CHANGE - LOCAL DEMO ONLY
========================================= */

function setupPasswordForm() {
    const form = document.getElementById("passwordForm");

    form.addEventListener("submit", event => {
        event.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword").value;

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (newPassword.length < 8) {
            settingsShowMessage(
                "passwordMessage",
                "Your new password must contain at least 8 characters.",
                "error"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            settingsShowMessage(
                "passwordMessage",
                "The new passwords do not match.",
                "error"
            );
            return;
        }

        if (newPassword === currentPassword) {
            settingsShowMessage(
                "passwordMessage",
                "Your new password must be different from the current password.",
                "error"
            );
            return;
        }

        /*
         * This is only a local prototype.
         * It is not secure to store plaintext passwords in localStorage.
         * A real website must verify and update passwords on a backend.
         */

        const account = settingsReadStorage(SETTINGS_ACCOUNT_KEY);
        const user = settingsReadStorage(SETTINGS_USER_KEY);

        if (!account || !user) {
            settingsShowMessage(
                "passwordMessage",
                "Account information could not be found. Please sign in again.",
                "error"
            );
            return;
        }

        const accountEmail = String(account.email || "").toLowerCase();
        const userEmail = String(user.email || "").toLowerCase();

        const accountUsername = String(
            account.username || ""
        ).toLowerCase();

        const userUsername = String(
            user.username || ""
        ).toLowerCase();

        const sameAccount =
            (accountEmail && userEmail && accountEmail === userEmail) ||
            (accountUsername && userUsername &&
                accountUsername === userUsername);

        if (!sameAccount) {
            settingsShowMessage(
                "passwordMessage",
                "The stored account does not match the signed-in user.",
                "error"
            );
            return;
        }

        if (account.password !== currentPassword) {
            settingsShowMessage(
                "passwordMessage",
                "The current password is incorrect.",
                "error"
            );
            return;
        }

        try {
            const updatedAccount = {
                ...account,
                password: newPassword,
                confirmPassword: undefined
            };

            localStorage.setItem(
                SETTINGS_ACCOUNT_KEY,
                JSON.stringify(updatedAccount)
            );

            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
            document.getElementById("showPasswords").checked = false;

            document.getElementById("currentPassword").type = "password";
            document.getElementById("newPassword").type = "password";
            document.getElementById("confirmPassword").type = "password";

            settingsShowMessage(
                "passwordMessage",
                "Password updated in this local prototype."
            );
        } catch (error) {
            console.error("Could not update password", error);

            settingsShowMessage(
                "passwordMessage",
                "Unable to update the password.",
                "error"
            );
        }
    });
}


/* =========================================
   LOG OUT
========================================= */

function setupSettingsLogout() {
    document.getElementById("settingsLogout").addEventListener(
        "click",
        () => {
            const confirmed = window.confirm(
                "Are you sure you want to log out?"
            );

            if (!confirmed) return;

            localStorage.removeItem(SETTINGS_USER_KEY);

            window.location.href = "../home/index.html";
        }
    );
}


/* =========================================
   SETTINGS SIDEBAR
========================================= */

function setupSettingsNavigation() {
    const links = document.querySelectorAll(".settings-nav-link");

    links.forEach(link => {
        link.addEventListener("click", () => {
            links.forEach(item => item.classList.remove("active"));
            link.classList.add("active");
        });
    });
}


/* =========================================
   INITIALIZE SETTINGS
========================================= */

async function initSettingsPage() {
    await settingsLoadSharedComponents();

    if (!settingsCheckSession()) return;

    loadPreferences();
    setupRoleSettings();
    setupSavePreferences();
    setupShowPasswords();
    setupPasswordForm();
    setupSettingsLogout();
    setupSettingsNavigation();
}

initSettingsPage();
