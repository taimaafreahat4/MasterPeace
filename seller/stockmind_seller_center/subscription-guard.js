
"use strict";

(function () {
    const SUB_KEY = "stockMindSubscription";

    let isActive = false;

    try {
        const subscription = JSON.parse(
            localStorage.getItem(SUB_KEY) || "null"
        );

        isActive = Boolean(
            subscription &&
            Number(subscription.expiresAt) > Date.now()
        );

    } catch (error) {
        isActive = false;
    }

    if (!isActive) {
        localStorage.removeItem(SUB_KEY);
        window.location.replace("subscription.html");
    }
})();
