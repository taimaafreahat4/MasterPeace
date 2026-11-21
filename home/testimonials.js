(() => {
    "use strict";

    const featuredReviews = [
        {id:"featured-yousef",name:"Yousef Haddad",role:"Electronics Retailer",text:"Location and season analysis helps me spot what customers need. My shelves are finally stocked with products that sell.",rating:5,tag:"Fewer losses"},
        {id:"featured-sarah",name:"Sarah Ahmed",role:"Retail Store Owner",text:"Stock Mind helped me avoid costly overstocking. The recommendations make it easier to choose the right products.",rating:5,tag:"Smarter buying"},
        {id:"featured-mohammed",name:"Mohammed Ali",role:"Online Store Owner",text:"I finally know what to buy and when. The demand prediction feature is a game changer.",rating:5,tag:"Smarter buying"},
        {id:"featured-lina",name:"Lina Hassan",role:"Small Business Owner",text:"The marketplace is amazing. I found great deals and moved surplus stock much faster.",rating:5,tag:"Faster selling"},
        {id:"featured-omar",name:"Omar Khalil",role:"Wholesale Merchant",text:"Before every big order, I check Stock Mind. It has helped me make more confident buying decisions.",rating:5,tag:"Better decisions"}
    ];

    const readReviews = () => {
        try {
            const entries = ["stockMindFeedbacks","stockMindSiteFeedback"].flatMap(key => {
                const value = JSON.parse(localStorage.getItem(key) || "[]");
                return Array.isArray(value) ? value : [];
            });
            const unique = [...new Map(entries
                .filter(item => item && item.approvalStatus === "approved" && item.showOnHome === true)
                .map((item, index) => [String(item.id || item.orderId || `approved-${index}`),item])).values()];
            const approved = unique
                .filter(item => item && item.approvalStatus === "approved" && item.showOnHome === true)
                .map(item => ({
                    id: String(item.id || item.orderId || ""),
                    name: String(item.name || "Stock Mind member").trim(),
                    role: String(item.role || (item.source === "order" ? "Verified order" : "Merchant feedback")),
                    text: String(item.review || item.message || "").trim(),
                    rating: Math.max(0, Math.min(5, Number(item.rating) || 0)),
                    category: String(item.category || ""),
                    tag: String(item.tag || "")
                }))
                .filter(item => item.text.length >= 5 || item.rating > 0)
                .map(item => ({...item, text:item.text || `Rated this experience ${item.rating} out of 5 stars.`}));
            return [...featuredReviews, ...approved.filter(item => !featuredReviews.some(featured => featured.id === item.id))]
        } catch {
            return featuredReviews;
        }
    };

    const publicReviewSignature = raw => {
        try {
            const items = JSON.parse(raw || "[]");
            if (!Array.isArray(items)) return "";
            return items.filter(item => item?.approvalStatus === "approved" && item.showOnHome === true)
                .map(item => String(item.id || item.orderId || ""))
                .sort().join("|");
        } catch { return ""; }
    };
    window.addEventListener("storage", event => {
        if (["stockMindFeedbacks","stockMindSiteFeedback"].includes(event.key) && publicReviewSignature(event.oldValue) !== publicReviewSignature(event.newValue)) {
            window.location.reload();
        }
    });

    const stage = document.getElementById("tStage");
    const track = document.getElementById("tTrack");
    const dotsBox = document.getElementById("tDots");
    if (!stage || !track || !dotsBox) return;

    const reviews = readReviews();
    const subtitle = document.querySelector("#testimonials .section-subtitle");
    if (subtitle) subtitle.textContent = "Real experiences from Stock Mind merchants and customers.";

    const hideControls = () => {
        stage.querySelectorAll(".t-arrow, .t-arc").forEach(control => { control.hidden = true; });
        dotsBox.hidden = true;
    };

    const createCard = review => {
        const card = document.createElement("article");
        card.className = "t-card";

        const quote = document.createElement("div");
        quote.className = "t-quote";
        quote.setAttribute("aria-hidden", "true");
        quote.textContent = "“";

        const user = document.createElement("div");
        user.className = "t-user";
        const avatar = document.createElement("div");
        avatar.className = "t-avatar t-avatar-initials";
        avatar.setAttribute("aria-hidden", "true");
        avatar.textContent = review.name.split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase();
        const identity = document.createElement("div");
        const name = document.createElement("h3");
        name.className = "t-name";
        name.textContent = review.name;
        const role = document.createElement("span");
        role.className = "t-role";
        role.textContent = review.role;
        identity.append(name, role);
        user.append(avatar, identity);

        const text = document.createElement("p");
        text.className = "t-text";
        text.textContent = `“${review.text}”`;

        const foot = document.createElement("div");
        foot.className = "t-foot";
        if (review.rating) {
            const stars = document.createElement("div");
            stars.className = "t-stars";
            stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
            stars.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
            foot.appendChild(stars);
        } else {
            const approved = document.createElement("span");
            approved.className = "t-verified-label";
            approved.textContent = "Approved feedback";
            foot.appendChild(approved);
        }
        const chip = document.createElement("span");
        chip.className = "t-chip";
        chip.textContent = review.tag || (review.category === "selling-experience" ? "Selling experience" :
            review.category === "buying-experience" ? "Buying experience" :
            review.id.startsWith("SM-") ? "Order experience" : "Merchant feedback");
        foot.appendChild(chip);

        card.append(quote, user, text, foot);
        return card;
    };

    track.replaceChildren(...reviews.map(createCard));

    const cards = Array.from(track.children);
    const count = cards.length;
    const STEP = 0.36;
    const RADIUS = 600;
    const DELAY = 4200;
    const EASE = 0.075;
    const DRAG = 240;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let pos = 0, target = 0, spread = 0, spreadTarget = 0;
    let visible = false, hovering = false, dragging = false;
    let startX = 0, startPos = 0, moved = 0, activeIdx = -1, timer = null;
    const wrap = d => ((d + count / 2) % count + count) % count - count / 2;

    const dots = reviews.map((review, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", `Show feedback ${i + 1} by ${review.name}`);
        button.addEventListener("click", () => {
            const base = Math.round(target);
            target = base + wrap(i - base);
            restart();
        });
        dotsBox.appendChild(button);
        return button;
    });

    function restart() {
        clearInterval(timer);
        if (reduceMotion || count < 2) return;
        timer = setInterval(() => {
            if (visible && !hovering && !dragging) target = Math.round(target) + 1;
        }, DELAY);
    }

    document.getElementById("tPrev")?.addEventListener("click", () => { target = Math.round(target) - 1; restart(); });
    document.getElementById("tNext")?.addEventListener("click", () => { target = Math.round(target) + 1; restart(); });
    if (count < 2) hideControls();

    cards.forEach((card, i) => card.addEventListener("click", () => {
        if (moved > 6) return;
        const base = Math.round(target);
        const distance = wrap(i - base);
        if (distance !== 0) { target = base + distance; restart(); }
    }));
    stage.addEventListener("mouseenter", () => { hovering = true; });
    stage.addEventListener("mouseleave", () => { hovering = false; });
    stage.addEventListener("pointerdown", event => {
        if (event.target.closest(".t-arrow") || count < 2) return;
        dragging = true; startX = event.clientX; startPos = pos; moved = 0;
        stage.classList.add("dragging");
    });
    window.addEventListener("pointermove", event => {
        if (!dragging) return;
        const dx = event.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));
        pos = startPos - dx / DRAG;
        target = pos;
    });
    window.addEventListener("pointerup", () => {
        if (!dragging) return;
        dragging = false; stage.classList.remove("dragging"); target = Math.round(pos); restart();
    });

    const reveal = entries => {
        visible = entries[0].isIntersecting;
        if (visible) spreadTarget = 1;
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(reveal, { threshold: 0.25 }).observe(stage);
    else { visible = true; spreadTarget = 1; }

    function render(time) {
        const kx = Math.min(1, stage.clientWidth / 1180);
        let nearest = 0, best = Infinity;
        for (let i = 0; i < count; i++) {
            const distance = wrap(i - pos);
            const absDistance = Math.abs(distance);
            const angle = distance * STEP * spread;
            const x = Math.sin(angle) * RADIUS * kx;
            const y = (1 - Math.cos(angle)) * RADIUS;
            const rotation = angle * 40.1;
            const scale = 1 - Math.min(absDistance, 2.6) * 0.115 * spread;
            const bob = reduceMotion ? 0 : Math.sin(time / 650 + i * 1.7) * 6 * Math.max(0, 1 - absDistance);
            const fade = Math.max(0, Math.min(1, (2.6 - absDistance) / 0.8)) * (1 - 0.16 * Math.min(absDistance, 2));
            cards[i].style.transform = `translate3d(${x.toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
            cards[i].style.opacity = (fade * Math.min(1, spread * 2)).toFixed(3);
            cards[i].style.zIndex = 100 - Math.round(absDistance * 10);
            cards[i].style.pointerEvents = absDistance > 2.4 ? "none" : "auto";
            if (absDistance < best) { best = absDistance; nearest = i; }
        }
        if (nearest !== activeIdx) {
            activeIdx = nearest;
            cards.forEach((card, i) => card.classList.toggle("active", i === nearest));
            dots.forEach((dot, i) => dot.classList.toggle("active", i === nearest));
        }
    }

    function frame(time) {
        if (visible) {
            if (!dragging) pos += (target - pos) * EASE;
            spread += (spreadTarget - spread) * 0.06;
            render(time);
        }
        requestAnimationFrame(frame);
    }

    render(0);
    restart();
    requestAnimationFrame(frame);
})();
