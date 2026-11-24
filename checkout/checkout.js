document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("checkoutForm");
  const summaryItems = $("summaryItems");
  const emptyCartMessage = $("emptyCartMessage");
  const formError = $("formError");
  const cardFields = $("cardFields");
  const money = amount => `JOD ${Number(amount || 0).toFixed(2)}`;

  function readAccount() {
    try {
      const account = JSON.parse(localStorage.getItem("stockMindUser") || "null");
      return account?.loggedIn === true ? account : null;
    } catch {
      return null;
    }
  }

  const account = readAccount();
  if (!account) {
    window.location.replace("../cart/cart.html");
    return;
  }

  const defaults = {fullName:account.name,email:account.email,phone:account.phone,address:account.address,city:account.city,country:account.country};
  Object.entries(defaults).forEach(([id,value]) => { if (value && $(id) && !$(id).value) $(id).value = value; });

  function readCart() {
    try {
      const data = JSON.parse(sessionStorage.getItem("stockMindCart") || "[]");
      if (!Array.isArray(data)) return [];
      const normalized = data.filter(p => p && Number.isFinite(Number(p.price)) && Number(p.price) >= 0 && Number.isInteger(Number(p.quantity)) && Number(p.quantity) > 0).map(item => {
        if (item.sellingMethod !== "whole_lot") return item;
        let unitPrice = Number(item.unitPrice);
        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
          let listings = [];
          try { listings = JSON.parse(localStorage.getItem("stockMindMarketplaceListings") || "[]"); } catch {}
          const listing = Array.isArray(listings) && listings.find(row => String(row.id) === String(item.marketplaceListingId || item.id));
          unitPrice = Number(listing?.price);
          if (!Number.isFinite(unitPrice) || unitPrice <= 0) unitPrice = Number(item.price) / Math.max(1, Number(item.lotUnits) || 1);
        }
        return {...item, unitPrice, price: unitPrice * Math.max(1, Number(item.lotUnits) || 1)};
      });
      if (JSON.stringify(normalized) !== JSON.stringify(data)) sessionStorage.setItem("stockMindCart", JSON.stringify(normalized));
      return normalized;
    } catch { return []; }
  }
  const cart = readCart();
  const subtotal = cart.reduce((sum, p) => sum + Number(p.price) * Number(p.quantity), 0);
  const commission = Math.round(subtotal * 5) / 100;
  const grandTotal = subtotal + commission;
  const units = cart.reduce((sum, p) => sum + (p.sellingMethod === "whole_lot" ? Number(p.lotUnits || 1) : Number(p.quantity)), 0);

  function renderSummary() {
    summaryItems.replaceChildren();
    cart.forEach(product => {
      const row = document.createElement("div"); row.className = "summary-item";
      const image = document.createElement("div"); image.className = "summary-product-image";
      const img = document.createElement("img"); img.src = product.image || "../images/default-product.png"; img.alt = product.name || "Product";
      img.onerror = () => { img.onerror = null; img.src = "../components/logo.png"; };
      image.append(img);
      const info = document.createElement("div");
      const name = document.createElement("div"); name.className = "summary-product-name"; name.textContent = product.name || "Marketplace product";
      const meta = document.createElement("div"); meta.className = "summary-product-meta";
      meta.textContent = product.sellingMethod === "whole_lot" ? `Complete lot · ${product.lotUnits || 1} pieces` : `Quantity: ${product.quantity}`;
      info.append(name,meta);
      const price = document.createElement("strong"); price.className = "summary-product-price"; price.textContent = money(Number(product.price) * Number(product.quantity));
      row.append(image,info,price); summaryItems.append(row);
    });
    emptyCartMessage.hidden = cart.length > 0;
    $("itemCount").textContent = `${units} unit${units === 1 ? "" : "s"}`;
    $("subtotal").textContent = money(subtotal);
    $("shipping").textContent = money(commission);
    $("total").textContent = money(grandTotal);
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = cart.length === 0;
  }

  function syncPaymentFields() {
    const method = form.querySelector('input[name="paymentMethod"]:checked')?.value || "card";
    const active = method === "card";
    cardFields.hidden = !active;
    ["cardName","cardNumber","cardExpiry","cardCvv"].forEach(id => { $(id).required = active; });
  }
  form.querySelectorAll("input,select,textarea").forEach(control => {
    const clearValidity = () => control.setCustomValidity("");
    control.addEventListener("input",clearValidity);
    control.addEventListener("change",clearValidity);
  });
  form.querySelectorAll('input[name="paymentMethod"]').forEach(input => input.addEventListener("change", syncPaymentFields));
  $("cardNumber").addEventListener("input", event => {
    const digits = event.target.value.replace(/\D/g, "").slice(0,19);
    event.target.value = digits.replace(/(\d{4})(?=\d)/g,"$1 ");
  });
  $("cardExpiry").addEventListener("input", event => {
    const digits = event.target.value.replace(/\D/g, "").slice(0,4);
    event.target.value = digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
  });
  $("cardCvv").addEventListener("input", event => { event.target.value = event.target.value.replace(/\D/g, "").slice(0,4); });

  function luhnValid(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 12 || digits.length > 19) return false;
    let sum = 0, doubleDigit = false;
    for (let i=digits.length-1; i>=0; i--) {
      let digit = Number(digits[i]);
      if (doubleDigit) { digit *= 2; if (digit > 9) digit -= 9; }
      sum += digit; doubleDigit = !doubleDigit;
    }
    return sum % 10 === 0;
  }
  function validExpiry(value) {
    if (!/^\d{2}\/\d{2}$/.test(value)) return false;
    const [month,year] = value.split("/").map(Number);
    if (month < 1 || month > 12) return false;
    const fullYear = 2000 + year;
    const end = new Date(fullYear,month,0,23,59,59,999);
    return end.getTime() >= Date.now();
  }
  function validateCheckout() {
    const name = $("fullName").value.trim();
    const email = $("email").value.trim();
    const phone = $("phone").value.trim();
    const digits = phone.replace(/\D/g,"");
    if (name.length < 2) { $("fullName").setCustomValidity("Enter your full name."); $("fullName").reportValidity(); return false; }
    $("fullName").setCustomValidity("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $("email").setCustomValidity("Enter a valid email address."); $("email").reportValidity(); return false; }
    $("email").setCustomValidity("");
    if (digits.length < 8 || digits.length > 15 || /[^+\d().\s-]/.test(phone)) { $("phone").setCustomValidity("Enter a valid phone number with 8–15 digits."); $("phone").reportValidity(); return false; }
    $("phone").setCustomValidity("");
    if ($("address").value.trim().length < 6) { $("address").setCustomValidity("Enter a complete delivery address."); $("address").reportValidity(); return false; }
    $("address").setCustomValidity("");
    if ($("city").value.trim().length < 2) { $("city").setCustomValidity("Enter a valid city."); $("city").reportValidity(); return false; }
    $("city").setCustomValidity("");
    const method = form.querySelector('input[name="paymentMethod"]:checked')?.value || "card";
    if (method === "card") {
      if ($("cardName").value.trim().length < 2) { $("cardName").setCustomValidity("Enter the name shown on the card."); $("cardName").reportValidity(); return false; }
      $("cardName").setCustomValidity("");
      if (!luhnValid($("cardNumber").value)) { $("cardNumber").setCustomValidity("Enter a valid demo card number."); $("cardNumber").reportValidity(); return false; }
      $("cardNumber").setCustomValidity("");
      if (!validExpiry($("cardExpiry").value)) { $("cardExpiry").setCustomValidity("Enter a valid future expiry date in MM/YY format."); $("cardExpiry").reportValidity(); return false; }
      $("cardExpiry").setCustomValidity("");
      if (!/^\d{3,4}$/.test($("cardCvv").value)) { $("cardCvv").setCustomValidity("Enter a 3- or 4-digit security code."); $("cardCvv").reportValidity(); return false; }
      $("cardCvv").setCustomValidity("");
    }
    if (!$("orderConsent").checked) return false;
    return form.checkValidity();
  }

  function validateListings(buyer) {
    let listings = [];
    try { listings = JSON.parse(localStorage.getItem("stockMindMarketplaceListings") || "[]"); }
    catch { return "Could not validate current marketplace stock."; }
    for (const item of cart.filter(product => product.marketplaceListingId)) {
      const listing = Array.isArray(listings) && listings.find(product => String(product.id) === String(item.marketplaceListingId));
      if (!listing || (listing.approvalStatus && listing.approvalStatus !== "approved") || listing.status === "reserved" || Number(listing.quantity) < 1) return `${item.name} is not currently approved or available. Remove it and refresh your cart.`;
      if (buyer.loggedIn && ((item.sellerEmail && String(item.sellerEmail).toLowerCase() === String(buyer.email || "").toLowerCase()) || (item.sellerId && [buyer.id,buyer.username].some(id => id && String(id).toLowerCase() === String(item.sellerId).toLowerCase())))) return `You cannot buy your own listing: ${item.name}.`;
      if (item.sellingMethod === "whole_lot") {
        const lotPrice = Number(listing.price) * Number(listing.quantity);
        if (listing.sellingMethod !== "whole_lot" || Number(item.quantity) !== 1 || Number(item.lotUnits) !== Number(listing.quantity) || Number(item.price) !== lotPrice) return `${item.name}: the listed lot changed. Remove it and add it again.`;
      } else if (Number(item.quantity) > Number(listing.quantity) || Number(item.quantity) < Number(listing.minOrder || 1) || Number(item.price) !== Number(listing.price)) return `${item.name}: stock, price, or minimum order changed. Update your cart.`;
    }
    return "";
  }

  form.addEventListener("submit", event => {
    event.preventDefault(); formError.textContent = "";
    const account = readAccount();
    if (!account) { window.location.replace("../cart/cart.html"); return; }
    if (!cart.length) { formError.textContent = "Your cart is empty. Browse products and add an item before checkout."; return; }
    if (!validateCheckout()) { if (!$("orderConsent").checked) formError.textContent = "Please confirm that you understand this is a demo order."; return; }
    const listingProblem = validateListings(account);
    if (listingProblem) { formError.textContent = listingProblem; return; }
    const method = form.querySelector('input[name="paymentMethod"]:checked')?.value || "card";
    const now = new Date();
    const estimated = new Date(now); estimated.setDate(estimated.getDate() + 4);
    const orderId = `SM-${now.getTime()}`;
    const order = {
      orderId, trackingNumber:"",
      customer:{fullName:$("fullName").value.trim(),email:$("email").value.trim().toLowerCase(),address:$("address").value.trim(),city:$("city").value.trim(),country:$("country").value,phone:$("phone").value.trim(),notes:$("notes").value.trim()},
      buyerEmail:$("email").value.trim().toLowerCase(), buyerAccountEmail:String(account.email || "").trim().toLowerCase(), buyerId:account.id || account.username || "", buyerRole:account.role || "Buyer",
      paymentMethod:method, paymentStatus:"demo-no-charge",
      items:cart.map(p=>({id:p.id,name:p.name,image:p.image,price:Number(p.price),quantity:Number(p.quantity),categoryName:p.categoryName || "Wholesale",condition:p.condition || "New",sellingMethod:p.sellingMethod || "regular",lotUnits:p.sellingMethod === "whole_lot" ? Number(p.lotUnits) : null,marketplaceListingId:p.marketplaceListingId || null,seller:p.seller || "Stock Mind Supplier",sellerId:p.sellerId || "",sellerEmail:p.sellerEmail || ""})),
      subtotal,commission,shipping:null,total:grandTotal,
      createdAt:now.toISOString(),estimatedDelivery:estimated.toISOString(),
      demoAutoDelivery:true,
      demoShippingAt:new Date(now.getTime()+3500).toISOString(),
      demoDeliveredAt:new Date(now.getTime()+12000).toISOString(),
      status:"Processing",statusHistory:[{status:"Processing",at:now.toISOString()}]
    };
    try {
      const previous = JSON.parse(localStorage.getItem("stockMindOrders") || "[]");
      const orders = Array.isArray(previous) ? previous : [];
      localStorage.setItem("stockMindOrders",JSON.stringify([order,...orders]));
      let listings = JSON.parse(localStorage.getItem("stockMindMarketplaceListings") || "[]");
      if (Array.isArray(listings)) {
        listings = listings.map(listing => {
          const line = cart.find(item=>String(item.marketplaceListingId)===String(listing.id));
          if (!line) return listing;
          if (line.sellingMethod === "whole_lot") return {...listing,status:"reserved"};
          const quantity = Math.max(0,Number(listing.quantity)-Number(line.quantity));
          return {...listing,quantity,status:quantity===0?"sold":listing.status};
        });
        localStorage.setItem("stockMindMarketplaceListings",JSON.stringify(listings));
      }
      sessionStorage.setItem("stockMindLastOrder",JSON.stringify(order));
      localStorage.setItem("stockMindLastOrder",JSON.stringify(order));
      sessionStorage.removeItem("stockMindGuestEmail");
      sessionStorage.removeItem("stockMindCart");
      window.dispatchEvent(new Event("cartUpdated"));
      window.addStockMindNotification?.({kind:"order",orderId,recipientEmail:order.buyerAccountEmail,recipientUserId:order.buyerId,title:"Order confirmed",message:`Order ${orderId} is being prepared. We’ll notify you when it’s on the way.`});
      window.location.assign(`confirmation/confirmation.html?order=${encodeURIComponent(orderId)}`);
    } catch (error) {
      console.error("Could not place demo order:",error);
      formError.textContent = "We couldn’t save your order. Check browser storage and try again.";
    }
  });

  renderSummary(); syncPaymentFields();
});
