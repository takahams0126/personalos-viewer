const ENTITY_DIRS = {
  spot: 'spots',
  route: 'routes',
  plan: 'plans',
  'concrete-plan': 'concrete-plans'
};

export async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }
  return response.json();
}

export function entityPath(type, id) {
  const dir = ENTITY_DIRS[type];
  if (!dir) throw new Error(`Unsupported entity type: ${type}`);
  if (!id) throw new Error(`Missing entity id for ${type}`);
  return `./data/${dir}/${encodeURIComponent(id)}.json`;
}

export function loadEntity(type, id) {
  return loadJson(entityPath(type, id));
}

export function loadManifest() {
  return loadJson('./manifest.json');
}
