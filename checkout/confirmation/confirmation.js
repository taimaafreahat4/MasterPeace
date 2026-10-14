document.addEventListener("DOMContentLoaded",()=>{


const orderNumber=document.getElementById("orderNumber");
const orderTotal=document.getElementById("orderTotal");
const orderItems=document.getElementById("orderItems");
const detailsButton=document.getElementById("viewOrderDetails");
const detailsBox=document.getElementById("orderDetails");



let order=null;


try{

order=JSON.parse(
sessionStorage.getItem("stockMindLastOrder")
|| "null"
);


}catch(e){

console.log(e);

}



function money(value){

return `JOD ${Number(value||0).toFixed(2)}`;

}





if(order){


orderNumber.textContent=
"#"+order.orderId;


orderTotal.textContent=
money(order.total);



if(Array.isArray(order.items)){



order.items.forEach(item=>{


const row=document.createElement("div");

row.className="order-item";




const img=document.createElement("img");



/*
هنا الصورة الحقيقية من المنتج
*/

img.src=item.image || "../../images/default-product.png";


img.alt=item.name;



img.onerror=function(){

this.src="../../images/default-product.png";

};





const info=document.createElement("div");

info.className="product-info";


info.innerHTML=`

<strong>${item.name}</strong>

<span>
Quantity: ${item.quantity}
</span>

`;





const price=document.createElement("strong");


price.textContent=
money(item.price * item.quantity);





row.append(
img,
info,
price
);



orderItems.appendChild(row);



});



}




detailsBox.textContent=

`
Customer:
${order.customer?.fullName || ""}

|

Items:
${order.items.length}

|

Payment:
${order.paymentMethod}

|

Status:
${order.status}
`;




}else{


orderNumber.textContent="Order unavailable";

orderTotal.textContent="JOD 0.00";

}



detailsButton.addEventListener(
    "click",
    ()=>{
        console.log("Button clicked");
        window.location.href = "../tracking/tracking.html";
    }
);
});