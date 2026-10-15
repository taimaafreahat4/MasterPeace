/* =====================================================
   STOCK MIND — LOGIN
===================================================== */

let role = "Buyer";

const body       = document.body;
const buyer      = document.getElementById("buyerRole");
const seller     = document.getElementById("sellerRole");
const admin      = document.getElementById("adminRole");
const title      = document.getElementById("loginType");
const rolesBox   = document.getElementById("roles");
const loginForm  = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const loginBtn   = document.getElementById("loginBtn");
const errorBox   = document.getElementById("formError");
const card       = document.getElementById("loginCard");
const cardWrap   = document.getElementById("cardWrap");
const heroBox    = document.getElementById("heroBox");


/* =====================================================
   ROLE SELECT  (Buyer / Seller / Admin)
===================================================== */

const ROLE_BTN   = { Buyer: buyer, Seller: seller, Admin: admin };
const ROLE_INDEX = { Buyer: 0, Seller: 1, Admin: 2 };

function setRole(newRole, animate = true) {

    role = newRole;

    Object.values(ROLE_BTN).forEach(b => b.classList.remove("active"));
    ROLE_BTN[newRole].classList.add("active");

    rolesBox.style.setProperty("--i", ROLE_INDEX[newRole]);

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
admin.addEventListener("click",  () => setRole("Admin"));

/* role coming from the home page (?role=buyer or localStorage) */

(function initRole() {

    const params    = new URLSearchParams(window.location.search);
    const fromUrl   = params.get("role");
    const fromStore = localStorage.getItem("requestedRole");

    const wanted = (fromUrl || fromStore || "").toLowerCase();

    if (wanted === "seller")      setRole("Seller", false);
    else if (wanted === "admin")  setRole("Admin", false);
    else if (wanted === "buyer")  setRole("Buyer", false);

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
   LOGIN  (same logic as before)
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
    "../admin/dashboard/dashboard.html";
}

         else if (isSeller) {

            window.location.href =
            "../seller/add-product.html";


        } else {

            window.location.href =
            "../category/category.html";

        }


    }, 1900);


});


/* =====================================================
   3D TILT (card) + MOUSE LIGHT   (only after intro)
===================================================== */

const canHover = window.matchMedia("(hover:hover)").matches;

if (canHover) {

    document.addEventListener("mousemove", e => {

        if (!body.classList.contains("done")) return;

        const r = cardWrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const dx = (e.clientX - cx) / (window.innerWidth / 2);
        const dy = (e.clientY - cy) / (window.innerHeight / 2);

        card.style.transform =
            `perspective(1200px) rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg)`;

        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");

    });

    document.addEventListener("mouseleave", () => {
        card.style.transform = "";
    });

}


/* =====================================================
   BACKGROUND BOXES ON THE CONVEYOR BELTS
===================================================== */

const PALETTE = [
    ["#8f63ff", "#5b2bd1", "#3d1a96"],
    ["#7c86ff", "#4a52d6", "#2f3699"],
    ["#b06bff", "#7e22ce", "#561596"],
    ["#5b9bff", "#2c63d8", "#1d44a3"],
    ["#9b6bff", "#6234c9", "#43208f"]
];

function rand(a, b) { return a + Math.random() * (b - a); }

function makeBox(lane, opts) {

    const [c1, c2, c3] = PALETTE[Math.floor(Math.random() * PALETTE.length)];

    const el = document.createElement("div");
    el.className = "cbox" + (opts.cls ? " " + opts.cls : "");

    el.style.setProperty("--s", opts.size + "px");
    el.style.setProperty("--h", Math.round(opts.size * opts.ratio) + "px");
    el.style.setProperty("--c1", c1);
    el.style.setProperty("--c2", c2);
    el.style.setProperty("--c3", c3);
    el.style.setProperty("--dur", opts.dur + "s");
    el.style.setProperty("--delay", opts.delay + "s");

    el.innerHTML = '<div class="cin"><i class="cf cf-front"></i><i class="cf cf-right"></i><i class="cf cf-top"></i></div>';

    lane.appendChild(el);
}

(function buildLanes() {

    const near = document.getElementById("nearLane");
    const far  = document.getElementById("farLane");

    /* boxes that rush past before the big box arrives */
    [[112, .78, 0], [90, .8, .22], [126, .76, .5]].forEach(([size, ratio, delay]) => {
        makeBox(near, { size, ratio, dur: 1.9, delay, cls: "pass" });
    });

    /* boxes that keep moving on the belt after the intro */
    const loopLane = document.createElement("div");
    loopLane.className = "near-lane loop-lane";
    near.parentNode.appendChild(loopLane);

    const DUR = 16, COUNT = 6;
    for (let i = 0; i < COUNT; i++) {
        makeBox(loopLane, {
            size: Math.round(rand(88, 128)),
            ratio: rand(.7, .85),
            dur: DUR,
            delay: -(i * DUR / COUNT + rand(0, 1.2)).toFixed(2)
        });
    }

    /* far belt (smaller, other direction) */
    const FDUR = 30, FCOUNT = 8;
    for (let i = 0; i < FCOUNT; i++) {
        makeBox(far, {
            size: Math.round(rand(40, 62)),
            ratio: rand(.7, .85),
            dur: FDUR,
            delay: -(i * FDUR / FCOUNT + rand(0, 1.5)).toFixed(2),
            cls: "rev"
        });
    }

})();


/* =====================================================
   PARTICLE NETWORK BACKGROUND
===================================================== */

(function particles() {

    const canvas = document.getElementById("bgCanvas");
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");

    let dots = [];
    const mouse = { x: -999, y: -999 };

    function resize() {

        const dpr = window.devicePixelRatio || 1;

        canvas.width  = window.innerWidth  * dpr;
        canvas.height = window.innerHeight * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const count = Math.min(70, Math.floor(window.innerWidth / 22));

        dots = Array.from({ length: count }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight * .75,
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

            if (a.x < 0 || a.x > window.innerWidth)        a.vx *= -1;
            if (a.y < 0 || a.y > window.innerHeight * .75) a.vy *= -1;

            const mdx = a.x - mouse.x;
            const mdy = a.y - mouse.y;
            const md  = Math.hypot(mdx, mdy);

            if (md < 120) {
                a.x += (mdx / md) * 1.2;
                a.y += (mdy / md) * 1.2;
            }

            ctx.beginPath();
            ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(196,170,255,.7)";
            ctx.fill();

            for (let j = i + 1; j < dots.length; j++) {

                const b = dots[j];
                const d = Math.hypot(a.x - b.x, a.y - b.y);

                if (d < 130) {
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(168,139,250,${(1 - d / 130) * .28})`;
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


/* =====================================================
   CONFETTI BURST
===================================================== */

const fx   = document.getElementById("fxCanvas");
const fctx = fx.getContext("2d");

let confetti = [];
let fxRunning = false;

function sizeFx() {
    const dpr = window.devicePixelRatio || 1;
    fx.width  = window.innerWidth  * dpr;
    fx.height = window.innerHeight * dpr;
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeFx();
window.addEventListener("resize", sizeFx);

function burst() {

    const r = heroBox.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height * .12;

    const colors = ["#7c3aed", "#a855f7", "#c084fc", "#38bdf8", "#ffffff", "#fbbf24", "#f472b6"];

    for (let i = 0; i < 130; i++) {

        const a  = -Math.PI / 2 + (Math.random() - .5) * 1.7;
        const sp = 6 + Math.random() * 12;

        confetti.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: .22 + Math.random() * .14,
            w: 5 + Math.random() * 7,
            h: 3 + Math.random() * 5,
            rot: Math.random() * 6,
            vr: (Math.random() - .5) * .4,
            c: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            max: 90 + Math.random() * 70,
            round: Math.random() < .3
        });

    }

    if (!fxRunning) {
        fxRunning = true;
        requestAnimationFrame(fxLoop);
    }

}

function fxLoop() {

    fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    confetti = confetti.filter(p => p.life < p.max);

    confetti.forEach(p => {

        p.life++;
        p.vx *= .992;
        p.vy += p.g;
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.vr;

        fctx.save();
        fctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        fctx.translate(p.x, p.y);
        fctx.rotate(p.rot);
        fctx.fillStyle = p.c;

        if (p.round) {
            fctx.beginPath();
            fctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            fctx.fill();
        } else {
            fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }

        fctx.restore();

    });

    if (confetti.length) {
        requestAnimationFrame(fxLoop);
    } else {
        fxRunning = false;
        fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

}


/* =====================================================
   INTRO TIMELINE
   box arrives → shakes → opens → form pops out → done
===================================================== */

let timers = [];

function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

function finish(instant) {

    timers.forEach(clearTimeout);
    timers = [];

    body.classList.remove("shake");
    body.classList.remove("belt-paused");

    if (instant) body.classList.add("skipped");

    body.classList.add("done");

    emailInput.focus({ preventScroll: true });

}

function runIntro() {

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finish(true);
        return;
    }

    at(2250, () => { body.classList.add("belt-paused", "shake"); });   // box stops + rattles

    at(3050, () => {                                                   // lid opens
        body.classList.remove("shake");
        body.classList.add("open");
    });

    at(3800, () => {                                                   // form pops out
        body.classList.add("emerge");
        burst();
    });

    at(5700, () => finish(false));                                     // interactive

}

document.getElementById("skipBtn").addEventListener("click", () => finish(true));

document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !body.classList.contains("done")) finish(true);
});

document.getElementById("replayBtn").addEventListener("click", () => location.reload());

runIntro();