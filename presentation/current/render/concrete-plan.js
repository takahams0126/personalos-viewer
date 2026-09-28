import { h, textRow } from './dom.js';

const CONSTRAINT_LABELS = {
  hard_limit: '期限',
  latest_safe: '安全側の最終時刻',
  earliest: '最早時刻'
};

async function describeTarget(target, resolver) {
  if (target?.kind === 'route_local') {
    return { title: target.label || 'ルート内地点', kind: 'route_local' };
  }

  if (target?.entity_type && target?.id) {
    try {
      const described = await resolver.describe(target);
      return { title: described.title, kind: target.entity_type };
    } catch {
      return {
        title: `${target.entity_type}:${target.id}`,
        kind: target.entity_type,
        unavailable: true
      };
    }
  }

  return { title: '地点情報なし', kind: 'unknown', unavailable: true };
}

function renderTimeFacts(action) {
  const facts = [];
  if (action.arrival_label) facts.push(textRow('到着', action.arrival_label));
  if (action.departure_label) facts.push(textRow('出発', action.departure_label));
  if (action.stay_label) facts.push(textRow('滞在', action.stay_label));
  return facts.length ? h('div', { className: 'action-times' }, facts) : null;
}

function renderTodos(todos) {
  if (!todos?.length) return null;
  return h('section', { className: 'action-todos' },
    h('h5', { text: 'やること' }),
    h('ul', {}, todos.map(todo => h('li', { text: todo })))
  );
}

function renderConstraints(constraints) {
  if (!constraints?.length) return null;
  return h('section', { className: 'action-constraints' },
    h('h5', { text: '時間上の注意' }),
    h('ul', {}, constraints.map(item => {
      const label = CONSTRAINT_LABELS[item.kind] || '時刻制約';
      return h('li', {}, `${label} ${item.time_label || ''}`.trim());
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

  const service = move.service
    ? [move.service.operator, move.service.service_number].filter(Boolean).join(' ')
    : null;

  const serviceTime = move.service
    ? [move.service.depart_label, move.service.arrive_label].filter(Boolean).join(' → ')
    : null;

  return h('aside', { className: 'next-move', dataset: { semantic: 'next-move' } },
    h('h5', { text: '次の移動' }),
    summary ? h('p', { text: summary }) : null,
    service ? h('p', { text: service }) : null,
    serviceTime ? h('p', { text: serviceTime }) : null
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
        h('h4', { text: target.title }),
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
    let title;
    try {
      const loaded = await resolver.load(relation.route_ref);
      title = loaded.data.title || loaded.entry.title;
    } catch {
      title = `${relation.route_ref.entity_type}:${relation.route_ref.id}`;
    }
    return h('li', {},
      h('strong', { text: title }),
      ` — Action ${relation.from_action_order}〜${relation.to_action_order}`
    );
  }));

  return h('section', { className: 'day-routes', dataset: { semantic: 'route-relations' } },
    h('h4', { text: 'この日のルート' }),
    h('ul', {}, items)
  );
}

async function renderMapPreview(artifactRef, artifactLoader, resolver) {
  if (!artifactRef) return null;

  try {
    const artifact = await artifactLoader.load(artifactRef);
    const pointItems = await Promise.all((artifact.points || []).map(async point => {
      const target = await describeTarget(point.entity_ref, resolver);
      return h('li', { text: target.title });
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
        ? h('div', { className: 'map-data-fallback' }, h('h5', { text: '区間' }), h('ol', {}, segmentItems))
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
  return h('details', { className: 'day-variant' },
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
    await renderActions(day.actions, resolver),
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
    plan.status.state?.label ? h('p', { text: plan.status.state.label }) : null,
    plan.status.attention?.length
      ? h('ul', {}, plan.status.attention.map(item => h('li', { text: item.text })))
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
    h('header', { className: 'plan-header' },
      h('p', { className: 'entity-kind', text: 'Concrete Plan' }),
      h('h1', { text: concretePlan.title }),
      concretePlan.period?.label ? h('p', { className: 'plan-period', text: concretePlan.period.label }) : null,
      sourcePlan?.title ? h('p', {}, `元Plan: ${sourcePlan.title}`) : null,
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
