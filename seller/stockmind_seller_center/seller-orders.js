"use strict";
(async()=>{
 const D=window.StockMindSellerData, root=document.getElementById('trade-orders');
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function refresh(){try{const {orders}=await D.api('/api/orders');const me=String(D.currentUser()?.email||'').toLowerCase();root.innerHTML=orders.length?'':'<p>No orders yet.</p>';
 orders.forEach(o=>{const sales=o.items.filter(x=>x.ownerId===me), purchases=o.buyerId===me;const el=document.createElement('article');el.className='trade-card';
 el.innerHTML=`<header><strong>${esc(o.orderId)}</strong><small>${esc(o.createdAt)} · ${esc(o.status)}</small></header><p>${purchases?'Your purchase':'Incoming sale'} · ${esc(o.buyerEmail)}</p><ul>${(purchases?o.items:sales).map(i=>`<li>${esc(i.name)} — ${i.sellingMethod==='whole_lot'?'Whole lot ('+i.lotUnits+' pcs)':'Qty '+i.quantity} — JOD ${Number(i.lineTotal).toFixed(2)}</li>`).join('')}</ul>${sales.length?'<button data-status="Confirmed">Confirm order</button> <button data-status="Shipped">Mark shipped</button> <button data-status="Delivered">Mark delivered</button>':''}`;
 el.querySelectorAll('button[data-status]').forEach(btn=>btn.onclick=async()=>{try{await D.api('/api/orders/'+encodeURIComponent(o.orderId)+'/status',{method:'PATCH',body:JSON.stringify({status:btn.dataset.status})});await refresh()}catch(e){alert(e.message)}});root.appendChild(el);
 });}catch(e){root.textContent=e.message;}}
 document.getElementById('refresh').onclick=refresh;await refresh();
 fetch('../../components/footer.html').then(r=>r.text()).then(x=>document.getElementById('footer-container').innerHTML=x).catch(()=>{});
})();