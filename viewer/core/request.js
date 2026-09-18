/**
 * @typedef {Object} ViewerTrailEntry
 * @property {string} type
 * @property {string} id
 */

/**
 * @typedef {Object} ViewerRequest
 * @property {string} type
 * @property {string|null} id
 * @property {ViewerTrailEntry[]} trail
 */

/**
 * @param {string} value
 * @returns {ViewerTrailEntry|null}
 */
function parseTrailEntry(value) {
  const separator = value.indexOf(':');
  if (separator <= 0 || separator === value.length - 1) return null;

  return {
    type: value.slice(0, separator),
    id: value.slice(separator + 1)
  };
}

/**
 * Resolve all Viewer navigation state at the composition boundary.
 * Page modules consume this object and must not parse the URL again.
 *
 * @param {string} [search=location.search]
 * @returns {ViewerRequest}
 */
export function resolveRequest(search = location.search) {
  const params = new URLSearchParams(search);

  return {
    type: params.get('type') || 'top',
    id: params.get('id'),
    trail: params.getAll('trail').map(parseTrailEntry).filter(Boolean)
  };
}
