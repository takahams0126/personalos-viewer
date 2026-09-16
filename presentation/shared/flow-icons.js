import { renderTablerIcon, resolveDestinationIcon, resolveTransferIcon } from './icon-registry.js';

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');
if (type === 'plan' && id) initSharedFlowIcons();

const sameRef = (a,b) => a && b && a.type === b.type && a.id === b.id;

function destinationSemantics(ref={}, role='') {
  return {
    pointType: ref.type === 'travel_point' ? ref.point_type : undefined,
    category: ref.category,
    role: role || ref.role,
    label: ref.label
  };
}

function matchingDestination(day, endpoint) {
  return (day?.flow || []).find(x => x?.type === 'destination' && sameRef(x.destination_ref, endpoint));
}

function decoratePlanDay(card, day) {
  const list = card?.querySelector('.plan-axis');
  if (!list || !day) return;
  const flowById = new Map((day.flow || []).map(x => [x.flow_id, x]));
  list.querySelectorAll(':scope > .flow-item').forEach(item => {
    const node = item.querySelector(':scope > .flow-icon');
    if (!node) return;
    let flow = item.dataset.flowId ? flowById.get(item.dataset.flowId) : null;
    if (item.classList.contains('plan-axis-start')) {
      const match = matchingDestination(day, day.start);
      flow = {type:'destination', destination_ref: day.start, role: match?.role};
    } else if (item.classList.contains('plan-axis-end')) {
      const match = matchingDestination(day, day.end);
      flow = {type:'destination', destination_ref: day.end, role: match?.role};
    }
    if (!flow) return;
    if (flow.type === 'transfer') {
      node.classList.add('ui-flow-node','ui-flow-node-transfer');
      node.innerHTML = renderTablerIcon(resolveTransferIcon(flow.mode), 'ui-flow-icon ui-flow-icon-transfer');
    } else if (flow.type === 'destination') {
      node.classList.add('ui-flow-node','ui-flow-node-destination');
      node.innerHTML = renderTablerIcon(resolveDestinationIcon(destinationSemantics(flow.destination_ref || {}, flow.role)), 'ui-flow-icon ui-flow-icon-destination');
    }
  });
}

function activeExecutionVariant(dayData, article) {
  const variantId = article?.dataset.activeVariant;
  return (dayData?.variants || []).find(v => v.id === variantId) || (dayData?.variants || [])[0];
}

function decorateExecutionDay(article, dayData) {
  const variant = activeExecutionVariant(dayData, article);
  if (!variant) return;
  const items = [...article.querySelectorAll('.exec-flow > .exec-flow-item')];
  (variant.flow || []).forEach((flow,index) => {
    const item = items[index]; if (!item) return;
    if (flow.type === 'transfer') {
      const node = item.querySelector('.exec-transfer-node'); if (!node) return;
      node.classList.add('ui-flow-node','ui-flow-node-transfer');
      node.innerHTML = renderTablerIcon(resolveTransferIcon(flow.mode), 'ui-flow-icon ui-flow-icon-transfer');
    } else if (flow.type === 'destination') {
      const node = item.querySelector('.exec-destination-node'); if (!node) return;
      node.classList.add('ui-flow-node','ui-flow-node-destination');
      node.innerHTML = renderTablerIcon(resolveDestinationIcon(destinationSemantics(flow.ref || {}, flow.role)), 'ui-flow-icon ui-flow-icon-destination');
    }
  });
}

async function initSharedFlowIcons() {
  let planData = null, concrete = null;
  try {
    const [p,c] = await Promise.all([
      fetch(`./data/plans/${encodeURIComponent(id)}.json`,{cache:'no-store'}),
      fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`,{cache:'no-store'})
    ]);
    if (p.ok) planData = await p.json();
    if (c.ok) concrete = await c.json();
  } catch {}

  const apply = () => {
    const planCards = [...document.querySelectorAll('.plan-demo-itinerary .day-card')];
    (planData?.plan?.days || []).forEach((day,index) => decoratePlanDay(planCards[index], day));
    const concreteByDay = new Map((concrete?.days || []).map(day => [String(day.day),day]));
    document.querySelectorAll('.execution-day').forEach(article => decorateExecutionDay(article, concreteByDay.get(article.dataset.day)));
  };
  apply();
  const app = document.querySelector('#app');
  if (!app) return;
  new MutationObserver(apply).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['data-active-variant']});
}
