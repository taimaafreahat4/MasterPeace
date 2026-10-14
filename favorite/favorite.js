document.addEventListener(
"DOMContentLoaded",
()=>{


const container =
document.getElementById(
"favoriteContainer"
);



function getFavorites(){

return JSON.parse(

localStorage.getItem(
"stockMindFavorites"
)

|| "[]"

);

}




function saveFavorites(data){

localStorage.setItem(

"stockMindFavorites",

JSON.stringify(data)

);

}




function loadFavorites(){


const favorites = getFavorites();


container.innerHTML="";



if(favorites.length === 0){


container.innerHTML = `

<div class="empty">

<h2>
No favorite products yet ❤️
</h2>

<p>
Save products you love and they will appear here.
</p>


</div>

`;


return;

}




favorites.forEach(product=>{



const card =
document.createElement("div");



card.className =
"favorite-card";




card.innerHTML = `


<button class="remove-btn">
❤️
</button>



<img src="${product.image}">



<h2>
${product.name}
</h2>



<div class="price">

JOD ${product.price}

</div>



<div class="card-buttons">


<button class="cart-btn">

Add to Cart

</button>



<button class="details-btn">

View Details

</button>



</div>


`;






// REMOVE FAVORITE

card.querySelector(".remove-btn")
.onclick = ()=>{


let favorites =
getFavorites();



favorites =
favorites.filter(
item => item.id !== product.id
);



saveFavorites(favorites);



window.dispatchEvent(
new Event("favoritesUpdated")
);



loadFavorites();



};






// ADD TO CART + GO CART PAGE

card.querySelector(".cart-btn")
.onclick = ()=>{


let cart =
JSON.parse(

localStorage.getItem(
"stockMindCart"
)

|| "[]"

);




let exists =
cart.find(
item=>item.id === product.id
);




if(!exists){


cart.push({

id:product.id,

name:product.name,

price:product.price,

image:product.image,

quantity:1

});



localStorage.setItem(

"stockMindCart",

JSON.stringify(cart)

);


}




// update navbar cart

window.dispatchEvent(
new Event("cartUpdated")
);




// go to cart page

window.location.href =
"../cart/cart.html";



};







// VIEW DETAILS

card.querySelector(".details-btn")
.onclick = ()=>{


window.location.href =
`../product/product.html?id=${product.id}`;


};






container.appendChild(card);



});



}





loadFavorites();



});