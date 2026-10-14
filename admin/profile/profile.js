/* =========================================
   STOCK MIND ADMIN - PROFILE JS
========================================= */



const saveButton =
document.querySelector(".card button");



const inputs =
document.querySelectorAll(".card input");


const profileImage =
document.getElementById("profileImage");


const imageUpload =
document.getElementById("imageUpload");


const removeImage =
document.getElementById("removeImage");



// ===============================
// LOAD PROFILE DATA
// ===============================


window.addEventListener("load",()=>{


const savedProfile =
JSON.parse(
localStorage.getItem("adminProfile")
);



if(savedProfile){


inputs[0].value =
savedProfile.name;


inputs[1].value =
savedProfile.email;


inputs[2].value =
savedProfile.phone;


inputs[3].value =
savedProfile.country;


}



});









// ===============================
// SAVE PROFILE
// ===============================


saveButton.addEventListener("click",()=>{


const profile = {


name:
inputs[0].value,


email:
inputs[1].value,


phone:
inputs[2].value,


country:
inputs[3].value


};





localStorage.setItem(

"adminProfile",

JSON.stringify(profile)

);





showToast(
"Profile updated successfully ✅"
);



});









// ===============================
// CHANGE PASSWORD BUTTON
// ===============================


document.querySelector(
".security button"
)
.addEventListener("click",()=>{


showToast(
"Password change page coming soon 🔒"
);



});









// ===============================
// LOGOUT ALL DEVICES
// ===============================


document.querySelector(
".danger"
)
.addEventListener("click",()=>{


const confirmLogout =
confirm(
"Logout from all devices?"
);



if(confirmLogout){


localStorage.removeItem(
"stockMindUser"
);



showToast(
"All devices logged out"
);



}



});









// ===============================
// TOAST MESSAGE
// ===============================


function showToast(message){



const toast =
document.createElement("div");



toast.innerText =
message;



toast.style.position =
"fixed";



toast.style.bottom =
"30px";



toast.style.right =
"30px";



toast.style.background =
"#7c3cff";



toast.style.color =
"white";



toast.style.padding =
"15px 25px";



toast.style.borderRadius =
"15px";



toast.style.fontWeight =
"600";



toast.style.zIndex =
"9999";



toast.style.boxShadow =
"0 10px 30px rgba(0,0,0,.2)";



document.body.appendChild(toast);



setTimeout(()=>{


toast.remove();


},2500);



}
// ===============================
// PROFILE IMAGE
// ===============================


// Load saved image

window.addEventListener("load",()=>{


const savedImage =
localStorage.getItem("adminImage");


if(savedImage){

profileImage.src =
savedImage;

}


});





// Upload image

imageUpload.addEventListener(
"change",
function(){


const file =
this.files[0];


if(file){


const reader =
new FileReader();



reader.onload =
function(e){


profileImage.src =
e.target.result;



localStorage.setItem(
"adminImage",
e.target.result
);



showToast(
"Profile image updated ✅"
);



};



reader.readAsDataURL(file);


}



});








// Remove image

removeImage.addEventListener(
"click",
()=>{


profileImage.src =
"../../components/logo.png";


localStorage.removeItem(
"adminImage"
);



showToast(
"Profile image removed 🗑"
);



});