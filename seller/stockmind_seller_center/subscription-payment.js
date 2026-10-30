"use strict";
(() => {
  const PLANS = [
    { id: 'one', months: 1, label: '1 month', price: 19 },
    { id: 'three', months: 3, label: '3 months', price: 49 },
    { id: 'six', months: 6, label: '6 months', price: 89 }
  ];
  // REAL PAYMENTS: Set up POST /api/subscriptions/checkout on your server.
  // It must validate logged-in seller + price server-side and return {checkoutUrl}.
  const CHECKOUT_ENDPOINT = '/api/subscriptions/checkout';
  const SUB_KEY = 'stockMindSubscription';
  let selectedId = new URLSearchParams(location.search).get('plan') || sessionStorage.getItem('stockMindPendingPlan') || 'six';
  if (!PLANS.some(p => p.id === selectedId)) selectedId = 'six';
  const $ = id => document.getElementById(id);
  const buttons = [$('continue-pay'), $('demo-pay')];
  const setBusy = busy => buttons.forEach(b => { b.disabled = busy; });
  const status = text => { $('pay-status').textContent = text; };
  const selected = () => PLANS.find(p => p.id === selectedId);
  function render() {
    $('period-options').innerHTML = PLANS.map(p => `<label class="period-option ${p.id === selectedId ? 'active' : ''}">
      <input type="radio" name="access-period" value="${p.id}" ${p.id === selectedId ? 'checked' : ''}>
      <span><strong>${p.label}</strong><small>JOD ${p.price.toFixed(2)}</small></span></label>`).join('');
    const p = selected();
    $('selected-period').textContent = p.label;
    $('service-price').textContent = 'JOD ' + p.price.toFixed(2);
    $('total-due').textContent = 'JOD ' + p.price.toFixed(2);
    sessionStorage.setItem('stockMindPendingPlan', p.id);
  }
  $('period-options').addEventListener('change', e => {
    if (e.target.name === 'access-period') { selectedId = e.target.value; render(); }
  });
  // A trusted hosted checkout should be returned by your own backend.
  $('continue-pay').addEventListener('click', async () => {
    setBusy(true); status('Connecting to secure payment provider...');
    try {
      const response = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include', body: JSON.stringify({ planId: selectedId })
      });
      if (!response.ok) throw new Error('Payment gateway has not been configured.');
      const data = await response.json();
      if (!data.checkoutUrl || !/^https:\/\//i.test(data.checkoutUrl)) throw new Error('Invalid secure checkout URL.');
      location.assign(data.checkoutUrl);
    } catch (error) {
      status(error.message + ' Use the test checkout button to preview the flow.');
      setBusy(false);
    }
  });
  $('demo-pay').addEventListener('click', () => {
    // DEMO ONLY: This is not a financial transaction or server-verified membership.
    const p = selected(), started = Date.now(), expires = new Date(started);
    expires.setMonth(expires.getMonth() + p.months);
    try {
      localStorage.setItem(SUB_KEY, JSON.stringify({
        planId: p.id, months: p.months, startedAt: started,
        expiresAt: expires.getTime(), mode: 'demo'
      }));
      location.replace('ai-advisor.html');
    } catch (e) { status('Could not save test subscription. Check browser storage.'); }
  });
  async function footer() {
    try { const r = await fetch('../../components/footer.html'); if (r.ok) $('footer-container').innerHTML = await r.text(); }
    catch (e) { console.warn('Footer unavailable', e); }
  }
  render(); footer();
})();
