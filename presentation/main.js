// Leisure Presentation bootstrap.
// Normal Path: identify page -> wait for base render -> load page renderer -> bind page behavior -> done.
// No persistent DOM observers belong in bootstrap.

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const pageType = type || 'home';
const PRESENTATION_VERSION = '20260916-presentation-3';

const body = document.body;
body.classList.add(`page-${pageType}`);
body.dataset.pageType = pageType;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForBaseRender(selector = '#app .hero, #app .section', timeout = 5000) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    const node = document.querySelector(selector);
    if (node) return node;
    await sleep(25);
  }
  return null;
}

async function load(path) {
  const versionedPath = `${path}${path.includes('?') ? '&' : '?'}v=${encodeURIComponent(PRESENTATION_VERSION)}`;
  try {
    await import(versionedPath);
    return true;
  } catch (error) {
    console.error(`[presentation] failed: ${versionedPath}`, error);
    return false;
  }
}

async function loadHome() {
  await waitForBaseRender();
  await load('./modules/home-explorer.js');
}

async function loadSpot() {
  await load('./modules/spot-renderer.js');
}

async function loadRoute() {
  await waitForBaseRender();
  await load('./modules/route-renderer.js');
  await waitForBaseRender('.route-demo-page, .route-demo-section, .route-stops');
  await load('./modules/route-metrics.js');
}

async function loadPlan() {
  await waitForBaseRender();
  await load('./modules/plan-renderer.js');
  await waitForBaseRender('.plan-demo-itinerary .plan-axis');
  await load('./shared/collapsible-content.js');
  await load('./modules/day-decisions.js');
  await load('./modules/concrete-plan-renderer.js');
  await load('./shared/flow-icons.js');
  await waitForBaseRender('#execution-mode-panel');
  await load('./modules/execution-feasibility.js');
  await load('./modules/execution-fuel.js');
  await load('./modules/execution-weather.js');
}

async function bootstrapPresentation() {
  if (type) await load('./shared/breadcrumb.js');

  if (pageType === 'home') return loadHome();
  if (pageType === 'spot') return loadSpot();
  if (pageType === 'route') return loadRoute();
  if (pageType === 'plan') return loadPlan();

  console.warn(`[presentation] unsupported page type: ${pageType}`);
}

await bootstrapPresentation();
