
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("advisorForm");
    const resultsSection = document.getElementById("resultsSection");

    if (!form || !resultsSection) return;

    const categoryNames = {
        clothing: "Clothing",
        shoes: "Shoes",
        cosmetics: "Cosmetics",
        electronics: "Electronics",
        home: "Home & Living",
        accessories: "Bags & Accessories",
        sports: "Sports",
        grocery: "Grocery",
        books: "Books",
        automotive: "Automotive"
    };

    const seasonNames = {
        spring: "Spring",
        summer: "Summer",
        autumn: "Autumn",
        winter: "Winter"
    };

    const weatherNames = {
        mild: "Mild",
        hot: "Hot",
        cold: "Cold",
        rainy: "Rainy"
    };

    const locationNames = {
        commercial: "Commercial shopping area",
        residential: "Residential neighborhood",
        tourist: "Tourist area",
        university: "University or school area",
        online: "Online store"
    };

    const ageNames = {
        young: "Children and teenagers",
        youngAdults: "Young adults",
        adults: "Adults",
        families: "Families and mixed ages",
        all: "All age groups"
    };

    const $ = id => document.getElementById(id);

    function value(id) {
        return $(id).value.trim();
    }

    function money(amount) {
        return "JOD " + Number(amount).toFixed(2);
    }

    function clamp(number, min, max) {
        return Math.max(min, Math.min(max, number));
    }

    function calculateAnalysis(data) {
        const reasons = [];
        const risks = [];

        // Category fit is a demo heuristic, not measured market demand.
        const seasonalScores = {
            clothing:    { spring: 8, summer: 9, autumn: 9, winter: 9 },
            shoes:       { spring: 8, summer: 8, autumn: 8, winter: 8 },
            cosmetics:   { spring: 8, summer: 8, autumn: 8, winter: 8 },
            electronics: { spring: 7, summer: 7, autumn: 7, winter: 7 },
            home:        { spring: 7, summer: 7, autumn: 8, winter: 8 },
            accessories: { spring: 8, summer: 8, autumn: 8, winter: 8 },
            sports:      { spring: 9, summer: 8, autumn: 8, winter: 7 },
            grocery:     { spring: 8, summer: 8, autumn: 8, winter: 8 },
            books:       { spring: 7, summer: 7, autumn: 8, winter: 7 },
            automotive:  { spring: 7, summer: 7, autumn: 7, winter: 7 }
        };

        const seasonFit = seasonalScores[data.category]?.[data.season] ?? 7;

        const locationCategoryMatches = {
            commercial: ["clothing", "shoes", "cosmetics", "accessories", "electronics"],
            residential: ["grocery", "home", "clothing", "books"],
            tourist: ["accessories", "clothing", "cosmetics"],
            university: ["books", "electronics", "clothing", "shoes", "accessories"],
            online: ["clothing", "accessories", "electronics", "cosmetics", "books"]
        };

        let locationFit = (
            locationCategoryMatches[data.location] || []
        ).includes(data.category) ? 9 : 6;

        if (data.location === "residential" &&
            ["automotive", "sports"].includes(data.category)) {
            locationFit = 6;
        }

        const ageCategoryMatches = {
            young: ["clothing", "shoes", "sports", "books", "accessories"],
            youngAdults: ["clothing", "shoes", "cosmetics", "electronics", "accessories", "sports"],
            adults: ["clothing", "cosmetics", "electronics", "home", "automotive"],
            families: ["clothing", "shoes", "home", "grocery", "books", "sports"],
            all: Object.keys(categoryNames)
        };

        let customerFit = (
            ageCategoryMatches[data.ageGroup] || []
        ).includes(data.category) ? 8 : 6;

        if (data.visitors >= 100) customerFit += 1;
        if (data.visitors < 15) customerFit -= 2;

        // Weather adjustments are simple assumptions, not live weather data.
        let weatherFit = 7;

        if (data.category === "clothing") {
            if (data.season === "summer" && data.weather === "hot") weatherFit = 9;
            if (data.season === "winter" && data.weather === "cold") weatherFit = 9;
            if (data.weather === "rainy" && data.season === "winter") weatherFit = 8;
        }

        if (data.category === "sports" && data.weather === "hot") weatherFit = 6;
        if (data.category === "home" && data.weather === "cold") weatherFit = 8;
        if (data.category === "cosmetics" && data.weather === "hot") weatherFit = 8;
        if (data.category === "grocery") weatherFit = 8;

        locationFit = clamp(locationFit, 1, 10);
        customerFit = clamp(customerFit, 1, 10);

        // Weighted score. It is not a probability of sales.
        const score = Math.round(
            seasonFit * 10 * 0.30 +
            weatherFit * 10 * 0.20 +
            locationFit * 10 * 0.25 +
            customerFit * 10 * 0.25
        );

        /*
         * Initial stock estimate:
         * 4% visitor conversion is an illustrative assumption.
         * It must be replaced with real sales data for reliable forecasts.
         */
        const estimatedDailyDemand = Math.ceil(data.visitors * 0.04);
        const estimatedDemandFor14Days = Math.max(1, estimatedDailyDemand * 14);

        const affordableQuantity = Math.floor(data.budget / data.unitCost);
        const minimumCost = data.minimumOrder * data.unitCost;
        const canAffordMinimum = minimumCost <= data.budget;

        let quantity = 0;

        if (canAffordMinimum) {
            quantity = Math.min(
                affordableQuantity,
                Math.max(data.minimumOrder, estimatedDemandFor14Days)
            );
        }

        const estimatedCost = quantity * data.unitCost;
        const budgetRemaining = data.budget - estimatedCost;

        if (seasonFit >= 8) {
            reasons.push(
                `${categoryNames[data.category]} has a potentially reasonable fit for the selected season.`
            );
        } else {
            reasons.push(
                "The seasonal fit is uncertain. Check whether customers are buying this category now."
            );
        }

        if (weatherFit >= 8) {
            reasons.push(
                `The selected weather (${weatherNames[data.weather].toLowerCase()}) may support this product category.`
            );
        } else {
            reasons.push(
                "The weather does not provide a strong seasonal signal in this demo. Compare alternatives."
            );
        }

        if (locationFit >= 8) {
            reasons.push(
                `${categoryNames[data.category]} may suit a ${locationNames[data.location].toLowerCase()}.`
            );
        } else {
            reasons.push(
                "The category is not an obvious match for this store type. Check nearby competitors and customer requests."
            );
        }

        if (customerFit >= 8) {
            reasons.push(
                `The selected customer group (${ageNames[data.ageGroup].toLowerCase()}) may be a reasonable audience for this category.`
            );
        } else {
            reasons.push(
                "The selected customer group may have different needs. Validate interest before placing a bulk order."
            );
        }

        reasons.push(
            `The quantity estimate assumes about ${estimatedDailyDemand} sales per day and 14 days of stock coverage. This is an illustrative assumption, not measured demand.`
        );

        if (data.visitors < 15) {
            risks.push(
                "Your estimated daily visitor count is low. Consider testing demand before investing in a large order."
            );
        }

        if (!canAffordMinimum) {
            risks.push(
                `The supplier minimum would cost ${money(minimumCost)}, which exceeds your budget of ${money(data.budget)}. Consider another supplier or adjust the budget.`
            );
        } else if (quantity === data.minimumOrder) {
            risks.push(
                "The estimated quantity is at the supplier minimum. Confirm that you can sell this quantity before buying."
            );
        }

        if (score < 65) {
            risks.push(
                "The combined fit score is relatively low. Compare other categories and gather customer feedback."
            );
        }

        if (canAffordMinimum && budgetRemaining < data.budget * 0.10) {
            risks.push(
                "This order uses most of your budget. Leave room for shipping, fees and unexpected costs."
            );
        }

        if (data.notes) {
            reasons.push(
                "Additional information to consider: " + data.notes
            );
        }

        if (risks.length === 0) {
            risks.push(
                "Before buying, check current stock, supplier reliability, actual sales and delivery costs."
            );
        }

        let headline = "Test demand before making a large purchase.";
        let recommendation = "Compare this result with actual customer requests and your existing inventory.";

        if (score >= 80 && canAffordMinimum) {
            headline = "Promising category to investigate.";
            recommendation = "The selected inputs suggest a potentially good fit. Consider a controlled initial order and review the results before restocking.";
        } else if (score < 60) {
            headline = "Validate demand before buying.";
            recommendation = "The selected inputs do not provide a strong match. Research demand or compare another category before committing your budget.";
        }

        if (!canAffordMinimum) {
            headline = "The supplier minimum exceeds your budget.";
            recommendation = "The budget cannot cover the minimum quantity at the unit cost provided. Find a lower minimum order, negotiate pricing or revise your budget.";
        }

        return {
            score,
            seasonFit,
            weatherFit,
            locationFit,
            customerFit,
            estimatedDailyDemand,
            quantity,
            estimatedCost,
            budgetRemaining,
            minimumCost,
            canAffordMinimum,
            headline,
            recommendation,
            reasons,
            risks
        };
    }

    function addListItem(list, text) {
        const li = document.createElement("li");
        li.textContent = text;
        list.appendChild(li);
    }

    function renderResults(data, result) {
        $("resultSubtitle").textContent =
            `${categoryNames[data.category]} · ${data.city}, ${data.country} · ${seasonNames[data.season]}`;

        $("suitabilityScore").textContent = result.score;

        $("suitabilityLabel").textContent =
            result.score >= 80 ? "Strong potential to investigate" :
            result.score >= 65 ? "Moderate potential" :
            "Needs more validation";

        $("scoreBar").style.width = result.score + "%";

        $("suggestedQuantity").textContent =
            result.canAffordMinimum ? result.quantity.toLocaleString() : "—";

        $("estimatedCost").textContent =
            result.canAffordMinimum ? money(result.estimatedCost) : "Over budget";

        $("budgetRemaining").textContent =
            result.canAffordMinimum ? money(result.budgetRemaining) : money(data.budget);

        $("recommendationHeadline").textContent = result.headline;
        $("recommendationText").textContent = result.recommendation;

        const reasonList = $("reasonList");
        const riskList = $("riskList");

        reasonList.replaceChildren();
        riskList.replaceChildren();

        result.reasons.forEach(reason => addListItem(reasonList, reason));
        result.risks.forEach(risk => addListItem(riskList, risk));

        resultsSection.hidden = false;

        // Save the most recent report for the download button.
        window.stockMindLastAIReport = {
            createdAt: new Date().toISOString(),
            inputs: data,
            result: result
        };

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const data = {
            country: value("country"),
            city: value("city"),
            location: value("locationType"),
            season: value("season"),
            weather: value("weather"),
            ageGroup: value("ageGroup"),
            visitors: Number(value("visitors")),
            category: value("category"),
            unitCost: Number(value("unitCost")),
            budget: Number(value("budget")),
            minimumOrder: Number(value("minimumOrder")),
            notes: value("notes")
        };

        if (
            !data.country ||
            !data.city ||
            !Number.isFinite(data.visitors) ||
            !Number.isFinite(data.unitCost) ||
            !Number.isFinite(data.budget) ||
            !Number.isFinite(data.minimumOrder) ||
            data.visitors < 0 ||
            data.unitCost <= 0 ||
            data.budget <= 0 ||
            data.minimumOrder < 1
        ) {
            alert("Please enter a valid location, visitor count, budget, unit cost and supplier minimum.");
            return;
        }

        const button = form.querySelector(".analyze-button");
        const originalButtonHTML = button.innerHTML;

        button.disabled = true;
        button.innerHTML = "Analyzing your market...";

        // Brief delay to show a clear loading state in this demo.
        window.setTimeout(() => {
            try {
                const result = calculateAnalysis(data);
                renderResults(data, result);
            } finally {
                button.disabled = false;
                button.innerHTML = originalButtonHTML;
            }
        }, 450);
    });

    $("editAnalysisButton").addEventListener("click", () => {
        resultsSection.hidden = true;
        form.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("downloadReportButton").addEventListener("click", () => {
        const report = window.stockMindLastAIReport;
        if (!report) return;

        const data = report.inputs;
        const result = report.result;

        const lines = [
            "STOCK MIND — BUYING ADVISOR REPORT",
            "Generated: " + report.createdAt,
            "",
            "MARKET DETAILS",
            "Country: " + data.country,
            "City: " + data.city,
            "Location: " + locationNames[data.location],
            "Season: " + seasonNames[data.season],
            "Weather: " + weatherNames[data.weather],
            "Customer group: " + ageNames[data.ageGroup],
            "Daily visitors: " + data.visitors,
            "",
            "BUYING DETAILS",
            "Category: " + categoryNames[data.category],
            "Unit cost: " + money(data.unitCost),
            "Budget: " + money(data.budget),
            "Supplier minimum: " + data.minimumOrder,
            "",
            "ANALYSIS",
            "Suitability score: " + result.score + "/100",
            "Recommendation: " + result.headline,
            "Suggested quantity: " + (
                result.canAffordMinimum ? result.quantity : "Minimum order is over budget"
            ),
            "Estimated cost: " + (
                result.canAffordMinimum ? money(result.estimatedCost) : "Over budget"
            ),
            "Budget remaining: " + (
                result.canAffordMinimum ? money(result.budgetRemaining) : money(data.budget)
            ),
            "",
            "WHY THIS MAY FIT",
            ...result.reasons.map((item, i) => `${i + 1}. ${item}`),
            "",
            "RISKS",
            ...result.risks.map((item, i) => `${i + 1}. ${item}`),
            "",
            "LIMITATION",
            "This report uses illustrative rules and assumptions. It is not a real AI forecast, live weather analysis, or guarantee of sales."
        ];

        const blob = new Blob([lines.join("\n")], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "stockmind-buying-analysis.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });

    // Load the shared footer.
    fetch("../components/footer.html")
        .then(response => {
            if (!response.ok) throw new Error("Footer could not be loaded.");
            return response.text();
        })
        .then(html => {
            $("footer-container").innerHTML = html;
        })
        .catch(error => console.error("Footer loading error:", error));
});
