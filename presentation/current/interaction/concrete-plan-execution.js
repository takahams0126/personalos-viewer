const MOBILE_QUERY = '(max-width: 52rem)';

function isMobileViewport() {
  return Boolean(globalThis.matchMedia?.(MOBILE_QUERY).matches);
}

function sameRef(a, b) {
  return Boolean(
    a?.entity_type && a?.id &&
    b?.entity_type && b?.id &&
    a.entity_type === b.entity_type &&
    a.id === b.id
  );
}

function fuelActionContext(event, concretePlan) {
  const day = (concretePlan?.days || []).find(item => item.ordinal === event.day_ordinal);
  if (!day || !event?.travel_point_ref) return null;

  const actions = [...(day.actions || [])].sort((a, b) => a.order - b.order);
  const index = actions.findIndex(action => sameRef(action.target, event.travel_point_ref));
  if (index < 0) return null;
  return { action: actions[index], nextAction: actions[index + 1] || null };
}

function actionReason(context) {
  return (context?.action?.todos || [])
    .map(todo => todo.instruction)
    .filter(Boolean)
    .join('・');
}

async function executionRelationForFuel(context, resolver) {
  const nextAction = context?.nextAction;
  if (!nextAction) return '';

  let nextTitle = '';
  if (nextAction.target?.entity_type && nextAction.target?.id) {
    try {
      const described = await resolver.describe(nextAction.target);
      nextTitle = described.title || '';
    } catch {
      nextTitle = '';
    }
  }

  const nextTodo = (nextAction.todos || [])
    .map(todo => todo.instruction)
    .filter(Boolean)
    .join('・');
  const relation = [nextTitle, nextTodo].filter(Boolean).join(' — ');
  return relation ? `この給油の次: ${relation}` : '';
}

async function annotateFuelPracticalInformation(root, concretePlan, resolver) {
  const fuel = root.querySelector('[data-semantic="fuel"]');
  if (!fuel || !concretePlan?.fuel?.events?.length) return;

  const events = [...concretePlan.fuel.events].sort((a, b) => {
    const priority = value => value?.importance?.code === 'required' ? 0 : 1;
    return priority(a) - priority(b) || (a.day_ordinal || 99) - (b.day_ordinal || 99);
  });
  const rows = [...fuel.querySelectorAll('.fuel-event-row')];

  for (let index = 0; index < Math.min(events.length, rows.length); index += 1) {
    const row = rows[index];
    const event = events[index];
    const context = fuelActionContext(event, concretePlan);

    if (!event.context && !row.querySelector('.fuel-practical-reason')) {
      const reason = actionReason(context);
      if (reason) {
        const note = document.createElement('p');
        note.className = 'fuel-event-context fuel-practical-reason';
        note.dataset.semantic = 'fuel-practical-reason';
        note.textContent = reason;
        row.append(note);
      }
    }

    if (!row.querySelector('.fuel-execution-relation')) {
      const relation = await executionRelationForFuel(context, resolver);
      if (relation) {
        const note = document.createElement('p');
        note.className = 'fuel-event-context fuel-execution-relation';
        note.dataset.semantic = 'fuel-execution-relation';
        note.textContent = relation;
        row.append(note);
      }
    }
  }
}

function applyMobileItineraryDisclosure(root) {
  const overview = root.querySelector('[data-semantic="itinerary-overview"]');
  if (!overview || overview.querySelector(':scope > .mobile-itinerary-disclosure')) return;
  const list = overview.querySelector(':scope > .itinerary-overview-list');
  if (!list) return;

  const disclosure = document.createElement('details');
  disclosure.className = 'mobile-itinerary-disclosure';
  disclosure.dataset.semantic = 'mobile-itinerary-disclosure';

  const summary = document.createElement('summary');
  summary.className = 'fuel-station-action';
  summary.textContent = '旅程全体を確認';
  disclosure.append(summary, list);
  overview.append(disclosure);
}

function visibleWorkspace(dayPanel) {
  const visiblePackage = [...dayPanel.querySelectorAll('[data-semantic="execution-package"]')]
    .find(packageNode => !packageNode.hidden);
  return visiblePackage?.querySelector('[data-content-switcher]')
    || dayPanel.querySelector('[data-content-switcher]');
}

function mapTabFor(workspace) {
  return workspace?.querySelector(':scope > .day-workspace-tabs [data-view-id="map"]') || null;
}

function actionsTabFor(workspace) {
  return workspace?.querySelector(':scope > .day-workspace-tabs [data-view-id="actions"]') || null;
}

function mapSourceFor(workspace) {
  return workspace?.querySelector(':scope > .day-workspace-panel > [data-layout-source="map"]') || null;
}

function syncMapActionState(dayPanel, opener) {
  const workspace = visibleWorkspace(dayPanel);
  opener.setAttribute('aria-expanded', workspace?.dataset.activeView === 'map' ? 'true' : 'false');
}

function addMobileMapActions(root) {
  root.querySelectorAll('[data-semantic="execution-day"]').forEach(dayPanel => {
    const availableMapTab = [...dayPanel.querySelectorAll('[data-content-switcher]')]
      .map(mapTabFor)
      .find(Boolean);
    const facts = dayPanel.querySelector('.concrete-day-context-facts');
    if (!availableMapTab || !facts || facts.querySelector('.mobile-map-jump')) return;

    dayPanel.querySelectorAll('[data-content-switcher]').forEach(workspace => {
      const mapTab = mapTabFor(workspace);
      if (mapTab) mapTab.hidden = true;

      const mapSource = mapSourceFor(workspace);
      if (!mapSource || mapSource.querySelector(':scope > .mobile-map-return')) return;
      const back = document.createElement('a');
      back.className = 'fuel-station-action mobile-map-return';
      back.href = '#';
      back.textContent = '行動順へ戻る';
      back.addEventListener('click', event => {
        event.preventDefault();
        actionsTabFor(workspace)?.click();
        const opener = dayPanel.querySelector('.mobile-map-jump');
        if (opener) opener.setAttribute('aria-expanded', 'false');
        dayPanel.querySelector('.concrete-day-context')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
      mapSource.prepend(back);
    });

    const opener = document.createElement('a');
    opener.className = 'fuel-station-action mobile-map-jump';
    opener.href = '#';
    opener.textContent = 'マップ';
    opener.setAttribute('aria-expanded', 'false');
    opener.addEventListener('click', event => {
      event.preventDefault();
      const workspace = visibleWorkspace(dayPanel);
      const mapTab = mapTabFor(workspace);
      if (!workspace || !mapTab) return;
      mapTab.click();
      opener.setAttribute('aria-expanded', 'true');
      mapSourceFor(workspace)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    facts.append(opener);
    syncMapActionState(dayPanel, opener);
  });
}

export async function hydrateConcretePlanExecution({ root, concretePlan, resolver }) {
  if (!root || !concretePlan) return;

  await annotateFuelPracticalInformation(root, concretePlan, resolver);

  if (!isMobileViewport()) return;
  applyMobileItineraryDisclosure(root);
  addMobileMapActions(root);
}
