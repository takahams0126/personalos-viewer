const routeMetricsQs = new URLSearchParams(location.search);
if (routeMetricsQs.get('type') === 'route' && routeMetricsQs.get('id') === 'R011') initRouteMetrics();

async function initRouteMetrics() {
  let data;
  try {
    const res = await fetch('./data/routes/R011.json', {cache:'no-store'});
    if (!res.ok) return;
    data = await res.json();
  } catch { return; }

  const map = data.map || {};
  const km = map.actual_distance_m ? (Number(map.actual_distance_m) / 1000).toFixed(1) : null;
  const minutes = map.actual_time_s ? Math.round(Number(map.actual_time_s) / 60) : null;
  if (!km && !minutes) return;

  const app = document.querySelector('#app');
  const attach = () => {
    const summary = app?.querySelector('#route-summary');
    const conceptual = app?.querySelector('#map-conceptual');
    const actual = app?.querySelector('#map-actual');
    if (!summary || !conceptual || !actual || summary.dataset.metricsEnhanced) return false;

    summary.dataset.metricsEnhanced = '1';
    summary.classList.add('route-metrics');
    summary.innerHTML = `
      <div class="route-metric-card">
        <span>総走行距離</span>
        <strong>${km ? `${km} km` : '—'}</strong>
      </div>
      <div class="route-metric-card">
        <span>総運転時間</span>
        <strong>${minutes ? `約${minutes}分` : '—'}</strong>
        <small>※立ち寄り時間を含まない</small>
      </div>`;

    const sync = () => {
      const actualActive = actual.classList.contains('active');
      summary.hidden = !actualActive;
    };
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(conceptual, {attributes:true, attributeFilter:['class']});
    observer.observe(actual, {attributes:true, attributeFilter:['class']});
    conceptual.addEventListener('click', () => requestAnimationFrame(sync));
    actual.addEventListener('click', () => requestAnimationFrame(sync));
    return true;
  };

  if (attach()) return;
  const observer = new MutationObserver(() => {
    if (attach()) observer.disconnect();
  });
  observer.observe(app, {childList:true, subtree:true});
}
