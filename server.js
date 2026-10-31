"use strict";
// Stock Mind local multi-seller demo server. Node >=18; no npm packages.
const http=require('node:http'), fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const ROOT=__dirname, DATA=path.join(ROOT,'server-data.json'), PORT=Number(process.env.PORT||3000);
const hash=(password,salt)=>crypto.scryptSync(password,salt,32).toString('hex');
function seedUser(email,password,name,role){const salt=crypto.randomBytes(16).toString('hex');return {id:email.toLowerCase(),email:email.toLowerCase(),name,role,salt,hash:hash(password,salt)};}
function initial(){return {users:[seedUser('seller@stockmind.com','Seller123','Seller One','Seller'),seedUser('seller2@stockmind.com','Seller2@123','Seller Two','Seller'),seedUser('buyer@stockmind.com','Buyer123','Default Buyer','Buyer')],listings:[],orders:[]};}
let db=fs.existsSync(DATA)?JSON.parse(fs.readFileSync(DATA,'utf8')):initial();
function persist(){const tmp=DATA+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,DATA);}
if(!fs.existsSync(DATA)) persist();
const tokens=new Map();
function send(res,status,obj){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function fail(status,message){const e=new Error(message);e.status=status;throw e;}
function user(req){const token=(req.headers.authorization||'').replace(/^Bearer /i,'');const id=tokens.get(token);return db.users.find(u=>u.id===id)||null;}
function requireUser(req){return user(req)||fail(401,'Sign in again. Your session is not active on the demo server.');}
function requireSeller(req){const u=requireUser(req);if(u.role!=='Seller')fail(403,'Seller account required');return u;}
async function json(req){let raw='';for await (const ch of req){raw+=ch;if(raw.length>100000)fail(413,'Request too large');}try{return JSON.parse(raw||'{}')}catch{fail(400,'Invalid JSON')}}
function publicUser(u){return {id:u.id,email:u.email,name:u.name,role:u.role};}
const fileTypes={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json'};
const cleanText=(v,n=200)=>String(v??'').trim().slice(0,n);
const cents=v=>Math.round(Number(v)*100);
const validInt=v=>Number.isInteger(Number(v))&&Number(v)>0;
const server=http.createServer(async(req,res)=>{try{
const url=new URL(req.url,'http://localhost');const route=url.pathname;
if(route==='/api/login'&&req.method==='POST'){
 const {email,password}=await json(req);const u=db.users.find(x=>x.email===String(email||'').toLowerCase());
 if(!u||typeof password!=='string'||!crypto.timingSafeEqual(Buffer.from(u.hash,'hex'),Buffer.from(hash(password,u.salt),'hex')))fail(401,'Incorrect email or password');
 const token=crypto.randomBytes(32).toString('hex');tokens.set(token,u.id);return send(res,200,{token,user:publicUser(u)});
}
if(route==='/api/me'&&req.method==='GET')return send(res,200,{user:publicUser(requireUser(req))});
if(route==='/api/listings'&&req.method==='GET'){
 requireUser(req);return send(res,200,{listings:db.listings});
}
if(route==='/api/listings'&&req.method==='POST'){
 const owner=requireSeller(req), p=await json(req),lot=p.sellingMethod==='whole_lot', qty=Number(p.quantity),price=Number(p.price),lotPrice=lot?Math.round(price*qty*100)/100:null,minOrder=lot?qty:Number(p.minOrder||1);
 if(!cleanText(p.name,100)||!validInt(qty)||!validInt(minOrder)||minOrder>qty||!(price>0)||!Number.isFinite(price)||lot&&!(lotPrice>0))fail(400,'Invalid listing name, quantity or price');
 const x={id:crypto.randomUUID(),ownerId:owner.id,seller:owner.name,sellerListed:true,name:cleanText(p.name,100),category:cleanText(p.category,60),condition:cleanText(p.condition,30)||'New',quantity:qty,minOrder,sellingMethod:lot?'whole_lot':'regular',price:price,lotPrice:lot?lotPrice:null,description:cleanText(p.description,500),location:cleanText(p.location,100),image:cleanText(p.image,1000),status:'available',dateAdded:new Date().toISOString()};
 db.listings.unshift(x);persist();return send(res,201,{listing:x});
}
if(route.startsWith('/api/listings/')&&req.method==='DELETE'){
 const owner=requireSeller(req),id=route.split('/').at(-1),p=db.listings.find(x=>x.id===id);
 if(!p)fail(404,'Listing not found');if(p.ownerId!==owner.id)fail(403,'You can only delete your own listings');
 if(p.status!=='available')fail(409,'Reserved or sold listing cannot be deleted');
 db.listings=db.listings.filter(x=>x.id!==id);persist();return send(res,200,{ok:true});
}
if(route==='/api/orders'&&req.method==='GET'){
 const u=requireUser(req);return send(res,200,{orders:db.orders.filter(x=>x.buyerId===u.id||x.items.some(y=>y.ownerId===u.id))});
}
if(route==='/api/orders'&&req.method==='POST'){
 const buyer=requireUser(req),p=await json(req),items=p.items;
 if(!Array.isArray(items)||!items.length||items.length>40)fail(400,'Empty or invalid cart');
 let totalCents=0;const normalized=[];const seen=new Set();
 for(const item of items){
  const id=cleanText(item.marketplaceListingId||'',100), qty=Number(item.quantity);
  if(!id){
   // Legacy Category products remain supported in the demo checkout.
   // There is no seller stock reservation for these client-side catalog products.
   const unit=Number(item.price),name=cleanText(item.name,100);
   if(!name||!validInt(qty)||!Number.isFinite(unit)||unit<0||qty>10000)fail(400,'Invalid category cart item');
   const lineCents=cents(unit)*qty;totalCents+=lineCents;
   normalized.push({id:cleanText(item.id,120),marketplaceListingId:null,ownerId:null,seller:cleanText(item.seller||'Category seller',100),name,image:cleanText(item.image,1000),quantity:qty,price:unit,lotUnits:null,sellingMethod:'regular',lineTotal:lineCents/100});
   continue;
  }
  if(seen.has(id))fail(400,'Repeated listing in cart');seen.add(id);
  const listing=db.listings.find(x=>x.id===id);
  if(!listing||listing.status!=='available')fail(409,'A product is no longer available; refresh Marketplace');
  if(listing.ownerId===buyer.id)fail(403,'You cannot purchase your own listing');
  if(!validInt(qty)||qty<1)fail(400,'Invalid quantity');
  if(listing.sellingMethod==='whole_lot'){
   if(qty!==1||Number(item.lotUnits)!==listing.quantity)fail(409,'Whole lot must be purchased as a complete package');
  } else if(qty<listing.minOrder||qty>listing.quantity)fail(409,'Requested quantity is outside available stock');
  const unit=listing.sellingMethod==='whole_lot'?listing.lotPrice:listing.price;
  const lineCents=cents(unit)*qty;totalCents+=lineCents;
  normalized.push({id:listing.id,marketplaceListingId:listing.id,ownerId:listing.ownerId,seller:listing.seller,name:listing.name,image:listing.image,quantity:qty,price:unit,lotUnits:listing.sellingMethod==='whole_lot'?listing.quantity:null,sellingMethod:listing.sellingMethod,lineTotal:lineCents/100});
 }
 const order={orderId:'SM-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex'),buyerId:buyer.id,buyerEmail:buyer.email,customer:{fullName:cleanText(p.customer?.fullName,100),address:cleanText(p.customer?.address,200),city:cleanText(p.customer?.city,100),phone:cleanText(p.customer?.phone,30)},items:normalized,subtotal:totalCents/100,commission:Math.round(totalCents*.05)/100,total:Math.round(totalCents*1.05)/100,createdAt:new Date().toISOString(),status:'Pending seller confirmation',paymentMethod:'DEMO - NO PAYMENT'};
 for(const line of normalized){if(!line.marketplaceListingId)continue;const l=db.listings.find(x=>x.id===line.id);if(l.sellingMethod==='whole_lot'){l.status='reserved';}else{l.quantity-=line.quantity;if(l.quantity===0)l.status='sold';}}
 db.orders.unshift(order);persist();return send(res,201,{order});
}
if(route.match(/^\/api\/orders\/[^/]+\/status$/)&&req.method==='PATCH'){
 const owner=requireSeller(req),id=route.split('/')[3],p=await json(req),order=db.orders.find(x=>x.orderId===id);
 if(!order)fail(404,'Order not found');if(!order.items.some(x=>x.ownerId===owner.id))fail(403,'Not your sale');
 if(!['Confirmed','Shipped','Delivered'].includes(p.status))fail(400,'Invalid status');
 order.status=p.status;persist();return send(res,200,{order});
}
if(route.startsWith('/api/'))fail(404,'Unknown endpoint');
let file;try{file=decodeURIComponent(route)}catch{fail(400,'Invalid path')}
if(file==='/'||file==='')file='/home/index.html';
const full=path.resolve(ROOT,'.'+file);if(!full.startsWith(ROOT+path.sep)||path.basename(full)==='server-data.json'||path.basename(full)==='server.js'||!fs.existsSync(full)||fs.statSync(full).isDirectory())fail(404,'Page not found');
res.writeHead(200,{'Content-Type':fileTypes[path.extname(full).toLowerCase()]||'application/octet-stream'});fs.createReadStream(full).pipe(res);
}catch(e){if(!res.headersSent)send(res,e.status||500,{error:e.message||'Server error'});}});
server.listen(PORT,()=>console.log(`Stock Mind server: http://localhost:${PORT}/login/login.html`));
