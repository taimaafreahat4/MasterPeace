/* =========================================
   STOCK MIND ADMIN - USERS JS
========================================= */



const searchInput =
document.getElementById("searchInput");


const filterSelect =
document.getElementById("filterSelect");


const table =
document.getElementById("usersTable");





/* =========================================
   SEARCH + FILTER
========================================= */


function filterUsers(){


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



        const role =
        row.querySelector(".badge")
        ?.innerText
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
            (
                role === filterValue ||
                status === filterValue
            );


        }




        row.style.display =
        show ? "" : "none";



    });


}





searchInput.addEventListener(
"input",
filterUsers
);



filterSelect.addEventListener(
"change",
filterUsers
);







/* =========================================
   BLOCK USER
========================================= */


document.querySelectorAll(".block")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");


    const status =
    row.querySelector(".status");



    if(status.innerText === "Blocked"){


        status.innerText="Active";

        status.className="status active";


        button.innerText="🚫";


    }

    else{


        status.innerText="Blocked";

        status.className="status blocked";


        button.innerText="✅";


    }



});


});







/* =========================================
   DELETE USER
========================================= */


document.querySelectorAll(".delete")
.forEach(button=>{


button.addEventListener("click",()=>{


    const row =
    button.closest("tr");



    const confirmDelete =
    confirm(
    "Are you sure you want to delete this user?"
    );



    if(confirmDelete){

        row.remove();

    }



});


});








/* =========================================
   VIEW USER
========================================= */


document.querySelectorAll(".view")
.forEach(button=>{


button.addEventListener("click",()=>{


const row =
button.closest("tr");


const name =
row.querySelector(".user-info div:last-child")
.innerText;



alert(
"Viewing user profile: " + name
);



});


});








/* =========================================
   EDIT USER
========================================= */


document.querySelectorAll(".edit")
.forEach(button=>{


button.addEventListener("click",()=>{


const row =
button.closest("tr");


const name =
row.querySelector(".user-info div:last-child")
.innerText;



alert(
"Edit user: " + name
);



});


});