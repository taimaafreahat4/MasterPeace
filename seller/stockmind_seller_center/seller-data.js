(() => {
  "use strict";
  const LISTINGS_KEY = "stockMindMarketplaceListings";
  const INVENTORY_KEY = "stockMindInventory";
  const money = amount => `JOD ${Number(amount || 0).toFixed(2)}`;
  const sampleListings = [
    {id:"demo-101",name:"Wireless Mouse",category:"Electronics",condition:"New",quantity:120,price:5,minOrder:10,description:"Bulk stock available for retailers.",location:"Amman, Jordan",seller:"Tech Corner",image:"https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()},
    {id:"demo-102",name:"LED Bulbs",category:"Electronics",condition:"New",quantity:250,price:2,minOrder:20,description:"Energy-saving LED bulbs. Wholesale quantity available.",location:"Irbid, Jordan",seller:"Bright Home",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()},
    {id:"demo-103",name:"Storage Organizer",category:"Home & Living",condition:"New",quantity:45,price:7.5,minOrder:5,description:"Surplus home storage stock.",location:"Zarqa, Jordan",seller:"Home Basics",image:"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()}
  ];
  const sampleInventory = [
    {id:"inv-1",name:"Electric Heater",category:"Home & Living",condition:"New",purchased:100,sold:25,unitCost:20,sellPrice:35,days:60,location:"Amman, Jordan",image:"https://images.unsplash.com/photo-1618941716939-862b2d1a5f9b?auto=format&fit=crop&w=700&q=80"},
    {id:"inv-2",name:"Wireless Mouse",category:"Electronics",condition:"New",purchased:150,sold:120,unitCost:3.2,sellPrice:5,days:18,location:"Amman, Jordan",image:"https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=700&q=80"},
    {id:"inv-3",name:"LED Bulbs",category:"Electronics",condition:"New",purchased:200,sold:110,unitCost:1.1,sellPrice:2,days:35,location:"Zarqa, Jordan",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80"},
    {id:"inv-4",name:"Electric Fan",category:"Home & Living",condition:"New",purchased:90,sold:30,unitCost:8,sellPrice:12,days:48,location:"Amman, Jordan",image:"https://images.unsplash.com/photo-1581279797859-5f5a8d3c1b6d?auto=format&fit=crop&w=700&q=80"}
  ];
  function read(key, fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
  function write(key, value){localStorage.setItem(key, JSON.stringify(value))}
  function getListings(){
    const marketplace=read(LISTINGS_KEY,null); const oldSeller=read("sellerProducts",[]);
    let listings=Array.isArray(marketplace)?marketplace:null;
    if(!listings){listings=sampleListings.slice();}
    if(Array.isArray(oldSeller)) oldSeller.forEach(p=>{if(p && p.name && !listings.some(x=>x.id===p.id)) listings.unshift(normalizeSellerProduct(p));});
    if(!localStorage.getItem(LISTINGS_KEY)) write(LISTINGS_KEY,listings);
    return listings;
  }
  function normalizeSellerProduct(p){return {id:p.id||`seller-${Date.now()}`,name:p.name||"Untitled product",category:p.category||"Other",condition:p.condition||"New",quantity:Number(p.quantity)||1,price:Number(p.price)||0,minOrder:1,description:p.description||"",location:p.location||"Amman, Jordan",seller:p.seller||"Stock Mind Seller",image:p.image||"",dateAdded:p.dateAdded||new Date().toISOString()}}
  function saveListing(product){const rows=getListings();const clean=normalizeSellerProduct(product);const i=rows.findIndex(x=>x.id===clean.id);if(i>=0)rows[i]=clean;else rows.unshift(clean);write(LISTINGS_KEY,rows);return clean}
  function getInventory(){let rows=read(INVENTORY_KEY,null);if(!Array.isArray(rows)){rows=sampleInventory;write(INVENTORY_KEY,rows)}return rows}
  window.StockMindSellerData={LISTINGS_KEY,INVENTORY_KEY,money,read,write,getListings,getInventory,saveListing,normalizeSellerProduct};
})();
