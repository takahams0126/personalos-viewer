const HISTORY_STATE_KEY = 'personalosCurrentViewer';
const PENDING_NAVIGATION_KEY = 'personalosCurrentViewerPendingNavigation';

function normalizeSource(source) {
  if (!source?.type || source.type === 'top' || !source.id) return null;
  return Object.freeze({
    type: String(source.type),
    id: String(source.id),
    title: String(source.title || source.id)
  });
}

function currentEntryKey(url = location) {
  return `${url.pathname}${url.search}`;
}

function readEntrySource(state = history.state) {
  return normalizeSource(state?.[HISTORY_STATE_KEY]?.navigation?.source);
}

function writeEntrySource(source) {
  const normalized = normalizeSource(source);
  if (!normalized) return;

  const previous = history.state || {};
  history.replaceState({
    ...previous,
    [HISTORY_STATE_KEY]: {
      ...(previous[HISTORY_STATE_KEY] || {}),
      navigation: { source: normalized }
    }
  }, '', location.href);
}

function consumePendingSource() {
  let raw = null;
  try {
    raw = sessionStorage.getItem(PENDING_NAVIGATION_KEY);
    if (!raw) return null;

    const pending = JSON.parse(raw);
    sessionStorage.removeItem(PENDING_NAVIGATION_KEY);

    if (pending?.destination !== currentEntryKey()) return null;

    const source = normalizeSource(pending.source);
    if (source) writeEntrySource(source);
    return source;
  } catch {
    if (raw != null) {
      try {
        sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
      } catch {
        // Navigation must remain usable when storage is unavailable.
      }
    }
    return null;
  }
}

function currentSource({ request, data }) {
  if (request?.kind !== 'entity') return null;
  return normalizeSource({
    type: request.type,
    id: request.id,
    title: data?.title || request.id
  });
}

function isPlainPrimaryClick(event) {
  return event.button === 0
    && !event.defaultPrevented
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

function internalViewerUrl(anchor) {
  const href = anchor?.getAttribute('href') || '';
  if (!href.startsWith('?')) return null;

  const url = new URL(href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return null;
  return url;
}

export function createNavigationContext() {
  const source = readEntrySource() || consumePendingSource();
  return Object.freeze({ source });
}

/**
 * Keep normal document navigation and browser history intact. sessionStorage is
 * used only as a short-lived transport so the destination history entry can
 * record the source entity in history.state after loading.
 */
export function installNavigationCapture(context, root = document) {
  const onClick = event => {
    if (!isPlainPrimaryClick(event)) return;

    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

    const url = internalViewerUrl(anchor);
    if (!url) return;

    const source = currentSource(context);
    try {
      if (!source) {
        sessionStorage.removeItem(PENDING_NAVIGATION_KEY);
        return;
      }

      sessionStorage.setItem(PENDING_NAVIGATION_KEY, JSON.stringify({
        destination: currentEntryKey(url),
        source
      }));
    } catch {
      // The link still performs a normal document navigation.
    }
  };

  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
