const VIEWER_ENTRY = './index2.html';

function normalizeTrail(trail = []) {
  return trail.filter(item => item?.type && item?.id);
}

export function buildViewerHref({ type, id, trail = [] }) {
  if (!type || type === 'top') return VIEWER_ENTRY;

  const params = new URLSearchParams();
  params.set('type', type);
  if (id) params.set('id', id);
  normalizeTrail(trail).forEach(item => {
    params.append('trail', `${item.type}:${item.id}`);
  });

  return `${VIEWER_ENTRY}?${params.toString()}`;
}

export function buildEntityHref(target, request) {
  const trail = normalizeTrail(request?.trail);
  if (request?.type && request.type !== 'top' && request?.id) {
    trail.push({ type: request.type, id: request.id });
  }

  return buildViewerHref({
    type: target.type,
    id: target.id,
    trail
  });
}

export function renderBreadcrumb(request, root = document.querySelector('#breadcrumb')) {
  if (!root) return;

  root.replaceChildren();
  if (!request || request.type === 'top') return;

  const stack = [
    ...normalizeTrail(request.trail),
    ...(request.id ? [{ type: request.type, id: request.id }] : [])
  ];

  const top = document.createElement('a');
  top.href = VIEWER_ENTRY;
  top.textContent = 'TOP';
  root.appendChild(top);

  stack.forEach((item, index) => {
    const separator = document.createElement('span');
    separator.textContent = '›';
    root.appendChild(separator);

    const isCurrent = index === stack.length - 1;
    const node = document.createElement(isCurrent ? 'span' : 'a');
    node.textContent = item.id;

    if (isCurrent) {
      node.setAttribute('aria-current', 'page');
    } else {
      node.href = buildViewerHref({
        type: item.type,
        id: item.id,
        trail: stack.slice(0, index)
      });
    }

    root.appendChild(node);
  });
}
