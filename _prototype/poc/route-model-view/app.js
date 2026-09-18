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
  if (!model.title || !Array.isArray(model.metrics) || !Array.isArray(model.sections)) {
    throw new Error('RouteModel ViewModel is missing required presentation fields.');
  }
  for (const section of model.sections) {
    if (!section?.key || !section?.label || !Array.isArray(section.waypoints)) {
      throw new Error('RouteModel ViewModel has an invalid section.');
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
  if (!badges.length) return '';
  return `
    <div class="waypoint-badges">
      ${badges.map((badge) => `<span class="waypoint-badge">${escapeHtml(badge)}</span>`).join('')}
    </div>
  `;
}

function renderWaypoint(waypoint) {
  const segment = waypoint.segment_from_previous
    ? `<span class="waypoint-segment">+${escapeHtml(waypoint.segment_from_previous)}</span>`
    : '';

  return `
    <li class="route-waypoint">
      <div class="waypoint-time">
        <strong>${escapeHtml(waypoint.elapsed)}</strong>
        ${segment}
      </div>
      <div class="waypoint-track" aria-hidden="true"><span></span></div>
      <div class="waypoint-body">
        <div class="waypoint-label">${escapeHtml(waypoint.label)}</div>
        ${renderBadges(waypoint.badges)}
      </div>
    </li>
  `;
}

function renderSection(section) {
  return `
    <section class="route-section route-section--${escapeHtml(section.key)}">
      <h3>${escapeHtml(section.label)}</h3>
      <ol class="route-waypoints">
        ${section.waypoints.map(renderWaypoint).join('')}
      </ol>
    </section>
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

/**
 * Render a presentation-ready RouteModel ViewModel.
 * The renderer intentionally does not interpret Canonical RouteModel fields,
 * ConcretePlan timing, provider-specific payloads, or route-specific IDs.
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

      <div class="route-sections">
        ${model.sections.map(renderSection).join('')}
      </div>

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
