import { resolveRequest } from './core/request.js';
import { loadPageData, resources } from './core/data.js';
import {
  createNavigationContext,
  installDocumentNavigation
} from './core/navigation.js';
import { loadStyle } from './shared/load-style.js';
import { renderError } from './shared/error-view.js';
import { renderNavigation } from './shared/navigation.js';

/**
 * Public contract between the composition root and every Viewer page module.
 *
 * @typedef {Object} ViewerPageContext
 * @property {{type:string,id:string|null}} request
 * @property {Object|null} data
 * @property {{source:Object|null,href:(target:Object)=>string}} navigation
 * @property {{loadJson:(path:string,options?:Object)=>Promise<Object>}} resources
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
  const loader = pageLoaders[request.type];
  if (!loader) {
    throw new Error(`Unsupported viewer page type: ${request.type}`);
  }

  const data = await loadPageData(request.type, request.id);
  const navigation = createNavigationContext({ request, data });
  const context = { request, data, navigation, resources };

  renderNavigation(context);

  const page = await loader();
  await page.render(context);

  installDocumentNavigation(context);
}

try {
  await main();
} catch (error) {
  console.error('[viewer] bootstrap failed', error);
  renderError(error);
}
