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

function isMobileViewport() {
  return window.matchMedia('(max-width: 52rem)').matches;
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
  if (isMobileViewport()) {
    spatialContext.dataset.mobileDisclosure = 'true';
    spatialContext.hidden = true;
  }

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

function appendFuelMeta(parent, event, className) {
  const meta = document.createElement('span');
  meta.className = `${className}-meta`;
  for (const value of [event.importance?.label, event.timing?.label].filter(Boolean)) {
    const badge = document.createElement('span');
    badge.textContent = value;
    meta.append(badge);
  }
  parent.append(meta);
}

function appendFuelPracticalDetails(parent, { event, station, context, className }) {
  appendText(parent, `${className}-address`, station?.location?.text || '');
  appendFacts(parent, station, `${className}-facts`);
  appendText(parent, `${className}-context`, event.context || '');
  appendText(parent, 'fuel-execution-relation', relationText(context));
  appendLinks(parent, station);
}

function buildFuelCard({ event, station, context, className }) {
  const title = station?.title || event.station_title || '給油ポイント';

  if (isMobileViewport()) {
    const disclosure = document.createElement('details');
    disclosure.className = `${className} fuel-practical-disclosure`;
    disclosure.dataset.semantic = 'fuel-practical';

    const summary = document.createElement('summary');
    summary.className = 'fuel-practical-summary';
    appendFuelMeta(summary, event, className);
    appendText(summary, `${className}-title`, title, 'span');
    disclosure.append(summary);

    const body = document.createElement('div');
    body.className = 'fuel-practical-body';
    appendFuelPracticalDetails(body, { event, station, context, className });
    disclosure.append(body);
    return disclosure;
  }

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
  appendText(card, `${className}-title`, title, 'h5');
  appendFuelPracticalDetails(card, { event, station, context, className });
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

function applyMobileTripOverviewDisclosure(root) {
  if (!isMobileViewport()) return;
  const overview = root.querySelector('[data-semantic="itinerary-overview"]');
  if (!overview || overview.querySelector(':scope > .mobile-trip-overview-disclosure')) return;

  const disclosure = document.createElement('details');
  disclosure.className = 'mobile-trip-overview-disclosure';
  const summary = document.createElement('summary');
  summary.textContent = '旅程全体を確認';
  disclosure.append(summary);
  while (overview.firstChild) disclosure.append(overview.firstChild);
  overview.append(disclosure);
}

function addMobileMapJumps(root) {
  if (!isMobileViewport()) return;
  root.querySelectorAll('[data-semantic="execution-day"]').forEach(dayPanel => {
    const spatial = dayPanel.querySelector('.execution-package:not([hidden]) .day-spatial-context')
      || dayPanel.querySelector('.day-spatial-context');
    const contextFacts = dayPanel.querySelector('.concrete-day-context-facts');
    if (!spatial || !contextFacts || contextFacts.querySelector('.mobile-map-jump')) return;

    const day = dayPanel.dataset.day || 'day';
    const timeline = dayPanel.querySelector('[data-semantic="execution-timeline"]');
    const timelineId = `execution-day-${day}-timeline`;
    const mapId = `execution-day-${day}-map`;
    if (timeline) timeline.id = timelineId;
    spatial.id = mapId;
    spatial.hidden = true;

    const opener = document.createElement('a');
    opener.className = 'mobile-map-jump';
    opener.href = `#${mapId}`;
    opener.setAttribute('aria-controls', mapId);
    opener.setAttribute('aria-expanded', 'false');
    opener.textContent = 'マップ';
    opener.addEventListener('click', event => {
      event.preventDefault();
      spatial.hidden = false;
      opener.setAttribute('aria-expanded', 'true');
      spatial.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    contextFacts.append(opener);

    if (!spatial.querySelector(':scope > .mobile-map-return')) {
      const back = document.createElement('a');
      back.className = 'mobile-map-jump mobile-map-return';
      back.href = timeline ? `#${timelineId}` : '#';
      back.textContent = '行動順へ戻る';
      back.addEventListener('click', event => {
        event.preventDefault();
        spatial.hidden = true;
        opener.setAttribute('aria-expanded', 'false');
        const target = timeline || dayPanel.querySelector('.concrete-day-context');
        target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
      spatial.prepend(back);
    }
  });
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

  applyMobileTripOverviewDisclosure(root);
  addMobileMapJumps(root);
}
