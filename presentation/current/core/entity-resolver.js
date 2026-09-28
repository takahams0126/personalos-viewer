import { refKey } from './manifest-store.js';

export class EntityResolver {
  constructor(manifestStore, resourceStore) {
    this.manifestStore = manifestStore;
    this.resourceStore = resourceStore;
    this.entityLoads = new Map();
  }

  async describe(ref) {
    const entry = await this.manifestStore.getEntry(ref);
    return Object.freeze({
      ref: entry.ref,
      title: entry.title,
      dataPath: entry.data_path,
      explorer: entry.explorer || null
    });
  }

  async load(ref) {
    const key = refKey(ref);
    if (this.entityLoads.has(key)) return this.entityLoads.get(key);

    const pending = (async () => {
      const entry = await this.manifestStore.getEntry(ref);
      const data = await this.resourceStore.loadJson(entry.data_path);
      if (data?.entity_type !== ref.entity_type || data?.id !== ref.id) {
        throw new Error(`Entity identity mismatch for ${key}`);
      }
      return Object.freeze({ entry, data });
    })();

    this.entityLoads.set(key, pending);
    try {
      return await pending;
    } catch (error) {
      this.entityLoads.delete(key);
      throw error;
    }
  }
}
