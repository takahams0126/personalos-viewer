import { renderTablerIcon } from '../shared/icon-registry.js';

const qs = new URLSearchParams(location.search);
if (qs.get('type') === 'plan' && qs.get('id')) init();

async function init() {
  const id = qs.get('id');
  let spec;
  try {
    const response = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, { cache: 'no-store' });
    if (!response.ok) return;
    spec = await response.json();
  } catch {
    return;
  }

  const panel = await waitForPanel();
  if (!panel) return;

  // Overall status is an overview only. Actionable deadlines/checks belong beside the action.
  panel.querySelector('.exec-overall-notices')?.remove();
  panel.querySelectorAll('.exec-feasibility').forEach(node => node.remove());

  for (const day of spec.days || []) decorateDay(panel, day);
}

async function waitForPanel(timeout = 5000) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    const panel = document.querySelector('#execution-mode-panel');
    if (panel) return panel;
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  return null;
}

const esc = value => String(value ?? '').replace(/[&<>'\"]/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;'
}[c]));

function variantId(variant = {}) {
  return variant.id || variant.variant_id || '';
}

function activeVariant(card, day) {
  const id = card.dataset.activeVariant;
  return (day.variants || []).find(v => variantId(v) === id) || (day.variants || [])[0];
}

function decorateDay(panel, day) {
  const card = panel.querySelector(`.execution-day[data-day="${Number(day.day)}"]`);
  if (!card) return;

  decorateVariant(card, activeVariant(card, day));

  card.addEventListener('click', event => {
    const button = event.target.closest('.exec-variant-tab');
    if (!button) return;
    queueMicrotask(() => decorateVariant(card, activeVariant(card, day)));
  });
}

function decorateVariant(card, variant) {
  if (!variant?.flow) return;
  const rows = [...card.querySelectorAll('[data-view-panel="flow"] > .exec-flow > .exec-flow-item')];
  rows.forEach((row, index) => decorateFlowItem(row, variant.flow[index] || {}));
}

function decorateFlowItem(row, item) {
  if (!row || row.dataset.executionInlineDecorated === '1') return;
  row.dataset.executionInlineDecorated = '1';
  const main = row.querySelector('.exec-flow-main');
  if (!main) return;

  decorateActivityDeadlines(row, item.activities || []);
  decorateFacilities(row, item.facilities || {});

  if (item.type === 'route' && item.route_execution) {
    main.insertAdjacentHTML('beforeend', routeExecutionHtml(item.route_execution));
  }
  if (item.timetable) main.insertAdjacentHTML('beforeend', timetableHtml(item.timetable));
  if (item.deadline) main.insertAdjacentHTML('beforeend', deadlineHtml(item.deadline));
}

function decorateActivityDeadlines(row, activities) {
  if (!activities.length) return;
  const nodes = [...row.querySelectorAll('.exec-activity')];
  activities.forEach((activity, index) => {
    if (!activity.deadline || !nodes[index] || nodes[index].querySelector('.exec-activity-deadline')) return;
    nodes[index].insertAdjacentHTML('beforeend', `<em class="exec-activity-deadline">締切 ${esc(activity.deadline)}</em>`);
  });
}

function decorateFacilities(row, facilities) {
  if (facilities.toilet !== 'available') return;
  const title = row.querySelector('.exec-destination-title');
  if (!title || title.querySelector('.badge-wc')) return;
  title.insertAdjacentHTML('beforeend', '<span class="badge-wc"><span>WC</span>トイレ有</span>');
}

function deadlineHtml(value = {}) {
  if (!value.label && !value.at && !value.note) return '';
  const tone = value.status || 'unknown';
  return `<div class="exec-deadline is-${esc(tone)}">` +
    `${value.label ? `<span>${esc(value.label)}</span>` : ''}` +
    `${value.at ? `<strong>${esc(value.at)}</strong>` : ''}` +
    `${value.slack ? `<em>余裕 ${esc(value.slack)}</em>` : ''}` +
    `${value.note ? `<small>${esc(value.note)}</small>` : ''}` +
    `</div>`;
}

function timetableHtml(value = {}) {
  const rows = [];
  if (value.target) rows.push(['Target', value.target, 'target']);
  if (value.latest_safe) rows.push(['安心ライン', value.latest_safe, 'safe']);
  if (value.next) rows.push(['次便', value.next, 'next']);
  if (value.fallback) rows.push(['次善', value.fallback, 'safe']);
  for (const entry of value.later || []) rows.push(['後続', entry, 'later']);
  if (!rows.length) return '';
  return `<div class="exec-timetable"><div class="exec-timetable-title">時刻表</div>${rows.map(([label, entry, cls]) => `
    <div class="is-${cls}"><span>${esc(label)}</span><strong>${esc(entry.depart_at || '—')} 発</strong>${arrowIcon()}<strong>${esc(entry.arrive_at || '—')} 着</strong></div>`).join('')}</div>`;
}

const routePointIcon = {
  sightseeing: 'photo',
  road: 'route',
  bus_stop: 'bus-stop',
  break: 'tools-kitchen-3',
  facility: 'building-community',
  parking: 'parking',
  default: 'map-pin'
};

function routeExecutionHtml(execution = {}) {
  if (!execution.expanded && !execution.start && !execution.end && !(execution.points || []).length) return '';
  const start = execution.start ? routePointHtml(execution.start, 'start') : '';
  const points = (execution.points || []).map(point => routePointHtml(point)).join('');
  const end = execution.end ? routePointHtml({
    ...execution.end,
    time: execution.end.planned_at || execution.end.range || execution.end.time
  }, 'end') : '';
  const caption = execution.caption || '';
  return `${caption ? `<div class="exec-route-caption">${esc(caption)}</div>` : ''}` +
    `<div class="exec-route-points">${start}${points}${end}</div>` +
    routeConnectionHtml(execution.connection);
}

function routePointHtml(point = {}, edge = '') {
  const iconName = routePointIcon[point.kind] || routePointIcon.default;
  const toilet = point.toilet ? `<span class="badge-wc"><span>WC</span>${point.toilet === 'portable_booth' ? '携帯トイレ' : 'トイレ有'}</span>` : '';
  const duration = point.duration ? `<small>${esc(point.duration)}</small>` : '';
  return `<div class="${edge ? `is-${edge}` : ''}"><time>${esc(point.time || '')}</time><span>${renderTablerIcon(iconName)}</span><strong>${esc(point.label || '')}${toilet}${duration}</strong></div>`;
}

function routeConnectionHtml(connection) {
  if (!connection) return '';
  const rows = [];
  if (connection.target) {
    rows.push(`<div class="is-good"><span>帰着予定 <strong>${esc(connection.target.planned_return_at || '—')}</strong></span>${arrowIcon()}<span>Targetバス <strong>${esc(connection.target.depart_at || '—')}発</strong></span>${connection.target.slack ? `<b>余裕 ${esc(connection.target.slack)}</b>` : ''}</div>`);
  }
  if (connection.fallback) {
    rows.push(`<div class="is-attention"><span>遅延時 <strong>${esc(connection.fallback.if_return_at || '—')}</strong></span>${arrowIcon()}<span>次善バス <strong>${esc(connection.fallback.depart_at || '—')}発</strong></span>${connection.fallback.slack ? `<b>余裕 ${esc(connection.fallback.slack)}</b>` : ''}</div>`);
  }
  return rows.length ? `<div class="exec-route-connection"><div class="exec-route-connection-title">Route帰着 → 復路バス</div>${rows.join('')}</div>` : '';
}

function arrowIcon() {
  return '<svg class="exec-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M15 8l4 4l-4 4"/></svg>';
}
