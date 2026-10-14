let role="Buyer";


let imageData="https://i.pravatar.cc/150";



const image =
document.getElementById("image");


const preview =
document.getElementById("preview");



image.onchange=function(){


const reader=new FileReader();


reader.onload=function(e){


imageData=e.target.result;


preview.src=imageData;


}


reader.readAsDataURL(this.files[0]);


};






const buyer =
document.getElementById("buyer");


const seller =
document.getElementById("seller");



buyer.onclick=()=>{


role="Buyer";


buyer.classList.add("active");

seller.classList.remove("active");


};



seller.onclick=()=>{


role="Seller";


seller.classList.add("active");

buyer.classList.remove("active");


};







document
.getElementById("signupForm")
.addEventListener(
"submit",
(e)=>{


e.preventDefault();



let pass =
document.getElementById("password").value;


let confirm =
document.getElementById("confirmPassword").value;



if(pass !== confirm){

alert("Passwords do not match ❌");

return;

}





const user={


name:
document.getElementById("name").value,


username:
document.getElementById("username").value,


email:
document.getElementById("email").value,


phone:
document.getElementById("phone").value,


country:
document.getElementById("country").value,


city:
document.getElementById("city").value,


address:
document.getElementById("address").value,


password:pass,


role:role,


image:imageData



};




localStorage.setItem(
"stockMindAccount",
JSON.stringify(user)
);


// مهم للـ navbar
localStorage.setItem(
"stockMindUser",
JSON.stringify({

loggedIn:true,

role:role,

name:user.name,

image:user.image

})

);




alert("Account Created Successfully 🎉");



window.location.href="login.html";



});