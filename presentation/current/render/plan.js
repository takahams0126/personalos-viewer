import { hrefFor, isDetailPageRef } from '../core/router.js';
import { h } from './dom.js';

function machineLabel(ref) {
  if (!ref?.entity_type || !ref?.id) return '参照情報なし';
  return `${ref.entity_type}:${ref.id}`;
}

async function describeRef(ref, resolver) {
  if (!ref) return { title: '参照情報なし', unavailable: true };
  try {
    return await resolver.describe(ref);
  } catch {
    return { title: machineLabel(ref), unavailable: true };
  }
}

function entityTitle(ref, title, unavailable = false) {
  if (!unavailable && isDetailPageRef(ref)) {
    return h('a', { attrs: { href: hrefFor(ref) }, text: title });
  }
  return h('span', { text: title });
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

function renderOptionalList(title, values, className) {
  if (!values?.length) return null;
  return h('section', { className }, h('h5', { text: title }), h('ul', {}, values.map(value => h('li', { text: value }))));
}

function renderRelationFacts(item) {
  const rows = [];
  if (item.visit_purpose?.label) rows.push(h('p', { className: 'plan-item-meta', text: `目的: ${item.visit_purpose.label}` }));
  if (item.inclusion_requirement?.label) rows.push(h('p', { className: 'plan-item-meta', text: `扱い: ${item.inclusion_requirement.label}` }));
  if (item.condition?.text) rows.push(h('p', { className: 'plan-item-condition', text: `条件: ${item.condition.text}` }));
  return rows;
}

async function renderPlace(item, resolver) {
  const target = await describeRef(item.target_ref, resolver);
  return h('li', { className: 'plan-sequence-item plan-place', dataset: { kind: 'place', semantic: 'place' } },
    h('article', {},
      h('p', { className: 'plan-item-kind', text: '地点' }),
      h('h4', {}, entityTitle(item.target_ref, target.title, target.unavailable)),
      target.unavailable ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' }) : null,
      ...renderRelationFacts(item),
      renderOptionalList('やること', item.actions, 'plan-item-actions')
    )
  );
}

async function renderMovement(item, resolver) {
  const [from, to] = await Promise.all([describeRef(item.from_ref, resolver), describeRef(item.to_ref, resolver)]);
  return h('li', { className: 'plan-sequence-item plan-movement', dataset: { kind: 'movement', semantic: 'movement' } },
    h('article', {},
      h('p', { className: 'plan-item-kind', text: '移動' }),
      h('p', { className: 'plan-movement-main' },
        h('strong', { text: item.transport?.label || '移動' }),
        h('span', {}, entityTitle(item.from_ref, from.title, from.unavailable), ' → ', entityTitle(item.to_ref, to.title, to.unavailable))
      ),
      item.condition?.text ? h('p', { className: 'plan-item-condition', text: `条件: ${item.condition.text}` }) : null
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
    condition ? h('p', { className: 'plan-item-condition', text: `選択条件: ${condition}` }) : null,
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
  return h('li', { className: 'plan-sequence-item plan-route', dataset: { kind: 'route', semantic: 'route-occurrence' } },
    h('article', {},
      h('p', { className: 'plan-item-kind', text: 'ルート' }),
      h('section', { className: 'plan-route-choice', dataset: { semantic: 'route-choice' } },
        choices.length > 1
          ? h('label', { className: 'plan-route-choice-label' }, h('span', { text: 'ルート選択' }), select)
          : null,
        detailHost
      )
    )
  );
}

async function renderSequenceItem(item, resolver) {
  if (item.kind === 'place') return renderPlace(item, resolver);
  if (item.kind === 'movement') return renderMovement(item, resolver);
  if (item.kind === 'route') return renderRoute(item, resolver);
  return h('li', {
    className: 'plan-sequence-item component-unavailable',
    dataset: { kind: item.kind || 'unknown' },
    text: `未対応のsequence item: ${item.kind || 'unknown'}`
  });
}

async function renderBoundary(label, ref, resolver) {
  const target = await describeRef(ref, resolver);
  return h('li', { className: 'plan-sequence-boundary', dataset: { semantic: label.toLowerCase() } },
    h('span', { className: 'plan-boundary-label', text: label }),
    h('strong', {}, entityTitle(ref, target.title, target.unavailable)),
    target.unavailable ? h('span', { className: 'component-unavailable', text: ' 参照不可' }) : null
  );
}

async function renderDay(day, resolver, openByDefault) {
  const [start, end, items] = await Promise.all([
    renderBoundary('START', day.start_ref, resolver),
    renderBoundary('END', day.end_ref, resolver),
    Promise.all((day.sequence || []).map(item => renderSequenceItem(item, resolver)))
  ]);
  return h('details', {
    className: 'plan-day-disclosure',
    dataset: { semantic: 'day', sourceDay: day.ordinal },
    attrs: { open: openByDefault }
  },
    h('summary', {},
      h('span', { className: 'plan-day-number', text: `Day ${day.ordinal}` }),
      h('span', { className: 'plan-day-title', text: day.title })
    ),
    h('div', { className: 'plan-day-body' },
      day.summary ? h('p', { className: 'plan-day-summary', text: day.summary }) : null,
      h('ol', { className: 'plan-sequence', dataset: { semantic: 'conceptual-sequence' } }, start, items, end)
    )
  );
}

export async function renderPlan({ plan, manifestEntry, resolver }) {
  const orderedDays = [...(plan.days || [])].sort((a, b) => a.ordinal - b.ordinal);
  const openByDefault = orderedDays.length === 1;
  const dayNodes = await Promise.all(
    orderedDays.map(day => renderDay(day, resolver, openByDefault))
  );
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
