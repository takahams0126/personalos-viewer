function refKey(ref) {
  if (!ref?.entity_type || !ref?.id) {
    throw new Error('PublicEntityRef requires entity_type and id.');
  }
  return `${ref.entity_type}:${ref.id}`;
}

export class ManifestStore {
  constructor(resourceStore) {
    this.resourceStore = resourceStore;
    this.manifestPromise = null;
    this.entries = null;
  }

  async ensure() {
    if (!this.manifestPromise) {
      this.manifestPromise = this.resourceStore.loadJson('manifest.json').then(manifest => {
        this.entries = new Map(
          (manifest.entities || []).map(entry => [refKey(entry.ref), entry])
        );
        return manifest;
      });
    }
    return this.manifestPromise;
  }

  async getEntry(ref) {
    await this.ensure();
    const entry = this.entries.get(refKey(ref));
    if (!entry) {
      throw new Error(`Manifest entry missing: ${refKey(ref)}`);
    }
    return entry;
  }
}

export { refKey };
