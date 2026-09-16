const qs = new URLSearchParams(location.search);
const currentType = qs.get('type');
const currentId = qs.get('id');

if (currentType && currentId) initBreadcrumb();

const dirFor = type => type === 'plan' ? 'plans' : type === 'route' ? 'routes' : type === 'spot' ? 'spots' : '';
const dataPathFor = (type, id) => `./data/${dirFor(type)}/${encodeURIComponent(id)}.json`;
const hrefFor = ref => `./?type=${encodeURIComponent(ref.type)}&id=${encodeURIComponent(ref.id)}`;
const esc = (value='') => String(value).replace(/[&<>'\"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));

async function fetchEntity(type, id) {
  const dir = dirFor(type);
  if (!dir || !id) return null;
  try {
    const response = await fetch(dataPathFor(type, id), {cache:'no-store'});
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

async function resolveTrail(type, id, seen = new Set(), depth = 0) {
  if (!type || !id || depth > 8) return [];
  const key = `${type}:${id}`;
  if (seen.has(key)) return [];
  seen.add(key);

  const entity = await fetchEntity(type, id);
  if (!entity) return [{type, id, label:id}];

  const current = {
    type,
    id,
    label: entity.title || id
  };
  const parent = Array.isArray(entity.parent_refs) ? entity.parent_refs[0] : null;
  if (!parent?.type || !parent?.id) return [current];

  const ancestors = await resolveTrail(parent.type, parent.id, seen, depth + 1);
  return [...ancestors, current];
}

async function initBreadcrumb() {
  const breadcrumb = document.querySelector('#breadcrumb');
  if (!breadcrumb) return;

  const trail = await resolveTrail(currentType, currentId);
  if (!trail.length) return;

  breadcrumb.innerHTML = [
    '<a href="./">Home</a>',
    ...trail.flatMap((ref, index) => {
      const isCurrent = index === trail.length - 1;
      const node = isCurrent
        ? `<span>${esc(ref.label)}</span>`
        : `<a href="${hrefFor(ref)}">${esc(ref.label)}</a>`;
      return ['<span>›</span>', node];
    })
  ].join('');
}
