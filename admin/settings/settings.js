/* =========================================
   STOCK MIND ADMIN - SETTINGS JS
========================================= */



// ===============================
// ELEMENTS
// ===============================


const nameInput =
document.getElementById("adminName");


const emailInput =
document.getElementById("adminEmail");



const saveButtons =
document.querySelectorAll(".save-btn");







// ===============================
// LOAD SAVED SETTINGS
// ===============================


window.addEventListener("load",()=>{


const savedSettings =
JSON.parse(
localStorage.getItem("adminSettings")
);



if(savedSettings){


    if(nameInput)
    nameInput.value =
    savedSettings.name;



    if(emailInput)
    emailInput.value =
    savedSettings.email;



}



});








// ===============================
// SAVE PROFILE SETTINGS
// ===============================


saveButtons.forEach(button=>{


button.addEventListener("click",()=>{



const settings = {


name:
nameInput.value,


email:
emailInput.value,


saved:
true,


date:
new Date().toISOString()



};





localStorage.setItem(

"adminSettings",

JSON.stringify(settings)

);





showMessage(
"Settings saved successfully ✅"
);




});



});










// ===============================
// TOGGLE SAVE
// ===============================


document.querySelectorAll(
".switch input"
)
.forEach(toggle=>{


toggle.addEventListener(
"change",
()=>{


localStorage.setItem(

toggle.parentElement
.previousElementSibling
.innerText,


toggle.checked

);



});



});









// ===============================
// MESSAGE
// ===============================


function showMessage(text){



const message =
document.createElement("div");



message.innerText =
text;



message.style.position =
"fixed";



message.style.bottom =
"30px";



message.style.right =
"30px";



message.style.background =
"#7c3cff";



message.style.color =
"white";



message.style.padding =
"15px 25px";



message.style.borderRadius =
"15px";



message.style.fontWeight =
"600";



message.style.boxShadow =
"0 10px 30px rgba(0,0,0,.2)";



message.style.zIndex =
"9999";



document.body.appendChild(
message
);




setTimeout(()=>{


message.remove();


},2500);



}