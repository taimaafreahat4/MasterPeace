(() => {
  "use strict";
  const LISTINGS_KEY = "stockMindMarketplaceListings";
  const money = amount => `JOD ${Number(amount || 0).toFixed(2)}`;
  const sampleListings = [
    {id:"demo-101",name:"Wireless Mouse",category:"Electronics",condition:"New",quantity:120,price:5,minOrder:10,description:"Bulk stock available for retailers.",location:"Amman, Jordan",seller:"Tech Corner",image:"https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()},
    {id:"demo-102",name:"LED Bulbs",category:"Electronics",condition:"New",quantity:250,price:2,minOrder:20,description:"Energy-saving LED bulbs. Wholesale quantity available.",location:"Irbid, Jordan",seller:"Bright Home",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()},
    {id:"demo-103",name:"Storage Organizer",category:"Home & Living",condition:"New",quantity:45,price:7.5,minOrder:5,description:"Surplus home storage stock.",location:"Zarqa, Jordan",seller:"Home Basics",image:"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()}
  ];
  function read(key, fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
  function write(key, value){localStorage.setItem(key, JSON.stringify(value))}
  function currentSeller(){const user=read("stockMindUser",null);return user?.loggedIn&&String(user.role||"").toLowerCase()==="seller"?user:null}
  function currentSellerEmail(){return String(currentSeller()?.email||"").trim().toLowerCase()}
  function getListings(){
    const marketplace=read(LISTINGS_KEY,null); const oldSeller=read("sellerProducts",[]);
    let listings=Array.isArray(marketplace)?marketplace:null;
    if(!listings){listings=sampleListings.slice();}
    if(Array.isArray(oldSeller)) oldSeller.forEach(p=>{if(p && p.name && !listings.some(x=>x.id===p.id)) listings.unshift(normalizeSellerProduct(p));});
    listings=listings.map(p=>normalizeSellerProduct(p));
    if(!localStorage.getItem(LISTINGS_KEY)) write(LISTINGS_KEY,listings);
    return listings;
  }
  function normalizeSellerProduct(p){const sellerListed=Boolean(p.sellerListed);const rawQuantity=Number(p.quantity);return {id:p.id||`seller-${Date.now()}`,name:p.name||"Untitled product",category:p.category||"Other",condition:p.condition||"New",quantity:Number.isFinite(rawQuantity)?Math.max(0,rawQuantity):1,price:Number(p.price)||0,minOrder:Math.max(1,Number(p.minOrder)||1),sellingMethod:p.sellingMethod==="whole_lot"?"whole_lot":"regular",lotPrice:p.sellingMethod==="whole_lot"?Number(p.lotPrice)||0:null,status:p.status||"available",approvalStatus:p.approvalStatus||"approved",sellerListed, sellerId:p.sellerId|| (sellerListed?"seller-main":""),sellerEmail:String(p.sellerEmail|| (sellerListed?"seller@stockmind.com":"")).toLowerCase(),description:p.description||"",location:p.location||"Amman, Jordan",seller:p.seller||"Stock Mind Seller",image:p.image||"",dateAdded:p.dateAdded||new Date().toISOString()}}
  function saveListing(product){const rows=getListings();const clean=normalizeSellerProduct(product);const i=rows.findIndex(x=>x.id===clean.id);if(i>=0)rows[i]=clean;else rows.unshift(clean);write(LISTINGS_KEY,rows);return clean}
  function getCurrentSellerListings(){const owner=currentSellerEmail();return getListings().filter(item=>item.sellerListed&&String(item.sellerEmail||"").toLowerCase()===owner)}
  window.StockMindSellerData={LISTINGS_KEY,money,read,write,getListings,getCurrentSellerListings,currentSeller,currentSellerEmail,saveListing,normalizeSellerProduct};
})();
