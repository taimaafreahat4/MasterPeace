
/* =========================================
   STOCK MIND - BUYER DASHBOARD
========================================= */

const USER_KEY = "stockMindUser";
const ACCOUNT_KEY = "stockMindAccount";
const ORDERS_KEY = "stockMindOrders";

let buyerOrders = [];


/* =========================================
   STORAGE HELPERS
========================================= */

function readStorage(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
        console.error("Unable to read " + key, error);
        return fallback;
    }
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-JO", {
        style: "currency",
        currency: "JOD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}


/* =========================================
   LOAD SHARED NAVBAR AND FOOTER
========================================= */

async function loadSharedComponents() {
    try {
        const response = await fetch("../components/navbar.html");

        if (!response.ok) {
            throw new Error("Navbar file could not be loaded");
        }

        const html = await response.text();
        document.getElementById("navbar").innerHTML = html;

        if (typeof initStockMindNavbar === "function") {
            initStockMindNavbar();
        } else {
            console.warn(
                "initStockMindNavbar() was not found in navbar.js."
            );
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
            throw new Error("Footer file could not be loaded");
        }

        document.getElementById("footer-container").innerHTML =
            await response.text();
    } catch (error) {
        console.error("Footer error:", error);
    }
}


/* =========================================
   CHECK BUYER SESSION
========================================= */

function getLoggedInBuyer() {
    const user = readStorage(USER_KEY);
    const account = readStorage(ACCOUNT_KEY, {});

    if (!user || user.loggedIn !== true) {
        window.location.replace("../login/login.html");
        return null;
    }

    if (String(user.role || "").toLowerCase() !== "buyer") {
        document.querySelector(".dashboard-page").innerHTML = `
            <section class="panel" style="margin-top:30px;text-align:center">
                <h2>Buyer Dashboard</h2>
                <p>This dashboard is available to buyer accounts only.</p>
                <a class="shop-button" href="../category/category.html">
                    Return to Shopping
                </a>
            </section>
        `;
        return null;
    }

    return {
        ...account,
        ...user
    };
}


/* =========================================
   LOAD BUYER NAME
========================================= */

function renderBuyerWelcome(buyer) {
    setText(
        "buyerName",
        buyer.name || buyer.username || "Buyer"
    );
}


/* =========================================
   ORDER DATA HELPERS
========================================= */

function getOrderAmount(order) {
    const value = order.total ?? order.amount ?? order.price ?? 0;
    const amount = Number(value);

    return Number.isFinite(amount) && amount >= 0 ? amount : 0;
}

function getOrderStatus(order) {
    return String(order.status || "Completed").trim();
}

function normalizeStatus(order) {
    const status = getOrderStatus(order).toLowerCase();

    if (
        ["completed", "complete", "delivered", "success", "successful"]
            .includes(status)
    ) {
        return "completed";
    }

    if (["cancelled", "canceled", "refunded"].includes(status)) {
        return "cancelled";
    }

    if (
        ["processing", "shipped", "in progress", "in-progress"]
            .includes(status)
    ) {
        return "processing";
    }

    return "pending";
}

function getOrderDate(order) {
    const rawDate = order.date || order.createdAt || order.created_at;

    if (!rawDate) return null;

    const date = new Date(rawDate);

    return Number.isNaN(date.getTime()) ? null : date;
}

function getOrderId(order, index) {
    return String(
        order.id ||
        order.orderId ||
        `SM-${String(index + 1).padStart(4, "0")}`
    );
}

function getItemCount(order) {
    const items = order.items || order.products;

    if (Array.isArray(items)) {
        return items.reduce((sum, item) => {
            return sum + (Number(item.quantity) || 1);
        }, 0);
    }

    return Number(order.quantity) || 0;
}

function orderBelongsToBuyer(order, buyer) {
    const orderEmail = String(
        order.email || order.userEmail || order.buyerEmail || ""
    ).trim().toLowerCase();

    const orderUserId = String(
        order.userId || order.buyerId || ""
    ).trim();

    const buyerEmail = String(buyer.email || "").trim().toLowerCase();

    const buyerId = String(buyer.id || buyer.userId || "").trim();

    // If the order has an owner, match it to the logged-in buyer.
    if (orderEmail) {
        return Boolean(buyerEmail && orderEmail === buyerEmail);
    }

    if (orderUserId) {
        return Boolean(buyerId && orderUserId === buyerId);
    }

    // Legacy prototype orders without an owner cannot be securely
    // assigned to a specific buyer. Exclude them from this dashboard.
    return false;
}

function loadBuyerOrders(buyer) {
    const orders = readStorage(ORDERS_KEY, []);

    if (!Array.isArray(orders)) {
        console.warn("stockMindOrders must be an array.");
        return [];
    }

    return orders.filter(order => orderBelongsToBuyer(order, buyer));
}


/* =========================================
   STATISTICS
========================================= */

function renderStatistics(orders) {
    const total = orders.reduce(
        (sum, order) => sum + getOrderAmount(order),
        0
    );

    const completed = orders.filter(
        order => normalizeStatus(order) === "completed"
    ).length;

    setText("totalOrders", String(orders.length));
    setText("totalSpent", formatMoney(total));
    setText(
        "averageOrder",
        formatMoney(orders.length ? total / orders.length : 0)
    );
    setText("completedOrders", String(completed));

    setText("statusTotal", String(orders.length));
    setText(
        "statusCompleted",
        String(orders.filter(o => normalizeStatus(o) === "completed").length)
    );
    setText(
        "statusPending",
        String(orders.filter(o => normalizeStatus(o) === "pending").length)
    );
    setText(
        "statusProcessing",
        String(orders.filter(o => normalizeStatus(o) === "processing").length)
    );
    setText(
        "statusCancelled",
        String(orders.filter(o => normalizeStatus(o) === "cancelled").length)
    );
}


/* =========================================
   RECENT ORDERS TABLE
========================================= */

function renderOrders(orders) {
    const tbody = document.getElementById("ordersTableBody");
    const empty = document.getElementById("emptyOrders");
    const tableWrap = document.getElementById("ordersTableWrap");

    tbody.replaceChildren();

    const sorted = orders
        .map((order, index) => ({ order, index }))
        .sort((a, b) => {
            const dateA = getOrderDate(a.order);
            const dateB = getOrderDate(b.order);

            if (dateA && dateB) return dateB - dateA;
            return b.index - a.index;
        })
        .slice(0, 8);

    empty.hidden = orders.length !== 0;
    tableWrap.hidden = orders.length === 0;

    sorted.forEach(({ order, index }) => {
        const row = document.createElement("tr");

        const cells = [
            getOrderId(order, index),
            getOrderDate(order)
                ? getOrderDate(order).toLocaleDateString("en-GB")
                : "—",
            getItemCount(order) || "—",
            formatMoney(getOrderAmount(order))
        ];

        cells.forEach((value, cellIndex) => {
            const cell = document.createElement("td");
            cell.textContent = value;

            if (cellIndex === 0) {
                cell.className = "order-id";
            }

            row.appendChild(cell);
        });

        const statusCell = document.createElement("td");
        const status = normalizeStatus(order);
        const badge = document.createElement("span");

        badge.className = "order-status " + status;
        badge.textContent = getOrderStatus(order);

        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        tbody.appendChild(row);
    });
}


/* =========================================
   MONTHLY SPENDING CHART
========================================= */

function drawSpendingChart(orders) {
    const canvas = document.getElementById("spendingChart");
    if (!canvas) return;

    const wrapper = canvas.parentElement;
    const width = Math.max(wrapper.clientWidth, 260);
    const height = Math.max(wrapper.clientHeight, 200);
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString("en-US", { month: "short" }),
            amount: 0
        });
    }

    orders.forEach(order => {
        if (normalizeStatus(order) === "cancelled") return;

        const date = getOrderDate(order);
        if (!date) return;

        const month = months.find(item =>
            item.year === date.getFullYear() &&
            item.month === date.getMonth()
        );

        if (month) month.amount += getOrderAmount(order);
    });

    const max = Math.max(...months.map(m => m.amount), 1);

    const left = 48;
    const right = 12;
    const top = 20;
    const bottom = 37;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;

    ctx.font = "10px Arial";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
        const y = top + chartHeight * i / 4;
        const value = max * (4 - i) / 4;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(width - right, y);
        ctx.strokeStyle = "#e9eaf2";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#8a93a4";
        ctx.fillText(value.toFixed(0), left - 8, y);
    }

    const points = months.map((month, index) => ({
        x: left + chartWidth * (index + 0.5) / months.length,
        y: top + chartHeight * (1 - month.amount / max),
        label: month.label
    }));

    // Filled area below the spending line.
    const gradient = ctx.createLinearGradient(0, top, 0, height - bottom);
    gradient.addColorStop(0, "rgba(113,53,232,.20)");
    gradient.addColorStop(1, "rgba(113,53,232,.01)");

    ctx.beginPath();

    points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });

    ctx.lineTo(points[points.length - 1].x, height - bottom);
    ctx.lineTo(points[0].x, height - bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Spending line.
    ctx.beginPath();

    points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });

    ctx.strokeStyle = "#7135e8";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();

    // Data points and month labels.
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#7135e8";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = "#7b8498";
        ctx.fillText(point.label, point.x, height - bottom + 12);
    });

    const hasSpending = months.some(month => month.amount > 0);

    setText(
        "chartMessage",
        hasSpending
            ? "Based on your dated, recorded orders."
            : "No dated purchases are recorded for these six months yet."
    );
}


/* =========================================
   SHOPPING ACTIVITY
========================================= */

function renderActivity(orders) {
    const list = document.getElementById("activityList");
    const empty = document.getElementById("emptyActivity");

    list.replaceChildren();

    const recent = orders
        .map((order, index) => ({ order, index }))
        .sort((a, b) => {
            const dateA = getOrderDate(a.order);
            const dateB = getOrderDate(b.order);

            if (dateA && dateB) return dateB - dateA;
            return b.index - a.index;
        })
        .slice(0, 5);

    empty.hidden = recent.length !== 0;

    recent.forEach(({ order, index }) => {
        const status = normalizeStatus(order);
        const date = getOrderDate(order);
        const id = getOrderId(order, index);

        const item = document.createElement("article");
        item.className = "activity-item";

        const icon = document.createElement("div");
        icon.className = "activity-icon";
        icon.textContent = status === "completed" ? "✓" : "▤";

        const content = document.createElement("div");
        content.className = "activity-content";

        const heading = document.createElement("h3");
        heading.textContent = `Order ${id} — ${getOrderStatus(order)}`;

        const description = document.createElement("p");
        description.textContent =
            `${getItemCount(order) || 0} item(s) · ${formatMoney(getOrderAmount(order))}`;

        const dateText = document.createElement("span");
        dateText.className = "activity-date";
        dateText.textContent = date
            ? date.toLocaleDateString("en-GB")
            : "Date not recorded";

        content.append(heading, description);
        item.append(icon, content, dateText);
        list.appendChild(item);
    });
}


/* =========================================
   REFRESH DASHBOARD
========================================= */

function refreshDashboard(buyer) {
    buyerOrders = loadBuyerOrders(buyer);

    renderStatistics(buyerOrders);
    renderOrders(buyerOrders);
    renderActivity(buyerOrders);
    drawSpendingChart(buyerOrders);
}


/* =========================================
   START
========================================= */

async function initBuyerDashboard() {
    await loadSharedComponents();

    const buyer = getLoggedInBuyer();
    if (!buyer) return;

    renderBuyerWelcome(buyer);
    refreshDashboard(buyer);

    window.addEventListener("resize", () => {
        drawSpendingChart(buyerOrders);
    });

    window.addEventListener("storage", event => {
        if (
            event.key === ORDERS_KEY ||
            event.key === USER_KEY ||
            event.key === ACCOUNT_KEY
        ) {
            const updatedBuyer = getLoggedInBuyer();

            if (updatedBuyer) {
                renderBuyerWelcome(updatedBuyer);
                refreshDashboard(updatedBuyer);
            }
        }
    });
}

initBuyerDashboard();
