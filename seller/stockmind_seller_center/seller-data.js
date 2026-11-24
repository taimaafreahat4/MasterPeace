(() => {
  "use strict";
  const LISTINGS_KEY = "stockMindMarketplaceListings";
  const money = amount => `JOD ${Number(amount || 0).toFixed(2)}`;
  const imagesRoot = new URL("../../Images/", document.currentScript.src);
  const localPhotos = (...paths) => paths.map(path => new URL(path, imagesRoot).href);
  const sampleListings = [
    {
      id: "clothing-001", name: "Classic T-Shirt", category: "Clothes", seller: "Stock Mind",
      quantity: 120, price: 6, oldPrice: 9, minOrder: 20, badge: "Trends",
      colors: ["#111111", "#ffffff", "#d9d9d9"],
      images: localPhotos("clothes/G74258s.webp", "clothes/G74258s2.webp", "clothes/G74258s4.webp", "clothes/G74258s5.webp")
    },
    {
      id: "cosmetics-001", name: "Cosmetic Product", category: "Cosmetics", seller: "Stock Mind",
      quantity: 90, price: 8, oldPrice: 12, minOrder: 10, badge: "Trends",
      colors: ["#111111", "#d9b08c", "#e8c7b8"],
      images: localPhotos("cosmatics/p1.png", "cosmatics/p2.png", "cosmatics/p3.png", "cosmatics/p4.png")
    },
    {
      id: "electronics-001", name: "Electronic Product", category: "Electronics", seller: "Stock Mind",
      quantity: 50, price: 25, oldPrice: 35, minOrder: 5, badge: "Trends",
      colors: ["#111111", "#ffffff", "#808080"],
      images: localPhotos("electronic/p1.jpg", "electronic/p2.jpg", "electronic/p3.jpg", "electronic/p4.jpg")
    },
    {
      id: "home-001", name: "Home & Living Product", category: "Home & Living", seller: "Stock Mind",
      quantity: 30, price: 25, oldPrice: 35, minOrder: 1, badge: "Trends",
      colors: ["#d9d0c3", "#ffffff", "#808080"],
      images: localPhotos("home/m1.avif", "home/m2.avif", "home/m3.avif", "home/m4.avif")
    },
    {id:"demo-101",name:"Wireless Mouse",category:"Electronics",condition:"New",quantity:120,price:5,minOrder:10,description:"Bulk stock available for retailers.",location:"Amman, Jordan",seller:"Tech Corner",image:"https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()},
    {id:"demo-102",name:"LED Bulbs",category:"Electronics",condition:"New",quantity:250,price:2,minOrder:20,description:"Energy-saving LED bulbs. Wholesale quantity available.",location:"Irbid, Jordan",seller:"Bright Home",image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()},
    {id:"demo-103",name:"Storage Organizer",category:"Home & Living",condition:"New",quantity:45,price:7.5,minOrder:5,description:"Surplus home storage stock.",location:"Zarqa, Jordan",seller:"Home Basics",image:"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=80",dateAdded:new Date().toISOString()}
  ];
  function read(key, fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
  function write(key, value){localStorage.setItem(key, JSON.stringify(value))}
  function seedDemoListings() {
    const saved = read(LISTINGS_KEY, []);
    const listings = Array.isArray(saved) ? saved : [];
    let changed = false;
    for (const sample of sampleListings) {
      const index = listings.findIndex(item => item?.id === sample.id);
      const existing = listings[index];
      if (existing?.demoListing === true) continue;

      const demo = normalizeSellerProduct({
        ...sample,
        image: sample.image || sample.images?.[0],
        ...existing,
        demoListing: true,
        sellerListed: true,
        sellerId: "stockmind-demo-catalog",
        sellerEmail: "",
        approvalStatus: existing?.approvalStatus || "approved"
      });
      if (index === -1) listings.push(demo);
      else listings[index] = demo;
      changed = true;
    }
    if (changed) write(LISTINGS_KEY, listings);
    return listings;
  }

  function currentSeller(){const user=read("stockMindUser",null);return user?.loggedIn&&String(user.role||"").toLowerCase()==="seller"?user:null}
  function currentSellerEmail(){return String(currentSeller()?.email||"").trim().toLowerCase()}
  function getListings(){
    const listings = seedDemoListings();
    const oldSeller = read("sellerProducts", []);
    if(Array.isArray(oldSeller)) oldSeller.forEach(p=>{if(p && p.name && !listings.some(x=>x.id===p.id)) listings.unshift(normalizeSellerProduct(p));});
    return listings.filter(Boolean).map(normalizeSellerProduct);
  }
  function normalizeSellerProduct(p){const sellerListed=Boolean(p.sellerListed);const rawQuantity=Number(p.quantity);return {...p,id:p.id||`seller-${Date.now()}`,name:p.name||"Untitled product",category:p.category||"Other",condition:p.condition||"New",quantity:Number.isFinite(rawQuantity)?Math.max(0,rawQuantity):1,price:Number(p.price)||0,minOrder:Math.max(1,Number(p.minOrder)||1),sellingMethod:p.sellingMethod==="whole_lot"?"whole_lot":"regular",lotPrice:p.sellingMethod==="whole_lot"?Number(p.lotPrice)||0:null,status:p.status||"available",approvalStatus:p.approvalStatus||(sellerListed?"pending_review":"approved"),sellerListed, sellerId:p.sellerId|| (sellerListed?"seller-main":""),sellerEmail:String(p.sellerEmail|| (sellerListed&&!p.demoListing?"seller@stockmind.com":"")).toLowerCase(),description:p.description||"",location:p.location||"Amman, Jordan",seller:p.seller||"Stock Mind Seller",image:p.image||"",dateAdded:p.dateAdded||new Date().toISOString()}}
  function saveListing(product){const rows=getListings();const clean=normalizeSellerProduct(product);const i=rows.findIndex(x=>x.id===clean.id);if(i>=0)rows[i]=clean;else rows.unshift(clean);write(LISTINGS_KEY,rows);return clean}
  function getCurrentSellerListings(){const owner=currentSellerEmail();return getListings().filter(item=>item.sellerListed&&String(item.sellerEmail||"").toLowerCase()===owner)}
  try { seedDemoListings(); }
  catch (error) { console.warn("Could not initialize marketplace demo listings.", error); }

  window.StockMindSellerData={LISTINGS_KEY,money,read,write,getListings,getCurrentSellerListings,currentSeller,currentSellerEmail,saveListing,normalizeSellerProduct};
})();
