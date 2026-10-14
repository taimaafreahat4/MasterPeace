document.addEventListener("DOMContentLoaded", function(){


    const logoutBtn = document.getElementById("logoutBtn");



    if(logoutBtn){


        logoutBtn.onclick = function(e){


            e.preventDefault();



            let confirmLogout =
            confirm("Are you sure you want to logout?");



            if(confirmLogout){



                localStorage.clear();



                window.location.href =
                "/home/index.html";



            }


        }


    }



});