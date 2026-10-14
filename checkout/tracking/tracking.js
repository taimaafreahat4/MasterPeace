document.addEventListener("DOMContentLoaded",()=>{


const orderNumber =
document.getElementById("orderNumber");


const trackingNumber =
document.getElementById("trackingNumber");


const orderDate =
document.getElementById("orderDate");


const deliveryDate =
document.getElementById("deliveryDate");


const statusBadge =
document.getElementById("statusBadge");


const confirmButton =
document.getElementById("confirmDeliveryButton");


const deliveryMessage =
document.getElementById("deliveryMessage");


const shippedCircle =
document.getElementById("shippedCircle");


const deliveredCircle =
document.getElementById("deliveredCircle");


const deliveredStep =
document.getElementById("deliveredStep");


const deliveryLine =
document.getElementById("deliveryLine");


const feedbackButton =
document.getElementById("feedbackButton");


const viewButton =
document.getElementById("viewOrderButton");


const stars =
document.querySelectorAll(".stars span");





let order={};


try{


order =
JSON.parse(
sessionStorage.getItem("stockMindLastOrder")
)
||
{};



}catch(error){

console.log(error);

}







/* DEFAULT DATA */


if(!order.orderId){

order.orderId =
"SM-"+Date.now();

}


if(!order.status){

order.status="Shipped";

}







/* SHOW DATA */


if(orderNumber){

orderNumber.textContent =
"#"+order.orderId;

}



if(trackingNumber){

trackingNumber.textContent =
"TRK-"+Math.floor(
Math.random()*900000
);

}



if(orderDate){

orderDate.textContent =
new Date(
order.createdAt || Date.now()
)
.toLocaleDateString();

}



if(deliveryDate){

deliveryDate.textContent =
"14 Oct 2026";

}





function updateStatus(status){


if(!statusBadge)
return;


statusBadge.textContent =
status;



if(status==="Delivered"){


statusBadge.style.background=
"#e5fff2";


statusBadge.style.color=
"#16a34a";


}


}






updateStatus(order.status);








/*
 CONFIRM DELIVERY
*/


if(confirmButton){


confirmButton.addEventListener(
"click",
()=>{


/* move truck */

if(shippedCircle){

shippedCircle.classList.add(
"move-truck"
);

}





setTimeout(()=>{



if(shippedCircle){

shippedCircle.classList.remove(
"move-truck"
);


shippedCircle.textContent="✓";


}





if(deliveredCircle){

deliveredCircle.textContent="✓";

}




if(deliveredStep){

deliveredStep.classList.add(
"delivered-active"
);

}




if(deliveryLine){

deliveryLine.classList.add(
"completed"
);

}





order.status="Delivered";

order.received=true;



sessionStorage.setItem(
"stockMindLastOrder",
JSON.stringify(order)
);




updateStatus(
"Delivered"
);




confirmButton.textContent =
"✓ Order Received";


confirmButton.disabled=true;



if(deliveryMessage){

deliveryMessage.textContent =
"Your order has been delivered successfully 🎉";

}



},1500);



}

);

}









/*
 RATING
*/


let selectedRating=0;



stars.forEach(
(star,index)=>{


star.addEventListener(
"click",
()=>{


selectedRating=index+1;



stars.forEach(
(item,i)=>{


item.textContent =
i<=index
?
"★"
:
"☆";


});


});


});







if(feedbackButton){


feedbackButton.addEventListener(
"click",
()=>{


if(selectedRating===0){


alert(
"Please select stars first ⭐"
);


return;


}



feedbackButton.textContent=
"Thanks for your feedback ❤️";


feedbackButton.disabled=true;



});


}








/*
 VIEW ORDER
*/


if(viewButton){


viewButton.addEventListener(
"click",
()=>{


alert(
`Order: #${order.orderId}
Status: ${order.status}
Total: JOD ${Number(order.total||0).toFixed(2)}`
);


});


}






console.log(
"Tracking page ready ✅"
);



});