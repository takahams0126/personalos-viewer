// Leisure Presentation bootstrap.
// Normal Path: identify page -> wait for base render -> normalize shared DOM -> page renderer -> normalize -> behavior -> done.
// No persistent DOM observers belong in bootstrap.

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const pageType = type || 'home';
const PRESENTATION_VERSION = '20260918-shared-day-badges-1';

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
    return await import(versionedPath);
  } catch (error) {
    console.error(`[presentation] failed: ${versionedPath}`, error);
    return null;
  }
}

const domContract = await load('./shared/base-dom-contract.js');
const normalizeDom = () => domContract?.normalizeBaseDom?.(document);

async function loadHome() {
  await waitForBaseRender();
  normalizeDom();
  await load('./modules/home-explorer.js');
  normalizeDom();
}

async function loadSpot() {
  await waitForBaseRender();
  normalizeDom();
  await load('./modules/spot-renderer.js');
  await waitForBaseRender('.spot-demo-hero');
  normalizeDom();
}

async function loadRoute() {
  await waitForBaseRender();
  normalizeDom();
  await load('./modules/route-renderer.js');
  await waitForBaseRender('.route-demo-page, .route-demo-section, .route-stops');
  normalizeDom();
  await load('./modules/route-metrics.js');
  normalizeDom();
}

async function loadPlan() {
  await waitForBaseRender();
  normalizeDom();
  await load('./modules/plan-renderer.js');
  await waitForBaseRender('.plan-demo-itinerary .plan-axis');
  normalizeDom();
  await load('./modules/day-decisions.js');
  await load('./modules/concrete-plan-renderer.js');
  normalizeDom();
  await load('./shared/flow-icons.js');
  await waitForBaseRender('#execution-mode-panel');
  await load('./modules/execution-day-header.js');
  await load('./modules/execution-overview.js');
  await load('./modules/execution-feasibility.js');
  await load('./modules/execution-fuel.js');
  await load('./modules/execution-weather.js');
  normalizeDom();
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
