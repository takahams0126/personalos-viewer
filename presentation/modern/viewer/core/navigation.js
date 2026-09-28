const HISTORY_STATE_KEY = 'personalosViewer';
const PENDING_NAVIGATION_KEY = 'personalosViewerPendingNavigation';

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

function currentEntryKey(url = location) {
  return `${url.pathname}${url.search}`;
}

function writeEntryNavigationState(source) {
  const nextState = {
    ...(history.state || {}),
    [HISTORY_STATE_KEY]: {
      ...(history.state?.[HISTORY_STATE_KEY] || {}),
      navigation: { source: normalizeSource(source) }
    }
  };
  history.replaceState(nextState, '', location.href);
}

function consumePendingNavigation() {
  let pending = null;
  try {
    const raw = sessionStorage.getItem(PENDING_NAVIGATION_KEY);
    if (raw) pending = JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
    return null;
  }

  if (!pending || pending.destination !== currentEntryKey()) return null;

  sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
  const source = normalizeSource(pending.source);
  if (source) writeEntryNavigationState(source);
  return source;
}

export function createNavigationContext({ request, data }) {
  const stored = readNavigationState();
  const source = stored.source || consumePendingNavigation();
  return {
    source,
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
 * Preserve normal document navigation. Session storage is only a short-lived
 * transport for the destination entry's source context; history.state remains
 * the authoritative entry-scoped navigation state after the destination loads.
 */
export function installDocumentNavigation(context, root = document) {
  const onClick = event => {
    if (!isPlainPrimaryClick(event)) return;

    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

    const url = resolveInternalViewerUrl(anchor);
    if (!url) return;

    const payload = {
      destination: currentEntryKey(url),
      source: currentSource(context)
    };

    try {
      sessionStorage.setItem(PENDING_NAVIGATION_KEY, JSON.stringify(payload));
    } catch {
      // Navigation must still proceed even if session storage is unavailable.
    }
    // Do not preventDefault(): let the browser create a real document-history entry.
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
