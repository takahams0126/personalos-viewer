import { hrefFor, isDetailPageRef } from '../core/router.js';
import { h } from './dom.js';

function machineLabel(ref) {
  if (!ref?.entity_type || !ref?.id) return '参照情報なし';
  return `${ref.entity_type}:${ref.id}`;
}

async function describeRef(ref, resolver) {
  if (!ref) return { title: '参照情報なし', unavailable: true, pointType: '' };
  try {
    const described = await resolver.describe(ref);
    let pointType = '';
    if (ref.entity_type === 'travel_point') {
      try {
        const loaded = await resolver.load(ref);
        pointType = loaded.data?.point_type?.code || '';
      } catch {
        pointType = '';
      }
    }
    return { ...described, pointType, unavailable: false };
  } catch {
    return { title: machineLabel(ref), unavailable: true, pointType: '' };
  }
}

function entityTitle(ref, title, unavailable = false) {
  if (!unavailable && isDetailPageRef(ref)) {
    return h('a', { attrs: { href: hrefFor(ref) }, text: title });
  }
  return h('span', { text: title });
}

function sameRef(a, b) {
  return Boolean(a?.entity_type && a?.id && b?.entity_type && b?.id && a.entity_type === b.entity_type && a.id === b.id);
}

function eventIconRole(ref, described) {
  if (ref?.entity_type === 'spot') return 'spot';
  if (ref?.entity_type === 'travel_point') return described?.pointType || 'place';
  return 'place';
}

function renderJourneyIcon(role, className) {
  return h('span', {
    className,
    dataset: { iconRole: role || 'place' },
    attrs: { 'aria-hidden': 'true' }
  });
}

function concretePlanRef(manifestEntry) {
  const relations = (manifestEntry?.relations || []).filter(
    relation => relation.kind === 'concrete_plan' && relation.target_ref
  );
  if (relations.length > 1) {
    throw new Error(`Plan ${manifestEntry?.ref?.id || ''} has multiple concrete_plan relations.`);
  }
  return relations[0]?.target_ref || null;
}

async function renderPlanComposition(manifestEntry, resolver) {
  const executionRef = concretePlanRef(manifestEntry);
  if (!executionRef) return null;
  const execution = await describeRef(executionRef, resolver);
  return h('section', { className: 'plan-composition', dataset: { semantic: 'plan-composition' } },
    h('div', { className: 'plan-composition-row plan-composition-execution' },
      h('h2', { text: '実施プラン' }),
      execution.unavailable
        ? h('span', { className: 'plan-composition-value', text: execution.title })
        : h('a', {
            className: 'plan-composition-execution-link',
            attrs: { href: hrefFor(executionRef) },
            text: execution.title || executionRef.id
          })
    )
  );
}

function renderPlanItineraryOverview(days = []) {
  if (!days.length) return null;
  return h('section', {
    className: 'plan-itinerary-overview itinerary-overview',
    dataset: { semantic: 'plan-itinerary-overview' }
  },
    h('h2', { text: '日程' }),
    h('ol', { className: 'plan-itinerary-overview-list itinerary-overview-list' }, days.map(day =>
      h('li', { className: 'plan-itinerary-day-row', dataset: { day: day.ordinal } },
        h('strong', { className: 'plan-itinerary-day-label itinerary-day-label', text: `DAY${day.ordinal}` }),
        h('span', { className: 'plan-itinerary-day-title', text: day.title || `Day ${day.ordinal}` })
      )
    ))
  );
}

function renderOptionalList(values) {
  if (!values?.length) return null;
  return h('ul', { className: 'plan-event-todos', dataset: { semantic: 'todos' } },
    values.map(value => h('li', { text: value }))
  );
}

function renderEventMeta(item) {
  const values = [item.visit_purpose?.label, item.inclusion_requirement?.label].filter(Boolean);
  if (!values.length) return null;
  return h('p', { className: 'plan-event-meta', text: values.join(' · ') });
}

function renderCondition(item) {
  if (!item.condition?.text) return null;
  return h('dl', { className: 'plan-event-facts' },
    h('div', {}, h('dt', { text: '条件' }), h('dd', { text: item.condition.text }))
  );
}

async function renderPlace(item, resolver, { boundary = '' } = {}) {
  const target = await describeRef(item.target_ref, resolver);
  return h('li', {
    className: 'plan-journey-event plan-place',
    dataset: { kind: 'place', semantic: 'place', boundary }
  },
    renderJourneyIcon(eventIconRole(item.target_ref, target), 'plan-event-icon'),
    h('article', { className: 'plan-event-body' },
      boundary ? h('p', { className: 'plan-boundary-label', text: boundary }) : null,
      h('div', { className: 'plan-event-title-row' },
        h('h4', {}, entityTitle(item.target_ref, target.title, target.unavailable)),
        renderEventMeta(item)
      ),
      target.unavailable ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' }) : null,
      renderCondition(item),
      renderOptionalList(item.actions)
    )
  );
}

async function renderBoundary(label, ref, resolver) {
  return renderPlace({ kind: 'place', target_ref: ref }, resolver, { boundary: label });
}

async function renderMovement(item, resolver) {
  const [from, to] = await Promise.all([describeRef(item.from_ref, resolver), describeRef(item.to_ref, resolver)]);
  const mode = item.transport?.code || 'move';
  return h('li', {
    className: 'plan-journey-connector plan-movement',
    dataset: { kind: 'movement', semantic: 'movement', transportMode: mode }
  },
    renderJourneyIcon(mode, 'plan-move-icon'),
    h('div', { className: 'plan-move-body' },
      h('strong', { className: 'plan-move-mode', text: item.transport?.label || '移動' }),
      h('span', { className: 'plan-move-endpoints' },
        entityTitle(item.from_ref, from.title, from.unavailable),
        ' → ',
        entityTitle(item.to_ref, to.title, to.unavailable)
      ),
      item.condition?.text
        ? h('dl', { className: 'plan-event-facts' },
            h('div', {}, h('dt', { text: '条件' }), h('dd', { text: item.condition.text }))
          )
        : null
    )
  );
}

async function renderImplicitDestination(ref, resolver) {
  const target = await describeRef(ref, resolver);
  return h('li', {
    className: 'plan-journey-event plan-waypoint',
    dataset: { semantic: 'place', kind: 'waypoint' }
  },
    renderJourneyIcon(eventIconRole(ref, target), 'plan-event-icon'),
    h('article', { className: 'plan-event-body' },
      h('h4', {}, entityTitle(ref, target.title, target.unavailable)),
      target.unavailable ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' }) : null
    )
  );
}

async function loadRouteChoice(ref, relation, resolver) {
  try {
    const loaded = await resolver.load(ref);
    return { ref, routeData: loaded.data, title: loaded.data.title, relation, unavailable: false };
  } catch {
    const described = await describeRef(ref, resolver);
    return { ref, routeData: null, title: described.title, relation, unavailable: true };
  }
}

function routeChoiceIdentity(choice) {
  const routeData = choice.routeData;
  return routeData
    ? [routeData.family_label, routeData.variant?.label].filter(Boolean).join('・')
    : choice.title;
}

function routeChoiceLabel(choice, index, total) {
  const identity = routeChoiceIdentity(choice);
  return total > 1 && index === 0 ? `標準・${identity}` : identity;
}

async function renderRouteStops(routeData, resolver) {
  const sequence = routeData?.sequence || [];
  if (!sequence.length) return null;
  const stops = await Promise.all(sequence.map(async item => {
    const spot = await describeRef(item.spot_ref, resolver);
    return h('li', { className: 'plan-route-stop' },
      h('span', { className: 'plan-route-stop-order', text: String(item.order) }),
      h('span', { className: 'plan-route-stop-title' }, entityTitle(item.spot_ref, spot.title, spot.unavailable))
    );
  }));
  return h('ol', {
    className: 'plan-route-stops',
    dataset: { semantic: 'route-stops' },
    attrs: { 'aria-label': '立ち寄り順' }
  }, stops);
}

async function renderRouteChoiceContent(choice, resolver) {
  const routeData = choice.routeData;
  const condition = choice.relation?.selection_condition?.text;
  const replacementIntent = choice.relation?.replacement_intent;
  const summary = routeData?.summary || '';
  return h('div', {
    className: 'plan-route-choice-content',
    dataset: { semantic: 'selected-route-detail', routeId: choice.ref?.id || '' }
  },
    replacementIntent ? h('p', { className: 'plan-route-intent', text: replacementIntent }) : null,
    condition
      ? h('dl', { className: 'plan-event-facts plan-route-condition' },
          h('div', {}, h('dt', { text: '選択条件' }), h('dd', { text: condition }))
        )
      : null,
    summary ? h('p', { className: 'plan-route-summary', text: summary }) : null,
    await renderRouteStops(routeData, resolver),
    choice.unavailable ? h('p', { className: 'component-unavailable', text: 'Route詳細を取得できませんでした' }) : null
  );
}

function updateRoutePageLink(link, choice) {
  const available = !choice.unavailable && isDetailPageRef(choice.ref);
  link.hidden = !available;
  if (available) link.href = hrefFor(choice.ref);
}

async function renderRoute(item, resolver) {
  const choices = await Promise.all([
    loadRouteChoice(item.route_ref, { selection_condition: item.selection_condition }, resolver),
    ...(item.alternatives || []).map(alternative => loadRouteChoice(alternative.route_ref, alternative, resolver))
  ]);
  const contentNodes = await Promise.all(choices.map(choice => renderRouteChoiceContent(choice, resolver)));
  const contentHost = h('div', { className: 'plan-route-choice-host' }, contentNodes[0]);
  const routeLink = h('a', {
    className: 'plan-route-page-link',
    attrs: { href: '#', hidden: true },
    text: 'Route画面へ'
  });
  updateRoutePageLink(routeLink, choices[0]);

  const select = choices.length > 1
    ? h('select', {
        className: 'plan-route-choice-select',
        attrs: { 'aria-label': '表示するルート' },
        dataset: { semantic: 'route-choice-control' }
      }, choices.map((choice, index) =>
        h('option', { attrs: { value: index }, text: routeChoiceLabel(choice, index, choices.length) })
      ))
    : null;
  const identityControl = select || h('p', {
    className: 'plan-route-current',
    text: routeChoiceIdentity(choices[0])
  });

  select?.addEventListener('change', () => {
    const index = Number(select.value);
    contentHost.replaceChildren(contentNodes[index]);
    updateRoutePageLink(routeLink, choices[index]);
  });

  return h('li', {
    className: 'plan-journey-event plan-route',
    dataset: { kind: 'route', semantic: 'route-occurrence' }
  },
    renderJourneyIcon('route', 'plan-event-icon'),
    h('article', { className: 'plan-event-body plan-route-body' },
      h('section', { className: 'plan-route-choice', dataset: { semantic: 'route-choice' } },
        h('div', { className: 'plan-route-utility' },
          h('span', { className: 'plan-route-choice-control-label', text: 'ルート' }),
          routeLink
        ),
        h('div', { className: 'plan-route-choice-control-row' }, identityControl),
        contentHost
      )
    )
  );
}

async function renderJourney(day, resolver) {
  const sequence = day.sequence || [];
  const first = sequence[0];
  const last = sequence[sequence.length - 1];
  const startAlreadyShown = first?.kind === 'place' && sameRef(first.target_ref, day.start_ref);
  const endAlreadyShown = last?.kind === 'place' && sameRef(last.target_ref, day.end_ref);
  const nodes = [];

  if (!startAlreadyShown) {
    nodes.push(await renderBoundary('', day.start_ref, resolver));
  }

  for (let index = 0; index < sequence.length; index += 1) {
    const item = sequence[index];
    if (item.kind === 'movement') {
      nodes.push(await renderMovement(item, resolver));
      const next = sequence[index + 1];
      const isFinalDestination = sameRef(item.to_ref, day.end_ref) && index === sequence.length - 1;
      if (!isFinalDestination) {
        if (next?.kind === 'place' && sameRef(next.target_ref, item.to_ref)) {
          nodes.push(await renderPlace(next, resolver));
          index += 1;
        } else if (next?.kind !== 'route') {
          nodes.push(await renderImplicitDestination(item.to_ref, resolver));
        }
      }
      continue;
    }
    if (item.kind === 'place') {
      nodes.push(await renderPlace(item, resolver));
      continue;
    }
    if (item.kind === 'route') {
      nodes.push(await renderRoute(item, resolver));
      continue;
    }
    nodes.push(h('li', {
      className: 'plan-journey-event component-unavailable',
      dataset: { kind: item.kind || 'unknown' },
      text: `未対応のsequence item: ${item.kind || 'unknown'}`
    }));
  }

  if (!endAlreadyShown) {
    nodes.push(await renderBoundary('', day.end_ref, resolver));
  }
  return h('ol', { className: 'plan-sequence plan-journey', dataset: { semantic: 'conceptual-sequence' } }, nodes);
}

async function renderDay(day, resolver) {
  return h('section', {
    className: 'plan-day-panel',
    dataset: {
      semantic: 'day',
      day: day.ordinal,
      sourceDay: day.ordinal,
      dayTitle: day.title || `Day ${day.ordinal}`
    }
  },
    h('header', { className: 'plan-day-context' },
      h('p', { className: 'plan-day-number', text: `Day ${day.ordinal}` }),
      h('h3', { className: 'plan-day-title', text: day.title })
    ),
    h('div', { className: 'plan-day-body' },
      day.summary ? h('p', { className: 'plan-day-summary', text: day.summary }) : null,
      await renderJourney(day, resolver)
    )
  );
}

export async function renderPlan({ plan, manifestEntry, resolver }) {
  const orderedDays = [...(plan.days || [])].sort((a, b) => a.ordinal - b.ordinal);
  const dayNodes = await Promise.all(orderedDays.map(day => renderDay(day, resolver)));
  const composition = await renderPlanComposition(manifestEntry, resolver);
  const itinerary = renderPlanItineraryOverview(orderedDays);

  return h('article', { className: 'plan-page', dataset: { semantic: 'plan' } },
    h('header', { className: 'plan-overview', dataset: { semantic: 'plan-overview' } },
      h('h1', { text: plan.title }),
      plan.summary ? h('p', { text: plan.summary }) : null
    ),
    composition,
    h('section', { className: 'plan-days', dataset: { semantic: 'days' } },
      itinerary,
      h('div', { className: 'plan-days-list' }, dayNodes)
    )
  );
}
