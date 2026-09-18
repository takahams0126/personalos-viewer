import { renderTablerIcon, resolveDestinationIcon, resolveTransferIcon } from './icon-registry.js';

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');

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

function applyNodeIcon(node, iconName, nodeKind) {
  if (!node || !iconName) return;
  node.classList.add('ui-flow-node', `ui-flow-node-${nodeKind}`);
  node.dataset.uiFlowIcon = iconName;
  node.dataset.uiFlowKind = nodeKind;
  node.innerHTML = renderTablerIcon(
    iconName,
    `ui-flow-icon ui-flow-icon-${nodeKind} icon-tabler-${iconName}`
  );
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
      applyNodeIcon(node, resolveTransferIcon(flow.mode), 'transfer');
    } else if (flow.type === 'destination') {
      applyNodeIcon(node, resolveDestinationIcon(destinationSemantics(flow.destination_ref || {}, flow.role)), 'destination');
    }
  });
}

async function initPlanFlowIcons() {
  let planData = null;
  try {
    const response = await fetch(`./data/plans/${encodeURIComponent(id)}.json`,{cache:'no-store'});
    if (response.ok) planData = await response.json();
  } catch {}

  const planCards = [...document.querySelectorAll('.plan-demo-itinerary .day-card')];
  (planData?.plan?.days || []).forEach((day,index) => decoratePlanDay(planCards[index], day));
}

if (type === 'plan' && id) initPlanFlowIcons();
