(() => {
    "use strict";

    const LISTINGS_KEY = "stockMindMarketplaceListings";
    const FEEDBACK_KEYS = ["stockMindFeedbacks", "stockMindSiteFeedback"];
    const $ = id => document.getElementById(id);
    const read = key => {
        try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
        catch { return []; }
    };
    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const text = value => String(value ?? "");
    const escapeHTML = value => text(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
    const statusOf = item => item.approvalStatus || "pending_review";
    const dateLabel = value => {
        const date = new Date(value || "");
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, {year:"numeric",month:"short",day:"numeric"});
    };

    const productTable = $("productsTable");
    const feedbackList = $("feedbackList");
    const tabs = [...document.querySelectorAll(".moderation-tab")];
    let products = [];
    let listings = [];
    let feedback = [];

    function loadData() {
        listings = read(LISTINGS_KEY);
        products = listings.filter(item => item?.sellerListed);
        feedback = FEEDBACK_KEYS.flatMap(key => read(key).map(item => ({...item, _storageKey:key, approvalStatus:item.approvalStatus || "pending_review"})));
        const unique = new Map();
        feedback.forEach(item => unique.set(String(item.id || item.orderId || `${item._storageKey}-${item.createdAt}`), item));
        feedback = [...unique.values()];
        updateCounts();
        renderProducts();
        renderFeedback();
    }

    function updateCounts() {
        const pendingProducts = products.filter(item => statusOf(item) === "pending_review").length;
        const approvedProducts = products.filter(item => statusOf(item) === "approved" && item.sellerListed).length;
        const pendingFeedback = feedback.filter(item => statusOf(item) === "pending_review").length;
        const publicFeedback = feedback.filter(item => statusOf(item) === "approved" && item.showOnHome === true).length;
        $("pendingProductsCount").textContent = pendingProducts.toLocaleString();
        $("approvedProductsCount").textContent = approvedProducts.toLocaleString();
        $("pendingFeedbackCount").textContent = pendingFeedback.toLocaleString();
        $("publicFeedbackCount").textContent = publicFeedback.toLocaleString();
        $("productsTabCount").textContent = pendingProducts.toLocaleString();
        $("feedbackTabCount").textContent = pendingFeedback.toLocaleString();
    }

    function productMatches(item) {
        const status = $("productStatusFilter").value;
        const query = $("productSearch").value.trim().toLowerCase();
        const haystack = [item.name,item.seller,item.sellerEmail,item.category,item.location].map(text).join(" ").toLowerCase();
        return (status === "all" || statusOf(item) === status) && haystack.includes(query);
    }

    function renderProducts() {
        const rows = products.filter(productMatches).sort((a,b) => {
            const ap = statusOf(a) === "pending_review" ? 0 : 1;
            const bp = statusOf(b) === "pending_review" ? 0 : 1;
            return ap - bp || Date.parse(b.dateAdded || 0) - Date.parse(a.dateAdded || 0);
        });
        productTable.replaceChildren();
        $("productsEmpty").hidden = rows.length > 0;
        rows.forEach(item => {
            const tr = document.createElement("tr");
            const status = statusOf(item);
            const imageCell = document.createElement("td");
            const product = document.createElement("div"); product.className = "moderation-product";
            if (item.image) {
                const img = document.createElement("img"); img.src = item.image; img.alt = ""; img.loading = "lazy";
                img.onerror = () => { img.remove(); const fallback = document.createElement("span"); fallback.className = "moderation-product-placeholder"; fallback.textContent = "▦"; product.prepend(fallback); };
                product.appendChild(img);
            } else { const fallback = document.createElement("span"); fallback.className = "moderation-product-placeholder"; fallback.textContent = "▦"; product.appendChild(fallback); }
            const productCopy = document.createElement("div");
            const name = document.createElement("strong"); name.textContent = item.name || "Untitled product";
            const description = document.createElement("small"); description.textContent = item.description || item.condition || "Seller listing";
            productCopy.append(name,description); product.appendChild(productCopy); imageCell.appendChild(product);

            const sellerCell = document.createElement("td"); sellerCell.className = "seller-cell";
            const sellerName = document.createElement("strong"); sellerName.textContent = item.seller || "Seller";
            const sellerEmail = document.createElement("small"); sellerEmail.textContent = item.sellerEmail || item.sellerId || "—";
            sellerCell.append(sellerName,sellerEmail);

            const offer = document.createElement("td"); offer.className = "offer-cell";
            const price = item.sellingMethod === "whole_lot" ? Number(item.lotPrice) || Number(item.price) * Number(item.quantity) : Number(item.price) || 0;
            const priceText = document.createElement("strong"); priceText.textContent = `JOD ${price.toFixed(2)}${item.sellingMethod === "whole_lot" ? " / lot" : " / unit"}`;
            const quantityText = document.createElement("small"); quantityText.textContent = `${Number(item.quantity || 0).toLocaleString()} pieces`;
            offer.append(priceText,quantityText);

            const statusCell = document.createElement("td");
            const badge = document.createElement("span"); badge.className = `review-badge is-${status === "pending_review" ? "pending" : status}`;
            badge.textContent = status === "pending_review" ? "Waiting for review" : status === "approved" ? "Approved" : "Rejected";
            statusCell.appendChild(badge);

            const actions = document.createElement("div"); actions.className = "row-actions";
            if (status === "pending_review") {
                const approve = actionButton("Approve", "approve", "approve-product", item.id);
                const reject = actionButton("Reject", "reject", "reject-product", item.id);
                actions.append(approve,reject);
            } else if (status === "rejected") {
                const approve = actionButton("Approve", "approve", "approve-product", item.id);
                actions.appendChild(approve);
            } else {
                const reject = actionButton("Unpublish", "reject", "reject-product", item.id);
                actions.appendChild(reject);
            }

            tr.append(imageCell,sellerCell,cell(item.category || "Other"),offer,cell(dateLabel(item.dateAdded)),statusCell,actionsCell(actions));
            productTable.appendChild(tr);
        });
    }

    function cell(value) { const td = document.createElement("td"); td.textContent = value; return td; }
    function actionsCell(actions) { const td = document.createElement("td"); td.appendChild(actions); return td; }
    function actionButton(label, className, action, id) {
        const button = document.createElement("button");
        button.type = "button"; button.className = `queue-action ${className}`; button.dataset.action = action; button.dataset.id = text(id); button.textContent = label;
        return button;
    }

    function notifyUser({kind,email,userId,title,message,entityKey,entityStatus}) {
        const recipientEmail = String(email || "").trim().toLowerCase();
        if (!recipientEmail && !userId) return;
        const all = read("stockMindNotifications");
        const duplicate = all.some(item => item.entityKey === entityKey && item.entityStatus === entityStatus && item.recipientEmail === recipientEmail);
        if (duplicate) return;
        const notice = {id:`notice-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,kind,recipientEmail,recipientUserId:String(userId || ""),title,message,entityKey,entityStatus,createdAt:new Date().toISOString(),readAt:""};
        try { write("stockMindNotifications",[notice,...all].slice(0,60)); }
        catch (error) { console.warn("Could not notify the account about its review decision:",error); }
    }

    function getIdentity(item) { return String(item.id || item.orderId || ""); }
    function feedbackMatches(item) {
        const selected = $("feedbackStatusFilter").value;
        const query = $("feedbackSearch").value.trim().toLowerCase();
        const status = item.approvalStatus || "pending_review";
        const haystack = [item.name,item.email,item.role,item.message,item.review,item.category,item.orderId].map(text).join(" ").toLowerCase();
        return (selected === "all" || status === selected) && haystack.includes(query);
    }

    function renderFeedback() {
        const rows = feedback.filter(feedbackMatches).sort((a,b) => Date.parse(b.submittedAt || b.createdAt || 0) - Date.parse(a.submittedAt || a.createdAt || 0));
        feedbackList.replaceChildren();
        $("feedbackEmpty").hidden = rows.length > 0;
        rows.forEach(item => {
            const card = document.createElement("article"); card.className = "feedback-card";
            const top = document.createElement("div"); top.className = "feedback-card-top";
            const author = document.createElement("div"); author.className = "feedback-author";
            const avatar = document.createElement("span"); avatar.className = "feedback-avatar"; avatar.textContent = String(item.name || "SM").split(/\s+/).slice(0,2).map(word => word[0] || "").join("").toUpperCase();
            const authorCopy = document.createElement("div");
            const authorName = document.createElement("strong"); authorName.textContent = item.name || "Stock Mind member";
            const authorRole = document.createElement("small"); authorRole.textContent = item.email || item.role || "Website feedback";
            authorCopy.append(authorName,authorRole); author.append(avatar,authorCopy);
            const status = item.approvalStatus || "pending_review";
            const badge = document.createElement("span"); badge.className = `review-badge is-${status === "pending_review" ? "pending" : status}`; badge.textContent = status === "pending_review" ? "Waiting" : status === "approved" ? item.showOnHome ? "Public" : "Approved · private" : "Rejected";
            top.append(author,badge);

            const message = document.createElement("p"); message.className = "feedback-card-body"; message.textContent = item.review || item.message || (item.rating ? `Left a ${item.rating}-star rating without a written review.` : "No written message.");
            const meta = document.createElement("div"); meta.className = "feedback-meta";
            const kind = document.createElement("span"); kind.textContent = item.source === "order" ? `Order ${item.orderId || "feedback"}` : (item.category || "Website feedback").replace(/-/g," ");
            const date = document.createElement("span"); date.textContent = dateLabel(item.submittedAt || item.createdAt);
            meta.append(kind,date);
            if (item.rating) { const rating = document.createElement("span"); rating.textContent = `${item.rating} / 5 stars`; meta.appendChild(rating); }
            const buttons = document.createElement("div"); buttons.className = "feedback-card-actions";
            if (status === "pending_review") {
                buttons.append(actionButton("Approve & show on home", "approve", "approve-feedback-public", getIdentity(item)), actionButton("Approve privately", "", "approve-feedback-private", getIdentity(item)), actionButton("Reject", "reject", "reject-feedback", getIdentity(item)));
            } else if (status === "approved" && item.showOnHome) {
                buttons.append(actionButton("Remove from home", "", "approve-feedback-private", getIdentity(item)), actionButton("Reject", "reject", "reject-feedback", getIdentity(item)));
            } else if (status === "approved") {
                buttons.append(actionButton("Show on home", "approve", "approve-feedback-public", getIdentity(item)), actionButton("Reject", "reject", "reject-feedback", getIdentity(item)));
            } else {
                buttons.append(actionButton("Approve & show on home", "approve", "approve-feedback-public", getIdentity(item)), actionButton("Approve privately", "", "approve-feedback-private", getIdentity(item)));
            }
            card.append(top,message,meta,buttons); feedbackList.appendChild(card);
        });
    }

    function updateProduct(id, approvalStatus) {
        const item = products.find(product => String(product.id) === String(id));
        if (!item) return;
        const changed = statusOf(item) !== approvalStatus;
        item.approvalStatus = approvalStatus;
        item.reviewedAt = new Date().toISOString();
        item.reviewedBy = "admin";
        write(LISTINGS_KEY,listings);
        if (changed) notifyUser({kind:"seller-listing",email:item.sellerEmail,userId:item.sellerId,title:approvalStatus === "approved" ? "Your product is approved" : "Your product was not approved",message:approvalStatus === "approved" ? `${item.name || "Your listing"} is now visible to eligible buyers.` : `${item.name || "Your listing"} is hidden from buyers. Review the details and submit an updated listing.`,entityKey:`listing:${item.id}`,entityStatus:approvalStatus});
        window.dispatchEvent(new Event("stockMindListingsUpdated"));
        loadData();
    }

    function updateFeedback(id, approvalStatus, showOnHome) {
        const item = feedback.find(entry => getIdentity(entry) === String(id));
        if (!item) return;
        const key = item._storageKey;
        const changed = statusOf(item) !== approvalStatus || Boolean(item.showOnHome) !== Boolean(showOnHome);
        const rows = read(key);
        const identity = getIdentity(item);
        const updated = rows.map(entry => getIdentity(entry) === identity ? {...entry,approvalStatus,showOnHome,reviewedAt:new Date().toISOString(),reviewedBy:"admin"} : entry);
        write(key,updated);
        if (changed && item.email) notifyUser({kind:"feedback-review",email:item.email,userId:item.userId,title:approvalStatus === "approved" ? "Your feedback was reviewed" : "Your feedback was not approved",message:approvalStatus === "approved" ? (showOnHome ? "Your feedback is approved and will be shown on the Stock Mind home page." : "Your feedback is approved for private review and will not appear on the home page.") : "Your feedback was reviewed and will not be shown publicly.",entityKey:`feedback:${identity}`,entityStatus:`${approvalStatus}:${Boolean(showOnHome)}`});
        window.dispatchEvent(new Event("stockMindFeedbackUpdated"));
        loadData();
    }

    document.addEventListener("click", event => {
        const tab = event.target.closest(".moderation-tab");
        if (tab) { activatePanel(tab.dataset.panel, true); return; }
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        if (action === "approve-product") updateProduct(button.dataset.id,"approved");
        if (action === "reject-product") updateProduct(button.dataset.id,"rejected");
        if (action === "approve-feedback-public") updateFeedback(button.dataset.id,"approved",true);
        if (action === "approve-feedback-private") updateFeedback(button.dataset.id,"approved",false);
        if (action === "reject-feedback") updateFeedback(button.dataset.id,"rejected",false);
    });

    function activatePanel(panelId, updateHash) {
        tabs.forEach(tab => {
            const active = tab.dataset.panel === panelId;
            tab.classList.toggle("is-active",active); tab.setAttribute("aria-selected",String(active));
        });
        document.querySelectorAll(".moderation-panel").forEach(panel => {
            const active = panel.id === panelId; panel.hidden = !active; panel.classList.toggle("is-active",active);
        });
        if (updateHash) history.replaceState(null,"",panelId === "feedback-panel" ? "#feedback" : "#products");
        document.dispatchEvent(new Event("adminSidebarReady"));
    }

    $("productSearch").addEventListener("input",renderProducts);
    $("productStatusFilter").addEventListener("change",renderProducts);
    $("feedbackSearch").addEventListener("input",renderFeedback);
    $("feedbackStatusFilter").addEventListener("change",renderFeedback);
    const initialPanel = location.hash === "#feedback" ? "feedback-panel" : "products-panel";
    activatePanel(initialPanel,false);
    loadData();
    window.addEventListener("storage",event => { if (LISTINGS_KEY === event.key || FEEDBACK_KEYS.includes(event.key)) loadData(); });
    window.addEventListener("stockMindListingsUpdated",loadData);
    window.addEventListener("stockMindFeedbackUpdated",loadData);
})();
