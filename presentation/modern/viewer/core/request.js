/**
 * @typedef {Object} ViewerRequest
 * @property {string} type
 * @property {string|null} id
 */

/**
 * Resolve Viewer identity from the URL at the composition boundary.
 * Navigation history/context is intentionally not encoded in ViewerRequest.
 *
 * @param {string} [search=location.search]
 * @returns {ViewerRequest}
 */
export function resolveRequest(search = location.search) {
  const params = new URLSearchParams(search);

  return {
    type: params.get('type') || 'top',
    id: params.get('id')
  };
}
