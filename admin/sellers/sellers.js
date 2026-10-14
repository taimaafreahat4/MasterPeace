/* =========================================
   STOCK MIND ADMIN - SELLERS JS
========================================= */



const searchInput =
document.getElementById("searchInput");


const filterSelect =
document.getElementById("filterSelect");


const table =
document.getElementById("sellerTable");





/* =========================================
   SEARCH + FILTER
========================================= */


function filterSellers(){


    const searchValue =
    searchInput.value
    .toLowerCase()
    .trim();



    const filterValue =
    filterSelect.value;



    const rows =
    table.querySelectorAll("tr");



    rows.forEach(row=>{


        const text =
        row.innerText
        .toLowerCase();



        const status =
        row.querySelector(".status")
        ?.innerText
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
filterSellers
);



filterSelect.addEventListener(
"change",
filterSellers
);








/* =========================================
   APPROVE SELLER
========================================= */


document.querySelectorAll(".approve")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");


    const status =
    row.querySelector(".status");



    status.innerText =
    "Approved";


    status.className =
    "status approved";



    button.remove();



    alert(
    "Seller approved successfully ✅"
    );



});


});







/* =========================================
   SUSPEND SELLER
========================================= */


document.querySelectorAll(".suspend")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");


    const status =
    row.querySelector(".status");



    if(status.innerText === "Suspended"){


        status.innerText =
        "Approved";


        status.className =
        "status approved";


        button.innerText =
        "🚫";


    }

    else{


        status.innerText =
        "Suspended";


        status.className =
        "status suspended";


        button.innerText =
        "✅";


    }



});


});








/* =========================================
   DELETE SELLER
========================================= */


document.querySelectorAll(".delete")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const confirmDelete =
    confirm(
    "Delete this seller?"
    );



    if(confirmDelete){


        row.remove();


    }



});


});








/* =========================================
   VIEW SELLER
========================================= */


document.querySelectorAll(".view")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");


    const store =
    row.querySelector(".seller-info")
    .innerText;



    alert(
    "Opening seller profile: " + store
    );



});


});