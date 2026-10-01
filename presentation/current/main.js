import { resources } from './core/resource-store.js';
import { ManifestStore } from './core/manifest-store.js';
import { EntityResolver } from './core/entity-resolver.js';
import { ArtifactLoader } from './core/artifact-loader.js';
import { readRequest } from './core/router.js';
import { createNavigationContext, installNavigationCapture } from './core/navigation-context.js';
import { renderConcretePlan } from './render/concrete-plan.js';
import { renderPlan } from './render/plan.js';
import { renderRoute } from './render/route.js';
import { renderSpot } from './render/spot.js';
import { renderTop } from './render/top.js';
import { applyPageLayoutDefinition } from './presentation/apply-layout-definition.js';
import { hydrateMapViews } from './map/google-map.js';
import { hydrateCarousels } from './interaction/carousel.js';
import { hydrateContentSwitchers } from './interaction/content-switcher.js';
import { hydrateExecutionPackageSwitchers } from './interaction/execution-package-switcher.js';
import { hydrateExplorer } from './interaction/explorer.js';
import { hydrateWeatherPresentation } from './interaction/weather.js';
import { renderAppShell } from './structure/app-shell.js';

const manifestStore = new ManifestStore(resources);
const resolver = new EntityResolver(manifestStore, resources);
const artifactLoader = new ArtifactLoader(resources);

async function loadSourcePlan(concretePlan) {
  if (!concretePlan.source_plan_ref) return null;
  try {
    const loaded = await resolver.load(concretePlan.source_plan_ref);
    return loaded.data;
  } catch (error) {
    console.warn('[current-viewer] source plan unavailable', error);
    return null;
  }
}

async function renderRequestedEntity(request, loaded) {
  const data = loaded.data;

  if (request.type === 'spot') {
    return renderSpot({ spot: data, resolver });
  }

  if (request.type === 'route') {
    return renderRoute({ route: data, resolver });
  }

  if (request.type === 'plan') {
    return renderPlan({ plan: data, manifestEntry: loaded.entry, resolver });
  }

  if (request.type === 'concrete_plan') {
    const sourcePlan = await loadSourcePlan(data);
    return renderConcretePlan({
      concretePlan: data,
      sourcePlan,
      resolver,
      artifactLoader
    });
  }

  throw new Error(`Current Viewer does not support this page type yet: ${request.type}`);
}

async function renderTopPage(app, pageLayoutDefinition) {
  const manifest = await manifestStore.ensure();
  document.documentElement.dataset.pageType = 'top';
  document.title = 'レジャー | PersonalOS Viewer';
  app.replaceChildren(renderTop({ manifest }));
  applyPageLayoutDefinition({ root: app, pageType: 'top', definition: pageLayoutDefinition });
  hydrateExplorer(app);
}

export async function startCurrentViewer({ presentation }) {
  const pageLayoutDefinition = presentation?.pageLayoutDefinition;
  if (!pageLayoutDefinition) throw new Error('Active Page Layout Definition is unavailable.');

  const request = readRequest();
  const app = document.querySelector('#app');
  const shell = document.querySelector('#viewer-shell');
  const navigation = createNavigationContext();

  if (request.kind === 'top') {
    await renderTopPage(app, pageLayoutDefinition);
    renderAppShell({ request, navigation }, shell);
    installNavigationCapture({ request, data: null });
    return;
  }

  document.documentElement.dataset.pageType = request.type;

  const loaded = await resolver.load({
    entity_type: request.type,
    id: request.id
  });

  const page = await renderRequestedEntity(request, loaded);

  document.title = `${loaded.data.title} | PersonalOS Viewer`;
  app.replaceChildren(page);
  applyPageLayoutDefinition({ root: app, pageType: request.type, definition: pageLayoutDefinition });
  renderAppShell({ request, navigation }, shell);
  installNavigationCapture({ request, data: loaded.data });

  hydrateContentSwitchers(app);
  hydrateExecutionPackageSwitchers(app);

  if (request.type === 'concrete_plan') {
    hydrateWeatherPresentation(app, loaded.data);
  }

  if (request.type === 'spot') {
    hydrateCarousels(app);
  }

  if (request.type === 'route' || request.type === 'concrete_plan') {
    await hydrateMapViews({ root: app, artifactLoader, resolver });
  }
}
