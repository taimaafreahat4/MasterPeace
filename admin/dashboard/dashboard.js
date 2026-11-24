(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const read = key => { try { const data = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(data) ? data : []; } catch { return []; } };
  const esc = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const date = value => { const parsed = new Date(value || ""); return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString(undefined,{month:"short",day:"numeric"}); };

  function render() {
    const products = read("stockMindMarketplaceListings").filter(item => item?.sellerListed);
    const pendingProducts = products.filter(item => (item.approvalStatus || "pending_review") === "pending_review");
    const approvedProducts = products.filter(item => item.approvalStatus === "approved");
    const feedbackRows = ["stockMindFeedbacks","stockMindSiteFeedback"].flatMap(key=>read(key).map(item=>({...item,_key:key})));
    const feedback = [...new Map(feedbackRows.map(item=>[String(item.id || item.orderId || `${item._key}-${item.createdAt}`),item])).values()];
    const pendingFeedback = feedback.filter(item=>!item.approvalStatus || item.approvalStatus === "pending_review");
    const orders = read("stockMindOrders").sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));

    $("pendingProductCount").textContent = pendingProducts.length.toLocaleString();
    $("approvedProductCount").textContent = approvedProducts.length.toLocaleString();
    $("pendingFeedbackCount").textContent = pendingFeedback.length.toLocaleString();
    $("orderCount").textContent = orders.length.toLocaleString();

    const productBody = $("pendingProductsTable");
    productBody.innerHTML = pendingProducts.slice(0,6).map(item=>`<tr><td><strong>${esc(item.name || "Untitled product")}</strong></td><td>${esc(item.seller || "Seller")}</td><td>${esc(item.category || "Other")}</td><td>${date(item.dateAdded)}</td></tr>`).join("");
    $("productsQueueEmpty").hidden = pendingProducts.length > 0;

    const feedbackPreview = $("pendingFeedbackPreview");
    feedbackPreview.innerHTML = pendingFeedback.slice(0,4).map(item=>`<article class="feedback-preview-item"><div class="feedback-preview-top"><span>${esc(item.name || "Stock Mind member")}</span><time>${date(item.submittedAt || item.createdAt)}</time></div><p>${esc(item.review || item.message || `${Number(item.rating)||0}-star order rating`)}</p></article>`).join("");
    $("feedbackQueueEmpty").hidden = pendingFeedback.length > 0;

    const orderBody = $("recentOrdersTable");
    orderBody.innerHTML = orders.slice(0,8).map(order=>`<tr><td><strong>#${esc(order.orderId || "—")}</strong></td><td>${esc(order.customer?.fullName || "Buyer")}</td><td>JOD ${Number(order.total||0).toFixed(2)}</td><td><span class="queue-status">${esc(order.status || "Processing")}</span></td></tr>`).join("");
    $("ordersEmpty").hidden = orders.length > 0;
  }

  render();
  window.addEventListener("storage",render);
  ["stockMindListingsUpdated","stockMindFeedbackUpdated","stockMindOrdersUpdated"].forEach(name=>window.addEventListener(name,render));
})();
