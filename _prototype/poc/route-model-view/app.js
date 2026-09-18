function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function assertViewModel(model) {
  if (!model || model.type !== 'route-model-view') {
    throw new Error('Expected route-model-view input.');
  }
  if (!model.title || !Array.isArray(model.metrics) || !Array.isArray(model.waypoints)) {
    throw new Error('RouteModel ViewModel is missing required presentation fields.');
  }
  for (const waypoint of model.waypoints) {
    if (!waypoint?.id || !waypoint?.label || !waypoint?.time?.primary) {
      throw new Error('RouteModel ViewModel has an invalid waypoint.');
    }
  }
}

function renderMetrics(metrics) {
  return `
    <dl class="route-metrics">
      ${metrics.map((metric) => `
        <div class="route-metric">
          <dt>${escapeHtml(metric.label)}</dt>
          <dd>${escapeHtml(metric.value)}</dd>
        </div>
      `).join('')}
    </dl>
  `;
}

function renderBadges(badges = []) {
  return badges
    .map((badge) => `<span class="waypoint-badge">${escapeHtml(badge)}</span>`)
    .join('');
}

function renderWaypoint(waypoint) {
  const phase = waypoint.phase_label
    ? `<span class="waypoint-phase">${escapeHtml(waypoint.phase_label)}</span>`
    : '';
  const secondaryTime = waypoint.time.secondary
    ? `<span class="waypoint-time-secondary">${escapeHtml(waypoint.time.secondary)}</span>`
    : '';
  const segment = waypoint.next_segment?.duration
    ? `
      <div class="waypoint-segment" aria-label="次の地点まで${escapeHtml(waypoint.next_segment.duration)}">
        <span aria-hidden="true">↓</span>
        <strong>${escapeHtml(waypoint.next_segment.duration)}</strong>
      </div>
    `
    : '';

  return `
    <li class="route-waypoint">
      <div class="waypoint-time">
        <strong>${escapeHtml(waypoint.time.primary)}</strong>
        ${secondaryTime}
      </div>
      <div class="waypoint-track" aria-hidden="true"><span></span></div>
      <div class="waypoint-body">
        ${phase}
        <div class="waypoint-main">
          <span class="waypoint-label">${escapeHtml(waypoint.label)}</span>
          ${renderBadges(waypoint.badges)}
        </div>
      </div>
      ${segment}
    </li>
  `;
}

function renderSource(source) {
  if (!source?.label) return '';
  const label = escapeHtml(source.label);
  if (!source.url) return `<span class="route-source">${label}</span>`;
  return `
    <a class="route-source" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
      ${label}<span aria-hidden="true">↗</span>
    </a>
  `;
}

function renderNotes(notes = []) {
  if (!notes.length) return '';
  return `
    <aside class="route-notes" aria-label="ルート詳細の注記">
      <ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
    </aside>
  `;
}

function renderTimeAxis(timeAxis) {
  if (!timeAxis?.label) return '';
  const start = timeAxis.start_at
    ? `<span class="route-time-start">${escapeHtml(timeAxis.start_at)} 開始</span>`
    : '';
  return `
    <div class="route-time-axis">
      <span>${escapeHtml(timeAxis.label)}</span>
      ${start}
      <small>地点間は次の地点までの所要時間</small>
    </div>
  `;
}

/**
 * Render a presentation-ready RouteModel ViewModel.
 * Absolute/relative time resolution is completed before this renderer runs.
 * The renderer intentionally does not interpret Canonical RouteModel fields,
 * ConcretePlan execution rules, provider-specific payloads, or route-specific IDs.
 * @param {object} model
 * @returns {string}
 */
export function renderRouteModel(model) {
  assertViewModel(model);

  const endpoints = model.endpoints
    ? `<p class="route-endpoints">${escapeHtml(model.endpoints.start)} <span aria-hidden="true">→</span> ${escapeHtml(model.endpoints.finish)}</p>`
    : '';

  return `
    <article class="route-model-view">
      <header class="route-model-header">
        <div class="route-model-heading">
          <p class="route-model-eyebrow">ルート詳細</p>
          <h2>${escapeHtml(model.title)}</h2>
          ${endpoints}
        </div>
        ${renderSource(model.source)}
      </header>

      ${renderMetrics(model.metrics)}
      ${renderTimeAxis(model.time_axis)}

      <ol class="route-waypoints">
        ${model.waypoints.map(renderWaypoint).join('')}
      </ol>

      ${renderNotes(model.notes)}
    </article>
  `;
}

async function loadViewModel(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load RouteModel ViewModel: ${response.status}`);
  return response.json();
}

async function main() {
  const root = document.querySelector('#route-model-root');
  if (!root) throw new Error('Missing #route-model-root.');

  const path = root.dataset.viewModel;
  if (!path) throw new Error('Missing data-view-model path.');

  const model = await loadViewModel(path);
  root.innerHTML = renderRouteModel(model);
}

main().catch((error) => {
  console.error('[route-model-view-poc] render failed', error);
  const root = document.querySelector('#route-model-root');
  if (root) root.innerHTML = `<p class="poc-error">${escapeHtml(error.message)}</p>`;
});