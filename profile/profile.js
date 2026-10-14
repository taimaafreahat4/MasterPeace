
/* =========================================
   STOCK MIND - EDIT PROFILE
========================================= */

const USER_KEY = "stockMindUser";
const ACCOUNT_KEY = "stockMindAccount";
const DEFAULT_AVATAR = "../components/logo.png";

let currentUser = null;
let currentAccount = null;
let originalValues = null;
let pendingImage = null;


/* =========================================
   LOCAL STORAGE HELPERS
========================================= */

function readStorage(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error("Unable to read " + key, error);
        return null;
    }
}

function getProfileData() {
    return {
        ...(currentAccount || {}),
        ...(currentUser || {})
    };
}

function saveProfileData(changes) {
    const updatedAccount = {
        ...(currentAccount || {}),
        ...changes
    };

    const updatedUser = {
        ...(currentUser || {}),
        ...changes,
        loggedIn: true
    };

    try {
        localStorage.setItem(
            ACCOUNT_KEY,
            JSON.stringify(updatedAccount)
        );

        localStorage.setItem(
            USER_KEY,
            JSON.stringify(updatedUser)
        );

        currentAccount = updatedAccount;
        currentUser = updatedUser;

        return true;
    } catch (error) {
        console.error("Unable to save profile", error);

        // Restore the previous saved values if saving failed.
        try {
            if (currentAccount) {
                localStorage.setItem(
                    ACCOUNT_KEY,
                    JSON.stringify(currentAccount)
                );
            }

            if (currentUser) {
                localStorage.setItem(
                    USER_KEY,
                    JSON.stringify(currentUser)
                );
            }
        } catch (restoreError) {
            console.error("Could not restore previous data", restoreError);
        }

        return false;
    }
}


/* =========================================
   MESSAGE
========================================= */

function showMessage(message, type = "success") {
    const element = document.getElementById("profileMessage");

    element.textContent = message;
    element.className = "form-message " + type;
}


/* =========================================
   LOAD PROFILE
========================================= */

function loadProfile() {
    const user = getProfileData();

    document.getElementById("editName").value =
        user.name || "";

    document.getElementById("editUsername").value =
        user.username || "";

    document.getElementById("editEmail").value =
        user.email || "";

    document.getElementById("editPhone").value =
        user.phone || "";

    document.getElementById("editCountry").value =
        user.country || "";

    document.getElementById("editCity").value =
        user.city || "";

    document.getElementById("editAddress").value =
        user.address || "";

    const image = user.image || DEFAULT_AVATAR;

    document.getElementById("editAvatar").src = image;

    saveOriginalValues();
}


/* =========================================
   SAVE ORIGINAL VALUES FOR CANCEL
========================================= */

function saveOriginalValues() {
    originalValues = {
        name: document.getElementById("editName").value,
        username: document.getElementById("editUsername").value,
        phone: document.getElementById("editPhone").value,
        country: document.getElementById("editCountry").value,
        city: document.getElementById("editCity").value,
        address: document.getElementById("editAddress").value
    };

    pendingImage = null;
}


/* =========================================
   IMAGE PREVIEW
========================================= */

function setupImageUpload() {
    const input = document.getElementById("newImage");

    input.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showMessage(
                "Please choose a JPG, PNG, or WEBP image.",
                "error"
            );

            input.value = "";
            return;
        }

        // Keep the Data URL small enough for localStorage.
        if (file.size > 1.5 * 1024 * 1024) {
            showMessage(
                "Please choose an image smaller than 1.5 MB.",
                "error"
            );

            input.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            pendingImage = reader.result;

            // Preview only. The image is saved when Save Changes is clicked.
            document.getElementById("editAvatar").src = pendingImage;

            showMessage(
                "Image preview ready. Click Save Changes to apply it.",
                "success"
            );
        };

        reader.onerror = () => {
            showMessage(
                "Unable to read this image. Please try another file.",
                "error"
            );
        };

        reader.readAsDataURL(file);
    });
}


/* =========================================
   SAVE PROFILE
========================================= */

function setupProfileForm() {
    const form = document.getElementById("profileForm");
    const saveButton = form.querySelector(".save-button");

    form.addEventListener("submit", event => {
        event.preventDefault();

        const changes = {
            name: document.getElementById("editName").value.trim(),
            username: document.getElementById("editUsername").value.trim(),
            phone: document.getElementById("editPhone").value.trim(),
            country: document.getElementById("editCountry").value.trim(),
            city: document.getElementById("editCity").value.trim(),
            address: document.getElementById("editAddress").value.trim()
        };

        if (!changes.name || !changes.username) {
            showMessage(
                "Please enter your full name and username.",
                "error"
            );
            return;
        }

        if (pendingImage) {
            changes.image = pendingImage;
        }

        saveButton.disabled = true;
        saveButton.innerHTML =
            '<span class="save-icon">…</span> Saving...';

        // Allow the browser to show the saving animation.
        requestAnimationFrame(() => {
            const success = saveProfileData(changes);

            saveButton.disabled = false;
            saveButton.innerHTML =
                '<span class="save-icon">✓</span> Save Changes';

            if (!success) {
                showMessage(
                    "Could not save changes. Try a smaller image or free browser storage.",
                    "error"
                );
                return;
            }

            document.getElementById("editAvatar").src =
                changes.image || getProfileData().image || DEFAULT_AVATAR;

            saveOriginalValues();

            document.getElementById("newImage").value = "";

            showMessage(
                "Your profile has been updated successfully!",
                "success"
            );
        });
    });
}


/* =========================================
   CANCEL CHANGES
========================================= */

function setupCancelButton() {
    document
        .getElementById("cancelProfileChanges")
        .addEventListener("click", () => {
            if (!originalValues) return;

            document.getElementById("editName").value =
                originalValues.name;

            document.getElementById("editUsername").value =
                originalValues.username;

            document.getElementById("editPhone").value =
                originalValues.phone;

            document.getElementById("editCountry").value =
                originalValues.country;

            document.getElementById("editCity").value =
                originalValues.city;

            document.getElementById("editAddress").value =
                originalValues.address;

            // Restore the last saved image.
            const user = getProfileData();

            document.getElementById("editAvatar").src =
                user.image || DEFAULT_AVATAR;

            document.getElementById("newImage").value = "";
            pendingImage = null;

            const message = document.getElementById("profileMessage");
            message.textContent = "";
            message.className = "form-message";
        });
}


/* =========================================
   INITIALIZE
========================================= */

function initEditProfile() {
    currentUser = readStorage(USER_KEY);
    currentAccount = readStorage(ACCOUNT_KEY);

    if (!currentUser || !currentUser.loggedIn) {
        window.location.replace("../login/login.html");
        return;
    }

    loadProfile();
    setupImageUpload();
    setupProfileForm();
    setupCancelButton();
}

initEditProfile();
