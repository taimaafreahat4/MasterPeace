document.addEventListener("DOMContentLoaded", () => {
    const api = window.StockMindStoreProfile;
    const user = api?.currentSeller();
    if (!user) { window.location.replace("../../login/login.html?role=seller"); return; }
    const form = document.getElementById("storeProfileForm");
    const button = document.getElementById("saveStoreButton");
    const message = document.getElementById("storeMessage");
    const profile = api.get(user) || {};
    ["storeName", "businessCategory", "locationDetails", "city", "country", "storeType", "targetCustomers", "averageVisitorsPerDay", "description"].forEach(key => {
        const field = document.getElementById(key);
        if (field && profile[key] != null) field.value = profile[key];
    });
    const updateDescriptionCount = () => { document.getElementById("descriptionCount").textContent = String(document.getElementById("description").value.length); };
    document.getElementById("description").addEventListener("input", updateDescriptionCount);
    updateDescriptionCount();

    function showMessage(text, kind) { message.textContent = text; message.className = `store-message is-${kind}`; message.hidden = false; }
    form.addEventListener("input", event => event.target.removeAttribute("aria-invalid"));
    form.addEventListener("submit", event => {
        event.preventDefault();
        const required = ["storeName", "businessCategory", "locationDetails", "city", "country", "storeType", "targetCustomers", "averageVisitorsPerDay"];
        let firstInvalid = null;
        required.forEach(id => {
            const field = document.getElementById(id);
            field.value = field.value.trim();
            const invalid = !field.checkValidity();
            field.setAttribute("aria-invalid", String(invalid));
            if (invalid && !firstInvalid) firstInvalid = field;
        });
        const visitors = document.getElementById("averageVisitorsPerDay");
        const visitorValue = visitors.value.trim();
        const invalidVisitors = visitorValue === "" || !visitors.checkValidity() || !Number.isInteger(Number(visitorValue)) || Number(visitorValue) < 0;
        visitors.setAttribute("aria-invalid", String(invalidVisitors));
        if (invalidVisitors && !firstInvalid) firstInvalid = visitors;
        if (firstInvalid) { showMessage(invalidVisitors ? "Average visitors must be a whole number from 0 or higher." : "Please complete all required fields.", "error"); firstInvalid.focus(); return; }

        button.disabled = true;
        button.querySelector("span").textContent = "Saving…";
        message.hidden = true;
        const values = Object.fromEntries(["storeName", "businessCategory", "locationDetails", "city", "country", "storeType", "targetCustomers", "averageVisitorsPerDay", "description"].map(id => [id, document.getElementById(id).value.trim()]));
        try {
            api.save(user, values);
            showMessage("Store saved. Opening your seller dashboard…", "success");
            button.querySelector("span").textContent = "Saved";
            setTimeout(() => window.location.assign("dashboard.html"), 700);
        } catch (error) {
            showMessage(error.message || "We couldn't save your store information. Please try again.", "error");
            button.disabled = false;
            button.querySelector("span").textContent = "Save & Continue";
        }
    });
});
