let rating = 0;


const stars =
document.querySelectorAll(".stars span");



stars.forEach(star=>{


star.addEventListener("click",()=>{


rating =
Number(star.dataset.star);



stars.forEach(s=>{


s.classList.remove("active");


});



for(let i=0;i<rating;i++){

stars[i].classList.add("active");

}


});


});





const tags =
document.querySelectorAll(".tags button");



tags.forEach(tag=>{


tag.addEventListener("click",()=>{


tag.classList.toggle("selected");


});


});




document.getElementById("submitReview").addEventListener("click", function(){

    const review = document.getElementById("review").value;

    const feedback = {
        rating: rating,
        review: review,
        date: new Date().toLocaleDateString()
    };

    localStorage.setItem(
        "stockMindFeedback",
        JSON.stringify(feedback)
    );

    alert("Thank you for your feedback ⭐");

window.location.href = "../../category/category.html";
});