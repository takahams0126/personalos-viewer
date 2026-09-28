import { resources } from './core/resource-store.js';
import { ManifestStore } from './core/manifest-store.js';
import { EntityResolver } from './core/entity-resolver.js';
import { ArtifactLoader } from './core/artifact-loader.js';
import { readRequest } from './core/router.js';
import { renderConcretePlan } from './render/concrete-plan.js';
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

async function main() {
  const request = readRequest();
  if (request.type !== 'concrete_plan') {
    throw new Error(`Current vertical slice supports concrete_plan only: ${request.type}`);
  }

  const loaded = await resolver.load({
    entity_type: request.type,
    id: request.id
  });
  const concretePlan = loaded.data;
  const sourcePlan = await loadSourcePlan(concretePlan);

  const page = await renderConcretePlan({
    concretePlan,
    sourcePlan,
    resolver,
    artifactLoader
  });

  document.title = `${concretePlan.title} | PersonalOS Viewer`;
  document.querySelector('#app').replaceChildren(page);
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
