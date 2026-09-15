// Formal Leisure Presentation entrypoint.
// This is the only production Presentation script loaded by index.html.
// Data semantics remain in Public JSON; this layer owns only UI composition/behavior.

const qs = new URLSearchParams(location.search);
const type = qs.get('type');

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
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

async function load(path) {
  try { await import(path); }
  catch (error) { console.error(`[presentation] failed: ${path}`, error); }
}

await waitFor('#app .hero, #app .section');

if (!type) {
  await load('./modules/home-explorer.js');
} else if (type === 'plan') {
  // Deterministic Plan composition order:
  // base Plan DOM -> shared Day UI -> SVG flow -> alternatives -> Concrete overlay -> execution supplements.
  await load('./modules/plan-demo.js');
  await waitFor('.plan-demo-itinerary .day-card, .itinerary .day-card');
  await load('./modules/plan-flow-icons.js');
  await load('./modules/day-decision-demo.js');
  await load('./modules/execution-demo.js');
  await waitFor('#execution-mode-panel');
  await load('./modules/execution-feasibility-poc.js');
  await load('./modules/execution-fuel-poc.js');
  await load('./modules/execution-weather-poc.js');
} else if (type === 'route') {
  await load('./modules/route-demo.js');
  await waitFor('.route-demo-page, .route-demo-section, .route-stops');
  await load('./modules/route-metrics.js');
} else if (type === 'spot') {
  await load('./modules/spot-demo.js');
}
