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

function renderPlanNavigation(manifestEntry) {
  const executionRef = concretePlanRef(manifestEntry);
  return h('nav', { className: 'plan-navigation', attrs: { 'aria-label': 'Plan表示' } },
    h('span', { attrs: { 'aria-current': 'page' }, text: '計画' }),
    executionRef
      ? h('a', { attrs: { href: hrefFor(executionRef) }, text: '実施' })
      : null
  );
}

function renderOptionalList(title, values, className) {
  if (!values?.length) return null;
  return h('section', { className },
    h('h5', { text: title }),
    h('ul', {}, values.map(value => h('li', { text: value })))
  );
}

function renderRelationFacts(item) {
  const rows = [];
  if (item.visit_purpose?.label) {
    rows.push(h('p', { className: 'plan-item-meta', text: `目的: ${item.visit_purpose.label}` }));
  }
  if (item.inclusion_requirement?.label) {
    rows.push(h('p', { className: 'plan-item-meta', text: `扱い: ${item.inclusion_requirement.label}` }));
  }
  if (item.condition?.text) {
    rows.push(h('p', { className: 'plan-item-condition', text: `条件: ${item.condition.text}` }));
  }
  return rows;
}

async function renderPlace(item, resolver) {
  const target = await describeRef(item.target_ref, resolver);
  return h('li', {
    className: 'plan-sequence-item plan-place',
    dataset: { kind: 'place', semantic: 'place' }
  },
    h('article', {},
      h('p', { className: 'plan-item-kind', text: '地点' }),
      h('h4', {}, entityTitle(item.target_ref, target.title, target.unavailable)),
      target.unavailable
        ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' })
        : null,
      ...renderRelationFacts(item),
      renderOptionalList('やること', item.actions, 'plan-item-actions')
    )
  );
}

async function renderMovement(item, resolver) {
  const [from, to] = await Promise.all([
    describeRef(item.from_ref, resolver),
    describeRef(item.to_ref, resolver)
  ]);
  return h('li', {
    className: 'plan-sequence-item plan-movement',
    dataset: { kind: 'movement', semantic: 'movement' }
  },
    h('article', {},
      h('p', { className: 'plan-item-kind', text: '移動' }),
      h('p', { className: 'plan-movement-main' },
        h('strong', { text: item.transport?.label || '移動' }),
        h('span', {},
          entityTitle(item.from_ref, from.title, from.unavailable),
          ' → ',
          entityTitle(item.to_ref, to.title, to.unavailable)
        )
      ),
      item.condition?.text
        ? h('p', { className: 'plan-item-condition', text: `条件: ${item.condition.text}` })
        : null
    )
  );
}

async function renderAlternative(alternative, resolver) {
  const route = await describeRef(alternative.route_ref, resolver);
  return h('li', { dataset: { semantic: 'alternative-route' } },
    h('strong', {}, entityTitle(alternative.route_ref, route.title, route.unavailable)),
    alternative.replacement_intent
      ? h('p', { text: alternative.replacement_intent })
      : null,
    alternative.selection_condition?.text
      ? h('p', { className: 'plan-item-condition', text: `選択条件: ${alternative.selection_condition.text}` })
      : null
  );
}

async function renderRouteStops(routeData, resolver) {
  const sequence = routeData?.sequence || [];
  if (!sequence.length) return null;

  const items = await Promise.all(sequence.map(async stop => {
    const spot = await describeRef(stop.spot_ref, resolver);
    return h('li', {
      className: 'plan-route-stop',
      dataset: { semantic: 'route-stop', order: stop.order }
    },
      h('span', { className: 'plan-route-stop-order', text: String(stop.order) }),
      h('strong', {}, entityTitle(stop.spot_ref, spot.title, spot.unavailable)),
      stop.visit_purpose?.label
        ? h('span', { className: 'plan-route-stop-purpose', text: stop.visit_purpose.label })
        : null,
      stop.inclusion_requirement?.label
        ? h('span', { className: 'plan-route-stop-inclusion', text: stop.inclusion_requirement.label })
        : null
    );
  }));

  return h('section', {
    className: 'plan-route-sequence',
    dataset: { semantic: 'route-sequence' }
  },
    h('h5', { text: 'ルート内の立ち寄り順' }),
    h('ol', {}, items)
  );
}

async function renderRoute(item, resolver) {
  let routeData = null;
  let title = machineLabel(item.route_ref);
  let unavailable = false;

  try {
    const loaded = await resolver.load(item.route_ref);
    routeData = loaded.data;
    title = routeData.title;
  } catch {
    const described = await describeRef(item.route_ref, resolver);
    title = described.title;
    unavailable = true;
  }

  const identity = routeData
    ? [routeData.family_label, routeData.variant?.label].filter(Boolean).join(' / ')
    : '';
  const alternatives = await Promise.all(
    (item.alternatives || []).map(alternative => renderAlternative(alternative, resolver))
  );
  const routeStops = routeData ? await renderRouteStops(routeData, resolver) : null;

  return h('li', {
    className: 'plan-sequence-item plan-route',
    dataset: { kind: 'route', semantic: 'route-occurrence' }
  },
    h('article', {},
      h('p', { className: 'plan-item-kind', text: 'ルート' }),
      h('h4', {}, entityTitle(item.route_ref, title, unavailable)),
      identity ? h('p', { className: 'plan-route-identity', text: identity }) : null,
      routeData?.summary ? h('p', { className: 'plan-route-summary', text: routeData.summary }) : null,
      unavailable
        ? h('p', { className: 'component-unavailable', text: 'Route詳細を取得できませんでした' })
        : null,
      item.condition?.text
        ? h('p', { className: 'plan-item-condition', text: `条件: ${item.condition.text}` })
        : null,
      routeStops,
      alternatives.length
        ? h('section', { className: 'plan-route-alternatives', dataset: { semantic: 'route-alternatives' } },
            h('h5', { text: '代替ルート' }),
            h('ul', {}, alternatives)
          )
        : null
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
  return h('li', {
    className: 'plan-sequence-boundary',
    dataset: { semantic: label.toLowerCase() }
  },
    h('span', { className: 'plan-boundary-label', text: label }),
    h('strong', {}, entityTitle(ref, target.title, target.unavailable)),
    target.unavailable
      ? h('span', { className: 'component-unavailable', text: ' 参照不可' })
      : null
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
    dataset: { semantic: 'day', day: day.ordinal },
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

function renderReorderGroups(plan) {
  if (!plan.reorder_groups?.length) return null;
  const dayByOrdinal = new Map((plan.days || []).map(day => [day.ordinal, day]));

  return h('section', { className: 'plan-reorder', dataset: { semantic: 'day-reorder' } },
    h('h2', { text: '日程調整' }),
    ...plan.reorder_groups.map(group => {
      const labels = (group.day_ordinals || []).map(ordinal => {
        const day = dayByOrdinal.get(ordinal);
        return day ? `Day ${ordinal} ${day.title}` : `Day ${ordinal}`;
      });
      return h('div', { className: 'plan-reorder-group' },
        h('p', { text: `${group.factor?.label || '条件'}に応じて入れ替え可能` }),
        h('p', { className: 'plan-reorder-days', text: labels.join(' / ') })
      );
    })
  );
}

export async function renderPlan({ plan, manifestEntry, resolver }) {
  const openByDefault = (plan.days || []).length === 1;
  const days = await Promise.all(
    (plan.days || []).map(day => renderDay(day, resolver, openByDefault))
  );

  return h('article', {
    className: 'plan-page',
    dataset: { semantic: 'plan' }
  },
    renderPlanNavigation(manifestEntry),
    h('header', { className: 'plan-overview', dataset: { semantic: 'plan-overview' } },
      h('h1', { text: plan.title }),
      plan.summary ? h('p', { text: plan.summary }) : null
    ),
    renderReorderGroups(plan),
    h('section', { className: 'plan-days', dataset: { semantic: 'days' } },
      h('h2', { text: '日程' }),
      days
    )
  );
}
