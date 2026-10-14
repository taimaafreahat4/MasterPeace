/* =========================================
   STOCK MIND ADMIN - PRODUCTS JS
========================================= */


const searchInput =
document.getElementById("searchInput");


const categoryFilter =
document.getElementById("categoryFilter");


const stockFilter =
document.getElementById("stockFilter");


const productsTable =
document.getElementById("productsTable");







/* =========================================
   SEARCH + FILTER
========================================= */


function filterProducts(){


    const searchValue =
    searchInput.value
    .toLowerCase()
    .trim();



    const categoryValue =
    categoryFilter.value;



    const stockValue =
    stockFilter.value;



    const rows =
    productsTable.querySelectorAll("tr");



    rows.forEach(row=>{


        const text =
        row.innerText
        .toLowerCase();



        const category =
        row.children[2]
        ?.innerText
        .toLowerCase();



        const stock =
        row.querySelector(".status")
        ?.innerText
        .toLowerCase();




        let show =
        text.includes(searchValue);




        // Category filter

        if(categoryValue !== "all"){

            show =
            show &&
            category.includes(categoryValue);

        }




        // Stock filter


        if(stockValue !== "all"){


            if(stockValue === "available"){

                show =
                show &&
                stock === "available";

            }


            if(stockValue === "low"){


                show =
                show &&
                stock === "low stock";


            }



            if(stockValue === "out"){


                show =
                show &&
                stock === "out of stock";


            }


        }





        row.style.display =
        show ? "" : "none";



    });


}





searchInput.addEventListener(
"input",
filterProducts
);



categoryFilter.addEventListener(
"change",
filterProducts
);



stockFilter.addEventListener(
"change",
filterProducts
);










/* =========================================
   DELETE PRODUCT
========================================= */


document.querySelectorAll(".delete")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const product =
    row.querySelector("strong")
    .innerText;



    const confirmDelete =
    confirm(
    `Delete ${product}?`
    );



    if(confirmDelete){

        row.remove();

    }



});


});








/* =========================================
   VIEW PRODUCT
========================================= */


document.querySelectorAll(".view")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const product =
    row.querySelector("strong")
    .innerText;



    alert(

    "Opening product details:\n\n"
    + product

    );



});


});









/* =========================================
   EDIT PRODUCT
========================================= */


document.querySelectorAll(".edit")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const product =
    row.querySelector("strong")
    .innerText;



    alert(

    "Edit product:\n"
    + product

    );



});


});









/* =========================================
   ADD PRODUCT BUTTON
========================================= */


const addButton =
document.querySelector(".table-header button");


if(addButton){


addButton.addEventListener("click",()=>{


window.location.href =
"../add-product/add-product.html";


});


}