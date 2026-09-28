const SITE_ROOT = new URL('../../../', import.meta.url);

export function createResourceStore({ fetchImpl = globalThis.fetch.bind(globalThis) } = {}) {
  const loads = new Map();

  async function loadJson(path) {
    const url = new URL(path, SITE_ROOT).href;
    if (loads.has(url)) return loads.get(url);

    const pending = (async () => {
      const response = await fetchImpl(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status}`);
      }
      return response.json();
    })();

    loads.set(url, pending);
    try {
      return await pending;
    } catch (error) {
      loads.delete(url);
      throw error;
    }
  }

  return Object.freeze({ loadJson });
}

export const resources = createResourceStore();
