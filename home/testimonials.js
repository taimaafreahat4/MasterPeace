(function () {
    "use strict";

    /* ====== الآراء: عدّل أو ضيف زي ما بدك (خلّيهم 6 عشان القوس يطلع حلو) ====== */
    const REVIEWS = [
        { name: "Sarah Ahmed",   role: "Retail Store Owner",   img: "https://i.pravatar.cc/100?img=47", chip: "-38% dead stock",
          text: "StockMind helped me avoid a huge loss. The AI recommendations are incredibly accurate." },
        { name: "Mohammed Ali",  role: "Online Store Owner",   img: "https://i.pravatar.cc/100?img=12", chip: "Smarter buying",
          text: "I finally know what to buy and when. The demand prediction feature is a game changer." },
        { name: "Lina Hassan",   role: "Small Business Owner", img: "https://i.pravatar.cc/100?img=32", chip: "Sold 2x faster",
          text: "The marketplace is amazing! I found great deals and sold my excess stock quickly." },
        { name: "Omar Khalil",   role: "Wholesale Merchant",   img: "https://i.pravatar.cc/100?img=15", chip: "+27% profit",
          text: "Before every big order I check StockMind first. It saved me from buying the wrong products." },
        { name: "Rania Saleh",   role: "Cosmetics Seller",     img: "https://i.pravatar.cc/100?img=5",  chip: "-45% old stock",
          text: "The recommendations for clearing old stock worked from the first week. Highly recommended." },
        { name: "Yousef Haddad", role: "Electronics Retailer", img: "https://i.pravatar.cc/100?img=33", chip: "Fewer losses",
          text: "Location and season analysis is spot on. My shelves are finally full of products that sell." }
    ];

    const stage   = document.getElementById("tStage");
    const track   = document.getElementById("tTrack");
    const dotsBox = document.getElementById("tDots");
    if (!stage || !track || !dotsBox) return;

    /* بناء الكاردات */
    track.innerHTML = REVIEWS.map(r => `
        <article class="t-card">
            <div class="t-quote"><i class="fa-solid fa-quote-right"></i></div>
            <div class="t-user">
                <img class="t-avatar" src="${r.img}" alt="${r.name}" draggable="false">
                <div>
                    <h4 class="t-name">${r.name}</h4>
                    <span class="t-role">${r.role}</span>
                </div>
            </div>
            <p class="t-text">“${r.text}”</p>
            <div class="t-foot">
                <div class="t-stars">★★★★★</div>
                <span class="t-chip">${r.chip}</span>
            </div>
        </article>`).join("");

    const cards = Array.from(track.children);
    const n = cards.length;

    /* ====== إعدادات الحركة ====== */
    const STEP   = 0.36;   // المسافة بين الكاردات على القوس (أكبر = قوس أوسع)
    const RADIUS = 600;    // نصف قطر الدائرة
    const DELAY  = 3200;   // كل كم ملي ثانية يتحرك تلقائي
    const EASE   = 0.075;  // نعومة الحركة (أقل = أبطأ وأنعم)
    const DRAG   = 240;    // حساسية السحب

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let pos = 0, target = 0, spread = 0, spreadTarget = 0;
    let visible = false, hovering = false, dragging = false;
    let startX = 0, startPos = 0, moved = 0, activeIdx = -1, timer = null;

    const wrap = d => ((d + n / 2) % n + n) % n - n / 2;

    /* النقاط */
    const dots = REVIEWS.map((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Review " + (i + 1));
        b.addEventListener("click", () => {
            const base = Math.round(target);
            goTo(base + wrap(i - base));
        });
        dotsBox.appendChild(b);
        return b;
    });

    function goTo(t) { target = t; restart(); }

    function restart() {
        clearInterval(timer);
        if (reduceMotion) return;
        timer = setInterval(() => {
            if (visible && !hovering && !dragging) target = Math.round(target) + 1;
        }, DELAY);
    }

    /* الأسهم */
    document.getElementById("tPrev").addEventListener("click", () => goTo(Math.round(target) - 1));
    document.getElementById("tNext").addEventListener("click", () => goTo(Math.round(target) + 1));

    /* ضغطة على كارد جانبي بجيبه للنص */
    cards.forEach((card, i) => card.addEventListener("click", () => {
        if (moved > 6) return;
        const base = Math.round(target);
        const d = wrap(i - base);
        if (d !== 0) goTo(base + d);
    }));

    /* وقف عند وقوف الماوس (احذف السطرين إذا بدك ما يوقف أبداً) */
    stage.addEventListener("mouseenter", () => hovering = true);
    stage.addEventListener("mouseleave", () => hovering = false);

    /* السحب بالماوس / اللمس */
    stage.addEventListener("pointerdown", e => {
        if (e.target.closest(".t-arrow")) return;
        dragging = true;
        startX = e.clientX;
        startPos = pos;
        moved = 0;
        stage.classList.add("dragging");
    });

    window.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        pos = startPos - dx / DRAG;
        target = pos;
    });

    window.addEventListener("pointerup", () => {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove("dragging");
        target = Math.round(pos);
        restart();
    });

    /* بس يتحرك لما القسم ظاهر على الشاشة */
    new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible) spreadTarget = 1;      // أول مرة: الكاردات بتنفرد على القوس
    }, { threshold: 0.25 }).observe(stage);

    /* الرسم */
    function render(t) {
        const kx = Math.min(1, stage.clientWidth / 1180);
        let nearest = 0, best = 99;

        for (let i = 0; i < n; i++) {
            const d  = wrap(i - pos);
            const ad = Math.abs(d);
            const a  = d * STEP * spread;

            const x     = Math.sin(a) * RADIUS * kx;
            const y     = (1 - Math.cos(a)) * RADIUS;
            const rot   = a * 40.1;
            const scale = 1 - Math.min(ad, 2.6) * 0.115 * spread;
            const bob   = reduceMotion ? 0 : Math.sin(t / 650 + i * 1.7) * 6 * Math.max(0, 1 - ad);
            const fade  = Math.max(0, Math.min(1, (2.6 - ad) / 0.8)) * (1 - 0.16 * Math.min(ad, 2));

            const c = cards[i];
            c.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
            c.style.opacity = (fade * Math.min(1, spread * 2)).toFixed(3);
            c.style.zIndex = 100 - Math.round(ad * 10);
            c.style.pointerEvents = ad > 2.4 ? "none" : "auto";

            if (ad < best) { best = ad; nearest = i; }
        }

        if (nearest !== activeIdx) {
            activeIdx = nearest;
            cards.forEach((c, i) => c.classList.toggle("active", i === nearest));
            dots.forEach((d, i) => d.classList.toggle("active", i === nearest));
        }
    }

    function frame(t) {
        if (visible) {
            if (!dragging) pos += (target - pos) * EASE;
            spread += (spreadTarget - spread) * 0.06;
            render(t);
        }
        requestAnimationFrame(frame);
    }

    render(0);
    restart();
    requestAnimationFrame(frame);
})();