function directChildBySemantic(container, semantic) {
  return [...container.children].find(child => child.dataset?.semantic === semantic) || null;
}

function concreteWorkspaceDefinition(definition) {
  const blocks = definition?.contentLayouts?.concrete_plan?.blocks || [];
  const days = blocks.find(block => block.id === 'execution-days');
  return days?.day?.workspace || null;
}

function sameRef(a, b) {
  return Boolean(a?.entity_type && a?.id && b?.entity_type && b?.id && a.entity_type === b.entity_type && a.id === b.id);
}

function applyPackageSpatialSupport(packageNode, workspaceDefinition) {
  const workspace = directChildBySemantic(packageNode, 'day-workspace');
  if (!workspace) return;

  const supportDefinition = workspaceDefinition?.parallelSupport;
  if (!supportDefinition?.sourceSemantic) {
    workspace.dataset.hasSpatialContext = 'false';
    return;
  }

  const support = directChildBySemantic(packageNode, supportDefinition.sourceSemantic);
  workspace.dataset.hasSpatialContext = support ? 'true' : 'false';
  if (!support) return;

  const spatialContext = document.createElement('aside');
  spatialContext.className = 'day-spatial-context';
  spatialContext.dataset.semantic = 'spatial-context';
  spatialContext.dataset.layoutBlock = supportDefinition.id || 'spatial-context';
  spatialContext.dataset.layoutGrammar = supportDefinition.view || 'map';

  support.dataset.layoutSlot = 'spatial-support';
  spatialContext.append(support);
  workspace.append(spatialContext);
}

function appendText(parent, className, text, tag = 'p') {
  if (!text) return null;
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function appendLinks(parent, station) {
  const links = (station?.links || []).filter(link => link?.url);
  if (!links.length) return;
  const row = document.createElement('div');
  row.className = 'practical-link-row';
  for (const link of links) {
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = link.label || '開く';
    row.append(anchor);
  }
  parent.append(row);
}

function appendFacts(parent, station, className) {
  const facts = station?.facts || [];
  if (!facts.length) return;
  const list = document.createElement('dl');
  list.className = className;
  for (const fact of facts) {
    const term = document.createElement('dt');
    term.textContent = fact.label;
    const value = document.createElement('dd');
    value.textContent = fact.value;
    list.append(term, value);
  }
  parent.append(list);
}

async function loadStation(event, resolver) {
  if (!event?.travel_point_ref) return null;
  try {
    const loaded = await resolver.load(event.travel_point_ref);
    return loaded.data || null;
  } catch {
    return null;
  }
}

async function actionContextForFuel(event, concretePlan, resolver) {
  const day = (concretePlan?.days || []).find(item => item.ordinal === event.day_ordinal);
  if (!day) return null;
  const actions = [...(day.actions || [])].sort((a, b) => a.order - b.order);
  const index = actions.findIndex(action => sameRef(action.target, event.travel_point_ref));
  if (index < 0) return { day, action: null, nextAction: null, nextTitle: '' };
  const action = actions[index];
  const nextAction = actions[index + 1] || null;
  let nextTitle = '';
  if (nextAction?.target?.entity_type && nextAction?.target?.id) {
    try {
      const described = await resolver.describe(nextAction.target);
      nextTitle = described.title || '';
    } catch {
      nextTitle = '';
    }
  }
  return { day, action, nextAction, nextTitle };
}

function relationText(context) {
  if (!context?.action) return '';
  const nextTodo = context.nextAction?.todos?.map(todo => todo.instruction).filter(Boolean).join('・') || '';
  const next = [context.nextTitle, nextTodo].filter(Boolean).join(' — ');
  return next ? `この給油の次: ${next}` : '';
}

function buildFuelCard({ event, station, context, className }) {
  const card = document.createElement('section');
  card.className = className;
  card.dataset.semantic = 'fuel-practical';

  const meta = document.createElement('div');
  meta.className = `${className}-meta`;
  for (const value of [event.importance?.label, event.timing?.label].filter(Boolean)) {
    const badge = document.createElement('span');
    badge.textContent = value;
    meta.append(badge);
  }
  card.append(meta);

  appendText(card, `${className}-title`, station?.title || event.station_title || '給油ポイント', 'h5');
  appendText(card, `${className}-address`, station?.location?.text || '');
  appendFacts(card, station, `${className}-facts`);
  appendText(card, `${className}-context`, event.context || '');
  appendText(card, 'fuel-execution-relation', relationText(context));
  appendLinks(card, station);
  return card;
}

async function exposeFuelInExecution(root, concretePlan, resolver) {
  for (const event of concretePlan?.fuel?.events || []) {
    const station = await loadStation(event, resolver);
    const context = await actionContextForFuel(event, concretePlan, resolver);
    const panel = root.querySelector(`[data-semantic="execution-day"][data-day="${CSS.escape(String(event.day_ordinal || ''))}"]`);
    if (!panel) continue;

    if (context?.action) {
      const actionNode = panel.querySelector(`.execution-action[data-order="${CSS.escape(String(context.action.order))}"] .action-body`);
      if (actionNode && !actionNode.querySelector(':scope > [data-semantic="fuel-practical"]')) {
        actionNode.append(buildFuelCard({ event, station, context, className: 'action-practical-fuel' }));
      }
      continue;
    }

    const dayContext = panel.querySelector('.concrete-day-context');
    if (dayContext && !dayContext.querySelector(`[data-fuel-event-id="${CSS.escape(event.fuel_event_id || '')}"]`)) {
      const cue = buildFuelCard({ event, station, context, className: 'day-fuel-cue' });
      cue.dataset.fuelEventId = event.fuel_event_id || '';
      dayContext.append(cue);
    }
  }
}

async function annotateFuelWorkspace(root, concretePlan, resolver) {
  const events = [...(concretePlan?.fuel?.events || [])].sort((a, b) => {
    const priority = value => value?.importance?.code === 'required' ? 0 : 1;
    return priority(a) - priority(b) || (a.day_ordinal || 99) - (b.day_ordinal || 99);
  });
  const rows = [...root.querySelectorAll('.fuel-event-row')];
  for (let index = 0; index < Math.min(events.length, rows.length); index += 1) {
    const context = await actionContextForFuel(events[index], concretePlan, resolver);
    const text = relationText(context);
    if (!text || rows[index].querySelector('.fuel-execution-relation')) continue;
    appendText(rows[index], 'fuel-execution-relation', text);
  }
}

export async function applyExecutionCockpitLayout({ root, definition, concretePlan, resolver }) {
  const workspaceDefinition = concreteWorkspaceDefinition(definition);
  if (!root || !workspaceDefinition?.parallelSupport) return;

  root.querySelectorAll('[data-semantic="execution-package"]').forEach(packageNode => {
    applyPackageSpatialSupport(packageNode, workspaceDefinition);
  });

  if (concretePlan && resolver) {
    await exposeFuelInExecution(root, concretePlan, resolver);
    await annotateFuelWorkspace(root, concretePlan, resolver);
  }
}
