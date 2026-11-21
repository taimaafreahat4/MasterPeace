(function () {
    "use strict";
    const KEY = "stockMindSellerProfiles";
    const readMap = () => {
        try { const value = JSON.parse(localStorage.getItem(KEY) || "{}"); return value && typeof value === "object" ? value : {}; }
        catch (_) { return {}; }
    };
    function identity(user) {
        return String(user?.id || user?.email || "").trim().toLowerCase();
    }
    function get(user) {
        if (!user || String(user.role || "").toLowerCase() !== "seller") return null;
        const map = readMap();
        const id = identity(user);
        return map[id] || (user.storeProfile && typeof user.storeProfile === "object" ? user.storeProfile : null);
    }
    function isComplete(user) {
        const profile = get(user);
        return Boolean(profile && [profile.storeName, profile.locationDetails, profile.city, profile.country, profile.storeType, profile.businessCategory, profile.targetCustomers].every(value => String(value || "").trim()) && profile.averageVisitorsPerDay !== "" && Number.isInteger(Number(profile.averageVisitorsPerDay)) && Number(profile.averageVisitorsPerDay) >= 0);
    }
    function save(user, profile) {
        if (!user || String(user.role || "").toLowerCase() !== "seller" || !identity(user)) throw new Error("A signed-in seller account is required.");
        const normalized = {
            storeName: String(profile.storeName || "").trim(),
            locationDetails: String(profile.locationDetails || "").trim(),
            city: String(profile.city || "").trim(),
            country: String(profile.country || "").trim(),
            storeType: String(profile.storeType || "").trim(),
            businessCategory: String(profile.businessCategory || "").trim(),
            targetCustomers: String(profile.targetCustomers || "").trim(),
            averageVisitorsPerDay: profile.averageVisitorsPerDay === "" || profile.averageVisitorsPerDay == null ? "" : Number(profile.averageVisitorsPerDay),
            description: String(profile.description || "").trim(),
            updatedAt: new Date().toISOString()
        };
        if (![normalized.storeName, normalized.locationDetails, normalized.city, normalized.country, normalized.storeType, normalized.businessCategory, normalized.targetCustomers].every(Boolean) || normalized.averageVisitorsPerDay === "") throw new Error("Complete the required store fields first.");
        if (!Number.isInteger(normalized.averageVisitorsPerDay) || normalized.averageVisitorsPerDay < 0) throw new Error("Average visitors must be a whole number of zero or greater.");
        const map = readMap();
        map[identity(user)] = normalized;
        localStorage.setItem(KEY, JSON.stringify(map));
        // Keep business fields isolated from stockMindUser/stockMindAccount:
        // their city and contact details belong to the person, not the store.
        return normalized;
    }
    function currentSeller() {
        try { const user = JSON.parse(localStorage.getItem("stockMindUser") || "null"); return user?.loggedIn && String(user.role || "").toLowerCase() === "seller" ? user : null; }
        catch (_) { return null; }
    }
    window.StockMindStoreProfile = { get, isComplete, save, currentSeller };
})();
