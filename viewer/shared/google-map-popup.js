import { loadStyle } from './load-style.js';

const MOBILE_BREAKPOINT = 640;
const EDGE_GAP = 12;
const ANCHOR_GAP = 18;

function normalizePopupData(data = {}) {
  return {
    title: String(data.title || ''),
    summary: String(data.summary || ''),
    meta: (data.meta || [])
      .filter(item => item && item.label && item.value != null && item.value !== '')
      .map(item => ({ label: String(item.label), value: String(item.value) })),
    actions: (data.actions || [])
      .filter(action => action && action.label && action.href)
      .map(action => ({
        kind: action.kind === 'primary' ? 'primary' : 'secondary',
        label: String(action.label),
        href: String(action.href),
        external: Boolean(action.external)
      }))
  };
}

function makeLinkIcon() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('map-popup-link-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M14 5h5v5"/><path d="M10 14 19 5"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>';
  return svg;
}

function createPopupDom(onClose) {
  const root = document.createElement('section');
  root.className = 'map-popup';
  root.hidden = true;
  root.setAttribute('role', 'dialog');

  const header = document.createElement('header');
  header.className = 'map-popup-header';

  const title = document.createElement('strong');
  title.className = 'map-popup-title';
  header.appendChild(title);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'map-popup-close';
  close.setAttribute('aria-label', '閉じる');
  close.textContent = '×';
  close.addEventListener('click', onClose);
  header.appendChild(close);

  const body = document.createElement('div');
  body.className = 'map-popup-body';

  const summary = document.createElement('p');
  summary.className = 'map-popup-summary';
  body.appendChild(summary);

  const meta = document.createElement('dl');
  meta.className = 'map-popup-meta';
  body.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'map-popup-actions';

  root.append(header, body, actions);
  return { root, title, body, summary, meta, actions };
}

function renderPopupData(parts, rawData) {
  const data = normalizePopupData(rawData);
  parts.title.textContent = data.title;

  parts.summary.textContent = data.summary;
  parts.summary.hidden = !data.summary;

  parts.meta.replaceChildren();
  data.meta.forEach(item => {
    const row = document.createElement('div');
    row.className = 'map-popup-meta-row';

    const dt = document.createElement('dt');
    dt.textContent = item.label;
    const dd = document.createElement('dd');
    dd.textContent = item.value;

    row.append(dt, dd);
    parts.meta.appendChild(row);
  });
  parts.meta.hidden = data.meta.length === 0;
  parts.body.hidden = !data.summary && data.meta.length === 0;

  parts.actions.replaceChildren();
  data.actions.forEach(action => {
    const link = document.createElement('a');
    link.className = `map-popup-action is-${action.kind}`;
    link.href = action.href;
    if (action.external) {
      link.target = '_blank';
      link.rel = 'noopener';
    }

    const label = document.createElement('span');
    label.textContent = action.label;
    link.append(label, makeLinkIcon());
    parts.actions.appendChild(link);
  });
  parts.actions.hidden = data.actions.length === 0;
}

function clamp(value, min, max) {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

export function createGoogleMapPopup({ maps, map } = {}) {
  if (!maps?.OverlayView || !maps?.LatLng || !map) {
    throw new Error('Google Maps OverlayView and map are required.');
  }

  loadStyle(new URL('./google-map-popup.css', import.meta.url).href);

  class GoogleMapPopup extends maps.OverlayView {
    constructor() {
      super();
      this.position = null;
      this.parts = createPopupDom(() => this.close());
      this.setMap(map);
    }

    onAdd() {
      map.getDiv().appendChild(this.parts.root);
      maps.OverlayView.preventMapHitsAndGesturesFrom(this.parts.root);
    }

    draw() {
      if (!this.position || this.parts.root.hidden) return;

      const projection = this.getProjection();
      const pixel = projection?.fromLatLngToContainerPixel(this.position);
      if (!pixel) return;

      const mapDiv = map.getDiv();
      const mapWidth = mapDiv.clientWidth;
      const mapHeight = mapDiv.clientHeight;
      if (!mapWidth || !mapHeight) return;

      const root = this.parts.root;
      const isMobile = mapWidth <= MOBILE_BREAKPOINT || window.innerWidth <= MOBILE_BREAKPOINT;
      root.classList.toggle('is-mobile', isMobile);
      root.classList.remove('is-above', 'is-below');
      root.style.removeProperty('--map-popup-tail-x');

      if (isMobile) {
        const width = Math.max(0, mapWidth - EDGE_GAP * 2);
        root.style.width = `${width}px`;
        root.style.maxWidth = `${width}px`;
        root.style.maxHeight = `${Math.max(140, mapHeight - EDGE_GAP * 2)}px`;
        root.style.left = `${mapWidth / 2}px`;
        root.style.top = `${mapHeight - EDGE_GAP}px`;
        root.style.transform = 'translate(-50%, -100%)';
        return;
      }

      root.style.removeProperty('width');
      root.style.removeProperty('max-width');
      root.style.maxHeight = `${Math.max(140, mapHeight - EDGE_GAP * 2)}px`;
      root.style.transform = 'none';

      const naturalWidth = root.offsetWidth || 340;
      const x = clamp(
        pixel.x,
        EDGE_GAP + naturalWidth / 2,
        mapWidth - EDGE_GAP - naturalWidth / 2
      );
      const tailX = clamp(pixel.x - (x - naturalWidth / 2), 20, naturalWidth - 20);
      root.style.setProperty('--map-popup-tail-x', `${tailX}px`);

      const availableAbove = pixel.y - ANCHOR_GAP - EDGE_GAP;
      const availableBelow = mapHeight - pixel.y - ANCHOR_GAP - EDGE_GAP;
      const placeAbove = availableAbove >= availableBelow;
      const available = Math.max(120, placeAbove ? availableAbove : availableBelow);
      root.style.maxHeight = `${Math.min(mapHeight - EDGE_GAP * 2, available)}px`;
      root.style.left = `${x - naturalWidth / 2}px`;

      if (placeAbove) {
        root.classList.add('is-above');
        root.style.top = `${pixel.y - ANCHOR_GAP}px`;
        root.style.transform = 'translateY(-100%)';
      } else {
        root.classList.add('is-below');
        root.style.top = `${pixel.y + ANCHOR_GAP}px`;
      }
    }

    onRemove() {
      this.parts.root.remove();
    }

    open({ position, data } = {}) {
      if (!position) return;
      this.position = position instanceof maps.LatLng
        ? position
        : new maps.LatLng(position.lat, position.lng);
      renderPopupData(this.parts, data || {});
      this.parts.root.hidden = false;
      this.draw();
      requestAnimationFrame(() => this.draw());
    }

    close() {
      this.parts.root.hidden = true;
      this.position = null;
    }
  }

  return new GoogleMapPopup();
}
