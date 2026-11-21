(function(){'use strict';
var $=function(i){return document.getElementById(i)},reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function cl(v,a,b){return Math.max(a,Math.min(b,v))}
function ss(a,b,x){var t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function lp(a,b,t){return a+(b-a)*t}
function md(a,n){return((a%n)+n)%n}
var root=$('stock-intel-track'), pin=$('stock-intel-app'), nav=document.querySelector('#navbar-container .navbar');
var navHeight=nav ? nav.offsetHeight : 64;
function maxS(){return Math.max(1,root.offsetHeight-pin.offsetHeight)}
function readP(){return cl((navHeight-root.getBoundingClientRect().top)/maxS(),0,1)}

/* ---------- story copy ---------- */
var CB1=['Explore the Warehouse|0.1','Discover StockMind|0.52'],CB2=['Get Started|0.99','Explore Marketplace|0.9'];
var SC=[
[0,.08,'STOCKMIND / INVENTORY INTELLIGENCE','Smarter inventory.<br><em>Stronger business.</em>','Predict demand. Manage smarter. Turn surplus into opportunity.',CB1],
[.08,.26,'THE JOURNEY BEGINS','Every product starts with a decision.','But not every purchasing decision leads to a sale.'],
[.27,.45,'THE PROBLEM','More stock.<br><em>Less certainty.</em>','Products sit unsold. Storage costs rise. Capital stays trapped on the shelves.'],
[.45,.52,'BEFORE STOCKMIND','Buying more shouldn’t mean risking more.','Without demand insights, today’s purchasing decision can become tomorrow’s excess inventory.'],
[.52,.61,'THE STOCKMIND SOLUTION','From inventory chaos<br><em>to intelligent decisions.</em>','StockMind turns inventory information into actionable business intelligence.'],
[.61,.72,'AI DEMAND FORECASTING','Know what could sell.<br><em>Before you buy.</em>','Forecasts informed by location, seasonality, customer behavior and sales patterns.'],
[.72,.8,'SMART RECOMMENDATIONS','Buy with insight.<br><em>Not just instinct.</em>','Guidance designed to help reduce overstocking and support more confident decisions.'],
[.8,.885,'INVENTORY INTELLIGENCE','Know what to keep.<br><em>Know what to sell.</em>','Understand your stock. Unlock better decisions.'],
[.885,.955,'STOCKMIND MARKETPLACE','One seller’s surplus.<br><em>Another seller’s opportunity.</em>','List surplus, discover stock, and connect products with the people who need them.'],
[.955,1.01,'BUY. SELL. CONNECT.','Smarter inventory.<br><em>Stronger business.</em>','Forecast demand. Optimize stock. Unlock the value of surplus inventory.',CB2]];
/* [from,to,anchor(x,y,z | 'hero'),side,title,text,class] */
var CD=[
[.31,.37,[0,4.7,-9],1,'Unsold Inventory','Products that remain on shelves longer than expected.','warn'],
[.34,.40,[3.3,1.6,-8.2],-1,'Storage Costs','Every unused shelf takes up valuable space.','warn'],
[.37,.43,[0,3.9,-7.2],1,'Locked Capital','Money invested in products that have not sold.','warn'],
[.40,.45,[-3.3,1.6,-6.2],-1,'Uncertain Demand','Purchasing decisions without clear demand insights.','warn'],
[.46,.52,[-8,3.4,-10],1,'<span class="tag">Sample data</span><br>Demand: Lower than expected','Inventory status: Excess stock<br>Storage pressure: Increasing','warn'],
[.615,.67,[-6,8.2,-8],-1,'Location Intelligence','Understand demand patterns across different locations.'],
[.63,.685,[-6,7.2,-8],1,'Seasonal Trends','See how timing and seasonality may influence demand.'],
[.645,.70,[-6,7.6,-8],-1,'Customer Insights','Identify patterns in customer purchasing behavior.'],
[.66,.72,[-6,7.6,-8],1,'Demand Forecasts','Estimate future demand before committing to new stock.'],
[.67,.73,[-6,7.4,-8],1,'PANEL','','wide'],
[.725,.775,[1.45,9.45,-11.5],1,'Demand Opportunity','Discover products with promising demand signals.','good'],
[.735,.785,[.35,6.85,-11.5],-1,'Inventory Risk','Identify products with potential overstocking risk.','warn'],
[.75,.795,[3.65,8.15,-11.5],1,'Suggested Quantity','Data-informed guidance on how much stock to consider.'],
[.805,.86,[9,9.4,-9.6],1,'Slow-Moving Stock','Identify products that may need attention.','warn'],
[.825,.875,[9,7.6,-6.4],-1,'Storage Efficiency','Make better use of valuable warehouse space.'],
[.845,.88,[9,9.9,-6.4],1,'Smart Promotions','Explore discount and promotional recommendations.','good'],
[.895,.95,'hero',1,'LISTING','','wide'],
[.915,.95,[16.4,8.2,-6],-1,'Buy by Quantity · Buy the Whole Lot','Choose the units you need, or purchase the complete lot. For businesses and individuals.']];

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
var stops=[
 [0,'Overview','The fulfillment center','Follow a package from the loading dock through inventory, forecasting and the marketplace.'],
 [.08,'Receiving','Goods arrive on the belt','A moving conveyor takes the package into the receiving area.'],
 [.27,'Inventory','Understand the cost of excess','See where unsold stock ties up space and capital.'],
 [.61,'Forecasting','Estimate demand before you buy','Explore the demand signals that inform a purchasing decision.'],
 [.72,'Stock insights','Decide what to keep or sell','Turn recommendations into practical steps for your inventory.'],
 [.885,'Marketplace','Give surplus a second destination','Browse available products or sell stock by quantity or as a whole lot.']
];
function updateJourneyHud(p){
  if(hudProgress)hudProgress.style.transform='scaleX('+p+')';
  var index=0;
  for(var j=1;j<stops.length;j++){if(p>=stops[j][0])index=j;}
  if(index===hudIndex)return;
  hudIndex=index;
  var entry=stops[index];
  $('intel-chapter-label').textContent=entry[1];
  $('intel-chapter-title').textContent=entry[2];
  $('intel-chapter-summary').textContent=entry[3];
  hudButtons.forEach(function(b,i){if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
}
function sceneFor(p){for(var i=0;i<SC.length;i++)if(p>=SC[i][0]&&p<SC[i][1])return i;return -1}
root.addEventListener('click',function(e){
 var b=e.target.closest('[data-p]');if(!b)return;
 var p=parseFloat(b.dataset.p);
 if(!renderer)return;
 window.scrollTo({top:window.scrollY+root.getBoundingClientRect().top-navHeight+p*maxS(),behavior:reduce?'auto':'smooth'});
});

/* ---------- cards ---------- */
var cardsEl=$('stock-intel-cards'),linesEl=$('stock-intel-lines'),NS='http://www.w3.org/2000/svg';
var PANEL='<span class="tag">Illustrative data</span><h4>Wireless Headphones</h4><svg viewBox="0 0 220 84" aria-hidden="true"><path d="M0 80H220" stroke="rgba(196,181,253,.2)" fill="none"/><path class="gr2" pathLength="1" d="M0 70C40 68 70 58 100 56S150 46 220 38"/><path class="gr" pathLength="1" d="M0 72C30 66 50 50 80 52S130 30 160 26 200 16 220 8"/></svg><div class="row"><span>Estimated demand</span><b>Rising</b></div><div class="row"><span>Seasonal peak</span><b>Q4</b></div><div class="row"><span>Suggested stock</span><b>180–240 units</b></div><div class="row"><span>Forecast uncertainty</span><b>Moderate</b></div>';
var LIST='<span class="tag">Sample listing</span><div><div class="thumb"></div><h4>Wireless Headphones</h4><p>Qty 240 · $18.50 / unit</p></div><div class="row" style="clear:both"><span>Type</span><b>Quantity or whole lot</b></div><div class="row"><span>Seller</span><b>Sample seller</b></div>';
var CARDS=CD.map(function(c){var el=document.createElement('div');el.className='card '+(c[6]||'');
 el.innerHTML=c[4]==='PANEL'?PANEL:c[4]==='LISTING'?LIST:(c[4].indexOf('<')>-1?'<h4 style="display:none"></h4>':'')+(c[4].indexOf('<')>-1?c[4].replace('<br>','<h4>')+'</h4><p>'+c[5]+'</p>':'<h4>'+c[4]+'</h4><p>'+c[5]+'</p>');
 cardsEl.appendChild(el);var ln=document.createElementNS(NS,'line'),dt=document.createElementNS(NS,'circle');dt.setAttribute('r',3.5);linesEl.appendChild(ln);linesEl.appendChild(dt);
 return{a:c[0],b:c[1],at:c[2],side:c[3],el:el,ln:ln,dt:dt,w:0,h:0}});

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
var bxM=new THREE.InstancedMesh(BOX,M(0xffffff,0,.85),2600),frM=new THREE.InstancedMesh(BOX,M(0xffffff,.6,.4),1200),nb=0,nf=0,tmp=new THREE.Object3D(),col=new THREE.Color();
function addI(m,n,x,y,z,w,h,d,c,ry){tmp.position.set(x,y,z);tmp.rotation.set(0,ry||0,0);tmp.scale.set(w,h,d);tmp.updateMatrix();m.setMatrixAt(n,tmp.matrix);m.setColorAt(n,col.set(c))}
function addBox(x,y,z,w,h,d,c,ry){addI(bxM,nb,x,y,z,w,h,d,c,ry);return nb++}
function addFr(x,y,z,w,h,d,c){addI(frM,nf++,x,y,z,w,h,d,c)}
var TANS=[0xc79a6b,0xb98a5e,0xd1a77c,0xc09263],CATS=[0xc79a6b,0xa58fd8,0x6fb7ae,0xd9a05b];
function rack(x,z,y0,o){o=o||{};var w=4.4,d=1.1,L=4,st=1.3,ids=[];
 [-1,1].forEach(function(a){[-1,1].forEach(function(b){addFr(x+a*w/2,y0+(L*st+.3)/2,z+b*d/2,.1,L*st+.3,.1,0x3b5bd0)})});
 for(var l=0;l<L;l++){var sy=y0+.2+l*st;[-1,1].forEach(function(b){addFr(x,sy,z+b*d/2,w,.1,.1,0xe08a2e)});
  for(var s=0;s<4;s++){if(r()>(o.fill==null?.9:o.fill))continue;
   var bw=.95,bh=.8,bd=.9,ry=0,oz=0,bx=x-w/2+.55+s*1.1;
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
var dockD=M(0x5a6590,.6,.4),dockS=M(0x0d1330,.3,.6),shutterRib=M(0x242d4a,.42,.46);
for(var di=0;di<8;di++){var dx=-15+di*3;B(2.7,3.9,.4,dx,1.95,.05,dockS);B(2.2,3.4,.12,dx,1.7,.28,dockD);B(1.6,.08,.05,dx,1.2,.36,lite);B(.1,3.4,.05,dx-1.2,1.7,.35,ambM);B(.1,3.4,.05,dx+1.2,1.7,.35,ambM);B(.4,.2,.3,dx,7.4,.3,lite);
 for(var rib=1;rib<=11;rib++)B(2.14,.025,.028,dx,.28+rib*.278,.351,shutterRib);
 B(2.62,.075,.14,dx,.12,.55,lite);
 (function(n){plane(1.1,.55,dx,4.5,.02,tex(128,64,function(g,w,h){g.fillStyle='#fff';g.font='700 46px Inter,sans-serif';g.textAlign='center';g.fillText('0'+n,64,48)}))})(di+1)}
/* receiving door */
var door=B(5,5.1,.14,12,2.55,-.2,M(0x7a86c0,.7,.35));
/* trucks, pallets, forklift */
var wm=M(0x0a0e22),cyl=new THREE.CylinderGeometry(.5,.5,.4,14);
function truck(x,z){var g=new THREE.Group();B(2.6,3,8,0,2.3,0,M(0xcfd4e8,.2,.5),g);B(2.5,2.2,2.2,0,1.8,5.2,M(0xe8ecfa,.2,.5),g);B(2.2,.9,.1,0,2.3,6.32,M(0x28326e,.5,.3),g);
 [-1,1].forEach(function(s){[-2.5,-.5,3,5].forEach(function(zz){var w=new THREE.Mesh(cyl,wm);w.rotation.z=Math.PI/2;w.position.set(s*1.3,.5,zz);g.add(w)})});g.position.set(x,0,z);scene.add(g)}
truck(-15,5);truck(-9,6.5);
pallet(17,9,0,3,0xcfd4e8);B(1.3,1.3,1.3,17,.85,9,MB(0xe9edff,.18));pallet(15.2,10.4,0,2);pallet(-3,12,0,2);
[-1,1].forEach(function(s){for(var k=0;k<3;k++){var c=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,1,8),M(0xe3b341,.3,.5));c.position.set(8+s*0+k*.01+(s>0?2.2:0),.5,2.6);scene.add(c)}});
var fk=new THREE.Group();B(1.3,.9,1.9,0,.7,0,M(0xe3b341,.3,.5),fk);B(.1,2.2,.1,-.4,1.2,1.1,M(0x333b66),fk);B(.1,2.2,.1,.4,1.2,1.1,M(0x333b66),fk);B(.12,.08,1.3,-.4,.15,1.7,M(0x333b66),fk);B(.12,.08,1.3,.4,.15,1.7,M(0x333b66),fk);fk.position.set(16.3,0,-5);fk.rotation.y=-2.6;scene.add(fk);
/* exterior polish: wet-asphalt glow, lamp cones, vents, windows, planters, neon loops, sky */
var glow=tex(128,128,function(g,w,h){var gr=g.createRadialGradient(64,64,2,64,64,64);gr.addColorStop(0,'rgba(150,120,255,.55)');gr.addColorStop(1,'rgba(124,58,237,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
function pool(x,z,s,o){var m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:glow,transparent:true,opacity:o,depthWrite:false,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);scene.add(m)}
for(var pi=0;pi<8;pi++)pool(-15+pi*3,3.4,5.4,.24);pool(12,7,11,.28);pool(-4,13,27,.16);
var coneG=new THREE.ConeGeometry(1.7,3.2,18,1,true),coneM=new THREE.MeshBasicMaterial({color:0xdcd8ff,transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
for(var ci=0;ci<8;ci++){var cn=new THREE.Mesh(coneG,coneM);cn.position.set(-15+ci*3,5.7,1.3);scene.add(cn)}
B(26,1.1,.05,-4.5,9.1,.03,M(0x38458f,.6,.4));for(var vi=0;vi<5;vi++)B(26,.07,.06,-4.5,8.7+vi*.2,.05,M(0x0d1330));
B(1.2,1.1,.05,15.4,2.9,.03,MB(0xf3c796));B(1.2,1.1,.05,17,2.9,.03,MB(0xf3c796));
for(var k=0;k<5;k++){var bs=new THREE.Mesh(new THREE.SphereGeometry(.45,10,8),M(0x1c5a46,0,.9));bs.position.set(14.8+k*.7,.55,2.4);scene.add(bs)}B(4,.3,.8,16.2,.15,2.4,M(0x2a3069));
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

/* interior level 0 : chaos */
var back=[-1.5,3.1,7.7,12.3];back.forEach(function(x){rack(x,-12.5,0,{fill:.8})});
rack(0,-9,0,{chaos:1,fill:1});rack(0,-7.2,0,{chaos:1,fill:1});
pallet(3.2,-8.2,0,3,0,1);pallet(-3.2,-6.2,0,2,0,1);pallet(-3.4,-9.6,0,3,0,1);pallet(4,-6.3,0,2,0,1);pallet(2.4,-5.2,0,1,0,1);
[[-9.5,-11],[-8,-11],[-6.5,-11],[-9.5,-9.5],[-8,-9.5]].forEach(function(p){pallet(p[0],p[1],0,4,0xe0b36a)});
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
var belt1=B(1.4,.3,10,16.4,Y1+.4,-7.5,M(0x111a4d,.6,.4));B(.1,.14,10,15.7,Y1+.62,-7.5,M(0x2a3890));B(.1,.14,10,17.1,Y1+.62,-7.5,M(0x2a3890));
B(2.4,.9,1.2,14.3,Y1+.45,-12.2,M(0x1a2570,.5,.4));addBox(14.3,Y1+1.2,-12.2,.7,.5,.7,0xc79a6b);addBox(16.4,Y1+.96,-2.2,.9,.8,.9,0xc79a6b);addBox(16.4,Y1+.96,-1.2,.9,.8,.9,0xd1a77c);
bxM.count=nb;frM.count=nf;bxM.instanceColor.needsUpdate=true;frM.instanceColor.needsUpdate=true;scene.add(bxM);scene.add(frM);
/* rec outlines */
var EG=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.05,.9,.98));
var outl=[[1.45,9.45,0x2DD4BF],[.35,6.85,0xF59E0B],[3.65,8.15,0x7C3AED]].map(function(p){var l=new THREE.LineSegments(EG,new THREE.LineBasicMaterial({color:p[2],transparent:true,opacity:0}));l.position.set(p[0],p[1],-11.5);scene.add(l);return l});
/* data motes + scan ring */
var DN=90,dp=new Float32Array(DN*3);for(var d=0;d<DN;d++){dp[d*3]=-12+r()*9;dp[d*3+1]=7.4+r()*3.6;dp[d*3+2]=-11+r()*8}
var dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
var motes=new THREE.Points(dg,new THREE.PointsMaterial({color:0xC4B5FD,size:3,sizeAttenuation:false,transparent:true,opacity:0}));scene.add(motes);

/* conveyor to the door */
var beltT=tex(64,64,function(g,w,h){g.fillStyle='#0a1236';g.fillRect(0,0,w,h);g.fillStyle='#26337c';for(var y=0;y<h;y+=16)g.fillRect(0,y,w,4);g.fillStyle='rgba(124,58,237,.6)';g.fillRect(0,0,3,h);g.fillRect(w-3,0,3,h)});beltT.repeat.set(1,27);
B(2,.3,30,13,.4,11,M(0x111a4d,.6,.4));
var bt=new THREE.Mesh(new THREE.PlaneGeometry(1.8,30),new THREE.MeshStandardMaterial({map:beltT,roughness:.5,metalness:.3}));bt.rotation.x=-Math.PI/2;bt.position.set(13,.56,11);scene.add(bt);
[-1,1].forEach(function(s){B(.1,.16,30,13+s*1.05,.62,11,M(0x2a3890,.7,.3));B(.03,.02,30,13+s*1.05,.71,11,MB(0x9a93d9))});
for(var lz=-2;lz<26;lz+=5)[-1,1].forEach(function(s){B(.12,.3,.12,13+s*.95,.15,lz,M(0x2a3890,.7,.3))});
var tapeM=MB(0x7C3AED);
function crate(w,h,d,tm){var g=new THREE.Group();B(w,h,d,0,0,0,M(0xc99a74,0,.85),g);B(w*.18,h*1.01,d*1.01,0,0,0,tm,g);B(w*.4,.01,d*.3,w*.2,h/2+.005,-d*.15,MB(0xe9e4da),g);scene.add(g);return g}
var hero=crate(1,.85,.9,tapeM),ring=new THREE.Mesh(new THREE.TorusGeometry(.95,.015,6,60),MB(0x2DD4BF));ring.visible=false;scene.add(ring);
var BC=[22,17,12,6,0.5].map(function(z){var g=crate(.8,.6,.8,MB(0xe9d9bf));return{g:g,b:z}});
var HW=[[0,13,.98,19],[.08,13,.98,14],[.16,13,.98,7],[.22,13,.98,1],[.27,13,.98,-3.2],[.40,13,.98,-3.2],[.50,-8,.43,-3.5],[.53,-14.6,.43,-8],[.60,-14.6,Y1+.43,-8],[.64,-6,Y1+.43,-8],[.80,-6,Y1+.43,-8],[.89,16.4,Y1+1.35,-11.5],[.92,16.4,Y1+1.35,-8],[.95,16.4,Y1+1.35,-3.2],[1.01,16.4,Y1+1.35,-3.2]];
function heroAt(p){var i=0;while(i<HW.length-2&&p>HW[i+1][0])i++;var a=HW[i],b=HW[i+1],t=ss(a[0],b[0],p);return[lp(a[1],b[1],t),lp(a[2],b[2],t),lp(a[3],b[3],t)]}

/* camera route: [p, pos xyz, look xyz] */
var KS=[[0,22,4.6,33,0,5.2,0],[.08,11,3.6,20,13,1.5,8],[.16,15.5,2.4,10,13,1.2,2],[.22,13,2.2,3.5,13,1.6,-3],[.27,11,1.9,-2.5,6,1.6,-7],
[.30,6.5,1.8,-8,0,1.6,-8],[.33,4.6,1.8,-3.4,0,1.6,-8],[.36,0,1.8,-1.8,0,1.6,-8],[.39,-4.6,1.8,-3.4,0,1.6,-8],[.42,-6.5,1.8,-8,0,1.6,-8],
[.47,-7,1.8,-5.5,-8,1.4,-10],[.51,-10,1.8,-7,-14.6,1.3,-8],[.53,-12.9,1.8,-8,-14.6,1.2,-8],[.57,-12.9,5,-8,-14.6,5,-8],[.60,-12.9,7.9,-8,-14.6,7.6,-8],[.62,-12.3,7.9,-8,-5,7.9,-8],
[.66,-9,8,-6,-4,8,-9],[.72,-4.5,8,-5.5,0,8,-9],[.76,0,8,-5,4,8,-10],[.80,3.5,8,-8,9,8,-8],[.83,5.1,8,-4.5,9,7.6,-8],[.85,9,8,-2.5,9,7.6,-8],[.88,12.9,8,-4.5,9,7.6,-8],
[.90,14.5,8,-8,12,7.6,-8],[.92,13.5,8.4,-2.5,16.4,7.6,-9],[.945,13,9.5,-3,15,7.8,-10],[.965,12,15,0,4,6,-6],[.985,13,14,18,2,5,0],[1,22,5.4,33,0,5.2,0]];
KS.forEach(function(k){k.v=k.slice(1);k.m=[0,0,0,0,0,0]});
KS.forEach(function(k,i){if(!i||i===KS.length-1)return;var a=KS[i-1],b=KS[i+1];for(var c=0;c<6;c++)k.m[c]=(b.v[c]-a.v[c])/(b[0]-a[0])});
var cp=new THREE.Vector3(),cl2=new THREE.Vector3(),tv=[0,0,0,0,0,0];
function path(p){var i=0;while(i<KS.length-2&&p>KS[i+1][0])i++;var a=KS[i],b=KS[i+1],h=b[0]-a[0],t=cl((p-a[0])/h,0,1),t2=t*t,t3=t2*t,h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
 for(var c=0;c<6;c++)tv[c]=h00*a.v[c]+h10*h*a.m[c]+h01*b.v[c]+h11*h*b.m[c];cp.set(tv[0],tv[1],tv[2]);cl2.set(tv[3],tv[4],tv[5])}

/* sizing */
var W=1,H=1;
function resize(){nav=document.querySelector('#navbar-container .navbar');navHeight=nav?nav.offsetHeight:64;root.style.setProperty('--intel-nav',navHeight+'px');W=stage.clientWidth;H=stage.clientHeight;if(!W||!H)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.3,Math.sqrt(1000000/(W*H))));renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();linesEl.setAttribute('viewBox','0 0 '+W+' '+H);
 CARDS.forEach(function(c){c.w=c.el.offsetWidth;c.h=c.el.offsetHeight})}
var ro=window.ResizeObserver?new ResizeObserver(resize):null;if(ro){ro.observe(stage);if(nav)ro.observe(nav);}else addEventListener('resize',resize);resize();
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(resize);
var navbarHost=document.getElementById('navbar-container');
var navbarObserver=navbarHost?new MutationObserver(function(){
  resize();
  if(nav&&ro)ro.observe(nav);
}):null;
if(navbarObserver)navbarObserver.observe(navbarHost,{childList:true});

/* frame */
var clock=new THREE.Clock(),sp=readP(),raf=0,pv=new THREE.Vector3();
function update(dt,t){
 var target=readP();sp=reduce?target:sp+(target-sp)*(1-Math.exp(-dt*8));
 path(sp);cam.position.copy(cp);cam.lookAt(cl2);
 var fov=42+14*ss(.2,.26,sp)*(1-ss(.94,.965,sp))+(cam.aspect<1?10:0);if(Math.abs(fov-cam.fov)>.01){cam.fov=fov;cam.updateProjectionMatrix()}
 var drift=reduce?0:t*.3;
 /* door, lift, roof, light */
 skyCube.rotation.set(.5,reduce?.6:t*.4,.2);skyCube.position.y=21+(reduce?0:Math.sin(t)*.3);door.position.y=2.55+5.2*ss(.17,.23,sp);lift.position.y=.1+Y1*ss(.53,.60,sp);
 roof.material.opacity=1-ss(.94,.96,sp);roof.visible=roof.material.opacity>.02;
 ambL.intensity=1.4*ss(.25,.3,sp)*(1-ss(.5,.58,sp));
 /* hero + belt */
 var hp=heroAt(sp),bob=reduce?0:Math.sin(t*1.6)*.06+.02;var hov=.35*ss(.62,.66,sp)*(1-ss(.78,.8,sp));
 hero.position.set(hp[0],hp[1]+hov+bob*(hov>0?1:0),hp[2]);hero.rotation.y=reduce?.3:(hov>0?t*.5:0);
 ring.visible=sp>.62&&sp<.8;ring.position.copy(hero.position);ring.position.y+=.1;ring.rotation.set(reduce?1.2:t*1.3,0,.4);
 beltT.offset.y=md(-(sp*60+drift)/1.1,1);
 var D=sp*60+drift;BC.forEach(function(c){var z=-2+md(c.b+2-D,28);var s=cl((z+2)/1.5,0,1)*cl((26-z)/1.2,0,1);c.g.scale.setScalar(Math.max(s,.001));c.g.position.set(13,.71+.3*s,z);if(sp>.25)c.g.visible=false;else c.g.visible=Math.abs(z-hp[2])>1.3});
 /* recs, motes, inventory morph */
 var ro2=ss(.72,.745,sp)*(1-ss(.79,.81,sp));outl.forEach(function(o,i){o.material.opacity=ro2*(.65+.35*(reduce?1:Math.sin(t*2+i)))});
 motes.material.opacity=.7*ss(.6,.64,sp)*(1-ss(.8,.83,sp));
 var mt=ss(.81,.87,sp);if(mt!==lastMt){lastMt=mt;for(var i=0;i<inv.length;i++){col.copy(invA[i]).lerp(invB[i],mt);bxM.setColorAt(inv[i].i,col)}bxM.instanceColor.needsUpdate=true}
 /* copy + progress */
 setScene(sceneFor(target));updateJourneyHud(target);$('stock-intel-hint').style.opacity=target>.02?0:1;
 /* cards */
 var shown=0,narrow=W<720;
 CARDS.forEach(function(c){var v=ss(c.a,c.a+.012,sp)*(1-ss(c.b-.012,c.b,sp));
  if(v<.02||(shown>=2)){c.el.style.opacity=0;c.ln.setAttribute('opacity',0);c.dt.setAttribute('opacity',0);return}
  if(c.at==='hero')pv.copy(hero.position).y+=.6;else pv.set(c.at[0],c.at[1],c.at[2]);pv.project(cam);
  if(pv.z>1||Math.abs(pv.x)>1.15||Math.abs(pv.y)>1.15){c.el.style.opacity=0;c.ln.setAttribute('opacity',0);c.dt.setAttribute('opacity',0);return}
  shown++;var ax=(pv.x*.5+.5)*W,ay=(-pv.y*.5+.5)*H,gap=narrow?24:56,cx=c.side>0?ax+gap:ax-gap-c.w;
  cx=cl(cx,10,W-c.w-10);var cy=cl(ay-c.h/2+(c.side>0?-20:30),narrow?H*.34:90,Math.max(narrow?H*.34:90,H-c.h-(narrow?128:148)));
  var ex=cx>ax?cx:cx+c.w,ey=cy+c.h/2;
  c.el.style.opacity=v;c.el.style.transform='translate('+cx.toFixed(1)+'px,'+(cy+(1-v)*14).toFixed(1)+'px)';
  c.el.style.setProperty('--dr',ss(c.a+.012,c.b-.02,sp).toFixed(3));
  var lv=ss(c.a+.004,c.a+.03,sp);c.ln.setAttribute('x1',ax);c.ln.setAttribute('y1',ay);c.ln.setAttribute('x2',lp(ax,ex,lv));c.ln.setAttribute('y2',lp(ay,ey,lv));c.ln.setAttribute('opacity',v);
  c.dt.setAttribute('cx',ax);c.dt.setAttribute('cy',ay);c.dt.setAttribute('opacity',v)})}
var lastMt=-1;
var visible=true, elapsed=0;
function schedule(){if(!raf && visible && !document.hidden)raf=requestAnimationFrame(frame);}
function frame(){raf=0;if(!visible||document.hidden)return;var dt=Math.min(clock.getDelta(),.05);elapsed+=dt;update(dt,elapsed);renderer.render(scene,cam);schedule();}
var observer=new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;schedule();});
observer.observe(pin);document.addEventListener('visibilitychange',schedule);schedule();
addEventListener('pagehide',function(event){if(event.persisted)return;cancelAnimationFrame(raf);observer.disconnect();if(navbarObserver)navbarObserver.disconnect();document.removeEventListener('visibilitychange',schedule);if(ro)ro.disconnect();else removeEventListener('resize',resize);scene.traverse(function(o){if(o.geometry)o.geometry.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){if(m.map)m.map.dispose();m.dispose()})});renderer.dispose()});
})();
