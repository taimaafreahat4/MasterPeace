/* =====================================================
   STOCK MIND — LOGIN
===================================================== */

let role = "Buyer";

const buyer      = document.getElementById("buyerRole");
const seller     = document.getElementById("sellerRole");
const title      = document.getElementById("loginType");
const rolesBox   = document.querySelector(".roles");
const loginForm  = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const loginBtn   = document.getElementById("loginBtn");
const errorBox   = document.getElementById("formError");
const card       = document.getElementById("loginCard");
const cardWrap   = document.getElementById("cardWrap");


/* =====================================================
   ROLE SELECT
===================================================== */

function setRole(newRole, animate = true) {

    role = newRole;


    
    const isSeller = newRole === "Seller";

    buyer.classList.toggle("active", !isSeller);
    seller.classList.toggle("active", isSeller);
    rolesBox.classList.toggle("seller", isSeller);

    const text = "Login as " + newRole;

    if (!animate) {
        title.textContent = text;
        return;
    }

    title.classList.add("swap");
    setTimeout(() => {
        title.textContent = text;
        title.classList.remove("swap");
    }, 200);
}

buyer.addEventListener("click",  () => setRole("Buyer"));
seller.addEventListener("click", () => setRole("Seller"));

/* role coming from the home page (?role=buyer or localStorage) */

(function initRole() {

    const params    = new URLSearchParams(window.location.search);
    const fromUrl   = params.get("role");
    const fromStore = localStorage.getItem("requestedRole");

    const wanted = (fromUrl || fromStore || "").toLowerCase();

    if (wanted === "seller") setRole("Seller", false);
    else if (wanted === "buyer") setRole("Buyer", false);

    if (fromStore) localStorage.removeItem("requestedRole");

})();


/* =====================================================
   SHOW / HIDE PASSWORD
===================================================== */

const showPassword = document.getElementById("showPassword");

showPassword.addEventListener("click", () => {

    const hidden = passInput.type === "password";

    passInput.type = hidden ? "text" : "password";
    showPassword.classList.toggle("on", hidden);

});


/* =====================================================
   ERROR + SHAKE
===================================================== */

function showError(message) {

    errorBox.textContent = message;
    errorBox.classList.add("show");

    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");

}

function clearError() {
    errorBox.classList.remove("show");
}

emailInput.addEventListener("input", clearError);
passInput.addEventListener("input", clearError);


/* =====================================================
   DEMO ACCOUNTS (quick fill)
===================================================== */

document.querySelectorAll("[data-demo]").forEach(btn => {

    btn.addEventListener("click", () => {

        const type = btn.dataset.demo;

        if (type === "seller") {
            setRole("Seller");
            emailInput.value = "seller@stockmind.com";
            passInput.value  = "Seller123";
        } else {
            setRole("Buyer");
            emailInput.value = "buyer@stockmind.com";
            passInput.value  = "Buyer123";
        }

        clearError();

    });

});


/* =====================================================
   BUTTON RIPPLE
===================================================== */

loginBtn.addEventListener("click", e => {

    const rect = loginBtn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top  = (e.clientY - rect.top  - size / 2) + "px";

    loginBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

});


/* =====================================================
   LOGIN
===================================================== */
loginForm.addEventListener("submit", e => {

    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
        showError("Please enter your email and password.");
        return;
    }


    let account = null;

    try {
        account = JSON.parse(localStorage.getItem("stockMindAccount"));
    } catch {
        account = null;
    }


    const emailLower = email.toLowerCase();


    const isDefaultSeller =
        emailLower === "seller@stockmind.com" &&
        password === "Seller123";


    const isDefaultBuyer =
        emailLower === "buyer@stockmind.com" &&
        password === "Buyer123";


    const isDefaultAdmin =
        emailLower === "admin@stockmind.com" &&
        password === "StockMindAdmin123";


    if (
        !account ||
        !account.email ||
        account.email.toLowerCase() !== emailLower ||
        account.password !== password
    ) {


        if (isDefaultAdmin) {

            account = {
                name: "Stock Mind Admin",
                username: "admin",
                email: "admin@stockmind.com",
                password: "StockMindAdmin123",
                role: "Admin",
                image: ""
            };


        } else if (isDefaultSeller) {

            account = {
                name: "Default Seller",
                username: "seller@stockmind.com",
                email: "seller@stockmind.com",
                password: "Seller123",
                role: "Seller",
                image: ""
            };


        } else if (isDefaultBuyer) {

            account = {
                name: "Default Buyer",
                username: "buyer@stockmind.com",
                email: "buyer@stockmind.com",
                password: "Buyer123",
                role: "Buyer",
                image: ""
            };


        } else {

            showError("Invalid email or password.");
            return;

        }

    }


    const userRole = String(account.role).toLowerCase();


    // السماح للـ Admin بالدخول دائماً
    if (
        userRole !== "admin" &&
        userRole !== role.toLowerCase()
    ) {
        showError("You cannot login with this role.");
        return;
    }


    const loggedInUser = {
        ...account,
        loggedIn: true
    };


    localStorage.setItem(
        "stockMindUser",
        JSON.stringify(loggedInUser)
    );


    loginBtn.classList.add("loading");


    const isSeller = userRole === "seller";
    const isAdmin = userRole === "admin";


    setTimeout(() => {

        document.getElementById("success").classList.add("show");


        document.getElementById("successText").textContent =
            isAdmin
            ? "Taking you to admin dashboard..."
            : isSeller
            ? "Taking you to your seller dashboard..."
            : "Taking you to the marketplace...";


    }, 600);



    setTimeout(() => {


        if (isAdmin) {

            window.location.href =
            "../admin/dashboard.html";


        } else if (isSeller) {

            window.location.href =
            "../seller/add-product.html";


        } else {

            window.location.href =
            "../category/category.html";

        }


    }, 1900);


});

/* =====================================================
   COUNT-UP NUMBERS
===================================================== */

document.querySelectorAll(".count").forEach(el => {

    const to     = +el.dataset.to;
    const suffix = el.dataset.suffix || "";
    const delay  = 1700;
    const dur    = 1600;

    setTimeout(() => {

        const start = performance.now();

        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(to * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);

    }, delay);

});


/* =====================================================
   3D TILT (card + dashboard) + MOUSE LIGHT
===================================================== */

const canHover = window.matchMedia("(hover:hover)").matches;

if (canHover) {

    document.addEventListener("mousemove", e => {

        /* login card */
        const r = cardWrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const dx = (e.clientX - cx) / (window.innerWidth / 2);
        const dy = (e.clientY - cy) / (window.innerHeight / 2);

        card.style.transform =
            `rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg)`;

        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");

        /* dashboard */
        const dash = document.getElementById("dash");

        if (dash) {
            const d = dash.getBoundingClientRect();
            const ddx = (e.clientX - (d.left + d.width / 2)) / window.innerWidth;
            const ddy = (e.clientY - (d.top + d.height / 2)) / window.innerHeight;
            dash.style.transform =
                `perspective(900px) rotateY(${ddx * 14}deg) rotateX(${-ddy * 14}deg)`;
        }

    });

    document.addEventListener("mouseleave", () => {
        card.style.transform = "";
        const dash = document.getElementById("dash");
        if (dash) dash.style.transform = "";
    });

}


/* =====================================================
   PARTICLE NETWORK BACKGROUND
===================================================== */

(function particles() {

    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");

    let w, h, dots = [];
    const mouse = { x: -999, y: -999 };

    function resize() {

        const dpr = window.devicePixelRatio || 1;

        w = canvas.width  = window.innerWidth  * dpr;
        h = canvas.height = window.innerHeight * dpr;

        canvas.style.width  = window.innerWidth  + "px";
        canvas.style.height = window.innerHeight + "px";

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(80, Math.floor(window.innerWidth / 18));

        dots = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - .5) * .35,
            vy: (Math.random() - .5) * .35,
            r: Math.random() * 2 + 1
        }));

    }

    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function draw() {

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = 0; i < dots.length; i++) {

            const a = dots[i];

            a.x += a.vx;
            a.y += a.vy;

            if (a.x < 0 || a.x > window.innerWidth)  a.vx *= -1;
            if (a.y < 0 || a.y > window.innerHeight) a.vy *= -1;

            /* gentle push away from the mouse */
            const mdx = a.x - mouse.x;
            const mdy = a.y - mouse.y;
            const md  = Math.hypot(mdx, mdy);

            if (md < 120) {
                a.x += (mdx / md) * 1.2;
                a.y += (mdy / md) * 1.2;
            }

            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(113,53,232,.55)";
            ctx.fill();

            for (let j = i + 1; j < dots.length; j++) {

                const b = dots[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);

                if (d < 130) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(113,53,232,${(1 - d / 130) * .22})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

            }

        }

        requestAnimationFrame(draw);

    }

    resize();
    draw();

})();
