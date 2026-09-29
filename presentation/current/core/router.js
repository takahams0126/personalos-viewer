const DETAIL_PAGE_TYPES = new Set(['spot', 'route', 'plan', 'concrete_plan']);

export function readRequest(search = window.location.search) {
  const params = new URLSearchParams(search);
  const type = params.get('type');
  const id = params.get('id');

  if (!type && !id) {
    return Object.freeze({ kind: 'top' });
  }

  if (!type || !id) {
    throw new Error('Entity request requires both type and id.');
  }

  return Object.freeze({ kind: 'entity', type, id });
}

export function isDetailPageRef(ref) {
  return Boolean(ref?.entity_type && ref?.id && DETAIL_PAGE_TYPES.has(ref.entity_type));
}

export function hrefFor(ref) {
  const params = new URLSearchParams({ type: ref.entity_type, id: ref.id });
  return `?${params.toString()}`;
}
