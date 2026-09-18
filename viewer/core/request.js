export function resolveRequest(search = location.search) {
  const params = new URLSearchParams(search);

  return {
    type: params.get('type') || 'top',
    id: params.get('id')
  };
}
