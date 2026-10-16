
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    /* =========================================
       LOAD FOOTER
    ========================================= */

    async function loadFooter() {
        const footer = $("footer-container");

        if (!footer) return;

        try {
            const response = await fetch("../../components/footer.html");

            if (!response.ok) {
                throw new Error(`Footer error: ${response.status}`);
            }

            footer.innerHTML = await response.text();
        } catch (error) {
            console.error("Footer loading failed:", error);
        }
    }

    loadFooter();

    /* =========================================
       FORM ELEMENTS
    ========================================= */

    const form = $("advisorForm");

    if (!form) {
        console.error("Advisor form was not found.");
        return;
    }

    const panels = [...document.querySelectorAll("[data-panel]")];
    const steps = [...document.querySelectorAll("#stepper .step")];
    const lines = [...document.querySelectorAll("#stepper .step-line")];

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

    let imageData = "";
    let analysisTimer = null;
    let lastReport = null;

    const money = (value) =>
        `JOD ${Number(value || 0).toFixed(2)}`;

    /* =========================================
       STEP NAVIGATION
    ========================================= */

    function goStep(number) {
        panels.forEach((panel) => {
            panel.hidden = Number(panel.dataset.panel) !== number;
        });

        steps.forEach((step, index) => {
            step.classList.toggle("active", index + 1 === number);
            step.classList.toggle("done", index + 1 < number);
        });

        lines.forEach((line, index) => {
            line.classList.toggle("fill", index + 1 < number);
        });

        if (number !== 2) {
            $("wizardTop")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    /* =========================================
       PRODUCT PHOTO
    ========================================= */

    const photoInput = $("photoInput");

    photoInput?.addEventListener("change", () => {
        const file = photoInput.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image.");
            photoInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            imageData = String(reader.result || "");

            $("photoPreview").src = imageData;
            $("photoBox").classList.add("has-img");
        };

        reader.onerror = () => {
            alert("Could not read the selected image.");
        };

        reader.readAsDataURL(file);
    });

    /* =========================================
       DEMO BUYING ESTIMATION
    ========================================= */

    function analyze(data) {
        const seasonal = {
            clothing: { spring: 78, summer: 83, autumn: 80, winter: 85 },
            shoes: { spring: 75, summer: 74, autumn: 76, winter: 74 },
            cosmetics: { spring: 76, summer: 78, autumn: 74, winter: 75 },
            electronics: { spring: 70, summer: 72, autumn: 72, winter: 73 },
            home: { spring: 70, summer: 70, autumn: 78, winter: 82 },
            accessories: { spring: 78, summer: 80, autumn: 77, winter: 76 },
            sports: { spring: 83, summer: 78, autumn: 75, winter: 68 },
            grocery: { spring: 79, summer: 79, autumn: 79, winter: 79 },
            books: { spring: 70, summer: 71, autumn: 78, winter: 72 },
            automotive: { spring: 70, summer: 70, autumn: 70, winter: 70 }
        };

        const storeMatches = {
            commercial: [
                "clothing", "shoes", "cosmetics",
                "accessories", "electronics"
            ],
            residential: ["home", "grocery", "clothing", "books"],
            tourist: ["accessories", "clothing", "cosmetics"],
            university: [
                "books", "electronics", "clothing",
                "shoes", "accessories"
            ],
            online: Object.keys(categoryNames)
        };

        const customerMatches = {
            young: ["clothing", "shoes", "sports", "books", "accessories"],
            youngAdults: [
                "clothing", "shoes", "cosmetics",
                "electronics", "accessories", "sports"
            ],
            adults: [
                "clothing", "cosmetics", "electronics", "home", "automotive"
            ],
            families: [
                "clothing", "shoes", "home", "grocery", "books", "sports"
            ],
            all: Object.keys(categoryNames)
        };

        let score = seasonal[data.category]?.[data.arrival] ?? 67;

        const storeFits =
            (storeMatches[data.storeType] || []).includes(data.category);

        const customerFits =
            (customerMatches[data.customers] || []).includes(data.category);

        score += storeFits ? 8 : -5;
        score += customerFits ? 7 : -4;

        score += ({
            strong: 8,
            average: 2,
            weak: -9,
            none: -3
        })[data.pastSales] ?? 0;

        score += ({
            none: 5,
            some: -5,
            high: -13
        })[data.stockLevel] ?? 0;

        score += data.visitors >= 100
            ? 6
            : data.visitors >= 40
                ? 2
                : data.visitors < 15
                    ? -12
                    : -3;

        score = Math.max(25, Math.min(95, Math.round(score)));

        const dailyDemand = Math.max(1, Math.ceil(data.visitors * 0.04));

        let suggested = Math.round(dailyDemand * 21 * (score / 75));

        if (data.pastSales === "strong") {
            suggested = Math.round(suggested * 1.2);
        }

        if (data.pastSales === "weak" || data.pastSales === "none") {
            suggested = Math.round(suggested * 0.65);
        }

        if (data.stockLevel === "some") {
            suggested = Math.round(suggested * 0.75);
        }

        if (data.stockLevel === "high") {
            suggested = Math.round(suggested * 0.45);
        }

        suggested = Math.max(
            1,
            Math.min(data.plannedQty, suggested)
        );

        const marginPct = (
            (data.sellPrice - data.unitCost) / data.sellPrice
        ) * 100;

        const reasons = [];
        const risks = [];

        reasons.push(
            score >= 78
                ? [
                    "ok", "✦", "Seasonal fit",
                    `${categoryNames[data.category]} may fit the selected season.`
                ]
                : [
                    "warn", "◷", "Seasonal uncertainty",
                    "Validate demand around the arrival date before placing a bulk order."
                ]
        );

        reasons.push([
            storeFits ? "ok" : "warn",
            "⌖",
            "Store type",
            `Selected store type: ${data.storeType}.`
        ]);

        reasons.push([
            customerFits ? "ok" : "warn",
            "♙",
            "Target customers",
            `Selected customer group: ${data.customers}.`
        ]);

        reasons.push([
            "ok",
            "↗",
            "Foot traffic",
            `Estimate uses ${data.visitors} visitors per day with an illustrative 4% conversion assumption.`
        ]);

        if (data.stockLevel === "high") {
            risks.push(
                "You already have a lot of similar stock. Avoid duplicating inventory until it sells."
            );
        } else if (data.stockLevel === "some") {
            risks.push(
                "Some similar stock is already available. Review the remaining quantity before ordering."
            );
        }

        if (data.pastSales === "weak" || data.pastSales === "none") {
            risks.push(
                "Past sales are weak or unavailable. Consider a smaller test order."
            );
        }

        if (marginPct < 20) {
            risks.push(
                `Gross margin is about ${marginPct.toFixed(1)}% before shipping, platform fees and other costs.`
            );
        }

        if (data.visitors < 15) {
            risks.push("Low daily traffic may limit the speed of sales.");
        }

        if (risks.length === 0) {
            risks.push(
                "Confirm supplier reliability, delivery costs and existing inventory before purchasing."
            );
        }

        const level = score >= 78
            ? "High"
            : score >= 60
                ? "Moderate"
                : "Low";

        let recommendation;

        if (level === "High") {
            recommendation =
                `Demand indicators look promising. Consider starting with ${suggested} units and review real sales before reordering.`;
        } else if (level === "Moderate") {
            recommendation =
                `Start with a controlled order of around ${suggested} units and monitor sales before reordering.`;
        } else {
            recommendation =
                `Validate demand first. If you proceed, consider testing around ${suggested} units instead of buying the full quantity.`;
        }

        return {
            score,
            level,
            suggested,
            marginPct,
            reasons,
            risks,
            recommendation
        };
    }

    /* =========================================
       DISPLAY RESULTS
    ========================================= */

    function addReason(list, type, icon, title, description) {
        const item = document.createElement("li");
        item.className = type;

        const iconBox = document.createElement("span");
        iconBox.className = "ic";
        iconBox.textContent = icon;

        const content = document.createElement("div");

        const heading = document.createElement("strong");
        heading.textContent = title;

        const paragraph = document.createElement("p");
        paragraph.textContent = description;

        content.append(heading, paragraph);
        item.append(iconBox, content);
        list.appendChild(item);
    }

    function renderResults(data, result) {
        $("resName").textContent = data.productName;
        $("resCategory").textContent =
            categoryNames[data.category] || data.category;
        $("resLocation").textContent = data.location;

        $("demandLevel").textContent = result.level;

        $("demandText").textContent = result.level === "High"
            ? "The selected details indicate a potentially promising fit. Actual sales are not guaranteed."
            : result.level === "Moderate"
                ? "Some indicators are positive, but monitor sales and start carefully."
                : "Validate demand before committing to a large purchase.";

        const demandCard = $("demandCard");

        demandCard.classList.remove("high", "medium", "low");
        demandCard.classList.add(
            result.level === "High"
                ? "high"
                : result.level === "Moderate"
                    ? "medium"
                    : "low"
        );

        $("planQty").textContent = data.plannedQty.toLocaleString();
        $("aiQty").textContent = `${result.suggested.toLocaleString()} units`;
        $("saleProb").textContent = `${result.score}/100`;

        const resultImage = $("resImg");

        resultImage.style.backgroundImage = "";
        resultImage.textContent = "";

        if (imageData) {
            resultImage.style.backgroundImage =
                `url("${imageData}")`;
        } else {
            resultImage.textContent = "📦";
        }

        const whyList = $("whyList");
        whyList.replaceChildren();

        result.reasons.forEach(reason => {
            addReason(
                whyList,
                reason[0],
                reason[1],
                reason[2],
                reason[3]
            );
        });

        result.risks.forEach(risk => {
            addReason(
                whyList,
                "warn",
                "⚠",
                "Risk to consider",
                risk
            );
        });

        const values = [0.48, 0.55, 0.63, 0.72, 0.84, 0.91]
            .map(value => Math.round(value * result.score));

        const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
        const chart = $("chart");

        chart.innerHTML = values.map((value, index) => {
            const height = Math.max(15, value);

            return `
                <div class="bar-wrap">
                    <div
                        class="bar ${index === 4 ? "peak" : ""}"
                        data-height="${height}%">
                        <b>${height}</b>
                    </div>
                    <span>${months[index]}</span>
                </div>
            `;
        }).join("");

        requestAnimationFrame(() => {
            chart.querySelectorAll(".bar").forEach(bar => {
                bar.style.height = bar.dataset.height;
            });
        });

        $("nextStep").textContent = result.recommendation;

        lastReport = {
            createdAt: new Date().toISOString(),
            inputs: {
                ...data,
                image: ""
            },
            result
        };

        window.stockMindLastAdvisorReport = lastReport;

        $("resultsSection").hidden = false;

        goStep(3);
    }

    /* =========================================
       SUBMIT FORM
    ========================================= */

    form.addEventListener("submit", event => {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const data = {
            productName: $("productName").value.trim(),
            unitCost: Number($("unitCost").value),
            sellPrice: Number($("sellPrice").value),
            plannedQty: Math.floor(Number($("plannedQty").value)),
            category: $("category").value,
            location: $("location").value.trim(),
            storeType: $("storeType").value,
            customers: $("customers").value,
            arrival: $("arrival").value,
            pastSales: $("pastSales").value,
            stockLevel: $("stockLevel").value,
            visitors: Number($("visitors").value)
        };

        if (
            !data.productName ||
            !data.location ||
            !Number.isFinite(data.unitCost) ||
            !Number.isFinite(data.sellPrice) ||
            !Number.isFinite(data.plannedQty) ||
            !Number.isFinite(data.visitors) ||
            data.unitCost <= 0 ||
            data.sellPrice <= 0 ||
            data.plannedQty < 1 ||
            data.visitors < 0
        ) {
            alert("Please enter valid product, price, quantity and store details.");
            return;
        }

        if (analysisTimer) {
            clearInterval(analysisTimer);
        }

        goStep(2);

        const checks = [...document.querySelectorAll("#checks li")];
        const progressBar = $("progressBar");

        checks.forEach(check => check.classList.remove("run", "ok"));
        progressBar.style.width = "0%";

        let index = 0;

        analysisTimer = setInterval(() => {
            if (index > 0) {
                checks[index - 1]?.classList.replace("run", "ok");
            }

            if (index < checks.length) {
                checks[index].classList.add("run");

                progressBar.style.width =
                    `${Math.round(((index + 1) / checks.length) * 100)}%`;

                index++;
                return;
            }

            clearInterval(analysisTimer);
            analysisTimer = null;

            try {
                renderResults(data, analyze(data));
            } catch (error) {
                console.error("Analysis failed:", error);
                alert("Analysis failed. Please check the browser console.");
                goStep(1);
            }

        }, 400);
    });

    /* =========================================
       EDIT DETAILS
    ========================================= */

    $("editBtn")?.addEventListener("click", () => {
        goStep(1);
    });

    /* =========================================
       NEW ANALYSIS
    ========================================= */

    $("newBtn")?.addEventListener("click", () => {
        if (analysisTimer) {
            clearInterval(analysisTimer);
            analysisTimer = null;
        }

        form.reset();

        imageData = "";
        lastReport = null;

        $("photoPreview").removeAttribute("src");
        $("photoBox").classList.remove("has-img");

        if (photoInput) {
            photoInput.value = "";
        }

        $("resImg").style.backgroundImage = "";
        $("resImg").textContent = "📦";

        goStep(1);
    });

    /* =========================================
       SAVE ANALYSIS
    ========================================= */

    $("saveBtn")?.addEventListener("click", () => {
        if (!lastReport) {
            alert("Please analyze a product first.");
            return;
        }

        try {
            const existing = JSON.parse(
                localStorage.getItem("stockMindSavedAnalyses") || "[]"
            );

            const reports = Array.isArray(existing) ? existing : [];
            reports.unshift(lastReport);

            localStorage.setItem(
                "stockMindSavedAnalyses",
                JSON.stringify(reports.slice(0, 30))
            );

            localStorage.setItem(
                "stockMindLastAnalysis",
                JSON.stringify(lastReport)
            );

            alert("Analysis saved successfully in this browser.");

        } catch (error) {
            console.error("Could not save analysis:", error);
            alert("Could not save the analysis. Browser storage may be full.");
        }
    });

    /* =========================================
       DOWNLOAD REPORT
    ========================================= */

    $("downloadBtn")?.addEventListener("click", () => {
        if (!lastReport) {
            alert("Please analyze a product first.");
            return;
        }

        const data = lastReport.inputs;
        const result = lastReport.result;

        const lines = [
            "STOCK MIND — BEFORE YOU BUY REPORT",
            `Created: ${lastReport.createdAt}`,
            "",
            "PRODUCT INFORMATION",
            `Product: ${data.productName}`,
            `Category: ${categoryNames[data.category] || data.category}`,
            `Location: ${data.location}`,
            `Unit cost: ${money(data.unitCost)}`,
            `Expected selling price: ${money(data.sellPrice)}`,
            `Planned quantity: ${data.plannedQty}`,
            "",
            "ANALYSIS",
            `Demand level: ${result.level}`,
            `Suitability score: ${result.score}/100`,
            `Suggested starting quantity: ${result.suggested}`,
            `Estimated gross margin: ${result.marginPct.toFixed(1)}%`,
            `Recommendation: ${result.recommendation}`,
            "",
            "FACTORS",
            ...result.reasons.map(reason =>
                `${reason[2]}: ${reason[3]}`
            ),
            "",
            "RISKS",
            ...result.risks.map(risk => `- ${risk}`),
            "",
            "DISCLAIMER",
            "Illustrative demo estimate only. It is not a trained AI forecast, live market data, or a guarantee of sales."
        ];

        const blob = new Blob(
            [lines.join("\n")],
            { type: "text/plain;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "stockmind-before-you-buy-report.txt";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

    /* =========================================
       INITIAL STATE
    ========================================= */

    goStep(1);
});
