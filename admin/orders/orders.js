/* =========================================
   STOCK MIND ADMIN - ORDERS JS
========================================= */



const searchInput =
document.getElementById("searchInput");


const statusFilter =
document.getElementById("statusFilter");


const ordersTable =
document.getElementById("ordersTable");






/* =========================================
   SEARCH + FILTER ORDERS
========================================= */


function filterOrders(){


    const searchValue =
    searchInput.value
    .toLowerCase()
    .trim();



    const filterValue =
    statusFilter.value
    .toLowerCase();



    const rows =
    ordersTable.querySelectorAll("tr");



    rows.forEach(row=>{


        const text =
        row.innerText
        .toLowerCase();



        const status =
        row.querySelector(".order-status")
        ?.value
        .toLowerCase();




        let show =
        text.includes(searchValue);



        if(filterValue !== "all"){


            show =
            show &&
            status === filterValue;


        }




        row.style.display =
        show ? "" : "none";



    });



}





searchInput.addEventListener(
"input",
filterOrders
);



statusFilter.addEventListener(
"change",
filterOrders
);








/* =========================================
   CHANGE ORDER STATUS
========================================= */


document.querySelectorAll(".order-status")
.forEach(select=>{


select.addEventListener("change",()=>{


    const value =
    select.value;



    if(value === "Completed"){


        select.style.background =
        "#d9ffe9";


        select.style.color =
        "#16c784";


    }


    else if(value === "Cancelled"){


        select.style.background =
        "#ffe2e2";


        select.style.color =
        "#ff4d5e";


    }


    else if(value === "Shipped"){


        select.style.background =
        "#dceeff";


        select.style.color =
        "#2563eb";


    }


    else{


        select.style.background =
        "#fff4cc";


        select.style.color =
        "#c58b00";


    }



});



});









/* =========================================
   VIEW ORDER
========================================= */


document.querySelectorAll(".view")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const orderId =
    row.children[0].innerText;



    const buyer =
    row.children[1].innerText;



    const amount =
    row.children[3].innerText;




    alert(

    "Order Details\n\n" +

    "Order ID: " + orderId +
    "\nBuyer: " + buyer +
    "\nAmount: " + amount

    );



});


});









/* =========================================
   DELETE ORDER
========================================= */


document.querySelectorAll(".delete")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const order =
    row.children[0].innerText;



    const confirmDelete =
    confirm(
    "Delete order " + order + "?"
    );



    if(confirmDelete){


        row.remove();


    }



});


});









/* =========================================
   INITIAL STATUS COLORS
========================================= */


document.querySelectorAll(".order-status")
.forEach(select=>{


const value =
select.value;



if(value === "Completed"){


select.style.background="#d9ffe9";
select.style.color="#16c784";


}


else if(value === "Pending"){


select.style.background="#fff4cc";
select.style.color="#c58b00";


}


});