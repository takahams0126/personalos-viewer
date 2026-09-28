const DEFAULT_REQUEST = Object.freeze({
  type: 'concrete_plan',
  id: 'CP001'
});

export function readRequest(search = window.location.search) {
  const params = new URLSearchParams(search);
  const type = params.get('type') || DEFAULT_REQUEST.type;
  const id = params.get('id') || DEFAULT_REQUEST.id;
  return Object.freeze({ type, id });
}

export function hrefFor(ref) {
  const params = new URLSearchParams({ type: ref.entity_type, id: ref.id });
  return `?${params.toString()}`;
}
