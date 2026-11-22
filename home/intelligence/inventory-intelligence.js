(function(){'use strict';
var $=function(i){return document.getElementById(i)},reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function cl(v,a,b){return Math.max(a,Math.min(b,v))}
function ss(a,b,x){var t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function lp(a,b,t){return a+(b-a)*t}
function md(a,n){return((a%n)+n)%n}
var root=$('stock-intel-track'), pin=$('stock-intel-app'), nav=document.querySelector('#navbar-container .navbar');
var navHeight=nav ? nav.offsetHeight : 64;
function syncWarehouseNavbar(){
    var bounds=root.getBoundingClientRect();
    var headerHeight=document.querySelector('#navbar-container .navbar')?.offsetHeight||navHeight;
    document.documentElement.classList.toggle('warehouse-in-view',bounds.bottom>headerHeight&&bounds.top<=headerHeight+2);
}
syncWarehouseNavbar();
addEventListener('scroll',syncWarehouseNavbar,{passive:true});
addEventListener('resize',syncWarehouseNavbar);
var headerHost=$('navbar-container');
if(headerHost)new MutationObserver(syncWarehouseNavbar).observe(headerHost,{childList:true});

function maxS(){return Math.max(1,root.offsetHeight-pin.offsetHeight)}
function readP(){return cl((navHeight-root.getBoundingClientRect().top)/maxS(),0,1)}

/* ---------- story copy ---------- */
var CB1=['Explore the Warehouse|0.1','Discover StockMind|0.52'],CB2=['Get Started|0.99','Explore Marketplace|0.9'];
var SC=[
[0,.08,'STOCKMIND / INVENTORY INTELLIGENCE','Smarter inventory.<br><em>Stronger business.</em>','Predict demand. Manage smarter. Turn surplus into opportunity.',CB1],
[.08,.26,'THE JOURNEY BEGINS','Every product starts with a decision.','But not every purchasing decision leads to a sale.'],
[.27,.45,'THE PROBLEM','More stock.<br><em>Less certainty.</em>','Products sit unsold. Storage costs rise. Capital stays trapped on the shelves.'],
[.45,.535,'AUTOMATED SORTING','From scattered boxes<br><em>to organized stock.</em>','The robotic arm picks up cartons and places them on the outbound conveyor.'],
[.605,.635,'THE STOCKMIND SOLUTION','From inventory chaos<br><em>to intelligent decisions.</em>','StockMind turns inventory information into actionable business intelligence.'],
[.635,.72,'AI DEMAND FORECASTING','Know what could sell.<br><em>Before you buy.</em>','Forecasts informed by location, seasonality, customer behavior and sales patterns.'],
[.72,.8,'SMART RECOMMENDATIONS','Buy with insight.<br><em>Not just instinct.</em>','Guidance designed to help reduce overstocking and support more confident decisions.'],
[.8,.885,'INVENTORY INTELLIGENCE','Know what to keep.<br><em>Know what to sell.</em>','Understand your stock. Unlock better decisions.'],
[.885,.955,'STOCKMIND MARKETPLACE','One seller’s surplus.<br><em>Another seller’s opportunity.</em>','List surplus, discover stock, and connect products with the people who need them.'],
[.955,1.01,'BUY. SELL. CONNECT.','Smarter inventory.<br><em>Stronger business.</em>','Forecast demand. Optimize stock. Unlock the value of surplus inventory.',CB2]];
var copy=$('stock-intel-copy'),cur=-2;
function setScene(i){if(i===cur)return;cur=i;if(i<0){copy.classList.add('off');copy.inert=true;return}copy.inert=false;
 var s=SC[i];$('stock-intel-ce').textContent=s[2];$('stock-intel-ch').innerHTML=s[3];$('stock-intel-cs').textContent=s[4];var cc=$('stock-intel-cc');cc.innerHTML='';
 (s[5]||[]).forEach(function(b){
  b=b.split('|');var final=i===SC.length-1 || !renderer;
  var e=document.createElement(final?'a':'button');e.textContent=b[0];
  if(final)e.href=b[0]==='Get Started'?root.dataset.start:root.dataset.market;
  else{e.type='button';e.dataset.p=b[1];}
  cc.appendChild(e);
 });
 copy.classList.remove('off','in');void copy.offsetWidth;copy.classList.add('in')}
var hudButtons=Array.from(root.querySelectorAll('.intel-chapters button'));
var hudProgress=root.querySelector('.intel-progress i');
var hudIndex=-1;
var chapterStarts=[0,.08,.27,.61,.72,.885];
function updateJourneyHud(p){
  if(hudProgress)hudProgress.style.transform='scaleX('+p+')';
  var index=0;
  for(var j=1;j<chapterStarts.length;j++){if(p>=chapterStarts[j])index=j;}
  if(index===hudIndex)return;
  hudIndex=index;
  hudButtons.forEach(function(b,i){if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
}
function sceneFor(p){for(var i=0;i<SC.length;i++)if(p>=SC[i][0]&&p<SC[i][1])return i;return -1}
root.addEventListener('click',function(e){
 var b=e.target.closest('[data-p]');if(!b)return;
 var p=parseFloat(b.dataset.p);
 if(!renderer)return;
 window.scrollTo({top:window.scrollY+root.getBoundingClientRect().top-navHeight+p*maxS(),behavior:reduce?'auto':'smooth'});
});

/* Keep one grouped callout visible at each floor. */
var floorPanels=[
    {element:root.querySelector('[data-floor-panel="ground"]'), start:.278, end:.448},
    {element:root.querySelector('[data-floor-panel="upper"]'), start:.628, end:.881}
];
function updateFloorPanels(progress){
    var anyVisible=false;
    floorPanels.forEach(function(panel){
        var entering=ss(panel.start,panel.start+.025,progress);
        var leaving=ss(panel.end-.025,panel.end,progress);
        var opacity=entering*(1-leaving);
        var shown=opacity>0;
        var accessible=opacity>.12;
        if(panel.shown||shown){
            panel.element.style.setProperty('--panel-opacity',opacity.toFixed(3));
            panel.element.style.setProperty('--panel-offset',((1-entering)*22-leaving*15).toFixed(1)+'px');
        }
        if(accessible!==panel.accessible){
            panel.element.setAttribute('aria-hidden',String(!accessible));
            panel.accessible=accessible;
        }
        panel.shown=shown;
        anyVisible=anyVisible||shown;
    });
    root.classList.toggle('floor-panel-visible',anyVisible);
}

/* ---------- WebGL ---------- */
var THREE=window.THREE,stage=$('stock-intel-stage'),renderer;
function noGL(){if(renderer)renderer.dispose();renderer=null;SC[0][5]=CB2;root.classList.remove('has-3d');$('stock-intel-hint').hidden=true;$('stock-intel-copy').classList.remove('off');}
if(reduce || !THREE){noGL();setScene(0);return}
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});if(!renderer.getContext())throw 0}catch(e){noGL();setScene(0);return}
renderer.domElement.setAttribute('aria-hidden','true');
stage.appendChild(renderer.domElement);
root.classList.add('has-3d');
var scene=new THREE.Scene();scene.background=new THREE.Color(0x07112B);scene.fog=new THREE.FogExp2(0x07112B,.011);
var cam=new THREE.PerspectiveCamera(42,1,.1,300);
scene.add(new THREE.HemisphereLight(0x8c96d0,0x0a1030,.8));
var moon=new THREE.DirectionalLight(0xaab4ff,.45);moon.position.set(20,40,30);scene.add(moon);
function pl(c,i,d,x,y,z){var l=new THREE.PointLight(c,i,d,2);l.position.set(x,y,z);scene.add(l);return l}
pl(0x7C3AED,1.1,28,12,5,8);pl(0xf2e9d8,1.1,26,0,4.8,-7);pl(0xdce0ff,1.1,30,4,10.8,-7);var ambL=pl(0xF59E0B,1.4,11,0,3,-8);
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var r=rng(7);
function M(c,m,ro,e){return new THREE.MeshStandardMaterial({color:c,metalness:m||0,roughness:ro==null?.6:ro,emissive:e||0})}
function MB(c,o){return new THREE.MeshBasicMaterial({color:c,transparent:o!=null,opacity:o==null?1:o})}
var BOX=new THREE.BoxGeometry(1,1,1);
function B(w,h,d,x,y,z,m,par){var o=new THREE.Mesh(BOX,m);o.scale.set(w,h,d);o.position.set(x,y,z);(par||scene).add(o);return o}
function tex(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);var t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
var neon=MB(0x7C3AED),lite=MB(0xdcd8ff),ambM=MB(0xF59E0B);
var cladT=tex(64,64,function(g,w,h){g.fillStyle='#232f6d';g.fillRect(0,0,w,h);g.fillStyle='#19225a';g.fillRect(0,0,7,h);g.fillStyle='#3a4894';g.fillRect(7,0,2,h)});
function clad(rx){var t=cladT.clone();t.needsUpdate=true;t.repeat.set(rx,1);return new THREE.MeshStandardMaterial({map:t,metalness:.5,roughness:.5})}

/* instanced cartons + rack steel */
var cartonAtlas=tex(512,512,function(g){
    var grain=rng(882);
    for(var tile=0;tile<4;tile++){
        var x=(tile%2)*256,y=Math.floor(tile/2)*256;
        g.fillStyle=tile===3?'#aaa094':'#e0d5c6';g.fillRect(x,y,256,256);
        for(var dot=0;dot<3100;dot++){
            g.fillStyle=dot%2?'rgba(61,44,29,.075)':'rgba(255,251,230,.12)';
            g.fillRect(x+grain()*254,y+grain()*254,1+grain()*2,1);
        }
        g.strokeStyle='#8d7863';g.lineWidth=1.5;g.strokeRect(x+4,y+4,248,248);
        g.strokeStyle='#f0e5d6';g.strokeRect(x+7,y+7,242,242);
        if(tile===1||tile===2){
            g.fillStyle='rgba(134,99,61,.42)';g.fillRect(x+105,y,46,tile===2?256:33);
            g.fillStyle='rgba(249,223,173,.32)';g.fillRect(x+108,y,3,tile===2?256:33);
        }
        if(tile===2){
            g.fillStyle='rgba(89,64,45,.45)';g.fillRect(x+127,y,2,256);
            g.fillRect(x,y+7,256,2);
        }
        if(tile===1){
            g.fillStyle='#fff7df';g.fillRect(x+144,y+116,78,55);
            g.fillStyle='#51453c';g.fillRect(x+151,y+123,40,3);g.fillRect(x+151,y+130,62,2);
            for(var line=0;line<18;line++)g.fillRect(x+151+line*3.4,y+142,line%3?1.4:2.3,16);
            g.fillRect(x+22,y+201,41,2);
            g.font='bold 13px sans-serif';g.fillText('THIS SIDE UP',x+22,y+220);
        }
    }
});
cartonAtlas.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
var cartonGeometry=BOX.clone();
var cartonUV=cartonGeometry.attributes.uv;
var cartonFaceTiles=[1,0,2,3,1,0];
cartonFaceTiles.forEach(function(tile,face){
    var x=tile%2,y=1-Math.floor(tile/2);
    for(var vertex=face*4;vertex<face*4+4;vertex++){
        cartonUV.setXY(vertex,(x+.012+cartonUV.getX(vertex)*.976)/2,(y+.012+cartonUV.getY(vertex)*.976)/2);
    }
});
var cartonMaterial=new THREE.MeshStandardMaterial({color:0xffffff,map:cartonAtlas,roughness:.94});
var bxM=new THREE.InstancedMesh(cartonGeometry,cartonMaterial,2600),frM=new THREE.InstancedMesh(BOX,M(0xffffff,.6,.4),1200),nb=0,nf=0,tmp=new THREE.Object3D(),col=new THREE.Color();
function addI(m,n,x,y,z,w,h,d,c,ry){tmp.position.set(x,y,z);tmp.rotation.set(0,ry||0,0);tmp.scale.set(w,h,d);tmp.updateMatrix();m.setMatrixAt(n,tmp.matrix);m.setColorAt(n,col.set(c))}
function addBox(x,y,z,w,h,d,c,ry){addI(bxM,nb,x,y,z,w,h,d,c,ry);return nb++}
function addFr(x,y,z,w,h,d,c){addI(frM,nf++,x,y,z,w,h,d,c)}
var TANS=[0xc79a6b,0xb98a5e,0xd1a77c,0xc09263],CATS=[0xc89d76,0xb7865d,0xcea880,0xbc906a];
function rack(x,z,y0,o){o=o||{};var w=4.4,d=1.1,L=4,st=1.3,ids=[];
 [-1,1].forEach(function(a){[-1,1].forEach(function(b){addFr(x+a*w/2,y0+(L*st+.3)/2,z+b*d/2,.1,L*st+.3,.1,0x3b5bd0)})});
 for(var l=0;l<L;l++){var sy=y0+.2+l*st;[-1,1].forEach(function(b){addFr(x,sy,z+b*d/2,w,.1,.1,0xe08a2e)});
  for(var s=0;s<4;s++){if(r()>(o.fill==null?.9:o.fill))continue;
   var bw=.88+(s%3)*.05,bh=.71+((l+s)%4)*.056,bd=.86+(l%2)*.07,ry=(s%3-1)*.035,oz=(s%2)*.045,bx=x-w/2+.55+s*1.1;
   if(o.chaos){bw=.8+r()*.5;bh=.6+r()*.5;bd=.8+r()*.4;ry=(r()-.5)*.6;oz=(r()-.5)*.5}
   var c=o.cat?o.cat(l,s):TANS[(r()*4)|0];
   ids.push({i:addBox(bx,sy+.05+bh/2,z+oz,bw,bh,bd,c,ry),l:l,c0:c});
   if(o.chaos&&l===L-1&&r()<.75)addBox(bx,sy+.05+bh+.3,z,.8,.55,.8,TANS[1],r())}}
 return ids}
var palMat=M(0x8a6a45,0,.9);
function pallet(x,z,y0,n,c,tilt){B(1.2,.14,1.2,x,y0+.07,z,palMat);for(var l=0;l<n;l++)for(var a=0;a<2;a++)for(var b=0;b<2;b++)addBox(x-.28+a*.56,y0+.14+.2+l*.4,z-.28+b*.56,.52,.38,.52,c||TANS[(r()*4)|0],tilt?r()*.5:0)}

/* ground + city */
var gnd=new THREE.Mesh(new THREE.PlaneGeometry(400,400),M(0x0a1338,.4,.3));gnd.rotation.x=-Math.PI/2;scene.add(gnd);
var yl=MB(0xe3b341);for(var i=0;i<9;i++)B(.12,.01,7,-17+i*3.3,.01,9,yl);
B(.12,.01,12,-8,.011,-7,yl);B(.12,.01,12,6,.011,-7,yl);
for(var bi=0;bi<22;bi++){var ba=r()*Math.PI*2,bd=55+r()*50,bx=Math.cos(ba)*bd,bz=Math.sin(ba)*bd;if(bz>15||(Math.abs(bx)<22&&bz>-20&&bz<30))continue;
 var bw=4+r()*6,bh=10+r()*28,wt=tex(64,128,function(g,w,h){g.fillStyle='#0a1235';g.fillRect(0,0,w,h);for(var yy=4;yy<h-6;yy+=12)for(var xx=4;xx<w-6;xx+=12)if(r()<.3){g.fillStyle=['#d9d2bd','#9aa5de','#c7c9ea'][(r()*3)|0];g.fillRect(xx,yy,5,7)}});
 wt.repeat.set(Math.max(1,Math.round(bw/3)),Math.max(1,Math.round(bh/7)));var bm=B(bw,bh,5+r()*5,bx,bh/2,bz,new THREE.MeshStandardMaterial({color:0xffffff,map:wt,emissive:0xffffff,emissiveMap:wt,emissiveIntensity:.5}));bm.rotation.y=r()*.6}

/* building shell */
var wallL=clad(14);
B(27.5,12,.5,-4.25,6,-.25,wallL);B(3.5,12,.5,16.25,6,-.25,clad(2));B(5,7,.5,12,8.5,-.25,clad(3));
B(.5,12,14,-18.25,6,-7,clad(8));B(.5,12,14,18.25,6,-7,clad(8));B(37,12,.5,0,6,-14.25,clad(18));
var roof=B(36.6,.4,14.6,0,12.2,-7,new THREE.MeshStandardMaterial({color:0x151e55,metalness:.5,roughness:.5,transparent:true}));
B(30.5,.4,14,2.75,6,-7,M(0x151e55,.5,.45));
B(36.4,.09,.09,0,12.34,.27,MB(0xa281ff));B(36.4,.028,.028,0,12.368,.328,lite);B(.14,12,.14,18,6,.05,neon);B(.14,12,.14,-18,6,.05,neon);B(.14,.14,14,18,12.1,-7,neon);B(.14,.14,14,-18,12.1,-7,neon);
B(5.4,.12,.12,12,5.1,.05,neon);B(.12,5.1,.12,9.35,2.55,.05,neon);B(.12,5.1,.12,14.65,2.55,.05,neon);
for(var z0=-3;z0>-12;z0-=4){B(24,.05,.35,3,5.78,z0,lite);B(24,.05,.35,3,11.78,z0,lite)}
/* decals */
function plane(w,h,x,y,z,t){var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true}));m.position.set(x,y,z);scene.add(m)}
plane(7,2.7,12,9.1,.02,tex(1024,400,function(g,w,h){g.fillStyle='#7C3AED';g.beginPath();g.moveTo(512-60,30);g.lineTo(512,0);g.lineTo(512+60,30);g.lineTo(512+60,100);g.lineTo(512,130);g.lineTo(512-60,100);g.closePath();g.fill();g.strokeStyle='#fff';g.lineWidth=7;g.beginPath();g.moveTo(512-60,30);g.lineTo(512,60);g.lineTo(512+60,30);g.moveTo(512,60);g.lineTo(512,130);g.stroke();
 g.fillStyle='#fff';g.textAlign='center';if('letterSpacing' in g)g.letterSpacing='14px';g.font='700 120px "Space Grotesk",Inter,sans-serif';g.fillText('STOCK MIND',512,270);g.font='600 40px Inter,sans-serif';g.fillStyle='#C4B5FD';if('letterSpacing' in g)g.letterSpacing='10px';g.fillText('FULFILLMENT CENTER',512,340)}));
plane(3,.7,12,5.65,.02,tex(300,70,function(g,w,h){g.fillStyle='#1c2780';g.fillRect(0,0,w,h);g.fillStyle='#fff';g.font='700 34px Inter,sans-serif';g.textAlign='center';g.fillText('« RECEIVING',150,48)}));
/* Recessed, numbered loading bays. */
var dockRubber=M(0x111526,.15,.84),dockSteel=M(0x414a69,.62,.42);
var dockSwatch=tex(128,192,function(g,w,h){
    var paint=g.createLinearGradient(0,0,w,h);
    paint.addColorStop(0,'#555b88');paint.addColorStop(.55,'#777ca6');paint.addColorStop(1,'#4d547b');
    g.fillStyle=paint;g.fillRect(0,0,w,h);
    for(var y=16;y<h;y+=16){
        g.fillStyle='#383d62';g.fillRect(0,y,w,2);
        g.fillStyle='#969bc0';g.fillRect(0,y+2,w,1);
    }
});
var dockDoorMaterial=new THREE.MeshStandardMaterial({map:dockSwatch,metalness:.32,roughness:.5});
var dockEdge=MB(0xaaa0ed),dockLamp=MB(0xffc68d),dockWindow=MB(0xe9edff);
var dockGuard=M(0xd49a2f,.36,.47);
for(var bay=0;bay<8;bay++){
    var dx=-15+bay*3;
    B(2.68,3.94,.36,dx,2.02,.16,dockRubber);
    B(2.05,3.2,.1,dx,1.73,.36,dockDoorMaterial);
    B(2.13,.43,.16,dx,.34,.45,dockSteel);
    B(2.6,.38,.59,dx,3.85,.3,dockRubber);
    B(2.59,.038,.043,dx,4.062,.6,dockEdge);
    B(.23,.051,.038,dx,3.8,.607,lite);
    B(2.25,.09,.42,dx,.095,.53,dockSteel);
    [-1,1].forEach(function(side){
        var edgeX=dx+side*1.18;
        B(.22,3.49,.4,edgeX,1.9,.39,dockRubber);
        B(.028,3.82,.047,dx+side*1.3,2.13,.59,dockEdge);
        B(.083,.91,.05,edgeX,1.77,.615,dockLamp);
        B(.26,.69,.28,edgeX,.41,.63,dockGuard);
        [-1,1].forEach(function(stripe){
            B(.18,.045,.023,edgeX,.42+stripe*.14,.782,dockRubber).rotation.z=side*.44;
        });
        B(.53,.24,.037,dx+side*.42,1.49,.429,dockRubber);
        B(.45,.16,.018,dx+side*.42,1.49,.456,dockWindow);
    });
    var dockNumber='0'+(bay+1);
    plane(.95,.58,dx,4.48,.042,tex(128,72,function(g,w,h){
        g.textAlign='center';g.font='700 54px Inter,sans-serif';
        g.shadowColor='#9a73ff';g.shadowBlur=12;
        g.fillStyle='#f3efff';g.fillText(dockNumber,w/2,58);
    }));
}
/* receiving door */
var door=B(5,5.1,.14,12,2.55,-.2,M(0x7a86c0,.7,.35));
/* trucks, pallets, forklift */
var truckWhite=M(0xf2f5fb,.27,.36,0x171923);
var trailerWhite=M(0xc4ccdc,.34,.52);
var truckTrim=M(0x262e42,.58,.39);
var truckGlass=M(0x23364c,.3,.2,0x0a1424);
var truckTire=M(0x111520,.05,.88);
var wheelMetal=M(0x9ca9bf,.78,.27);
var headlamp=MB(0xdbeaff), markerLamp=MB(0xffad4d), tailLamp=MB(0xd83a52);
var tireGeo=new THREE.CylinderGeometry(.445,.445,.32,20);
var hubGeo=new THREE.CylinderGeometry(.24,.24,.035,16);

var cabProfile=new THREE.Shape();
cabProfile.moveTo(2.36,.67);
cabProfile.lineTo(4.53,.67);
cabProfile.lineTo(4.58,1.7);
cabProfile.lineTo(4.32,2.55);
cabProfile.quadraticCurveTo(4.2,2.86,3.84,2.91);
cabProfile.lineTo(2.71,2.91);
cabProfile.quadraticCurveTo(2.46,2.85,2.36,2.57);
cabProfile.closePath();
var cabGeo=new THREE.ExtrudeGeometry(cabProfile,{
    depth:2.16,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.055,bevelThickness:.055,curveSegments:4
});
cabGeo.translate(0,0,-1.08);
cabGeo.rotateY(-Math.PI/2);

var trailerPanel=tex(256,96,function(g,w,h){
    g.fillStyle='#d7dce6';g.fillRect(0,0,w,h);
    for(var x=9;x<w;x+=12){
        g.fillStyle='#c6cedb';g.fillRect(x,0,2,h);
        g.fillStyle='#e8ecf3';g.fillRect(x+2,0,1,h);
    }
    g.fillStyle='#b4bfce';g.fillRect(0,0,w,4);g.fillRect(0,h-5,w,5);
    for(var i=8;i<w;i+=16){
        g.fillStyle=i%32===8?'#bd4e5b':'#f1e8dd';
        g.fillRect(i,h-4,9,2);
    }
});
var trailerSide=new THREE.MeshStandardMaterial({map:trailerPanel,metalness:.25,roughness:.54});
var trailerMats=[trailerSide,trailerSide,truckWhite,trailerWhite,trailerWhite,trailerWhite];

function truck(x,z,angle){
    var g=new THREE.Group();
    B(2.02,.24,8.5,0,.72,-.32,truckTrim,g);
    B(2.43,2.55,7.35,0,2.09,-1.47,trailerMats,g);
    var cab=new THREE.Mesh(cabGeo,truckWhite);
    g.add(cab);
    var windshield=B(1.91,.68,.044,0,2.24,4.48,truckGlass,g);
    windshield.rotation.x=-.29;
    B(.06,.64,.055,0,2.23,4.51,truckTrim,g).rotation.x=-.29;
    B(2.17,.23,.17,0,.72,4.58,truckTrim,g);
    B(1.32,.53,.048,0,1.16,4.625,truckTrim,g);
    for(var row=0;row<5;row++)B(1.21,.023,.018,0,.98+row*.09,4.654,wheelMetal,g);
    [-1,1].forEach(function(side){
        B(.035,.55,.88,side*1.142,2.18,3.83,truckGlass,g);
        B(.035,.042,.19,side*1.145,1.7,3.27,wheelMetal,g);
        B(.28,.055,.055,side*1.19,2.32,4.3,truckTrim,g);
        B(.12,.31,.16,side*1.34,2.26,4.29,truckTrim,g);
        B(.39,.15,.052,side*.83,1.02,4.635,headlamp,g);
        B(.13,.075,.058,side*1.025,1.16,4.63,markerLamp,g);
        B(.17,.105,.055,side*1.02,.89,-5.16,tailLamp,g);
        B(.31,.13,.58,side*1.01,.6,3.31,truckTrim,g);
        [-4.24,-3.29,-2.34,1.6,3.76].forEach(function(axle){
            var wheel=new THREE.Mesh(tireGeo,truckTire);
            wheel.rotation.z=Math.PI/2;
            wheel.position.set(side*1.09,.45,axle);
            g.add(wheel);
            var hub=new THREE.Mesh(hubGeo,wheelMetal);
            hub.rotation.z=Math.PI/2;
            hub.position.set(side*1.26,.45,axle);
            g.add(hub);
        });
    });
    g.position.set(x,0,z);
    g.rotation.y=angle;
    scene.add(g);
}
truck(-16.5,8.1,.48);
truck(-4.8,5.8,.48);
/* Oversized shipping cartons on slatted pallets. */
var shippingWood=M(0x956339,.05,.85),shippingTape=MB(0xe4c28e);
function freightStack(x,z,wrapped){
    var baseWidth=2.1,baseDepth=1.65;
    [-.7,0,.7].forEach(function(offset){B(.19,.1,baseDepth,x+offset,.055,z,shippingWood)});
    for(var slat=-2;slat<=2;slat++)B(baseWidth,.085,.24,x,.145,z+slat*.335,shippingWood);
    for(var level=0;level<2;level++){
        for(var side=-1;side<=1;side+=2){
            var y=.192+(level+.5)*.67;
            var boxX=x+side*.505;
            B(.98,.665,1.54,boxX,y,z,M(wrapped?0xb8a9a4:0xac7952,0,.8));
            B(.09,.015,1.547,boxX,y+.332,z,shippingTape);
            B(.23,.14,.009,boxX+.21,y+.1,z+.776,MB(0xece2cf));
        }
    }
    if(wrapped){
        var wrap=new THREE.MeshPhysicalMaterial({color:0xc6d5ff,roughness:.22,transparent:true,opacity:.19,depthWrite:false});
        B(2.015,1.34,1.565,x,.862,z,wrap);
        var filmEdge=new THREE.MeshBasicMaterial({color:0xd8e4ff,transparent:true,opacity:.52,depthWrite:false});
        for(var band=0;band<5;band++){
            B(2.025,.016,1.575,x,.32+band*.245,z,filmEdge);
        }
    }
}
freightStack(16.9,6.75,true);
freightStack(16.4,9.05,false);
pallet(-3,12,0,2);
[-1,1].forEach(function(s){for(var k=0;k<3;k++){var c=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1,8),M(0xe3b341,.3,.5));c.position.set(8+s*0+k*.01+(s>0?2.2:0),.5,2.6);scene.add(c)}});
var fk=new THREE.Group();B(1.3,.9,1.9,0,.7,0,M(0xe3b341,.3,.5),fk);B(.1,2.2,.1,-.4,1.2,1.1,M(0x333b66),fk);B(.1,2.2,.1,.4,1.2,1.1,M(0x333b66),fk);B(.12,.08,1.3,-.4,.15,1.7,M(0x333b66),fk);B(.12,.08,1.3,.4,.15,1.7,M(0x333b66),fk);fk.position.set(16.3,0,-5);fk.rotation.y=-2.6;scene.add(fk);
/* exterior polish: wet-asphalt glow, lamp cones, vents, windows, planters, neon loops, sky */
var glow=tex(128,128,function(g,w,h){var gr=g.createRadialGradient(64,64,2,64,64,64);gr.addColorStop(0,'rgba(150,120,255,.55)');gr.addColorStop(1,'rgba(124,58,237,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
function pool(x,z,s,o){var m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:glow,transparent:true,opacity:o,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);scene.add(m)}
for(var pi=0;pi<8;pi++)pool(-15+pi*3,3.4,5.4,.24);pool(12,7,11,.28);pool(-4,13,27,.16);pool(-14.3,12.25,3.6,.16);pool(-2.6,9.95,3.8,.2);
var coneG=new THREE.ConeGeometry(1.7,3.2,18,1,true),coneM=new THREE.MeshBasicMaterial({color:0xdcd8ff,transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
for(var ci=0;ci<8;ci++){var cn=new THREE.Mesh(coneG,coneM);cn.position.set(-15+ci*3,5.7,1.3);scene.add(cn)}
B(26,1.1,.05,-4.5,9.1,.03,M(0x38458f,.6,.4));for(var vi=0;vi<5;vi++)B(26,.07,.06,-4.5,8.7+vi*.2,.05,M(0x0d1330));
/* Glazed service windows beside receiving. */
var serviceFrame=M(0x29364f,.68,.43);
var serviceGlass=tex(128,96,function(g,w,h){
    var glass=g.createLinearGradient(0,0,w,h);
    glass.addColorStop(0,'#667f9d');
    glass.addColorStop(.43,'#354c69');
    glass.addColorStop(.76,'#263450');
    glass.addColorStop(1,'#7c6a62');
    g.fillStyle=glass;g.fillRect(0,0,w,h);
    g.fillStyle='rgba(196,222,245,.24)';g.fillRect(8,11,w-16,3);
    g.fillStyle='rgba(255,202,145,.33)';g.fillRect(7,h-13,w-14,5);
});
[15.4,17].forEach(function(x){
    B(1.34,.92,.10,x,2.9,.062,serviceFrame);
    plane(1.18,.76,x,2.9,.116,serviceGlass);
    B(.047,.77,.038,x,2.9,.132,serviceFrame);
    B(1.23,.042,.035,x,2.77,.132,serviceFrame);
    B(1.39,.075,.18,x,2.424,.108,serviceFrame);
});
/* Concrete planters and warm uplights along the receiving wall. */
var planterConcrete=M(0x777d97,.2,.74),planterCap=M(0xa0a3b2,.24,.62),planterSoil=M(0x28232a,0,.92);
var foliage=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),M(0xffffff,0,.84),180);
var leafRandom=rng(371),leaf=new THREE.Object3D(),leafColor=new THREE.Color();
var greens=[0x244b38,0x365e36,0x567640,0x76854c];
var leafIndex=0;
for(var shrub=0;shrub<5;shrub++){
    var shrubX=15.04+shrub*.68;
    B(.65,.38,.86,shrubX,.19,1.45,planterConcrete);
    B(.67,.065,.89,shrubX,.38,1.45,planterCap);
    B(.56,.014,.75,shrubX,.42,1.45,planterSoil);
    B(.09,.06,.085,shrubX,.46,1.81,MB(0xffd79e));
    for(var branch=0;branch<36;branch++){
        var angle=leafRandom()*Math.PI*2,radius=Math.sqrt(leafRandom())*.33;
        leaf.position.set(shrubX+Math.cos(angle)*radius,.55+leafRandom()*(.5-radius*.72),1.41+Math.sin(angle)*radius);
        leaf.rotation.set(leafRandom()*2,angle,leafRandom()*2);
        leaf.scale.set(.10+leafRandom()*.055,.12+leafRandom()*.09,.095+leafRandom()*.035);
        leaf.updateMatrix();
        foliage.setMatrixAt(leafIndex,leaf.matrix);
        foliage.setColorAt(leafIndex++,leafColor.set(greens[Math.floor(leafRandom()*greens.length)]));
    }
    pool(shrubX,2.03,1.05,.17);
}
scene.add(foliage);
pl(0xffd093,.74,5,16.55,.78,2.23);
for(var k2=0;k2<3;k2++){var cn2=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,10),M(0xff7a1a,0,.6));cn2.position.set(-12+k2*.9,.3,12);scene.add(cn2)}
[26,29.5].forEach(function(R,i){var lp2=new THREE.Mesh(new THREE.TorusGeometry(R,.07,6,140,Math.PI*1.1),i?MB(0x7C3AED,.5):neon);lp2.rotation.x=Math.PI/2;lp2.position.set(14,.05,2);scene.add(lp2)});
var skyCube=new THREE.Mesh(BOX,M(0x6355c4,.3,.3,0x3d3399));skyCube.scale.setScalar(2.6);skyCube.position.set(2,21,-2);skyCube.add(new THREE.LineSegments(new THREE.EdgesGeometry(BOX),new THREE.LineBasicMaterial({color:0xc4b5fd})));scene.add(skyCube);
var logoTex=new THREE.TextureLoader().load('../components/logo.png');
logoTex.encoding=THREE.sRGBEncoding;
var logoFaceMat=new THREE.MeshBasicMaterial({map:logoTex,transparent:true,depthWrite:false});
var logoFace=new THREE.PlaneGeometry(.65,.65);
var frontLogo=new THREE.Mesh(logoFace,logoFaceMat);
frontLogo.position.z=.506;skyCube.add(frontLogo);
var sideLogo=new THREE.Mesh(logoFace,logoFaceMat);
sideLogo.position.x=.506;sideLogo.rotation.y=Math.PI/2;skyCube.add(sideLogo);
var SN=260,sa=new Float32Array(SN*3);for(var s=0;s<SN;s++){var th=r()*Math.PI*2,ph=.15+r()*1.2;sa[s*3]=Math.cos(th)*Math.sin(ph)*160;sa[s*3+1]=Math.cos(ph)*160;sa[s*3+2]=Math.sin(th)*Math.sin(ph)*160-30}
var sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(sa,3));scene.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xdcd8ff,size:1.6,sizeAttenuation:false,fog:false})));
pl(0x8a5cff,1,40,-8,6,12);

/* Receiving lane and warehouse finishes */
var concrete = tex(128,128,function(g,w,h){
    g.fillStyle='#515a68';g.fillRect(0,0,w,h);
    for(var i=0;i<700;i++){
        g.fillStyle=i%2?'rgba(255,255,255,.055)':'rgba(0,0,0,.10)';
        g.fillRect((i*73.53)%w,(i*37.17)%h,1+i%3,1+i%2);
    }
    g.fillStyle='rgba(15,22,37,.38)';g.fillRect(0,0,w,1);g.fillRect(0,0,1,h);
});
concrete.repeat.set(12,5);
var receivingFloor=new THREE.Mesh(new THREE.PlaneGeometry(36,13.9),
    new THREE.MeshStandardMaterial({map:concrete,roughness:.64,metalness:.14}));
receivingFloor.rotation.x=-Math.PI/2;
receivingFloor.position.set(0,.005,-7);
scene.add(receivingFloor);

var bumper=M(0x293044,.5,.52), caution=M(0xd69c36,.24,.55);
[-1,1].forEach(function(side){
    var x=13+side*1.65;
    B(.07,.013,5.8,x,.017,-3.1,caution);
    for(var z=-1;z>=-5;z-=2){
        B(.14,.65,.14,x,.325,z,bumper);
        B(.16,.13,.16,x,.57,z,caution);
    }
});
for(var beamZ=-2;beamZ>=-11;beamZ-=3){
    B(25,.16,.25,5.5,5.65,beamZ,bumper);
    B(4,.045,.19,12.6,5.52,beamZ,lite);
}
pl(0xffdfaf,1.35,14,12.4,4.65,-3.4);
pl(0xcbdcff,1.1,15,5.6,4.9,-9);
pool(13,-3,7,.20);
pool(6,-9,10,.14);

/* Ground-floor inventory staging */
var back=[-1.5,3.1,7.7,12.3];back.forEach(function(x){rack(x,-12.5,0,{fill:.8})});
rack(0,-9,0,{chaos:1,fill:1});rack(0,-7.2,0,{chaos:1,fill:1});
pallet(3.2,-8.2,0,3,0,1);pallet(-3.2,-6.2,0,2,0,1);pallet(-3.4,-9.6,0,3,0,1);pallet(4,-6.3,0,2,0,1);pallet(2.4,-5.2,0,1,0,1);
[[-11.3,-11.6],[-9.8,-11.6],[-8.3,-11.6],[-6.8,-11.6],[-5.3,-11.6]].forEach(function(p){pallet(p[0],p[1],0,4,0xe0b36a)});
[[7.6,.02,-5.7],[7.6,.02,-10.2]].forEach(function(p){B(p[0],p[1],.08,0,p[1],p[2],ambM)});B(.08,.02,4.5,-3.8,.02,-7.9,ambM);B(.08,.02,4.5,3.8,.02,-7.9,ambM);
B(4.4,.05,.05,0,.18,-6.55,ambM);B(4.4,.05,.05,0,.18,-9.65,ambM);
/* lift */
var lift=B(3,.15,3,-14,.1,-8,M(0x2a3890,.7,.3));B(2.6,.05,.4,0,.1,-1.3,MB(0x7C3AED),lift);
[[-15.7,-9.6],[-15.7,-6.4],[-12.4,-9.6],[-12.4,-6.4]].forEach(function(p){B(.14,12,.14,p[0],6,p[1],M(0x4d5ba8,.7,.3))});
/* interior level 1 */
var Y1=6.2,cat=function(l,s){return CATS[(l+s)%4]};
rack(-8,-11.5,Y1,{cat:cat,fill:1});rack(-8,-2.8,Y1,{cat:cat,fill:1});rack(2,-11.5,Y1,{cat:cat,fill:1});rack(2,-2.8,Y1,{cat:cat,fill:.95});rack(6.9,-11.5,Y1,{cat:cat,fill:1});
var inv=rack(9,-9.6,Y1,{fill:1,cat:function(){return CATS[(r()*4)|0]}}).concat(rack(9,-6.4,Y1,{fill:1,cat:function(){return CATS[(r()*4)|0]}}));
var invA=inv.map(function(b){return new THREE.Color(b.c0)}),invB=inv.map(function(b){return new THREE.Color(CATS[b.l%4])});
pallet(-6,-8,Y1,2,0xd1a77c);
/* dispatch */
B(1.6,.3,10,16.4,Y1+.4,-7.5,M(0x111a4d,.6,.4));
[-1,1].forEach(function(side){
    var railX=16.4+side*.79;
    B(.09,.14,10,railX,Y1+.62,-7.5,M(0x28365c,.65,.36));
    B(.027,.026,10,railX,Y1+.701,-7.5,MB(0x49dcff));
    [-11,-7.5,-4].forEach(function(z){B(.13,.28,.13,railX,Y1+.14,z,M(0x263653,.55,.42))});
});
B(2.4,.9,1.2,14.3,Y1+.45,-12.2,M(0x1a2570,.5,.4));addBox(14.3,Y1+1.2,-12.2,.7,.5,.7,0xc79a6b);
bxM.count=nb;frM.count=nf;bxM.instanceColor.needsUpdate=true;frM.instanceColor.needsUpdate=true;scene.add(bxM);scene.add(frM);
/* rec outlines */
var EG=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.05,.9,.98));
var outl=[[1.45,9.45,0x2DD4BF],[.35,6.85,0xF59E0B],[3.65,8.15,0x7C3AED]].map(function(p){var l=new THREE.LineSegments(EG,new THREE.LineBasicMaterial({color:p[2],transparent:true,opacity:0}));l.position.set(p[0],p[1],-11.5);scene.add(l);return l});
/* data motes + scan ring */
var DN=90,dp=new Float32Array(DN*3);for(var d=0;d<DN;d++){dp[d*3]=-12+r()*9;dp[d*3+1]=7.4+r()*3.6;dp[d*3+2]=-11+r()*8}
var dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
var motes=new THREE.Points(dg,new THREE.PointsMaterial({color:0xC4B5FD,size:3,sizeAttenuation:false,transparent:true,opacity:0}));scene.add(motes);

/* conveyor to the door */
var beltT=tex(64,64,function(g,w,h){g.fillStyle='#0a1236';g.fillRect(0,0,w,h);for(var y=0;y<h;y+=16){var roller=g.createLinearGradient(0,y,0,y+13);roller.addColorStop(0,'#6478ae');roller.addColorStop(.28,'#344678');roller.addColorStop(1,'#101a39');g.fillStyle=roller;g.fillRect(0,y,w,13);}g.fillStyle='rgba(124,58,237,.6)';g.fillRect(0,0,3,h);g.fillRect(w-3,0,3,h)});beltT.repeat.set(1,27);
B(2,.3,30,13,.4,11,M(0x111a4d,.6,.4));
var bt=new THREE.Mesh(new THREE.PlaneGeometry(1.8,30),new THREE.MeshStandardMaterial({map:beltT,roughness:.5,metalness:.3}));bt.rotation.x=-Math.PI/2;bt.position.set(13,.56,11);scene.add(bt);
[-1,1].forEach(function(s){B(.1,.16,30,13+s*1.05,.62,11,M(0x2a3890,.7,.3));B(.03,.02,30,13+s*1.05,.71,11,MB(0x9a93d9))});
for(var lz=-2;lz<26;lz+=5)[-1,1].forEach(function(s){B(.12,.3,.12,13+s*.95,.15,lz,M(0x2a3890,.7,.3))});
var tapeM=MB(0x7C3AED);
function crate(w,h,d,tm){var g=new THREE.Group();B(w,h,d,0,0,0,M(0xc99a74,0,.85),g);B(w*.18,h*1.01,d*1.01,0,0,0,tm,g);B(w*.4,.01,d*.3,w*.2,h/2+.005,-d*.15,MB(0xe9e4da),g);scene.add(g);return g}
var hero=crate(1,.85,.9,tapeM),ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.015,6,60),MB(0x2DD4BF));ring.visible=false;scene.add(ring);
var BC=[22,17,12,6,0.5].map(function(z){var g=crate(.8,.6,.8,MB(0xe9d9bf));return{g:g,b:z}});
var dispatchTexture=beltT.clone();
dispatchTexture.repeat.set(1,8);
dispatchTexture.needsUpdate=true;
var dispatchSurface=new THREE.Mesh(new THREE.PlaneGeometry(1.46,10),
    new THREE.MeshStandardMaterial({map:dispatchTexture,roughness:.46,metalness:.28}));
dispatchSurface.rotation.x=-Math.PI/2;
dispatchSurface.position.set(16.4,Y1+.558,-7.5);
scene.add(dispatchSurface);
var paperTape=MB(0xe6c495);
var dispatchParcels=[{width:.78,height:.66,depth:.77},{width:.58,height:.44,depth:.72},{width:.86,height:.72,depth:1.02}].map(function(size,i){
    var parcel=crate(size.width,size.height,size.depth,i===1?tapeM:paperTape);
    parcel.visible=false;
    return {mesh:parcel,height:size.height,depth:size.depth};
});
var HW=[[0,13,.98,19],[.05,13,.98,17],[.08,13,.98,14],[.16,13,.98,7],[.22,13,.98,1],[.27,13,.98,-3.2],[.40,13,.98,-3.2],[.50,-8,.43,-3.5],[.535,-14.6,.43,-8],[.60,-14.6,Y1+.43,-8],[.64,-6,Y1+.43,-8],[.80,-6,Y1+.43,-8],[.89,16.4,Y1+.983,-11.5],[.92,16.4,Y1+.983,-8],[.95,16.4,Y1+.983,-3.2],[1.01,16.4,Y1+.983,-3.2]];
function heroAt(p){var i=0;while(i<HW.length-2&&p>HW[i+1][0])i++;var a=HW[i],b=HW[i+1],t=ss(a[0],b[0],p);return[lp(a[1],b[1],t),lp(a[2],b[2],t),lp(a[3],b[3],t)]}

/* Robotic sorting cell. Positions are driven entirely by scroll so the transfer reverses cleanly. */
var sorter=new THREE.Group();
sorter.position.set(-7.8,0,-8.5);
scene.add(sorter);
var sortSteel=M(0x7187a5,.7,.31), sortDark=M(0x1e3147,.55,.45);
var sortCyan=MB(0x3ce1ff), sortAmber=MB(0xffaa4c);
var sortRoller=new THREE.CylinderGeometry(.065,.065,1.04,12);
[-1.9,1.9].forEach(function(x){
    B(1.25,.22,3.7,x,.68,0,sortDark,sorter);
    [-.62,.62].forEach(function(edge){
        B(.08,.15,3.7,x+edge,.83,0,sortSteel,sorter);
        B(.025,.025,3.68,x+edge,.915,0,x<0?sortCyan:sortAmber,sorter);
    });
    for(var i=0;i<13;i++){
        var roller=new THREE.Mesh(sortRoller,sortSteel);
        roller.rotation.z=Math.PI/2;
        roller.position.set(x,.82,-1.68+i*.28);
        sorter.add(roller);
    }
    [-1.4,1.4].forEach(function(z){B(.12,.62,.2,x,.31,z,sortDark,sorter)});
});
B(.95,.24,.95,0,.12,0,sortDark,sorter);
var pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.38,.48,.65,20),sortSteel);
pedestal.position.y=.55;sorter.add(pedestal);
var shoulder=new THREE.Vector3(0,1.02,0),elbow=new THREE.Vector3(),wrist=new THREE.Vector3();
var armAxis=new THREE.Vector3(0,1,0),armDirection=new THREE.Vector3();
var upperArm=B(.3,1,.34,0,0,0,sortSteel,sorter);
var foreArm=B(.23,1,.25,0,0,0,sortSteel,sorter);
var elbowJoint=new THREE.Mesh(new THREE.SphereGeometry(.22,16,12),sortDark);
sorter.add(elbowJoint);
var gripper=new THREE.Group();
sorter.add(gripper);
B(.51,.13,.35,0,0,0,sortDark,gripper);
B(.28,.035,.06,0,.085,.12,sortCyan,gripper);
[-1,1].forEach(function(side){B(.075,.25,.15,.23*side,-.1,0,sortSteel,gripper)});
var sortedCartons=[-.98,0,.98].map(function(z,i){
    var carton=B(.64,.44,.65,1.9,1.105,z,M(TANS[i],0,.82),sorter);
    B(.16,1.01,.99,0,0,0,MB(0xe8d6ad),carton);
    return carton;
});
function aimArm(segment,from,to){
    armDirection.subVectors(to,from);
    segment.scale.y=armDirection.length()+.09;
    segment.position.copy(from).lerp(to,.5);
    segment.quaternion.setFromUnitVectors(armAxis,armDirection.normalize());
}
function animateSorter(p){
    var cycle=cl((p-.455)/.075,0,1)*3;
    var item=Math.min(2,Math.floor(cycle)),t=cycle-item;
    var across=ss(.29,.73,t);
    var gripX=lp(1.9,-1.9,across);
    var gripY=1.42+.83*(1-ss(0,.15,t)+ss(.24,.36,t)-ss(.6,.76,t)+ss(.81,.93,t));
    gripX=lp(gripX,1.9,ss(.85,1,t));
    var z=lp(sortedCartons[item].position.z,sortedCartons[Math.min(2,item+1)].position.z,ss(.86,1,t));
    wrist.set(gripX,gripY,z);
    elbow.set(gripX*.39,Math.max(2.28,gripY+.37),z*.49-.19);
    aimArm(upperArm,shoulder,elbow);
    aimArm(foreArm,elbow,wrist);
    elbowJoint.position.copy(elbow);
    gripper.position.copy(wrist);
    sortedCartons.forEach(function(carton,i){
        var carried=i===item&&t>=.24&&t<.78;
        carton.position.x=i<item||(i===item&&t>=.78)?-1.9:carried?gripX:1.9;
        carton.position.y=carried?Math.max(1.105,gripY-.315):1.105;
        carton.rotation.y=i<item||(i===item&&t>=.78)?0:(i-1)*.2*(1-(carried?across:0));
    });
}
animateSorter(0);

/* camera route: [p, pos xyz, look xyz] */
var KS=[[0,22,4.6,33,0,5.2,0],[.08,11,3.6,20,13,1.5,8],[.16,15.5,2.4,10,13,1.2,2],[.22,13,2.2,3.5,13,1.6,-3],[.27,11,1.9,-2.5,6,1.6,-7],
[.30,6.5,1.8,-6,0,1.6,-8],[.33,4.6,1.8,-3.4,0,1.6,-8],[.36,0,1.8,-1.8,0,1.6,-8],[.39,-4.6,1.8,-3.4,0,1.6,-8],[.42,-6.5,1.8,-8,0,1.6,-8],
[.455,-6.5,3,-3.1,-8.85,1.45,-8.3],[.49,-8.4,3.1,-3.6,-8.85,1.45,-8.3],[.518,-11.4,3.35,-2.35,-12.4,2.7,-7.8],[.535,-13.15,3.65,-1.05,-14.55,3.65,-8],[.56,-13.38,3.72,-.95,-14.55,3.65,-8],[.585,-13.6,3.84,-1.12,-14.55,3.7,-8],[.601,-13.65,4.05,-1.2,-14.55,3.85,-8],[.62,-13.15,7.75,-5.1,-7.8,7.55,-8],
[.66,-9,8,-6,-4,8,-9],[.72,-4.5,8,-5.5,0,8,-9],[.76,0,8,-5,4,8,-10],[.80,3.5,8,-8,9,8,-8],[.83,5.1,8,-4.5,9,7.6,-8],[.85,9,8,-2.5,9,7.6,-8],[.88,12.9,8,-4.5,9,7.6,-8],
[.90,14.5,8,-8,12,7.6,-8],[.92,13.5,8.4,-2.5,16.4,7.6,-9],[.945,13,9.5,-3,15,7.8,-10],[.965,12,15,0,4,6,-6],[.985,13,14,18,2,5,0],[1,22,5.4,33,0,5.2,0]];
KS.forEach(function(k){k.v=k.slice(1);k.m=[0,0,0,0,0,0]});
KS.forEach(function(k,i){if(!i||i===KS.length-1)return;var a=KS[i-1],b=KS[i+1];for(var c=0;c<6;c++)k.m[c]=(b.v[c]-a.v[c])/(b[0]-a[0])});
var cp=new THREE.Vector3(),cl2=new THREE.Vector3(),tv=[0,0,0,0,0,0];
function path(p){var i=0;while(i<KS.length-2&&p>KS[i+1][0])i++;var a=KS[i],b=KS[i+1],h=b[0]-a[0],t=cl((p-a[0])/h,0,1),t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
 for(var c=0;c<6;c++)tv[c]=h00*a.v[c]+h10*h*a.m[c]+h01*b.v[c]+h11*h*b.m[c];cp.set(tv[0],tv[1],tv[2]);cl2.set(tv[3],tv[4],tv[5])}

/* sizing */
var W=1,H=1;
function resize(){nav=document.querySelector('#navbar-container .navbar');navHeight=nav?nav.offsetHeight:64;root.style.setProperty('--intel-nav',navHeight+'px');W=stage.clientWidth;H=stage.clientHeight;if(!W||!H)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.3,Math.sqrt(1000000/(W*H))));renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();}
var ro=window.ResizeObserver?new ResizeObserver(resize):null;if(ro){ro.observe(stage);if(nav)ro.observe(nav);}else addEventListener('resize',resize);resize();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(resize);
var navbarHost=document.getElementById('navbar-container');
var navbarObserver=navbarHost?new MutationObserver(function(){
  resize();
  if(nav&&ro)ro.observe(nav);
}):null;
if(navbarObserver)navbarObserver.observe(navbarHost,{childList:true});

/* frame */
var clock=new THREE.Clock(),sp=readP(),raf=0;
function update(dt,t){
 var target=readP();sp=reduce?target:sp+(target-sp)*(1-Math.exp(-dt*8));
 if(sp>=.41&&sp<=.57)animateSorter(sp);
 path(sp);cam.position.copy(cp);cam.lookAt(cl2);
 var fov=42+14*ss(.2,.26,sp)*(1-ss(.94,.965,sp))+(cam.aspect<1?10:0);if(Math.abs(fov-cam.fov)>.01){cam.fov=fov;cam.updateProjectionMatrix()}
 var drift=reduce?0:t*.3;
 /* door, lift, roof, light */
 skyCube.rotation.set(.5,reduce?.6:t*.4,.2);skyCube.position.y=21+(reduce?0:Math.sin(t)*.3);door.position.y=2.55+5.2*ss(.135,.225,sp);lift.position.y=.1+Y1*ss(.535,.60,sp);
 roof.material.opacity=1-ss(.94,.96,sp);roof.visible=roof.material.opacity>.02;
 ambL.intensity=1.4*ss(.25,.3,sp)*(1-ss(.5,.58,sp));
 /* hero + belt */
 var hp=heroAt(sp),bob=reduce?0:Math.sin(t*1.6)*.06+.02;var hov=.35*ss(.62,.66,sp)*(1-ss(.78,.8,sp));
 hero.position.set(hp[0],hp[1]+hov+bob*(hov>0?1:0),hp[2]);hero.rotation.y=reduce?.3:(hov>0?t*.5:0);
 ring.visible=sp>.62&&sp<.8;ring.position.copy(hero.position);ring.position.y+=.1;ring.rotation.set(reduce?1.2:t*1.3,0,.4);
 beltT.offset.y=md(-(sp*60+drift)/1.1,1);
 var dispatchDistance=ss(.87,.96,sp)*8.5+(reduce?0:t*.95);
 dispatchTexture.offset.y=md(dispatchDistance*.8,1);
 dispatchParcels.forEach(function(parcel,i){
    var z=-12+md(i*3.12+dispatchDistance,9);
    parcel.mesh.position.set(16.4,Y1+.558+parcel.height/2,z);
    parcel.mesh.visible=sp>=.875&&sp<.97&&(
        Math.abs(hp[0]-16.4)>.8||Math.abs(z-hp[2])>(parcel.depth+.9)/2+.15
    );
 });
 var D=sp*60+drift;BC.forEach(function(c){var z=-2+md(c.b+2-D,28);var s=cl((z+2)/1.5,0,1)*cl((26-z)/1.2,0,1);c.g.scale.setScalar(Math.max(s,.001));c.g.position.set(13,.71+.3*s,z);if(sp>.25)c.g.visible=false;else c.g.visible=Math.abs(z-hp[2])>1.3});
 /* recs, motes, inventory morph */
 var ro2=ss(.72,.745,sp)*(1-ss(.79,.81,sp));outl.forEach(function(o,i){o.material.opacity=ro2*(.65+.35*(reduce?1:Math.sin(t*2+i)))});
 motes.material.opacity=.7*ss(.6,.64,sp)*(1-ss(.8,.83,sp));
 var mt=ss(.81,.87,sp);if(mt!==lastMt){lastMt=mt;for(var i=0;i<inv.length;i++){col.copy(invA[i]).lerp(invB[i],mt);bxM.setColorAt(inv[i].i,col)}bxM.instanceColor.needsUpdate=true}
 /* copy + progress */
 setScene(sceneFor(target));updateJourneyHud(target);$('stock-intel-hint').style.opacity=target>.02?0:1;
 updateFloorPanels(sp);
}
var lastMt=-1;
var visible=true, elapsed=0;
function schedule(){if(!raf && visible && !document.hidden)raf=requestAnimationFrame(frame);}
function frame(){raf=0;if(!visible||document.hidden)return;var dt=Math.min(clock.getDelta(),.05);elapsed+=dt;update(dt,elapsed);renderer.render(scene,cam);schedule();}
var observer=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;schedule();});
observer.observe(pin);document.addEventListener('visibilitychange',schedule);schedule();
addEventListener('pagehide',function(event){if(event.persisted)return;cancelAnimationFrame(raf);observer.disconnect();if(navbarObserver)navbarObserver.disconnect();document.removeEventListener('visibilitychange',schedule);if(ro)ro.disconnect();else removeEventListener('resize',resize);scene.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){if(m.map)m.map.dispose();m.dispose()})});renderer.dispose()});
})();
