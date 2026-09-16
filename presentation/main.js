// Formal Leisure Presentation entrypoint.
// This is the only production Presentation script loaded by index.html.
// Data semantics remain in Public JSON; this layer owns only UI composition/behavior.

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const PRESENTATION_VERSION = '20260916-presentation-3';

function waitFor(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);
    const observer = new MutationObserver(() => {
      const node = document.querySelector(selector);
      if (!node) return;
      observer.disconnect();
      resolve(node);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

async function load(path) {
  const versionedPath = `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(PRESENTATION_VERSION)}`;
  try { await import(versionedPath); }
  catch (error) { console.error(`[presentation] failed: ${versionedPath}`, error); }
}

if (type) await load('./shared/breadcrumb.js');

if (type === 'spot') {
  await load('./modules/spot-renderer.js');
} else {
  await waitFor('#app .hero, #app .section');

  if (!type) {
    await load('./modules/home-explorer.js');
  } else if (type === 'plan') {
    await load('./modules/plan-renderer.js');
    await waitFor('.plan-demo-itinerary .plan-axis');
    await load('./modules/plan-flow-icons.js');
    await load('./modules/day-decisions.js');
    await load('./modules/concrete-plan-renderer.js');
    await waitFor('#execution-mode-panel');
    await load('./modules/execution-feasibility.js');
    await load('./modules/execution-fuel.js');
    await load('./modules/execution-weather.js');
  } else if (type === 'route') {
    await load('./modules/route-renderer.js');
    await waitFor('.route-demo-page, .route-demo-section, .route-stops');
    await load('./modules/route-metrics.js');
  }
}
