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

function normalizeStateMap(value, normalizeValue) {
  if (!value || typeof value !== 'object') return Object.freeze({});
  const entries = Object.entries(value)
    .map(([key, item]) => [String(key), normalizeValue(item)])
    .filter(([, item]) => item != null);
  return Object.freeze(Object.fromEntries(entries));
}

function normalizePresentation(presentation) {
  if (!presentation || typeof presentation !== 'object') {
    return Object.freeze({ dayNavigations: Object.freeze({}), contentSwitchers: Object.freeze({}) });
  }

  const dayNavigations = normalizeStateMap(presentation.dayNavigations, value => {
    const day = String(value || '').trim();
    return day || null;
  });
  const contentSwitchers = normalizeStateMap(presentation.contentSwitchers, value => {
    const viewId = String(value?.viewId || '').trim();
    if (!viewId) return null;
    return Object.freeze({
      viewId,
      mode: String(value?.mode || '').trim()
    });
  });

  return Object.freeze({ dayNavigations, contentSwitchers });
}

function currentEntryKey(url = location) {
  return `${url.pathname}${url.search}`;
}

function readViewerState(state = history.state) {
  return state?.[HISTORY_STATE_KEY] || null;
}

function readEntrySource(state = history.state) {
  return normalizeSource(readViewerState(state)?.navigation?.source);
}

function readEntryPresentation(state = history.state) {
  return normalizePresentation(readViewerState(state)?.presentation);
}

function writeViewerState(patch) {
  const previous = history.state || {};
  const viewerState = previous[HISTORY_STATE_KEY] || {};
  history.replaceState({
    ...previous,
    [HISTORY_STATE_KEY]: {
      ...viewerState,
      ...patch
    }
  }, '', location.href);
}

function writeEntrySource(source) {
  const normalized = normalizeSource(source);
  if (!normalized) return;
  writeViewerState({ navigation: { source: normalized } });
}

function capturePresentation(root = document) {
  const dayNavigations = {};
  root.querySelectorAll('[data-day-navigation]').forEach(navigation => {
    const key = String(navigation.dataset.dayNavigation || '').trim();
    const activeDay = String(navigation.dataset.activeDay || '').trim();
    if (key && activeDay) dayNavigations[key] = activeDay;
  });

  const contentSwitchers = {};
  root.querySelectorAll('[data-content-switcher]').forEach(switcher => {
    const key = String(switcher.dataset.contentSwitcher || '').trim();
    const viewId = String(switcher.dataset.activeView || '').trim();
    if (!key || !viewId) return;
    contentSwitchers[key] = {
      viewId,
      mode: String(switcher.dataset.activeMode || '').trim()
    };
  });

  return normalizePresentation({ dayNavigations, contentSwitchers });
}

function writeEntryPresentation(root = document) {
  writeViewerState({ presentation: capturePresentation(root) });
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
  const presentation = readEntryPresentation();
  return Object.freeze({ source, presentation });
}

/**
 * Keep normal document navigation and browser history intact. sessionStorage is
 * used only as a short-lived transport so the destination history entry can
 * record the source entity in history.state after loading. The source entry's
 * local presentation context remains attached to that history entry, allowing
 * Browser Back to restore the selected Day / workspace / map view.
 */
export function installNavigationCapture(context, root = document) {
  const onClick = event => {
    if (!isPlainPrimaryClick(event)) return;

    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;

    const url = internalViewerUrl(anchor);
    if (!url) return;

    writeEntryPresentation(root);

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
