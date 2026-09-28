export class ArtifactLoader {
  constructor(resourceStore) {
    this.resourceStore = resourceStore;
    this.loads = new Map();
  }

  async load(ref) {
    if (!ref?.artifact_id) {
      throw new Error('ArtifactRef requires artifact_id.');
    }
    if (this.loads.has(ref.artifact_id)) return this.loads.get(ref.artifact_id);

    const pending = this.resourceStore.loadJson(ref.artifact_id);
    this.loads.set(ref.artifact_id, pending);
    try {
      return await pending;
    } catch (error) {
      this.loads.delete(ref.artifact_id);
      throw error;
    }
  }
}
