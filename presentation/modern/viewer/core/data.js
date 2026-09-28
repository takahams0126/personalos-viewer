const ENTITY_DIRS = {
  spot: 'spots',
  route: 'routes',
  plan: 'plans',
  'concrete-plan': 'concrete-plans'
};

// This Modern tree is presentation-only reference code. Published Boundary data
// remains shared at the repository/site root so presentation generations never
// own or overwrite it.
const PUBLIC_ROOT = new URL('../../', document.baseURI);

export function createResourceManager({ fetchImpl = globalThis.fetch.bind(globalThis) } = {}) {
  const jsonLoads = new Map();

  async function loadJson(path, { cache = 'no-store' } = {}) {
    const url = new URL(path, PUBLIC_ROOT).href;
    const key = `${cache}:${url}`;
    if (jsonLoads.has(key)) return jsonLoads.get(key);

    const load = (async () => {
      const response = await fetchImpl(url, { cache });
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return response.json();
    })();

    jsonLoads.set(key, load);
    try {
      return await load;
    } catch (error) {
      jsonLoads.delete(key);
      throw error;
    }
  }

  return Object.freeze({ loadJson });
}

export const resources = createResourceManager();

export function loadJson(path, options) {
  return resources.loadJson(path, options);
}

export function entityPath(type, id) {
  const dir = ENTITY_DIRS[type];
  if (!dir) throw new Error(`Unsupported entity type: ${type}`);
  if (!id) throw new Error(`Missing entity id for ${type}`);
  return `data/${dir}/${encodeURIComponent(id)}.json`;
}

export function loadEntity(type, id) {
  return resources.loadJson(entityPath(type, id));
}

export function loadManifest() {
  return resources.loadJson('manifest.json');
}

export function loadPageData(type, id) {
  return type === 'top' ? loadManifest() : loadEntity(type, id);
}
