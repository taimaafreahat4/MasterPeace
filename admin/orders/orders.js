"use strict";

(() => {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const tableBody = document.getElementById("ordersTable");
  const statusLabel = value => String(value || "Processing").replace(/^\w/,letter=>letter.toUpperCase());
  const readOrders = () => {
    try { const value = JSON.parse(localStorage.getItem("stockMindOrders") || "[]"); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  function render() {
    if (!tableBody) return;
    const all = readOrders();
    const query = String(searchInput?.value || "").trim().toLowerCase();
    const filter = String(statusFilter?.value || "all").toLowerCase();
    const filtered = all.filter(order => {
      const text = [order.orderId,order.customer?.fullName,order.buyerEmail,order.items?.map(item=>item.name).join(" "),order.status].join(" ").toLowerCase();
      const status = String(order.status).toLowerCase();
      const matchesStatus = filter === "all" ||
        (filter === "pending" && ["pending","processing"].includes(status)) ||
        (filter === "completed" && status === "delivered") || status === filter;
      return text.includes(query) && matchesStatus;
    });
    tableBody.replaceChildren();
    if (!filtered.length) {
      const row = document.createElement("tr"); const cell = document.createElement("td");
      cell.colSpan = 7; cell.textContent = all.length ? "No orders match these filters." : "No orders have been placed in this browser yet.";
      cell.className = "orders-empty"; row.append(cell); tableBody.append(row);
    }
    filtered.forEach(order => {
      const row = document.createElement("tr");
      const customer = order.customer?.fullName || order.buyerEmail || "Buyer";
      const seller = [...new Set((order.items || []).map(item=>item.seller || "Stock Mind Supplier"))].join(", ");
      const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—";
      const cells = [order.orderId,customer,seller,`JOD ${Number(order.total || 0).toFixed(2)}`,date];
      cells.forEach(value=>{const td=document.createElement("td");td.textContent=String(value);row.append(td);});
      const statusCell=document.createElement("td");
      const select=document.createElement("select"); select.className="order-status"; select.setAttribute("aria-label",`Update ${order.orderId} status`);
      ["Processing","Shipped","Delivered","Cancelled"].forEach(value=>{const option=document.createElement("option");option.value=value.toLowerCase();option.textContent=value;select.append(option);});
      select.value=String(order.status || "processing").toLowerCase();
      select.addEventListener("change",()=>{
        const previous=String(order.status || "processing").toLowerCase();
        const result=window.setStockMindOrderStatus?.(order.orderId,select.value);
        if (!result?.ok) { select.value=previous; window.alert(result?.message || "Could not update this order."); return; }
        render();
      });
      statusCell.append(select);row.append(statusCell);
      const actions=document.createElement("td");
      const view=document.createElement("a");view.className="view";view.textContent="Track";view.href=`../../checkout/tracking/tracking.html?order=${encodeURIComponent(order.orderId)}`;view.setAttribute("aria-label",`Track ${order.orderId}`);actions.append(view);
      row.append(actions);tableBody.append(row);
    });
    const counts={total:all.length,processing:all.filter(o=>["processing","pending"].includes(String(o.status).toLowerCase())).length,shipped:all.filter(o=>String(o.status).toLowerCase()==="shipped").length,completed:all.filter(o=>String(o.status).toLowerCase()==="delivered").length};
    document.querySelectorAll(".stats .stat-card h2").forEach((heading,index)=>{heading.textContent=[counts.total,counts.processing,counts.shipped,counts.completed][index] ?? 0;});
  }
  searchInput?.addEventListener("input",render);
  statusFilter?.addEventListener("change",render);
  window.addEventListener("storage",event=>{if(event.key==="stockMindOrders")render();});
  window.addEventListener("stockMindOrdersUpdated",render);
  render();
})();
