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

function routeRefsFromPlan(plan) {
  const refs = [];
  const seen = new Set();
  const add = ref => {
    if (!ref?.entity_type || !ref?.id) return;
    const key = `${ref.entity_type}:${ref.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push(ref);
  };
  for (const day of plan.days || []) {
    for (const item of day.sequence || []) {
      if (item.kind !== 'route') continue;
      add(item.route_ref);
      for (const alternative of item.alternatives || []) add(alternative.route_ref);
    }
  }
  return refs;
}

async function renderPlanComposition(plan, manifestEntry, resolver) {
  const routeRefs = routeRefsFromPlan(plan);
  const routes = await Promise.all(routeRefs.map(async ref => ({ ref, ...(await describeRef(ref, resolver)) })));
  const executionRef = concretePlanRef(manifestEntry);
  const execution = executionRef ? await describeRef(executionRef, resolver) : null;
  if (!routes.length && !executionRef) return null;
  return h('section', { className: 'plan-composition', dataset: { semantic: 'plan-composition' } },
    h('h2', { text: 'プラン構成' }),
    h('div', { className: 'plan-composition-row plan-composition-routes' },
      h('h3', { text: '計画プラン' }),
      routes.length
        ? h('div', { className: 'plan-composition-links' }, routes.map(route =>
            h('a', { className: 'plan-composition-chip', attrs: { href: hrefFor(route.ref) }, text: route.title })
          ))
        : h('span', { className: 'plan-composition-empty', text: 'ルート参照なし' })
    ),
    executionRef
      ? h('div', { className: 'plan-composition-row plan-composition-execution' },
          h('h3', { text: '実施プラン' }),
          execution?.unavailable
            ? h('span', { text: execution.title })
            : h('a', { className: 'plan-composition-execution-link', attrs: { href: hrefFor(executionRef) }, text: execution?.title || executionRef.id })
        )
      : null
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
      h('h4', {}, entityTitle(item.target_ref, target.title, target.unavailable)),
      target.unavailable ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' }) : null,
      renderEventMeta(item),
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

function renderRouteChoiceDetail(choice) {
  const routeData = choice.routeData;
  const identity = routeData ? [routeData.family_label, routeData.variant?.label].filter(Boolean).join(' / ') : '';
  const condition = choice.relation?.selection_condition?.text;
  const replacementIntent = choice.relation?.replacement_intent;
  return h('div', {
    className: 'plan-route-choice-detail',
    dataset: { semantic: 'selected-route-detail', routeId: choice.ref?.id || '' }
  },
    h('h4', {}, entityTitle(choice.ref, choice.title, choice.unavailable)),
    identity ? h('p', { className: 'plan-route-identity', text: identity }) : null,
    replacementIntent ? h('p', { className: 'plan-route-intent', text: replacementIntent }) : null,
    condition
      ? h('dl', { className: 'plan-event-facts' },
          h('div', {}, h('dt', { text: '選択条件' }), h('dd', { text: condition }))
        )
      : null,
    choice.unavailable ? h('p', { className: 'component-unavailable', text: 'Route詳細を取得できませんでした' }) : null
  );
}

async function renderRoute(item, resolver) {
  const choices = await Promise.all([
    loadRouteChoice(item.route_ref, { selection_condition: item.selection_condition }, resolver),
    ...(item.alternatives || []).map(alternative => loadRouteChoice(alternative.route_ref, alternative, resolver))
  ]);
  const detailNodes = choices.map(renderRouteChoiceDetail);
  const detailHost = h('div', { className: 'plan-route-choice-host' }, detailNodes[0]);
  const select = h('select', {
    className: 'plan-route-choice-select',
    attrs: { 'aria-label': '表示するルート' },
    dataset: { semantic: 'route-choice-control' }
  }, choices.map((choice, index) =>
    h('option', { attrs: { value: index }, text: index === 0 ? `${choice.title}（標準）` : choice.title })
  ));
  select.addEventListener('change', () => detailHost.replaceChildren(detailNodes[Number(select.value)]));
  return h('li', {
    className: 'plan-journey-event plan-route',
    dataset: { kind: 'route', semantic: 'route-occurrence' }
  },
    renderJourneyIcon('route', 'plan-event-icon'),
    h('article', { className: 'plan-event-body plan-route-body' },
      h('p', { className: 'plan-route-label', text: 'ルート' }),
      h('section', { className: 'plan-route-choice', dataset: { semantic: 'route-choice' } },
        choices.length > 1
          ? h('label', { className: 'plan-route-choice-label' }, h('span', { text: '実施ルート' }), select)
          : null,
        detailHost
      )
    )
  );
}

async function renderJourney(day, resolver) {
  const nodes = [await renderBoundary('START', day.start_ref, resolver)];
  const sequence = day.sequence || [];

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

  nodes.push(await renderBoundary('END', day.end_ref, resolver));
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
  const composition = await renderPlanComposition(plan, manifestEntry, resolver);

  return h('article', { className: 'plan-page', dataset: { semantic: 'plan' } },
    h('header', { className: 'plan-overview', dataset: { semantic: 'plan-overview' } },
      h('h1', { text: plan.title }),
      plan.summary ? h('p', { text: plan.summary }) : null
    ),
    composition,
    h('section', { className: 'plan-days', dataset: { semantic: 'days' } },
      h('h2', { text: '日程' }),
      h('div', { className: 'plan-days-list' }, dayNodes)
    )
  );
}
