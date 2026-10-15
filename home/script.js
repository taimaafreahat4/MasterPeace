/* =====================================================
   MOBILE MENU
===================================================== */

const mobileMenu =
    document.getElementById("mobileMenu");

const navInner =
    document.getElementById("navInner");

if(mobileMenu && navInner){

   if(mobileMenu && navInner){

    mobileMenu.addEventListener("click", function(){

        navInner.classList.toggle("mobile-open");

    });

}
}


/* Close menu when clicking navigation link */

document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", function () {

        navInner.classList.remove("mobile-open");

    });

});



/* =====================================================
   MODAL ELEMENTS
===================================================== */

const modalOverlay =
    document.getElementById("modalOverlay");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");

const nameField =
    document.getElementById("nameField");

const authForm =
    document.getElementById("authForm");

const submitButton =
    authForm.querySelector(".modal-submit");



/* =====================================================
   OPEN MODAL
===================================================== */

function openModal(type) {

    modalOverlay.classList.add("active");


    if (type === "signup") {

        modalTitle.textContent =
            "Create Account";

        modalDescription.textContent =
            "Join StockMind and make smarter inventory decisions.";

        nameField.style.display =
            "block";

        nameField.required =
            true;

        submitButton.textContent =
            "Create Account";

    }

    else {

        modalTitle.textContent =
            "Welcome Back";

        modalDescription.textContent =
            "Login to your StockMind account.";

        nameField.style.display =
            "none";

        nameField.required =
            false;

        submitButton.textContent =
            "Login";

    }

}



/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    modalOverlay.classList.remove("active");

}



/* Close modal when clicking outside */

modalOverlay.addEventListener("click", function (event) {

    if (event.target === modalOverlay) {

        closeModal();

    }

});



/* Close modal with Escape */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeModal();

    }

});



/* =====================================================
   LOGIN / SIGNUP FORM
===================================================== */

authForm.addEventListener("submit", function (event) {

    event.preventDefault();


    const email =
        document.getElementById("emailField").value;

    const password =
        document.getElementById("passwordField").value;


    if (!email || !password) {

        showToast("Please fill in all required fields.");

        return;

    }


    closeModal();

    showToast("Welcome to StockMind 🚀");

    authForm.reset();

});
/* =====================================================
   SEARCH
===================================================== */

const searchInput =
    document.getElementById("searchInput");

const categoryCards =
    document.querySelectorAll(".category-card");
searchInput.addEventListener("input", function () {
    const value =
        searchInput.value
        .toLowerCase()
        .trim();
    categoryCards.forEach(card => {
        const name =
            card.dataset.name.toLowerCase();


        if (name.includes(value)) {

            card.style.display = "";

        }
        else {

            card.style.display = "none";

        }

    });

});



/* =====================================================
   CATEGORY CLICK
===================================================== */

categoryCards.forEach(card => {

    card.addEventListener("click", function () {

        const category =
            this.querySelector(".category-name").textContent;


        showToast(
            `${category} selected ✨`
        );
    });
});
/* =====================================================
   TOAST
===================================================== */

const toast =
    document.getElementById("toast");
let toastTimer;
function showToast(message) {
    toast.textContent =
        message;

    toast.classList.add("show");
    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(function () {

            toast.classList.remove("show");

        }, 2500);

}

/* =====================================================
   ACTIVE NAVIGATION
===================================================== */

const sections =
    document.querySelectorAll("section[id]");

const navLinks =
    document.querySelectorAll(".nav-links a");


window.addEventListener("scroll", function () {

    let current = "";


    sections.forEach(section => {

        const sectionTop =
            section.offsetTop - 100;

        const sectionHeight =
            section.clientHeight;


        if (
            window.scrollY >= sectionTop &&
            window.scrollY <
            sectionTop + sectionHeight
        ) {

            current =
                section.getAttribute("id");

        }

    });
    navLinks.forEach(link => {

        link.style.color = "";

        if (
            link.getAttribute("href") ===
            "#" + current
        ) {

            link.style.color =
                "#a85cff";

        }

    });

});

function openCategory(category){

    const loggedUser = localStorage.getItem("user");


    if(loggedUser){

        window.location.href =
        `../category/category.html?category=${category}`;

    }

    else{

        localStorage.setItem(
            "selectedCategory",
            category
        );


        window.location.href =
        "../login/login.html?role=buyer";

    }

}
function playHeroVideo(){

    const video =
    document.querySelector(".hero-video video");


    if(video){

        video.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        video.play();

    }
}// ===============================
// HOW IT WORKS ANIMATION
// ===============================

function animateSteps(){

    const cards = document.querySelectorAll(".step-card");


    cards.forEach(card => {

        const top =
        card.getBoundingClientRect().top;


        if(top < window.innerHeight - 150){

            card.classList.add("animate");

        }

    });

}


window.addEventListener("scroll", animateSteps);

window.addEventListener("load", animateSteps);

/* =========================================
   SUCCESS MODAL
========================================= */

let successModalTimer = null;
let previousFocusedElement = null;

function showSuccessModal() {
    const modal = document.getElementById("successModal");
    const doneButton = document.getElementById("successDone");

    if (!modal) return;

    clearTimeout(successModalTimer);

    previousFocusedElement = document.activeElement;

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    // Restart the animation every time the modal opens.
    const card = modal.querySelector(".success-modal");

    if (card) {
        card.style.animation = "none";
        void card.offsetWidth;
        card.style.animation = "";
    }

    if (doneButton) {
        doneButton.focus();
    }

    // Automatically close after 3.5 seconds.
    successModalTimer = setTimeout(closeSuccessModal, 3500);
}

function closeSuccessModal() {
    const modal = document.getElementById("successModal");

    if (!modal || modal.hidden) return;

    clearTimeout(successModalTimer);
    modal.hidden = true;
    document.body.style.overflow = "";

    if (
        previousFocusedElement &&
        typeof previousFocusedElement.focus === "function"
    ) {
        previousFocusedElement.focus();
    }
}

document.getElementById("successDone")?.addEventListener(
    "click",
    closeSuccessModal
);

document.getElementById("successModal")?.addEventListener(
    "click",
    event => {
        if (event.target.id === "successModal") {
            closeSuccessModal();
        }
    }
);

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeSuccessModal();
    }
});




/* =====================================================
   ABOUT SECTION – reveal on scroll + count-up
   الصق هاد الكود بآخر script.js
===================================================== */
(function () {
    const section = document.getElementById("about");
    if (!section) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = section.querySelectorAll(".am-reveal");
    const counters = section.querySelectorAll(".am-count");

    // بدون IntersectionObserver أو حركة مخفضة: خلي كل شي ظاهر
    if (!("IntersectionObserver" in window) || reduce) return;

    section.classList.add("am-ready");

    function runCounter(el) {
        const to = +el.dataset.to;
        const suffix = el.dataset.suffix || "";
        const dur = 1400;
        const start = performance.now();

        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(to * eased) + (p === 1 ? suffix : "");
            if (p < 1) requestAnimationFrame(tick);
        }
        el.textContent = "0";
        requestAnimationFrame(tick);
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add("in");
            // بعد ما يخلص الدخول، شيل التأخير عشان الـ hover يكون فوري
            setTimeout(() => el.style.setProperty("--d", "0s"), 1500);
            io.unobserve(el);
        });
    }, { threshold: 0.15 });

    items.forEach((el) => io.observe(el));

    const co = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            co.unobserve(entry.target);
        });
    }, { threshold: 0.6 });

    counters.forEach((el) => co.observe(el));
})();