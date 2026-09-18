import { resolveRequest } from './core/request.js';
import { loadStyle } from './shared/load-style.js';
import { renderError } from './shared/error-view.js';

const pageLoaders = {
  top: () => import('./top/top.js'),
  spot: () => import('./spot/spot.js'),
  route: () => import('./route/route.js'),
  plan: () => import('./plan/plan.js'),
  'concrete-plan': () => import('./concrete-plan/concrete-plan.js')
};

export async function main() {
  loadStyle(new URL('./shared/shared.css', import.meta.url).href);

  const request = resolveRequest();
  const loader = pageLoaders[request.type];

  if (!loader) {
    throw new Error(`Unsupported viewer page type: ${request.type}`);
  }

  const page = await loader();
  await page.render(request);
}

try {
  await main();
} catch (error) {
  console.error('[viewer] bootstrap failed', error);
  renderError(error);
}
