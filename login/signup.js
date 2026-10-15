/* =====================================================
   STOCK MIND — SIGN UP
===================================================== */

let role = "Buyer";
let imageData = "https://i.pravatar.cc/150";

const form       = document.getElementById("signupForm");
const card       = document.getElementById("signupCard");
const cardWrap   = document.getElementById("cardWrap");
const errorBox   = document.getElementById("formError");
const signupBtn  = document.getElementById("signupBtn");
const passInput  = document.getElementById("password");
const confInput  = document.getElementById("confirmPassword");


/* =====================================================
   PHOTO UPLOAD
===================================================== */

const image   = document.getElementById("image");
const preview = document.getElementById("preview");

image.addEventListener("change", function () {

    const file = this.files && this.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
        imageData = e.target.result;
        preview.src = imageData;
    };

    reader.readAsDataURL(file);

});


/* =====================================================
   ROLE (Buyer / Seller)
===================================================== */

const buyer    = document.getElementById("buyer");
const seller   = document.getElementById("seller");
const rolesBox = document.getElementById("roles");

function setRole(r) {

    role = r;

    buyer.classList.toggle("active", r === "Buyer");
    seller.classList.toggle("active", r === "Seller");

    rolesBox.style.setProperty("--i", r === "Seller" ? 1 : 0);

}

buyer.addEventListener("click",  () => setRole("Buyer"));
seller.addEventListener("click", () => setRole("Seller"));

/* role coming from the home page (?role=seller) */

(function initRole() {

    const r = (new URLSearchParams(location.search).get("role") || "").toLowerCase();

    if (r === "seller") setRole("Seller");

})();


/* =====================================================
   SHOW / HIDE PASSWORD
===================================================== */

document.querySelectorAll(".eye").forEach(btn => {

    btn.addEventListener("click", () => {

        const input  = document.getElementById(btn.dataset.target);
        const hidden = input.type === "password";

        input.type = hidden ? "text" : "password";
        btn.classList.toggle("on", hidden);

    });

});


/* =====================================================
   PASSWORD STRENGTH + MATCH
===================================================== */

const strength     = document.getElementById("strength");
const strengthText = document.getElementById("strengthText");

const LABELS = ["Use 6+ characters", "Weak", "Fair", "Good", "Strong"];

function scorePassword(p) {

    if (!p) return 0;

    let s = 0;

    if (p.length >= 6)  s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    else if (/\d/.test(p) && p.length >= 8) s++;

    return Math.max(p.length >= 6 ? 1 : 0, Math.min(s, 4));

}

passInput.addEventListener("input", () => {

    const s = scorePassword(passInput.value);

    strength.dataset.s = s;
    strengthText.textContent = LABELS[s];

    checkMatch();

});

function checkMatch() {

    const f = confInput.closest(".field");

    if (!confInput.value) {
        f.classList.remove("valid", "invalid");
        return;
    }

    const ok = confInput.value === passInput.value;

    f.classList.toggle("valid", ok);
    f.classList.toggle("invalid", !ok);

}

confInput.addEventListener("input", checkMatch);


/* =====================================================
   ERROR + SHAKE
===================================================== */

function showError(message, fieldId) {

    errorBox.textContent = message;
    errorBox.classList.add("show");

    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");

    if (fieldId) {
        const el = document.getElementById(fieldId);
        el.closest(".field").classList.add("invalid");
        el.focus();
    }

}

function clearError() {

    errorBox.classList.remove("show");

    form.querySelectorAll(".field.invalid").forEach(f => {
        if (f !== confInput.closest(".field")) f.classList.remove("invalid");
    });

}

form.addEventListener("input", clearError);


/* =====================================================
   BUTTON RIPPLE
===================================================== */

signupBtn.addEventListener("click", e => {

    const rect = signupBtn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top  = (e.clientY - rect.top  - size / 2) + "px";

    signupBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);

});


/* =====================================================
   SUBMIT
===================================================== */

form.addEventListener("submit", e => {

    e.preventDefault();

    const get = id => document.getElementById(id).value.trim();

    const name     = get("name");
    const username = get("username");
    const email    = get("email");
    const phone    = get("phone");
    const country  = get("country");
    const city     = get("city");
    const address  = get("address");
    const pass     = passInput.value;
    const confirm  = confInput.value;


    if (!name)     return showError("Please enter your full name.", "name");
    if (!username) return showError("Please choose a username.", "username");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return showError("Please enter a valid email address.", "email");

    if (!phone)    return showError("Please enter your phone number.", "phone");

    if (pass.length < 6)
        return showError("Password must be at least 6 characters.", "password");

    if (pass !== confirm)
        return showError("Passwords do not match.", "confirmPassword");


    const user = {
        name,
        username,
        email,
        phone,
        country,
        city,
        address,
        password: pass,
        role,
        image: imageData
    };

    localStorage.setItem("stockMindAccount", JSON.stringify(user));

    // مهم للـ navbar
    localStorage.setItem("stockMindUser", JSON.stringify({
        loggedIn: true,
        role: role,
        name: user.name,
        image: user.image
    }));


    signupBtn.classList.add("loading");

    setTimeout(() => {
        document.getElementById("success").classList.add("show");
    }, 600);

    setTimeout(() => {
        window.location.href = "../login/login.html?role=" + role.toLowerCase();
    }, 2100);

});


/* =====================================================
   3D TILT + MOUSE LIGHT
===================================================== */

if (window.matchMedia("(hover:hover)").matches) {

    document.addEventListener("mousemove", e => {

        const r  = cardWrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;

        const dx = (e.clientX - cx) / (window.innerWidth / 2);
        const dy = (e.clientY - cy) / (window.innerHeight / 2);

        card.style.transform =
            `perspective(1400px) rotateY(${dx * 3}deg) rotateX(${-dy * 2}deg)`;

        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");

    });

    document.addEventListener("mouseleave", () => {
        card.style.transform = "";
    });

}
// ===============================
// Animated Network Background
// ===============================

const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

let points = [];

function resizeCanvas(){

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);



class Point{

    constructor(){

        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;

        this.vx = (Math.random()-0.5) * 0.35;
        this.vy = (Math.random()-0.5) * 0.35;

        this.size = Math.random()*2 + 2;

    }


    move(){

        this.x += this.vx;
        this.y += this.vy;


        if(this.x < 0 || this.x > canvas.width)
            this.vx *= -1;


        if(this.y < 0 || this.y > canvas.height)
            this.vy *= -1;

    }


    draw(){

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            this.size,
            0,
            Math.PI*2
        );


        ctx.fillStyle =
        "rgba(190,170,255,0.8)";


        ctx.fill();

    }

}



function createPoints(){

    points=[];

    for(let i=0;i<45;i++){

        points.push(new Point());

    }

}


createPoints();



function drawLines(){

    for(let i=0;i<points.length;i++){

        for(let j=i+1;j<points.length;j++){


            let dx =
            points[i].x-points[j].x;


            let dy =
            points[i].y-points[j].y;


            let distance =
            Math.sqrt(dx*dx+dy*dy);



            if(distance < 150){


                ctx.beginPath();

                ctx.moveTo(
                    points[i].x,
                    points[i].y
                );


                ctx.lineTo(
                    points[j].x,
                    points[j].y
                );


                ctx.strokeStyle =
                "rgba(170,150,240,0.15)";


                ctx.lineWidth=1;

                ctx.stroke();


            }

        }

    }

}




function animateNetwork(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    points.forEach(point=>{

        point.move();
        point.draw();

    });


    drawLines();


    requestAnimationFrame(
        animateNetwork
    );

}


animateNetwork();