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

function googleMapsLink(event) {
  if (!event?.google_maps_url) return null;
  return h('a', {
    className: 'google-maps-link',
    attrs: { href: event.google_maps_url, target: '_blank', rel: 'noopener noreferrer' },
    text: 'Google Mapsで開く'
  });
}

function renderTimelineTime(action) {
  if (!action.arrival_label && !action.departure_label) return null;
  return h('aside', { className: 'action-time-axis', dataset: { semantic: 'timeline-time' } },
    action.arrival_label
      ? h('span', { className: 'action-time-arrival', text: action.arrival_label, attrs: { 'aria-label': `到着 ${action.arrival_label}` } })
      : null,
    action.departure_label && action.departure_label !== action.arrival_label
      ? h('span', { className: 'action-time-departure', text: action.departure_label, attrs: { 'aria-label': `出発 ${action.departure_label}` } })
      : null
  );
}

function renderStay(action) {
  return action.stay_label
    ? h('section', { className: 'action-stay', dataset: { semantic: 'stay' } }, textRow('滞在', action.stay_label))
    : null;
}

function renderTodos(todos) {
  if (!todos?.length) return null;
  return h('section', { className: 'action-todos', dataset: { semantic: 'todos' } },
    h('h5', { text: 'やること' }),
    h('ul', {}, todos.map(todo =>
      h('li', { dataset: { semantic: 'todo' } },
        h('span', { className: 'todo-instruction', text: todo.instruction }),
        todo.estimated_duration_label
          ? h('span', { className: 'todo-duration', text: `想定 ${todo.estimated_duration_label}` })
          : null
      )
    ))
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

function renderService(service, className = 'service-fact') {
  if (!service) return null;
  const identity = serviceIdentity(service);
  const times = serviceTime(service);
  return h('div', { className, dataset: { semantic: 'transport-service' } },
    identity ? h('p', { className: 'service-identity', text: identity }) : null,
    times ? h('p', { className: 'service-time', text: times }) : null,
    service.reservation_label
      ? h('p', { className: 'service-reservation', text: service.reservation_label })
      : null
  );
}

function renderConstraints(constraints) {
  if (!constraints?.length) return null;
  return h('section', { className: 'action-constraints', dataset: { semantic: 'time-constraints' } },
    h('h5', { text: '時間上の注意' }),
    h('ul', {}, constraints.map(item => {
      const label = CONSTRAINT_LABELS[item.kind] || '時刻制約';
      return h('li', {
        dataset: {
          semantic: 'time-constraint',
          constraintKind: item.kind || '',
          marginState: item.margin_state?.code || ''
        }
      },
        h('strong', { text: [label, item.time_label].filter(Boolean).join(' ') }),
        item.margin_state?.label
          ? h('span', { className: 'constraint-state', text: item.margin_state.label })
          : null,
        item.margin_label ? h('p', { className: 'constraint-margin', text: item.margin_label }) : null,
        renderService(item.service, 'constraint-service')
      );
    }))
  );
}

function renderFacilityExecutions(items) {
  if (!items?.length) return null;
  return h('section', { className: 'action-facilities', dataset: { semantic: 'facility-executions' } },
    h('h5', { text: '現地利用' }),
    h('ul', {}, items.map(item => {
      const details = [
        item.vehicle_type?.label,
        item.reservation_label,
        item.opens_label && `開始 ${item.opens_label}`,
        item.closes_label && `終了 ${item.closes_label}`
      ].filter(Boolean);
      return h('li', { dataset: { semantic: 'facility-execution', usable: item.usable } },
        h('strong', { text: item.facility_key }),
        h('span', { text: item.usable ? '利用可' : '利用不可' }),
        details.length ? h('p', { text: details.join(' ・ ') }) : null
      );
    }))
  );
}

function renderAttention(attention) {
  if (!attention?.length) return null;
  return h('section', { className: 'action-attention', dataset: { semantic: 'attention' } },
    h('h5', { text: '注意' }),
    h('ul', {}, attention.map(item =>
      h('li', { dataset: { level: item.level || '', semantic: item.semantic || '' }, text: item.text })
    ))
  );
}

function renderMove(move) {
  if (!move) return null;
  const summary = [move.transport?.label, move.duration_label, move.distance_label].filter(Boolean).join(' ・ ');
  return h('aside', {
    className: 'next-move',
    dataset: { semantic: 'next-move', connectionState: move.connection_state?.code || '' }
  },
    h('h5', { text: '次の移動' }),
    summary ? h('p', { className: 'next-move-summary', text: summary }) : null,
    renderService(move.service),
    move.connection_margin_label
      ? h('p', { className: 'connection-margin', text: move.connection_margin_label })
      : null,
    move.connection_state?.label
      ? h('p', { className: 'connection-state', text: move.connection_state.label })
      : null
  );
}

function fixedFuelEventForTarget(fuelEvents, target) {
  if (target?.entity_type !== 'travel_point') return null;
  return (fuelEvents || []).find(event =>
    event.importance?.code === 'required' &&
    event.timing?.code === 'fixed' &&
    event.travel_point_ref?.id === target.id
  ) || null;
}

async function renderAction(action, resolver, fuelEvents = []) {
  const target = await describeTarget(action.target, resolver);
  const purpose = action.visit_purpose?.label;
  const inclusion = action.inclusion_requirement?.label;
  const fixedFuel = fixedFuelEventForTarget(fuelEvents, action.target);

  return h('li', {
    className: 'execution-action',
    dataset: { semantic: 'action', order: action.order, targetKind: target.kind }
  },
    renderTimelineTime(action),
    h('article', { className: 'action-body' },
      h('header', { className: 'action-header' },
        h('p', { className: 'action-order', text: `#${action.order}` }),
        h('h4', {}, entityTitle(target.ref, target.title, target.unavailable)),
        target.unavailable
          ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' })
          : null,
        purpose ? h('p', { className: 'action-purpose', text: purpose }) : null,
        inclusion ? h('p', { className: 'action-inclusion', text: inclusion }) : null,
        fixedFuel ? googleMapsLink(fixedFuel) : null
      ),
      renderStay(action),
      renderTodos(action.todos),
      renderFacilityExecutions(action.facility_executions),
      renderConstraints(action.time_constraints),
      renderAttention(action.attention),
      renderMove(action.next_move)
    )
  );
}

async function renderActions(actions, resolver, fuelEvents = []) {
  const nodes = await Promise.all((actions || []).map(action => renderAction(action, resolver, fuelEvents)));
  return h('ol', { className: 'execution-flow', dataset: { semantic: 'execution-timeline' } }, nodes);
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
        h('p', { className: 'day-route-action-range', text: `実施範囲 Action ${relation.from_action_order}〜${relation.to_action_order}` }),
        unavailable ? h('p', { className: 'component-unavailable', text: 'Route詳細を取得できませんでした' }) : null
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
    const segmentItems = (artifact.segments || []).map(segment => h('li', { text: segment.mode?.label || '移動' }));
    return h('figure', {
      className: 'map-semantic-preview map-view',
      dataset: { semantic: 'map', mapArtifactId: artifactRef.artifact_id }
    },
      h('figcaption', { text: '移動地図' }),
      h('div', { className: 'map-canvas', attrs: { role: 'img', 'aria-label': '移動地図' } }),
      h('p', { className: 'map-state', text: '地図を読み込み中…' }),
      pointItems.length ? h('div', { className: 'map-data-fallback' }, h('h5', { text: '地点' }), h('ol', {}, pointItems)) : null,
      segmentItems.length ? h('div', { className: 'map-data-fallback' }, h('h5', { text: '実経路' }), h('ol', {}, segmentItems)) : null
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

function weatherTemperatureRange(weatherDay) {
  const minimum = weatherDay?.temperature_min_label;
  const maximum = weatherDay?.temperature_max_label;
  if (minimum && maximum) return `${minimum}〜${maximum}`;
  return minimum || maximum || '';
}

function compactWeatherText(weatherDay) {
  if (!weatherDay) return '';
  return [
    weatherDay.condition?.label,
    weatherTemperatureRange(weatherDay),
    weatherDay.precipitation_probability_label && `降水 ${weatherDay.precipitation_probability_label}`,
    weatherDay.precipitation_amount_label && `${weatherDay.precipitation_amount_label}`
  ].filter(Boolean).join(' ・ ');
}

function renderWeather(weatherDay) {
  if (!weatherDay) return null;
  const summaryFacts = [
    weatherTemperatureRange(weatherDay) && `気温 ${weatherTemperatureRange(weatherDay)}`,
    weatherDay.precipitation_probability_label && `降水確率 ${weatherDay.precipitation_probability_label}`,
    weatherDay.precipitation_amount_label && `降水量 ${weatherDay.precipitation_amount_label}`,
    weatherDay.wind_label && `風 ${weatherDay.wind_label}`
  ].filter(Boolean);

  const periods = weatherDay.periods || [];
  return h('section', { className: 'day-weather', dataset: { semantic: 'day-weather' } },
    h('h4', { text: '天気' }),
    h('div', { className: 'weather-summary', dataset: { semantic: 'weather-summary' } },
      weatherDay.condition?.label ? h('strong', { text: weatherDay.condition.label }) : null,
      summaryFacts.length ? h('p', { text: summaryFacts.join(' ・ ') }) : null
    ),
    periods.length
      ? h('details', { className: 'weather-detail', dataset: { semantic: 'weather-detail' } },
          h('summary', { text: '3時間ごとの予報' }),
          h('ol', { className: 'weather-periods' }, periods.map(period =>
            h('li', { className: 'weather-period', dataset: { semantic: 'weather-period' } },
              h('time', { text: period.time_label }),
              h('strong', { text: period.condition?.label || '' }),
              h('span', { text: [
                period.temperature_label,
                period.precipitation_probability_label && `降水確率 ${period.precipitation_probability_label}`,
                period.precipitation_amount_label && `降水量 ${period.precipitation_amount_label}`,
                period.wind_label && `風 ${period.wind_label}`
              ].filter(Boolean).join(' ・ ') })
            )
          ))
        )
      : null
  );
}

function reorderCandidates(day, sourcePlan) {
  const groups = sourcePlan?.reorder_groups || [];
  const group = groups.find(item => (item.day_ordinals || []).includes(day.source_plan_day_ordinal));
  if (!group) return [];
  return (group.day_ordinals || [])
    .map(ordinal => sourcePlan.days?.find(item => item.ordinal === ordinal))
    .filter(Boolean);
}

function renderDayAssignment(day, sourcePlan) {
  const current = sourcePlan?.days?.find(item => item.ordinal === day.source_plan_day_ordinal);
  const candidates = reorderCandidates(day, sourcePlan);

  if (candidates.length <= 1) {
    return h('section', { className: 'execution-day-assignment', dataset: { semantic: 'execution-day-assignment' } },
      h('p', { className: 'execution-slot', text: `${day.date} ${day.weekday_label || ''}`.trim() }),
      h('p', { className: 'execution-assigned-day' },
        h('span', { text: '実施内容 ' }),
        h('strong', { text: current ? `Plan Day ${current.ordinal} ${current.title}` : `Plan Day ${day.source_plan_day_ordinal}` })
      )
    );
  }

  const note = h('p', {
    className: 'execution-reorder-note',
    text: '実施日・天気はこの日付に固定。現在の実行内容を変更するには再具体化が必要です。'
  });
  const select = h('select', {
    className: 'execution-day-assignment-select',
    attrs: { 'aria-label': `${day.date} の実施内容` },
    dataset: { semantic: 'execution-day-assignment-control', slot: day.ordinal }
  }, candidates.map(candidate =>
    h('option', {
      attrs: { value: candidate.ordinal },
      text: `Plan Day ${candidate.ordinal} ${candidate.title}`
    })
  ));
  select.value = String(day.source_plan_day_ordinal);
  select.addEventListener('change', () => {
    const selected = sourcePlan?.days?.find(item => item.ordinal === Number(select.value));
    if (!selected || selected.ordinal === day.source_plan_day_ordinal) {
      note.textContent = '実施日・天気はこの日付に固定。現在の実行内容を表示しています。';
      return;
    }
    note.textContent = `Plan Day ${selected.ordinal} ${selected.title} をこの日に割り当てる場合は、交通・営業時間・制約・Mapをこの日付で再具体化します。現在表示中のActionは変更しません。`;
  });

  return h('section', { className: 'execution-day-assignment', dataset: { semantic: 'execution-day-assignment' } },
    h('p', { className: 'execution-slot', text: `${day.date} ${day.weekday_label || ''}`.trim() }),
    h('label', { className: 'execution-assignment-control' },
      h('span', { text: '実施内容 ' }),
      select
    ),
    note
  );
}

function renderExecutionReorder(concretePlan, sourcePlan) {
  const reorderableDays = (concretePlan.days || []).filter(
    day => reorderCandidates(day, sourcePlan).length > 1
  );
  if (!reorderableDays.length) return null;

  return h('section', { className: 'plan-reorder concrete-plan-reorder', dataset: { semantic: 'day-reorder' } },
    h('h2', { text: '日程調整' }),
    h('p', { text: '実施日は固定したまま、各日へ割り当てるPlan Day contentを確認・選択します。採用時は日付依存情報を再具体化します。' }),
    h('div', { className: 'plan-day-assignment-grid' },
      reorderableDays.map(day => renderDayAssignment(day, sourcePlan))
    )
  );
}

function renderDaySummary(day, sourceDay, weatherDay) {
  return h('summary', { className: 'concrete-day-summary' },
    h('span', { className: 'plan-day-number', text: `Day ${day.ordinal}` }),
    h('span', { className: 'concrete-day-date', text: `${day.date} ${day.weekday_label || ''}`.trim() }),
    compactWeatherText(weatherDay)
      ? h('span', { className: 'concrete-day-weather', dataset: { semantic: 'compact-weather' }, text: compactWeatherText(weatherDay) })
      : null,
    h('span', { className: 'plan-day-title', text: sourceDay?.title || `Plan Day ${day.source_plan_day_ordinal}` })
  );
}

function dayFuelSuggestions(fuelEvents, ordinal) {
  return (fuelEvents || []).filter(event =>
    event.day_ordinal === ordinal &&
    event.importance?.code === 'recommended' &&
    ['preferred', 'fallback'].includes(event.timing?.code)
  );
}

function renderDayFuelSuggestions(events) {
  if (!events?.length) return null;
  return h('section', { className: 'day-fuel-suggestions', dataset: { semantic: 'fuel-suggestions' } },
    h('h3', { text: '給油候補' }),
    h('ul', {}, events.map(event =>
      h('li', { dataset: { semantic: 'fuel-suggestion', timing: event.timing?.code || '' } },
        h('strong', { text: event.station_title || '給油候補' }),
        h('p', { text: [event.importance?.label, event.timing?.label].filter(Boolean).join(' ・ ') }),
        event.context ? h('p', { text: event.context }) : null,
        googleMapsLink(event)
      )
    ))
  );
}

async function renderDay(day, sourcePlan, concretePlan, resolver, artifactLoader, openByDefault, fuelEvents) {
  const sourceDay = sourcePlan?.days?.find(item => item.ordinal === day.source_plan_day_ordinal);
  const weatherDay = concretePlan.weather?.days?.find(item => item.day === day.ordinal);
  const variants = await Promise.all((day.variants || []).map(variant => renderVariant(variant, resolver, artifactLoader)));
  const fuelSuggestions = dayFuelSuggestions(fuelEvents, day.ordinal);

  return h('details', {
    className: 'plan-day-disclosure concrete-day-disclosure',
    dataset: { semantic: 'execution-day', day: day.ordinal, sourceDay: day.source_plan_day_ordinal },
    attrs: { open: openByDefault }
  },
    renderDaySummary(day, sourceDay, weatherDay),
    h('div', { className: 'plan-day-body concrete-day-body' },
      h('h2', { text: sourceDay?.title || `Day ${day.ordinal}` }),
      sourceDay?.summary ? h('p', { className: 'day-summary', text: sourceDay.summary }) : null,
      day.start_time_label ? textRow('開始', day.start_time_label) : null,
      renderWeather(weatherDay),
      renderDayFuelSuggestions(fuelSuggestions),
      await renderRouteRelations(day.routes, resolver),
      h('section', { className: 'day-execution', dataset: { semantic: 'actual-actions' } },
        h('h3', { text: '行動順' }),
        await renderActions(day.actions, resolver, fuelEvents)
      ),
      await renderMapPreview(day.map_artifact_ref, artifactLoader, resolver),
      variants.length
        ? h('section', { className: 'day-variants', dataset: { semantic: 'variants' } },
            h('h3', { text: '代替案' }),
            variants
          )
        : null
    )
  );
}

function renderTripWeatherOverview(plan) {
  const weatherDays = plan.weather?.days || [];
  if (!weatherDays.length) return null;
  const dayByOrdinal = new Map((plan.days || []).map(day => [day.ordinal, day]));

  return h('section', { className: 'trip-weather-overview', dataset: { semantic: 'trip-weather-overview' } },
    h('h3', { text: '日別天気' }),
    h('ol', { className: 'trip-weather-days' }, weatherDays.map(weatherDay => {
      const day = dayByOrdinal.get(weatherDay.day);
      return h('li', { className: 'trip-weather-day', dataset: { semantic: 'trip-weather-day', day: weatherDay.day } },
        h('div', { className: 'trip-weather-day-heading' },
          h('strong', { text: day ? `Day ${day.ordinal} ${day.date} ${day.weekday_label || ''}`.trim() : `Day ${weatherDay.day}` }),
          weatherDay.condition?.label ? h('span', { className: 'trip-weather-condition', text: weatherDay.condition.label }) : null
        ),
        h('p', { text: [
          weatherTemperatureRange(weatherDay) && `気温 ${weatherTemperatureRange(weatherDay)}`,
          weatherDay.precipitation_probability_label && `降水確率 ${weatherDay.precipitation_probability_label}`,
          weatherDay.precipitation_amount_label && `降水量 ${weatherDay.precipitation_amount_label}`
        ].filter(Boolean).join(' ・ ') })
      );
    }))
  );
}

function renderExecutionOverview(plan, sourcePlan) {
  const status = plan.status;
  return h('section', { className: 'execution-overview', dataset: { semantic: 'execution-overview' } },
    h('h2', { text: '実施計画' }),
    plan.period?.label ? textRow('実施期間', plan.period.label) : null,
    sourcePlan?.title ? textRow('基本Plan', sourcePlan.title) : null,
    status?.state?.label ? textRow('状態', status.state.label) : null,
    plan.weather?.state?.label ? textRow('天気情報', plan.weather.state.label) : null,
    plan.weather?.notice ? h('p', { className: 'weather-notice', text: plan.weather.notice }) : null,
    renderTripWeatherOverview(plan),
    status?.attention?.length
      ? h('section', { className: 'execution-attention', dataset: { semantic: 'execution-attention' } },
          h('h3', { text: '確認事項' }),
          h('ul', {}, status.attention.map(item =>
            h('li', { dataset: { level: item.level || '', semantic: item.semantic || '' }, text: item.text })
          ))
        )
      : null
  );
}

function renderFuelSummary(fuel) {
  if (!fuel) return null;
  const events = fuel.events || [];
  const required = events.filter(event => event.importance?.code === 'required');
  const recommended = events.filter(event => event.importance?.code === 'recommended');
  return h('section', { className: 'plan-fuel', dataset: { semantic: 'fuel' } },
    h('h2', { text: '給油計画' }),
    fuel.distance_label ? textRow('想定走行距離', fuel.distance_label) : null,
    fuel.fuel_economy_label ? textRow('想定燃費', fuel.fuel_economy_label) : null,
    fuel.estimated_liters_label ? textRow('想定使用量', fuel.estimated_liters_label) : null,
    required.length
      ? h('section', { className: 'fuel-required', dataset: { semantic: 'required-refuel' } },
          h('h3', { text: '必須給油' }),
          h('ul', {}, required.map(event =>
            h('li', {},
              h('strong', { text: event.station_title || '給油' }),
              event.day_ordinal ? h('span', { text: ` Day ${event.day_ordinal}` }) : null,
              event.context ? h('p', { text: event.context }) : null,
              googleMapsLink(event)
            )
          ))
        )
      : null,
    recommended.length
      ? h('section', { className: 'fuel-recommended', dataset: { semantic: 'recommended-refuel' } },
          h('h3', { text: '推奨給油' }),
          h('ul', {}, recommended.map(event =>
            h('li', {},
              h('strong', { text: event.station_title || '給油候補' }),
              event.day_ordinal ? h('span', { text: ` Day ${event.day_ordinal}` }) : null,
              event.context ? h('p', { text: event.context }) : null,
              googleMapsLink(event)
            )
          ))
        )
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
    sourceRef ? h('a', { attrs: { href: hrefFor(sourceRef) }, text: '計画' }) : null,
    h('span', { attrs: { 'aria-current': 'page' }, text: '実施' })
  );
}

export async function renderConcretePlan({ concretePlan, sourcePlan, resolver, artifactLoader }) {
  const orderedDays = [...(concretePlan.days || [])].sort((a, b) => a.ordinal - b.ordinal);
  const openByDefault = orderedDays.length === 1;
  const fuelEvents = concretePlan.fuel?.events || [];
  const dayNodes = await Promise.all(
    orderedDays.map(day => renderDay(day, sourcePlan, concretePlan, resolver, artifactLoader, openByDefault, fuelEvents))
  );

  return h('article', {
    className: 'concrete-plan',
    dataset: { semantic: 'concrete-plan', entityId: concretePlan.id }
  },
    renderExecutionNavigation(concretePlan),
    h('header', { className: 'plan-header' },
      h('p', { className: 'entity-kind', text: 'Concrete Plan' }),
      h('h1', { text: concretePlan.title })
    ),
    renderExecutionOverview(concretePlan, sourcePlan),
    renderExecutionReorder(concretePlan, sourcePlan),
    h('section', { className: 'plan-days', dataset: { semantic: 'days' } },
      h('h2', { text: '日程' }),
      dayNodes
    ),
    renderFuelSummary(concretePlan.fuel),
    renderCost(concretePlan)
  );
}
