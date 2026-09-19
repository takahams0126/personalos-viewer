const HISTORY_STATE_KEY = 'personalosViewer';

function normalizeSource(source) {
  if (!source?.type) return null;
  return {
    type: String(source.type),
    id: source.id ? String(source.id) : null,
    title: String(source.title || source.id || '')
  };
}

export function buildViewerHref({ type, id } = {}) {
  if (!type || type === 'top') return '?';

  const params = new URLSearchParams();
  params.set('type', type);
  if (id) params.set('id', id);
  return `?${params.toString()}`;
}

export function readNavigationState(state = history.state) {
  const stored = state?.[HISTORY_STATE_KEY]?.navigation;
  return {
    source: normalizeSource(stored?.source)
  };
}

function currentSource({ request, data }) {
  if (!request || request.type === 'top') return null;
  return normalizeSource({
    type: request.type,
    id: request.id,
    title: data?.title || request.id || ''
  });
}

export function createNavigationContext({ request, data }) {
  const state = readNavigationState();
  return {
    source: state.source,
    href: target => buildViewerHref(target)
  };
}

function isPlainPrimaryClick(event) {
  return event.button === 0
    && !event.defaultPrevented
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

function resolveInternalViewerUrl(anchor) {
  const href = anchor?.getAttribute('href') || '';
  if (!href.startsWith('?')) return null;

  const url = new URL(href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return null;
  return url;
}

/**
 * Keep normal document navigation while attaching entry-scoped navigation context.
 * The destination URL remains physical-entry independent and contains only Viewer identity.
 */
export function installDocumentNavigation(context, root = document) {
  const onClick = event => {
    if (!isPlainPrimaryClick(event)) return;

    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

    const url = resolveInternalViewerUrl(anchor);
    if (!url) return;

    event.preventDefault();
    const state = {
      ...(history.state || {}),
      [HISTORY_STATE_KEY]: {
        navigation: {
          source: currentSource(context)
        }
      }
    };

    history.pushState(state, '', `${url.pathname}${url.search}${url.hash}`);
    location.reload();
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
