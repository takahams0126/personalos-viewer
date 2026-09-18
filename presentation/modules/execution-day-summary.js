const qs = new URLSearchParams(location.search);
if (qs.get('type') === 'plan' && qs.get('id')) initExecutionDaySummary();

async function initExecutionDaySummary(){
  const id = qs.get('id');
  let payload;
  try {
    const response = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, {cache:'no-store'});
    if (!response.ok) return;
    payload = await response.json();
  } catch { return; }

  const sync = () => {
    const panel = document.querySelector('#execution-mode-panel');
    if (!panel) return false;
    let touched = false;
    for (const day of payload.days || []) {
      const card = panel.querySelector(`.execution-day[data-day="${Number(day.day)}"]`);
      if (!card) continue;
      syncCard(card, day);
      touched = true;
    }
    if (touched && !panel.dataset.executionDaySummaryBound) {
      panel.dataset.executionDaySummaryBound = '1';
      panel.addEventListener('click', event => {
        const tab = event.target.closest('.exec-variant-tab');
        if (!tab) return;
        const card = tab.closest('.execution-day');
        if (!card) return;
        const day = (payload.days || []).find(item => Number(item.day) === Number(card.dataset.day));
        if (!day) return;
        queueMicrotask(() => syncCard(card, day));
      });
    }
    return touched;
  };

  if (sync()) return;
  const observer = new MutationObserver(() => { if (sync()) observer.disconnect(); });
  observer.observe(document.querySelector('#app') || document.body, {childList:true, subtree:true});
}

function syncCard(card, day){
  const metricGrid = card.querySelector('.exec-summary-metrics');
  metricGrid?.remove();
  const summaryBlock = card.querySelector('.exec-day-summary');
  if (summaryBlock && !summaryBlock.children.length) summaryBlock.remove();

  const variantId = card.dataset.activeVariant;
  const variants = day.variants || [];
  const active = variants.find(v => (v.id || v.variant_id) === variantId) || variants[0] || {};
  const total = active.summary?.total_time;
  const overview = card.querySelector('.exec-day-overview');
  if (!overview) return;

  let badges = overview.querySelector('.plan-day-overview-badges');
  let badge = overview.querySelector('.exec-total-time-badge');
  if (!total) {
    badge?.remove();
    return;
  }
  if (!badges) {
    badges = document.createElement('div');
    badges.className = 'plan-day-overview-badges';
    const subhead = overview.querySelector('.plan-day-subhead');
    if (subhead) subhead.insertAdjacentElement('afterend', badges);
    else overview.prepend(badges);
  }
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'exec-total-time-badge';
    badges.appendChild(badge);
  }
  badge.textContent = `合計 ${total}`;
}
