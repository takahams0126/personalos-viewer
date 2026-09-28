import { resources } from './core/resource-store.js';
import { ManifestStore } from './core/manifest-store.js';
import { EntityResolver } from './core/entity-resolver.js';
import { ArtifactLoader } from './core/artifact-loader.js';
import { readRequest } from './core/router.js';
import { renderConcretePlan } from './render/concrete-plan.js';
import { renderPlan } from './render/plan.js';
import { renderRoute } from './render/route.js';
import { renderSpot } from './render/spot.js';
import { renderTop } from './render/top.js';
import { hydrateMapViews } from './map/google-map.js';
import { hydrateCarousels } from './ui/carousel.js';
import { hydrateExplorer } from './ui/explorer.js';
import { h } from './render/dom.js';

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

async function renderRequestedEntity(request, data) {
  if (request.type === 'spot') {
    return renderSpot({ spot: data, resolver });
  }

  if (request.type === 'route') {
    return renderRoute({ route: data, resolver });
  }

  if (request.type === 'plan') {
    return renderPlan({ plan: data, resolver });
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

async function renderTopPage(app) {
  const manifest = await manifestStore.ensure();
  document.documentElement.dataset.pageType = 'top';
  document.title = 'レジャー | PersonalOS Viewer';
  app.replaceChildren(renderTop({ manifest }));
  hydrateExplorer(app);
}

async function main() {
  const request = readRequest();
  const app = document.querySelector('#app');

  if (request.kind === 'top') {
    await renderTopPage(app);
    return;
  }

  document.documentElement.dataset.pageType = request.type;

  const loaded = await resolver.load({
    entity_type: request.type,
    id: request.id
  });

  const page = await renderRequestedEntity(request, loaded.data);

  document.title = `${loaded.data.title} | PersonalOS Viewer`;
  app.replaceChildren(page);

  if (request.type === 'spot') {
    hydrateCarousels(app);
  }

  if (request.type === 'route' || request.type === 'concrete_plan') {
    await hydrateMapViews({ root: app, artifactLoader, resolver });
  }
}

try {
  await main();
} catch (error) {
  console.error('[current-viewer] bootstrap failed', error);
  document.querySelector('#app').replaceChildren(
    h('section', { attrs: { role: 'alert' } },
      h('h1', { text: 'Viewerを表示できませんでした' }),
      h('p', { text: error.message })
    )
  );
}
