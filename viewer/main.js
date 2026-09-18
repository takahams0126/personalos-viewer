import { resolveRequest } from './core/request.js';
import { loadEntity } from './core/data.js';
import { loadStyle } from './shared/load-style.js';
import { renderError } from './shared/error-view.js';
import { renderBreadcrumb } from './shared/navigation.js';

/**
 * Public contract between the composition root and every Viewer page module.
 * TOP receives data=null; entity pages receive their primary entity exactly once.
 *
 * @typedef {Object} ViewerPageContext
 * @property {{type:string,id:string|null,trail:Array<{type:string,id:string}>}} request
 * @property {Object|null} data
 */

/**
 * @typedef {Object} ViewerPageModule
 * @property {(context: ViewerPageContext) => (void|Promise<void>)} render
 */

/** @type {Record<string, () => Promise<ViewerPageModule>>} */
const pageLoaders = {
  top: () => import('./top/top.js'),
  spot: () => import('./spot/spot.js'),
  route: () => import('./route/route.js'),
  plan: () => import('./plan/plan.js'),
  'concrete-plan': () => import('./concrete-plan/concrete-plan.js')
};

export async function main() {
  loadStyle(new URL('./shared/main.css', import.meta.url).href);

  const request = resolveRequest();
  renderBreadcrumb(request);

  const loader = pageLoaders[request.type];
  if (!loader) {
    throw new Error(`Unsupported viewer page type: ${request.type}`);
  }

  const data = request.type === 'top'
    ? null
    : await loadEntity(request.type, request.id);

  const page = await loader();
  await page.render({ request, data });
}

try {
  await main();
} catch (error) {
  console.error('[viewer] bootstrap failed', error);
  renderError(error);
}
