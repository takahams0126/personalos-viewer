const MOBILE_BREAKPOINT = 640;
const EDGE_GAP = 10;
const ANCHOR_GAP = 14;

function clamp(value, min, max) {
  if (max < min) return (min + max) / 2;
  return Math.min(Math.max(value, min), max);
}

function createPopupDom(onClose) {
  const root = document.createElement('section');
  root.className = 'map-popup-overlay';
  root.hidden = true;
  root.setAttribute('role', 'dialog');

  const header = document.createElement('header');
  header.className = 'map-popup-overlay-header';

  const title = document.createElement('strong');
  title.className = 'map-popup-overlay-title';
  header.append(title);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'map-popup-overlay-close';
  close.setAttribute('aria-label', '閉じる');
  close.textContent = '×';
  close.addEventListener('click', onClose);
  header.append(close);

  const actions = document.createElement('div');
  actions.className = 'map-popup-overlay-actions';

  root.append(header, actions);
  return { root, title, actions };
}

function renderPopup(parts, data = {}) {
  parts.title.textContent = String(data.title || '');
  parts.actions.replaceChildren();

  for (const action of data.actions || []) {
    if (!action?.label || !action?.href) continue;
    const link = document.createElement('a');
    link.className = 'map-popup-overlay-action';
    link.href = action.href;
    link.textContent = action.label;
    if (action.external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    parts.actions.append(link);
  }
  parts.actions.hidden = !parts.actions.children.length;
}

export function createGoogleMapPopup({ maps, map } = {}) {
  if (!maps?.OverlayView || !maps?.LatLng || !map) {
    throw new Error('Google Maps OverlayView and map are required.');
  }

  class CurrentGoogleMapPopup extends maps.OverlayView {
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
      const mobile = mapWidth <= MOBILE_BREAKPOINT || window.innerWidth <= MOBILE_BREAKPOINT;
      root.classList.toggle('is-mobile', mobile);
      root.classList.remove('is-above', 'is-below');
      root.style.removeProperty('--map-popup-tail-x');

      if (mobile) {
        const width = Math.max(0, mapWidth - EDGE_GAP * 2);
        root.style.width = `${width}px`;
        root.style.maxWidth = `${width}px`;
        root.style.left = `${mapWidth / 2}px`;
        root.style.top = `${mapHeight - EDGE_GAP}px`;
        root.style.transform = 'translate(-50%, -100%)';
        return;
      }

      root.style.removeProperty('width');
      root.style.removeProperty('max-width');
      root.style.transform = 'none';

      const naturalWidth = root.offsetWidth || 300;
      const x = clamp(pixel.x, EDGE_GAP + naturalWidth / 2, mapWidth - EDGE_GAP - naturalWidth / 2);
      const tailX = clamp(pixel.x - (x - naturalWidth / 2), 20, naturalWidth - 20);
      root.style.setProperty('--map-popup-tail-x', `${tailX}px`);

      const availableAbove = pixel.y - ANCHOR_GAP - EDGE_GAP;
      const availableBelow = mapHeight - pixel.y - ANCHOR_GAP - EDGE_GAP;
      const placeAbove = availableAbove >= availableBelow;
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
      renderPopup(this.parts, data);
      this.parts.root.hidden = false;
      this.draw();
      requestAnimationFrame(() => this.draw());
    }

    close() {
      this.parts.root.hidden = true;
      this.position = null;
    }
  }

  return new CurrentGoogleMapPopup();
}
