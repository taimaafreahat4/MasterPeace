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
document.addEventListener("click", function (e) {

    const logout = e.target.closest("#logoutBtn");
    if (!logout) return;

    e.preventDefault();

    // مسح بيانات تسجيل الدخول
    localStorage.removeItem("stockMindUser");
    localStorage.removeItem("user");

    // الرجوع للصفحة الرئيسية
    window.location.href = "../../home/index.html";

});