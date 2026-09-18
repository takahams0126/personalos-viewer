function parseTrailEntry(value) {
  const separator = value.indexOf(':');
  if (separator <= 0 || separator === value.length - 1) return null;

  return {
    type: value.slice(0, separator),
    id: value.slice(separator + 1)
  };
}

export function resolveRequest(search = location.search) {
  const params = new URLSearchParams(search);

  return {
    type: params.get('type') || 'top',
    id: params.get('id'),
    trail: params.getAll('trail').map(parseTrailEntry).filter(Boolean)
  };
}
