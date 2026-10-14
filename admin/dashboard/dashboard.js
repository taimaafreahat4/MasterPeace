Chart.defaults.font.family="Inter";


// Revenue Gradient Chart

const ctx =
document.getElementById("salesChart");


new Chart(ctx,{

type:"line",


data:{


labels:[
"Jan",
"Feb",
"Mar",
"Apr",
"May",
"Jun"
],


datasets:[{

label:"Revenue",

data:[
12000,
18000,
15000,
26000,
34000,
45000
],


fill:true,

tension:.45,

borderWidth:3

}]


},


options:{


responsive:true,


plugins:{


legend:{

display:false

}


},


scales:{


y:{

beginAtZero:true

}


}


}


});





// Users Doughnut


new Chart(

document.getElementById("usersChart"),

{


type:"doughnut",


data:{


labels:[

"Buyers",
"Sellers",
"Admins"

],


datasets:[{


data:[70,25,5],


borderWidth:0


}]


},


options:{


cutout:"70%",


plugins:{


legend:{


position:"bottom"


}


}


}



});