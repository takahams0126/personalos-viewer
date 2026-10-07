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
    return { title: target.label || 'ルート内地点', kind: 'route_local', ref: null, pointType: '' };
  }
  if (target?.entity_type && target?.id) {
    try {
      const described = await resolver.describe(target);
      let pointType = '';
      if (target.entity_type === 'travel_point') {
        try {
          const loaded = await resolver.load(target);
          pointType = loaded.data?.point_type?.code || '';
        } catch {
          pointType = '';
        }
      }
      return { title: described.title, kind: target.entity_type, ref: target, pointType };
    } catch {
      return {
        title: `${target.entity_type}:${target.id}`,
        kind: target.entity_type,
        ref: target,
        pointType: '',
        unavailable: true
      };
    }
  }
  return { title: '地点情報なし', kind: 'unknown', ref: null, pointType: '', unavailable: true };
}

function entityTitle(ref, title, unavailable = false) {
  if (!unavailable && isDetailPageRef(ref)) {
    return h('a', { attrs: { href: hrefFor(ref) }, text: title });
  }
  return h('span', { text: title });
}

function eventIconRole(target) {
  if (target.kind === 'travel_point') return target.pointType || 'travel_point';
  if (target.kind === 'route_local') return 'route';
  if (target.kind === 'spot') return 'spot';
  return 'place';
}

function renderEventIcon(target) {
  return h('span', {
    className: 'action-event-icon',
    dataset: { iconRole: eventIconRole(target) },
    attrs: { 'aria-hidden': 'true' }
  });
}

function publicLink(data, semantic) {
  return (data?.links || []).find(item => item.semantic === semantic && item.url) || null;
}

function renderExternalLink(link, className) {
  if (!link?.url) return null;
  return h('a', {
    className,
    attrs: { href: link.url, target: '_blank', rel: 'noopener noreferrer' },
    text: link.label || '開く'
  });
}

async function googleMapsLink(event, resolver) {
  const ref = event?.travel_point_ref;
  if (!ref) return null;
  try {
    const loaded = await resolver.load(ref);
    return renderExternalLink(publicLink(loaded.data, 'google_maps'), 'google-maps-link');
  } catch {
    return null;
  }
}

async function loadFuelStation(event, resolver) {
  const ref = event?.travel_point_ref;
  if (!ref) return null;
  try {
    const loaded = await resolver.load(ref);
    return loaded.data || null;
  } catch {
    return null;
  }
}

function renderFuelStationDetails(station) {
  if (!station) return null;
  const facts = station.facts || [];
  return h('div', { className: 'fuel-station-details' },
    station.location?.text
      ? h('p', { className: 'fuel-station-address', text: station.location.text })
      : null,
    facts.length
      ? h('dl', { className: 'fuel-station-facts' }, facts.map(fact =>
          h('div', {}, h('dt', { text: fact.label }), h('dd', { text: fact.value }))
        ))
      : null,
    h('div', { className: 'fuel-station-actions' },
      renderExternalLink(publicLink(station, 'google_maps'), 'fuel-station-action'),
      renderExternalLink(publicLink(station, 'official'), 'fuel-station-action')
    )
  );
}

function renderTimelineTime(action) {
  if (!action.arrival_label && !action.departure_label) return null;
  return h('aside', { className: 'action-time-axis', dataset: { semantic: 'timeline-time' } },
    action.arrival_label
      ? h('span', { className: 'action-time-arrival', attrs: { 'aria-label': `到着 ${action.arrival_label}` } },
          h('span', { className: 'action-time-value', text: action.arrival_label }),
          h('span', { className: 'action-time-kind', text: '着' })
        )
      : null,
    action.departure_label && action.departure_label !== action.arrival_label
      ? h('span', { className: 'action-time-departure', attrs: { 'aria-label': `出発 ${action.departure_label}` } },
          h('span', { className: 'action-time-value', text: action.departure_label }),
          h('span', { className: 'action-time-kind', text: '発' })
        )
      : null
  );
}

function renderActionMeta(action) {
  const items = [];
  if (action.visit_purpose?.label) {
    items.push(h('span', { className: 'action-purpose', text: action.visit_purpose.label }));
  }
  if (action.stay_label) {
    items.push(h('span', { className: 'action-stay-inline', text: `滞在${action.stay_label}` }));
  }
  if (action.inclusion_requirement?.label) {
    items.push(h('span', { className: 'action-inclusion', text: action.inclusion_requirement.label }));
  }
  return items.length
    ? h('p', { className: 'action-meta', dataset: { semantic: 'action-meta' } }, items)
    : null;
}

function renderTodos(todos) {
  if (!todos?.length) return null;
  return h('section', {
    className: 'action-todos',
    dataset: { semantic: 'todos' },
    attrs: { 'aria-label': '行動' }
  },
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
  const transportMode = move.transport?.code || 'move';
  return h('aside', {
    className: 'next-move',
    dataset: {
      semantic: 'next-move',
      connectionState: move.connection_state?.code || '',
      transportMode
    }
  },
    h('span', {
      className: 'move-connector-icon',
      dataset: { iconRole: transportMode },
      attrs: { 'aria-hidden': 'true' }
    }),
    h('div', { className: 'move-connector-content' },
      summary ? h('p', { className: 'next-move-summary', text: summary }) : null,
      renderService(move.service),
      move.connection_margin_label
        ? h('p', { className: 'connection-margin', text: move.connection_margin_label })
        : null,
      move.connection_state?.label
        ? h('p', { className: 'connection-state', text: move.connection_state.label })
        : null
    )
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
  const fixedFuel = fixedFuelEventForTarget(fuelEvents, action.target);
  const fixedFuelMapLink = fixedFuel ? await googleMapsLink(fixedFuel, resolver) : null;

  return h('li', {
    className: 'execution-action',
    dataset: {
      semantic: 'action',
      order: action.order,
      targetKind: target.kind,
      eventIcon: eventIconRole(target)
    }
  },
    renderTimelineTime(action),
    h('article', { className: 'action-body' },
      h('div', { className: 'action-place-surface', dataset: { semantic: 'place-event' } },
        h('header', { className: 'action-header' },
          renderEventIcon(target),
          h('div', { className: 'action-heading' },
            h('h4', {}, entityTitle(target.ref, target.title, target.unavailable)),
            target.unavailable
              ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' })
              : null,
            renderActionMeta(action),
            fixedFuelMapLink
          )
        ),
        renderTodos(action.todos),
        renderFacilityExecutions(action.facility_executions),
        renderConstraints(action.time_constraints),
        renderAttention(action.attention)
      ),
      renderMove(action.next_move)
    )
  );
}

async function renderActions(actions, resolver, fuelEvents = []) {
  const nodes = await Promise.all((actions || []).map(action => renderAction(action, resolver, fuelEvents)));
  return h('ol', { className: 'execution-flow', dataset: { semantic: 'execution-timeline' } }, nodes);
}

function actionStartLabel(action) {
  return action?.arrival_label || action?.departure_label || '';
}

function actionEndLabel(action) {
  return action?.departure_label || action?.arrival_label || '';
}

async function resolveRouteExecution(relation, resolver) {
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

  return {
    relation,
    routeData,
    title,
    unavailable,
    identity: routeData
      ? [routeData.family_label, routeData.variant?.label].filter(Boolean).join(' / ')
      : ''
  };
}

async function renderRouteExecutionGroup(relation, routeActions, resolver, fuelEvents) {
  const resolved = await resolveRouteExecution(relation, resolver);
  const firstAction = routeActions[0];
  const lastAction = routeActions[routeActions.length - 1];
  const actionNodes = await Promise.all(routeActions.map(action => renderAction(action, resolver, fuelEvents)));
  const startLabel = actionStartLabel(firstAction);
  const endLabel = actionEndLabel(lastAction);

  return h('li', {
    className: 'execution-action route-execution-group',
    dataset: {
      semantic: 'route-execution-group',
      routeId: relation.route_ref?.id || '',
      fromAction: relation.from_action_order,
      toAction: relation.to_action_order
    }
  },
    (startLabel || endLabel)
      ? h('aside', { className: 'action-time-axis route-execution-time-axis', dataset: { semantic: 'route-execution-time' } },
          startLabel ? h('span', { className: 'action-time-arrival', text: startLabel, attrs: { 'aria-label': `ルート開始 ${startLabel}` } }) : null,
          endLabel && endLabel !== startLabel
            ? h('span', { className: 'action-time-departure', text: endLabel, attrs: { 'aria-label': `ルート終了 ${endLabel}` } })
            : null
        )
      : null,
    h('article', { className: 'action-body route-execution-body' },
      h('header', { className: 'route-execution-summary', dataset: { semantic: 'route-execution-summary' } },
        h('p', { className: 'route-execution-label', text: 'ルート' }),
        h('h4', {}, entityTitle(relation.route_ref, resolved.title, resolved.unavailable)),
        resolved.identity ? h('p', { className: 'route-execution-identity', text: resolved.identity }) : null,
        resolved.unavailable ? h('p', { className: 'component-unavailable', text: 'Route詳細を取得できませんでした' }) : null
      ),
      h('ol', { className: 'execution-flow route-execution-actions', dataset: { semantic: 'route-execution-actions' } }, actionNodes),
      lastAction?.next_move
        ? h('div', { className: 'route-execution-exit', dataset: { semantic: 'route-execution-exit' } }, renderMove(lastAction.next_move))
        : null
    )
  );
}

async function renderExecutionSequence(actions, routes, resolver, fuelEvents = []) {
  const orderedActions = [...(actions || [])].sort((a, b) => a.order - b.order);
  const orderedRoutes = [...(routes || [])].sort((a, b) => a.from_action_order - b.from_action_order);
  const routeByStart = new Map(orderedRoutes.map(relation => [relation.from_action_order, relation]));
  const nodes = [];

  for (let index = 0; index < orderedActions.length;) {
    const action = orderedActions[index];
    const relation = routeByStart.get(action.order);
    if (!relation) {
      nodes.push(await renderAction(action, resolver, fuelEvents));
      index += 1;
      continue;
    }

    const routeActions = [];
    let cursor = index;
    while (cursor < orderedActions.length && orderedActions[cursor].order <= relation.to_action_order) {
      routeActions.push(orderedActions[cursor]);
      cursor += 1;
    }
    if (!routeActions.length) {
      nodes.push(await renderAction(action, resolver, fuelEvents));
      index += 1;
      continue;
    }
    nodes.push(await renderRouteExecutionGroup(relation, routeActions, resolver, fuelEvents));
    index = cursor;
  }

  return h('section', { className: 'day-execution', dataset: { semantic: 'execution-sequence' } },
    h('h3', { className: 'execution-sequence-title', text: '行動順' }),
    h('ol', { className: 'execution-flow execution-sequence', dataset: { semantic: 'execution-timeline' } }, nodes)
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
    variant.selection_condition?.text ? h('p', { className: 'variant-condition', text: variant.selection_condition.text }) : null,
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

function renderWeather(weatherDay) {
  if (!weatherDay) return null;
  const summaryFacts = [
    weatherTemperatureRange(weatherDay) && `気温 ${weatherTemperatureRange(weatherDay)}`,
    weatherDay.precipitation_probability_label && `降水確率 ${weatherDay.precipitation_probability_label}`,
    weatherDay.precipitation_amount_label && `降水量 ${weatherDay.precipitation_amount_label}`,
    weatherDay.wind_label && `風 ${weatherDay.wind_label}`
  ].filter(Boolean);
  const periods = weatherDay.periods || [];
  const locationLabel = weatherDay.representative_location_label;
  const weatherTitle = locationLabel ? `天気（${locationLabel}）` : '天気';
  const coverageLabel = weatherDay.coverage_state?.label;

  return h('section', {
    className: 'day-weather',
    dataset: {
      semantic: 'day-weather',
      coverageState: weatherDay.coverage_state?.code || ''
    }
  },
    h('h4', { text: weatherTitle }),
    h('div', { className: 'weather-summary', dataset: { semantic: 'weather-summary' } },
      weatherDay.condition?.label
        ? h('strong', { text: weatherDay.condition.label })
        : coverageLabel
          ? h('strong', { text: coverageLabel })
          : null,
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

function dayExecutionWindow(day) {
  const actions = [...(day.actions || [])].sort((a, b) => a.order - b.order);
  const first = actions.find(action => action.arrival_label || action.departure_label);
  const last = [...actions].reverse().find(action => action.departure_label || action.arrival_label);
  const start = day.start_time_label || first?.arrival_label || first?.departure_label || '';
  const end = last?.departure_label || last?.arrival_label || '';
  if (!start && !end) return '';
  if (start && end && start !== end) return `${start} → ${end}`;
  return start || end;
}

function dayHasTimeConstraint(day) {
  return (day.actions || []).some(action => action.time_constraints?.length);
}

function formatDate(date) {
  return String(date || '').replaceAll('-', '/');
}

function renderDayContext(day, sourceDay) {
  const window = dayExecutionWindow(day);
  const hasConstraint = dayHasTimeConstraint(day);
  return h('header', { className: 'concrete-day-context', dataset: { semantic: 'day-context' } },
    h('p', { className: 'concrete-day-kicker', text: [`Day ${day.ordinal}`, formatDate(day.date), day.weekday_label].filter(Boolean).join(' · ') }),
    h('h2', { text: sourceDay?.title || `Day ${day.ordinal}` }),
    sourceDay?.summary ? h('p', { className: 'day-summary', text: sourceDay.summary }) : null,
    h('div', { className: 'concrete-day-context-facts' },
      window ? h('p', { className: 'concrete-day-window', text: window }) : null,
      hasConstraint ? h('p', { className: 'concrete-day-constraint-indicator', text: '時刻制約あり' }) : null
    )
  );
}

async function renderDay(day, sourcePlan, concretePlan, resolver, artifactLoader, fuelEvents) {
  const sourceDay = sourcePlan?.days?.find(item => item.ordinal === day.source_plan_day_ordinal);
  const weatherDay = concretePlan.weather?.days?.find(item => item.day === day.ordinal);
  const variants = await Promise.all((day.variants || []).map(variant => renderVariant(variant, resolver, artifactLoader)));
  const title = sourceDay?.title || `Day ${day.ordinal}`;
  const hasConstraint = dayHasTimeConstraint(day);

  return h('section', {
    className: 'concrete-day-panel',
    dataset: {
      semantic: 'execution-day',
      day: day.ordinal,
      sourceDay: day.source_plan_day_ordinal,
      date: `${day.date || ''} ${day.weekday_label || ''}`.trim(),
      dayTitle: title,
      hasConstraint: hasConstraint ? 'true' : 'false'
    }
  },
    h('div', { className: 'concrete-day-body' },
      renderDayContext(day, sourceDay),
      renderWeather(weatherDay),
      await renderExecutionSequence(day.actions, day.routes, resolver, fuelEvents),
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

function renderAttentionDetails(plan) {
  const items = [];
  if (plan.weather?.notice) items.push({ semantic: 'weather', text: plan.weather.notice });
  for (const item of plan.status?.attention || []) items.push(item);
  if (!items.length) return null;
  return h('details', { className: 'execution-attention-popover', dataset: { semantic: 'execution-attention' } },
    h('summary', { className: 'execution-warning-trigger' },
      h('span', { className: 'execution-warning-icon', attrs: { 'aria-hidden': 'true' }, text: '⚠' }),
      h('span', { text: `確認事項 ${items.length}件` })
    ),
    h('div', { className: 'execution-attention-panel' },
      h('h3', { text: '確認事項' }),
      h('ul', {}, items.map(item =>
        h('li', { dataset: { level: item.level || '', semantic: item.semantic || '' }, text: item.text })
      ))
    )
  );
}

function renderExecutionOverview(plan, sourcePlan) {
  const sourceRef = plan.source_plan_ref;
  const status = plan.status;
  return h('section', { className: 'execution-overview', dataset: { semantic: 'execution-overview' } },
    h('dl', { className: 'execution-meta' },
      sourcePlan?.title
        ? h('div', { className: 'execution-meta-row' },
            h('dt', { text: '計画プラン' }),
            h('dd', {}, sourceRef ? h('a', { attrs: { href: hrefFor(sourceRef) }, text: sourcePlan.title }) : sourcePlan.title)
          )
        : null,
      plan.period?.label
        ? h('div', { className: 'execution-meta-row' }, h('dt', { text: '実施期間' }), h('dd', { text: plan.period.label }))
        : null,
      status?.state?.label
        ? h('div', { className: 'execution-meta-row execution-meta-status' },
            h('dt', { text: '状態' }),
            h('dd', {}, h('span', { className: 'execution-status-label', text: status.state.label }), renderAttentionDetails(plan))
          )
        : null
    )
  );
}

function renderItineraryOverview(concretePlan, sourcePlan) {
  const days = [...(concretePlan.days || [])].sort((a, b) => a.ordinal - b.ordinal);
  if (!days.length) return null;
  return h('section', { className: 'itinerary-overview', dataset: { semantic: 'itinerary-overview' } },
    h('h2', { text: '日程' }),
    h('ol', { className: 'itinerary-overview-list' }, days.map(day => {
      const sourceDay = sourcePlan?.days?.find(item => item.ordinal === day.source_plan_day_ordinal);
      return h('li', {
        className: 'itinerary-day-row',
        dataset: { itineraryDay: day.ordinal, day: day.ordinal }
      },
        h('strong', { className: 'itinerary-day-label', text: `DAY${day.ordinal}` }),
        h('time', { className: 'itinerary-day-date', text: formatDate(day.date) }),
        day.weekday_label ? h('span', { className: 'itinerary-day-weekday', text: day.weekday_label.replace('曜日', '') }) : null,
        h('span', { className: 'itinerary-day-weather', dataset: { weatherSlot: '' } }),
        h('span', { className: 'itinerary-day-title', text: sourceDay?.title || `Day ${day.ordinal}` })
      );
    }))
  );
}

function renderFuelFact(label, value) {
  if (!value) return null;
  return h('div', { className: 'fuel-summary-fact' }, h('dt', { text: label }), h('dd', { text: value }));
}

async function renderFuelSummary(fuel, resolver) {
  if (!fuel) return null;
  const events = [...(fuel.events || [])].sort((a, b) => {
    const priority = value => value?.importance?.code === 'required' ? 0 : 1;
    return priority(a) - priority(b) || (a.day_ordinal || 99) - (b.day_ordinal || 99);
  });
  const items = await Promise.all(events.map(async event => {
    const station = await loadFuelStation(event, resolver);
    return h('li', {
      className: 'fuel-event-row',
      dataset: { semantic: 'fuel-event', importance: event.importance?.code || '', timing: event.timing?.code || '' }
    },
      h('div', { className: 'fuel-event-meta' },
        event.day_ordinal ? h('span', { className: 'fuel-day-badge', text: `DAY${event.day_ordinal}` }) : null,
        event.importance?.label ? h('span', { className: 'fuel-importance', text: event.importance.label }) : null,
        event.timing?.label ? h('span', { className: 'fuel-timing', text: event.timing.label }) : null
      ),
      h('strong', { className: 'fuel-station-title', text: station?.title || event.station_title || '給油ポイント' }),
      event.context ? h('p', { className: 'fuel-event-context', text: event.context }) : null,
      renderFuelStationDetails(station)
    );
  }));
  return h('section', { className: 'plan-fuel', dataset: { semantic: 'fuel' } },
    h('header', { className: 'support-panel-header' },
      h('h2', { text: '給油計画' }),
      h('dl', { className: 'fuel-summary-facts' },
        renderFuelFact('想定走行距離', fuel.distance_label),
        renderFuelFact('想定燃費', fuel.fuel_economy_label),
        renderFuelFact('想定使用量', fuel.estimated_liters_label)
      )
    ),
    items.length ? h('ol', { className: 'fuel-event-list' }, items) : h('p', { className: 'support-empty', text: '給油予定はありません。' })
  );
}

function renderCostGroup(title, items, notes) {
  if (!items.length) return null;
  return h('section', { className: 'cost-group' },
    h('h3', { text: title }),
    h('div', { className: 'cost-table', attrs: { role: 'table', 'aria-label': title } },
      items.map(item => {
        const noteNumber = item.annotation ? notes.push(item.annotation) : null;
        const amount = item.amount_label || item.amount_state.label;
        return h('div', { className: 'cost-row', attrs: { role: 'row' } },
          h('div', { className: 'cost-item', attrs: { role: 'cell' } },
            h('strong', { className: 'cost-item-label', text: item.label }),
            item.detail ? h('span', { className: 'cost-item-detail', text: item.detail }) : null
          ),
          h('div', { className: 'cost-amount', attrs: { role: 'cell' } },
            h('strong', { text: amount }),
            item.amount_label ? h('span', { className: 'cost-state', text: item.amount_state.label }) : null,
            noteNumber ? h('sup', {}, h('a', { attrs: { href: `#cost-note-${noteNumber}` }, text: `注${noteNumber}` })) : null
          )
        );
      })
    )
  );
}

function renderCostTotal(total) {
  if (!total) return null;
  const qualifiers = [total.amount_state?.label, total.coverage?.label].filter(Boolean);
  const text = total.amount_label
    ? `合計 ${total.amount_label}${qualifiers.length ? `（${qualifiers.join('・')}）` : ''}`
    : qualifiers.join('・');
  return text ? h('p', { className: 'cost-total', text }) : null;
}

function renderCost(plan) {
  if (!plan.cost) return null;
  const items = plan.cost.items || [];
  const notes = [];
  const trip = items.filter(item => item.scope === 'trip');
  const dayItems = items.filter(item => item.scope === 'day');
  const ordinals = [...new Set(dayItems.map(item => item.day_ordinal))].sort((a, b) => a - b);

  return h('section', {
    className: 'plan-cost',
    dataset: { semantic: 'cost', costStructure: 'structured-v8' }
  },
    h('header', { className: 'support-panel-header' },
      h('h2', { text: '費用' }),
      renderCostTotal(plan.cost.total)
    ),
    renderCostGroup('旅程全体料金', trip, notes),
    dayItems.length
      ? h('section', { className: 'cost-day-groups' },
          h('h3', { text: '日別料金' }),
          ordinals.map(ordinal => renderCostGroup(`DAY${ordinal}`, dayItems.filter(item => item.day_ordinal === ordinal), notes))
        )
      : null,
    notes.length
      ? h('section', { className: 'cost-notes', attrs: { 'aria-label': '費用注釈' } },
          h('h3', { text: '注釈' }),
          h('ol', {}, notes.map((note, index) => h('li', { attrs: { id: `cost-note-${index + 1}` }, text: note })))
        )
      : null
  );
}

export async function renderConcretePlan({ concretePlan, sourcePlan, resolver, artifactLoader }) {
  const orderedDays = [...(concretePlan.days || [])].sort((a, b) => a.ordinal - b.ordinal);
  const fuelEvents = concretePlan.fuel?.events || [];
  const dayNodes = await Promise.all(
    orderedDays.map(day => renderDay(day, sourcePlan, concretePlan, resolver, artifactLoader, fuelEvents))
  );
  const fuelSummary = await renderFuelSummary(concretePlan.fuel, resolver);

  return h('article', {
    className: 'concrete-plan',
    dataset: { semantic: 'concrete-plan', entityId: concretePlan.id }
  },
    h('header', { className: 'plan-header' },
      h('p', { className: 'entity-kind', text: 'Concrete Plan' }),
      h('h1', { text: concretePlan.title })
    ),
    renderExecutionOverview(concretePlan, sourcePlan),
    renderItineraryOverview(concretePlan, sourcePlan),
    h('section', { className: 'plan-days concrete-plan-days', dataset: { semantic: 'days' } },
      h('div', { className: 'concrete-day-panels' }, dayNodes)
    ),
    fuelSummary,
    renderCost(concretePlan)
  );
}
