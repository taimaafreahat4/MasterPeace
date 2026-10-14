document.addEventListener("DOMContentLoaded", () => {


/* =========================
   LOAD NAVBAR
========================= */

fetch("../components/navbar.html")
.then(res => res.text())
.then(data => {

    const nav = document.getElementById("navbar");

    if(nav){
        nav.innerHTML = data;
    }

});



/* =========================
   LOAD FOOTER
========================= */

fetch("../components/footer.html")
.then(res => res.text())
.then(data => {

    const footer = document.getElementById("footer");

    if(footer){
        footer.innerHTML = data;
    }

});





/* =========================
   ELEMENTS
========================= */


const detailsNext =
document.getElementById("detailsNextButton");


const photosNext =
document.getElementById("photosNextButton");


const productImages =
document.getElementById("productImages");


const imagePreview =
document.getElementById("imagePreview");


const photoCount =
document.getElementById("photoCount");



let mainImage = "";





/* =========================
   SAVE PRODUCT DETAILS
========================= */


function saveProductDetails(){


const product = {


name:
document.getElementById("productName").value,


category:
document.getElementById("category").value,


condition:
document.getElementById("condition").value,


quantity:
document.getElementById("quantity").value,


price:
document.getElementById("price").value,


description:
document.getElementById("description").value



};



localStorage.setItem(

"draftProduct",

JSON.stringify(product)

);


}





/* =========================
   STEP 1 -> STEP 2
========================= */


if(detailsNext){


detailsNext.addEventListener("click",()=>{


saveProductDetails();



document.querySelector('[data-panel="1"]').hidden=true;


document.querySelector('[data-panel="2"]').hidden=false;



document.querySelector('.step[data-step="1"]')
.classList.remove("active");



document.querySelector('.step[data-step="2"]')
.classList.add("active");



});

}








/* =========================
   IMAGE UPLOAD
========================= */


if(productImages){



productImages.addEventListener("change",()=>{


imagePreview.innerHTML="";



const files =
Array.from(productImages.files);



photoCount.textContent =
`${files.length} / 10`;



files.forEach((file,index)=>{


const reader =
new FileReader();



reader.onload=function(e){


const img =
document.createElement("img");


img.src=e.target.result;



imagePreview.appendChild(img);



if(index===0){


mainImage=e.target.result;



localStorage.setItem(

"mainImage",

mainImage

);



}


};



reader.readAsDataURL(file);



});



});



}







/* =========================
   STEP 2 -> STEP 3
========================= */


if(photosNext){


photosNext.addEventListener("click",()=>{


if(!productImages.files.length){


alert("Please add at least one photo");

return;


}




document.querySelector('[data-panel="2"]').hidden=true;


document.querySelector('[data-panel="3"]').hidden=false;



document.querySelector('.step[data-step="2"]')
.classList.remove("active");



document.querySelector('.step[data-step="3"]')
.classList.add("active");



loadReview();



});



}








/* =========================
   REVIEW DATA
========================= */


function loadReview(){


const product =

JSON.parse(

localStorage.getItem("draftProduct")

);



if(!product)return;




document.getElementById("reviewName")
.textContent =
product.name;



document.getElementById("reviewCategory")
.textContent =
product.category;



document.getElementById("reviewPrice")
.textContent =
"JOD " + Number(product.price).toFixed(2);



document.getElementById("reviewQuantity")
.textContent =
product.quantity + " units available";



document.getElementById("reviewCondition")
.textContent =
product.condition;



document.getElementById("reviewDescription")
.textContent =
product.description;




const img =
document.getElementById("reviewMainImage");



const savedImage =
localStorage.getItem("mainImage");



if(savedImage){


img.src=savedImage;


}



}





/* =========================
   BACK BUTTONS
========================= */


const backDetails =
document.getElementById("backToDetails");


if(backDetails){


backDetails.onclick=()=>{


document.querySelector('[data-panel="2"]').hidden=true;


document.querySelector('[data-panel="1"]').hidden=false;


};


}




const backPhotos =
document.getElementById("backToPhotos");


if(backPhotos){


backPhotos.onclick=()=>{


document.querySelector('[data-panel="3"]').hidden=true;


document.querySelector('[data-panel="2"]').hidden=false;


};


}






/* =========================
   PUBLISH
========================= */


const publish =
document.getElementById("publishButton");



if(publish){


publish.onclick=()=>{


const product =

JSON.parse(

localStorage.getItem("draftProduct")

);



const image =
localStorage.getItem("mainImage");



const products =

JSON.parse(

localStorage.getItem("sellerProducts") || "[]"

);



products.push({


id:"seller-"+Date.now(),


...product,


image,


sellerListed:true,


dateAdded:new Date().toISOString()


});




localStorage.setItem(

"sellerProducts",

JSON.stringify(products)

);



alert("Product published successfully!");



window.location.href =
"../category/category.html";



};



}





});