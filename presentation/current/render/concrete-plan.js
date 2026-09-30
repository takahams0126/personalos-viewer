import { hrefFor, isDetailPageRef } from '../core/router.js';
import { h, textRow } from './dom.js';

const CONSTRAINT_LABELS = {
  target: '目標',
  latest_safe: '安心ライン',
  hard_limit: '最終制約',
  next_service: '次の便'
};

async function describeTarget(target, resolver) {
  if (target?.kind === 'route_local') {
    return { title: target.label || 'ルート内地点', kind: 'route_local', ref: null };
  }

  if (target?.entity_type && target?.id) {
    try {
      const described = await resolver.describe(target);
      return { title: described.title, kind: target.entity_type, ref: target };
    } catch {
      return {
        title: `${target.entity_type}:${target.id}`,
        kind: target.entity_type,
        ref: target,
        unavailable: true
      };
    }
  }

  return { title: '地点情報なし', kind: 'unknown', ref: null, unavailable: true };
}

function entityTitle(ref, title, unavailable = false) {
  if (!unavailable && isDetailPageRef(ref)) {
    return h('a', { attrs: { href: hrefFor(ref) }, text: title });
  }
  return h('span', { text: title });
}

function renderTimeFacts(action) {
  const facts = [];
  if (action.arrival_label) facts.push(textRow('到着', action.arrival_label));
  if (action.departure_label) facts.push(textRow('出発', action.departure_label));
  if (action.stay_label) facts.push(textRow('滞在', action.stay_label));
  return facts.length
    ? h('section', { className: 'action-times', dataset: { semantic: 'time-facts' } },
        h('h5', { className: 'visually-hidden', text: '時刻' }),
        facts
      )
    : null;
}

function renderTodos(todos) {
  if (!todos?.length) return null;
  return h('section', { className: 'action-todos', dataset: { semantic: 'todos' } },
    h('h5', { text: 'やること' }),
    h('ul', {}, todos.map(todo => h('li', { text: todo })))
  );
}

function serviceIdentity(service) {
  if (!service) return '';
  return [service.operator, service.route_name, service.service_number].filter(Boolean).join(' ');
}

function serviceTime(service) {
  if (!service) return '';
  return [service.depart_label, service.arrive_label].filter(Boolean).join(' → ');
}

function renderConstraints(constraints) {
  if (!constraints?.length) return null;
  return h('section', { className: 'action-constraints', dataset: { semantic: 'time-constraints' } },
    h('h5', { text: '時間上の注意' }),
    h('ul', {}, constraints.map(item => {
      const label = CONSTRAINT_LABELS[item.kind] || '時刻制約';
      const identity = serviceIdentity(item.service);
      const times = serviceTime(item.service);
      return h('li', { dataset: { semantic: 'time-constraint', constraintKind: item.kind || '' } },
        h('strong', { text: [label, item.time_label].filter(Boolean).join(' ') }),
        identity ? h('p', { className: 'constraint-service', text: identity }) : null,
        times ? h('p', { className: 'constraint-service-time', text: times }) : null,
        item.margin_label ? h('p', { className: 'constraint-margin', text: item.margin_label }) : null
      );
    }))
  );
}

function renderMove(move) {
  if (!move) return null;

  const summary = [
    move.transport?.label,
    move.duration_label,
    move.distance_label
  ].filter(Boolean).join(' ・ ');

  const service = serviceIdentity(move.service);
  const times = serviceTime(move.service);

  return h('aside', { className: 'next-move', dataset: { semantic: 'next-move' } },
    h('h5', { text: '次の移動' }),
    summary ? h('p', { text: summary }) : null,
    service ? h('p', { text: service }) : null,
    times ? h('p', { text: times }) : null
  );
}

async function renderAction(action, resolver) {
  const target = await describeTarget(action.target, resolver);
  const purpose = action.visit_purpose?.label;
  const inclusion = action.inclusion_requirement?.label;

  return h('li', {
    className: 'execution-action',
    dataset: {
      semantic: 'action',
      order: action.order,
      targetKind: target.kind
    }
  },
    h('article', { className: 'action-body' },
      h('header', { className: 'action-header' },
        h('p', { className: 'action-order', text: `#${action.order}` }),
        h('h4', {}, entityTitle(target.ref, target.title, target.unavailable)),
        target.unavailable
          ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' })
          : null,
        purpose ? h('p', { className: 'action-purpose', text: purpose }) : null,
        inclusion ? h('p', { className: 'action-inclusion', text: inclusion }) : null
      ),
      renderTimeFacts(action),
      renderTodos(action.todos),
      renderConstraints(action.time_constraints),
      renderMove(action.next_move)
    )
  );
}

async function renderActions(actions, resolver) {
  const nodes = await Promise.all((actions || []).map(action => renderAction(action, resolver)));
  return h('ol', { className: 'execution-flow', dataset: { semantic: 'execution-flow' } }, nodes);
}

async function renderRouteRelations(routes, resolver) {
  if (!routes?.length) return null;

  const items = await Promise.all(routes.map(async relation => {
    let routeData = null;
    let title;
    let unavailable = false;
    try {
      const loaded = await resolver.load(relation.route_ref);
      routeData = loaded.data;
      title = routeData.title || loaded.entry.title;
    } catch {
      title = `${relation.route_ref.entity_type}:${relation.route_ref.id}`;
      unavailable = true;
    }

    const identity = routeData
      ? [routeData.family_label, routeData.variant?.label].filter(Boolean).join(' / ')
      : '';

    return h('li', { className: 'day-route-relation', dataset: { semantic: 'route-relation' } },
      h('article', {},
        h('h5', {}, entityTitle(relation.route_ref, title, unavailable)),
        identity ? h('p', { className: 'day-route-identity', text: identity }) : null,
        h('p', {
          className: 'day-route-action-range',
          text: `実施範囲 Action ${relation.from_action_order}〜${relation.to_action_order}`
        }),
        unavailable
          ? h('p', { className: 'component-unavailable', text: 'Route詳細を取得できませんでした' })
          : null
      )
    );
  }));

  return h('section', { className: 'day-routes', dataset: { semantic: 'route-relations' } },
    h('h4', { text: 'この日のルート' }),
    h('p', { className: 'day-routes-note', text: '実際の立ち寄り順・時刻は下の行動順を正とします。' }),
    h('ul', {}, items)
  );
}

async function renderMapPreview(artifactRef, artifactLoader, resolver) {
  if (!artifactRef) return null;

  try {
    const artifact = await artifactLoader.load(artifactRef);
    const pointItems = await Promise.all((artifact.points || []).map(async point => {
      const target = await describeTarget(point.entity_ref, resolver);
      return h('li', {}, entityTitle(target.ref, target.title, target.unavailable));
    }));

    const segmentItems = (artifact.segments || []).map(segment =>
      h('li', { text: segment.mode?.label || '移動' })
    );

    return h('figure', {
      className: 'map-semantic-preview map-view',
      dataset: {
        semantic: 'map',
        mapArtifactId: artifactRef.artifact_id
      }
    },
      h('figcaption', { text: '移動地図' }),
      h('div', {
        className: 'map-canvas',
        attrs: { role: 'img', 'aria-label': '移動地図' }
      }),
      h('p', { className: 'map-state', text: '地図を読み込み中…' }),
      pointItems.length
        ? h('div', { className: 'map-data-fallback' }, h('h5', { text: '地点' }), h('ol', {}, pointItems))
        : null,
      segmentItems.length
        ? h('div', { className: 'map-data-fallback' }, h('h5', { text: '実経路' }), h('ol', {}, segmentItems))
        : null
    );
  } catch {
    return h('section', { className: 'map-unavailable', dataset: { semantic: 'map' } },
      h('h4', { text: '地図' }),
      h('p', { text: '地図データを読み込めませんでした。' })
    );
  }
}

async function renderVariant(variant, resolver, artifactLoader) {
  return h('details', { className: 'day-variant', dataset: { semantic: 'variant' } },
    h('summary', { text: variant.intent || variant.variant_id || '代替案' }),
    variant.selection_condition?.text
      ? h('p', { className: 'variant-condition', text: variant.selection_condition.text })
      : null,
    await renderActions(variant.actions, resolver),
    await renderMapPreview(variant.map_artifact_ref, artifactLoader, resolver)
  );
}

function renderWeather(weatherDay) {
  if (!weatherDay) return null;
  const summary = [
    weatherDay.condition?.label,
    weatherDay.temperature_min_label && `最低 ${weatherDay.temperature_min_label}`,
    weatherDay.temperature_max_label && `最高 ${weatherDay.temperature_max_label}`,
    weatherDay.precipitation_probability_label && `降水 ${weatherDay.precipitation_probability_label}`,
    weatherDay.wind_label && `風 ${weatherDay.wind_label}`
  ].filter(Boolean).join(' ・ ');

  return h('section', { className: 'day-weather', dataset: { semantic: 'weather' } },
    h('h4', { text: '天気' }),
    h('p', { text: summary })
  );
}

async function renderDay(day, sourcePlan, concretePlan, resolver, artifactLoader) {
  const sourceDay = sourcePlan?.days?.find(item => item.ordinal === day.source_plan_day_ordinal);
  const weatherDay = concretePlan.weather?.days?.find(item => item.day === day.ordinal);
  const title = sourceDay?.title || `Day ${day.ordinal}`;

  const variants = await Promise.all((day.variants || []).map(
    variant => renderVariant(variant, resolver, artifactLoader)
  ));

  return h('section', {
    className: 'plan-day',
    dataset: { semantic: 'day', day: day.ordinal }
  },
    h('header', { className: 'day-header' },
      h('p', { className: 'day-date', text: `Day ${day.ordinal} — ${day.date} ${day.weekday_label || ''}`.trim() }),
      h('h2', { text: title }),
      sourceDay?.summary ? h('p', { className: 'day-summary', text: sourceDay.summary }) : null,
      day.start_time_label ? textRow('開始', day.start_time_label) : null
    ),
    renderWeather(weatherDay),
    await renderRouteRelations(day.routes, resolver),
    h('section', { className: 'day-execution', dataset: { semantic: 'actual-actions' } },
      h('h3', { text: '行動順' }),
      await renderActions(day.actions, resolver)
    ),
    await renderMapPreview(day.map_artifact_ref, artifactLoader, resolver),
    variants.length
      ? h('section', { className: 'day-variants', dataset: { semantic: 'variants' } },
          h('h3', { text: '代替案' }),
          variants
        )
      : null
  );
}

function renderStatus(plan) {
  if (!plan.status) return null;
  return h('section', { className: 'plan-status', dataset: { semantic: 'status' } },
    h('h2', { text: '現在の状態' }),
    plan.status.state?.label ? h('p', { className: 'status-state', text: plan.status.state.label }) : null,
    plan.status.attention?.length
      ? h('ul', { className: 'status-attention' }, plan.status.attention.map(item =>
          h('li', { dataset: { level: item.level || '', semantic: item.semantic || '' }, text: item.text })
        ))
      : null
  );
}

function renderCost(plan) {
  if (!plan.cost) return null;
  return h('section', { className: 'plan-cost', dataset: { semantic: 'cost' } },
    h('h2', { text: '費用' }),
    plan.cost.total_label ? h('p', { className: 'cost-total', text: plan.cost.total_label }) : null,
    plan.cost.items?.length
      ? h('ul', {}, plan.cost.items.map(item => {
          const amount = item.amount_label || item.amount_state?.label || '';
          return h('li', {},
            h('strong', { text: item.meaning }),
            amount ? ` — ${amount}` : '',
            item.reason ? h('p', { text: item.reason }) : null
          );
        }))
      : null
  );
}

function renderExecutionNavigation(concretePlan) {
  const sourceRef = concretePlan.source_plan_ref;
  return h('nav', { className: 'plan-navigation', attrs: { 'aria-label': 'Plan表示' } },
    sourceRef
      ? h('a', { attrs: { href: hrefFor(sourceRef) }, text: '計画' })
      : null,
    h('span', { attrs: { 'aria-current': 'page' }, text: '実施' })
  );
}

export async function renderConcretePlan({ concretePlan, sourcePlan, resolver, artifactLoader }) {
  const dayNodes = await Promise.all(
    (concretePlan.days || []).map(day =>
      renderDay(day, sourcePlan, concretePlan, resolver, artifactLoader)
    )
  );

  return h('article', {
    className: 'concrete-plan',
    dataset: { semantic: 'concrete-plan', entityId: concretePlan.id }
  },
    renderExecutionNavigation(concretePlan),
    h('header', { className: 'plan-header', dataset: { semantic: 'execution-overview' } },
      h('p', { className: 'entity-kind', text: 'Concrete Plan' }),
      h('h1', { text: concretePlan.title }),
      concretePlan.period?.label ? h('p', { className: 'plan-period', text: concretePlan.period.label }) : null,
      concretePlan.weather?.notice ? h('p', { className: 'weather-notice', text: concretePlan.weather.notice }) : null
    ),
    renderStatus(concretePlan),
    h('section', { className: 'plan-days', dataset: { semantic: 'days' } }, dayNodes),
    concretePlan.fuel?.distance_label
      ? h('section', { className: 'plan-fuel', dataset: { semantic: 'fuel' } },
          h('h2', { text: '走行距離' }),
          h('p', { text: concretePlan.fuel.distance_label })
        )
      : null,
    renderCost(concretePlan)
  );
}
