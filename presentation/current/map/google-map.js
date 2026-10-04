import { createGoogleMapPopup } from './google-map-popup.js';

let mapsPromise;

const SEGMENT_COLORS = Object.freeze([
  '#1565c0', '#d81b60', '#00897b', '#ef6c00', '#6a1b9a',
  '#2e7d32', '#c62828', '#00838f', '#5d4037', '#3949ab'
]);

const PERSONALOS_MAP_STYLES = Object.freeze([
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ lightness: 28 }, { saturation: -35 }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ lightness: 20 }, { saturation: -25 }] },
  { featureType: 'landscape', elementType: 'labels', stylers: [{ lightness: 24 }, { saturation: -30 }] }
]);

function loadGoogleMaps() {
  if (globalThis.google?.maps) return Promise.resolve(globalThis.google.maps);
  if (mapsPromise) return mapsPromise;

  const key = globalThis.PERSONALOS_CONFIG?.googleMapsApiKey;
  if (!key) return Promise.reject(new Error('Google Maps API key is not configured.'));

  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = '__personalosCurrentGoogleMapsReady';
    globalThis[callbackName] = () => {
      delete globalThis[callbackName];
      resolve(globalThis.google.maps);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      delete globalThis[callbackName];
      mapsPromise = undefined;
      reject(new Error('Google Maps JavaScript API could not be loaded.'));
    };
    document.head.append(script);
  });

  return mapsPromise;
}

function latLng(position) {
  return { lat: position.lat, lng: position.lon };
}

async function titleForPoint(point, resolver) {
  if (!point.entity_ref) return point.label || point.point_id;
  try {
    const described = await resolver.describe(point.entity_ref);
    return described.title;
  } catch {
    return `${point.entity_ref.entity_type}:${point.id}`;
  }
}

function googleMapsUrl(point) {
  const placeId = point.external_ref?.provider_code === 'google_places' ? point.external_ref.id : null;
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(placeId)}&query=${encodeURIComponent(`${point.position.lat},${point.position.lon}`)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point.position.lat},${point.position.lon}`)}`;
}

function popupData(point, title) {
  return {
    title: `${point.order ? `${point.order}. ` : ''}${title}`,
    actions: [{
      label: 'Google Mapsで開く',
      href: googleMapsUrl(point),
      external: true
    }]
  };
}

function markerIcon(maps, active = false) {
  return {
    path: maps.SymbolPath.CIRCLE,
    scale: active ? 12 : 9.5,
    fillColor: active ? '#0f5144' : '#d84a3d',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeOpacity: 1,
    strokeWeight: active ? 2.6 : 2.1
  };
}

function markerLabel(order) {
  return {
    text: String(order || ''),
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700'
  };
}

function segmentColor(segment, index) {
  const order = Number(segment.order);
  const paletteIndex = Number.isFinite(order) && order > 0 ? order - 1 : index;
  return SEGMENT_COLORS[paletteIndex % SEGMENT_COLORS.length];
}

function drawResolvedSegment(maps, map, segment, bounds, index) {
  const path = (segment.path || []).map(latLng);
  path.forEach(position => bounds.extend(position));
  const color = segmentColor(segment, index);
  const polyline = new maps.Polyline({
    map,
    path,
    geodesic: true,
    strokeColor: color,
    strokeOpacity: 0.9,
    strokeWeight: 6,
    zIndex: 2
  });
  return { segment, polyline, color, index };
}

function drawSemanticConnection(maps, map, connection, pointById, bounds) {
  if (connection.geometry_segment_id) return;
  const from = pointById.get(connection.from_point_id);
  const to = pointById.get(connection.to_point_id);
  if (!from || !to) return;

  const path = [latLng(from.position), latLng(to.position)];
  path.forEach(position => bounds.extend(position));
  new maps.Polyline({
    map,
    path,
    geodesic: true,
    strokeOpacity: 0,
    strokeWeight: 2,
    icons: [{
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.55, scale: 2 },
      offset: '0',
      repeat: '12px'
    }]
  });
}

function setSegmentFocus(segmentViews, active) {
  for (const item of segmentViews) {
    const selected = !active || item === active;
    item.polyline.setOptions({
      strokeOpacity: selected ? 0.98 : 0.18,
      strokeWeight: selected ? (active ? 8 : 6) : 4,
      zIndex: selected && active ? 20 : 2
    });
  }
}

function buildSegmentLegend(segmentViews, pointTitleById, pointOrderById) {
  if (segmentViews.length <= 1) return null;
  const legend = document.createElement('div');
  legend.className = 'map-segment-legend';
  legend.dataset.semantic = 'map-segment-legend';
  legend.setAttribute('aria-label', '移動経路');

  const selectedContext = document.createElement('div');
  selectedContext.className = 'map-segment-selected-context';
  selectedContext.textContent = '地図上の区間を選択できます';

  const details = document.createElement('details');
  details.className = 'map-segment-details';
  const summary = document.createElement('summary');
  summary.textContent = '区間一覧';
  const list = document.createElement('div');
  list.className = 'map-segment-list';
  details.append(summary, list);
  legend.append(selectedContext, details);

  const mobileQuery = globalThis.matchMedia?.('(max-width: 52rem)');
  const syncDetailsMode = () => {
    if (!mobileQuery) {
      details.open = true;
      return;
    }
    if (!mobileQuery.matches) details.open = true;
    else if (!details.dataset.userOpened) details.open = false;
  };
  details.addEventListener('toggle', () => {
    if (mobileQuery?.matches && details.open) details.dataset.userOpened = 'true';
  });
  mobileQuery?.addEventListener?.('change', () => {
    delete details.dataset.userOpened;
    syncDetailsMode();
  });
  syncDetailsMode();

  let pinned = null;

  segmentViews.forEach(item => {
    const segment = item.segment;
    const fromTitle = pointTitleById.get(segment.from_point_id) || segment.from_point_id;
    const toTitle = pointTitleById.get(segment.to_point_id) || segment.to_point_id;
    const fromOrder = pointOrderById.get(segment.from_point_id);
    const toOrder = pointOrderById.get(segment.to_point_id);
    const orderLabel = fromOrder && toOrder
      ? `${fromOrder} → ${toOrder}`
      : String(segment.order || item.index + 1);
    const contextLabel = `${orderLabel}  ${fromTitle} → ${toTitle}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-segment-legend-item';
    button.style.setProperty('--segment-color', item.color);
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `経路 ${contextLabel}`);

    const number = document.createElement('span');
    number.className = 'map-segment-number';
    number.textContent = orderLabel;
    const label = document.createElement('span');
    label.className = 'map-segment-label';
    label.textContent = `${fromTitle} → ${toTitle}`;
    button.append(number, label);

    const showContext = () => {
      selectedContext.textContent = contextLabel;
    };
    const preview = () => {
      setSegmentFocus(segmentViews, item);
      showContext();
    };
    const restore = () => {
      setSegmentFocus(segmentViews, pinned);
      if (!pinned) selectedContext.textContent = '地図上の区間を選択できます';
    };
    button.addEventListener('pointerenter', preview);
    button.addEventListener('pointerleave', restore);
    button.addEventListener('focus', preview);
    button.addEventListener('blur', restore);
    button.addEventListener('click', () => {
      pinned = pinned === item ? null : item;
      list.querySelectorAll('.map-segment-legend-item').forEach(control => {
        control.setAttribute('aria-pressed', control === button && pinned === item ? 'true' : 'false');
      });
      setSegmentFocus(segmentViews, pinned);
      selectedContext.textContent = pinned ? contextLabel : '地図上の区間を選択できます';
      if (mobileQuery?.matches) {
        details.open = false;
        delete details.dataset.userOpened;
      }
    });
    list.append(button);
  });

  return legend;
}

function bindRouteSequence(view, markerViews, map, maps, popup) {
  const page = view.closest('.route-page');
  if (!page) return;
  const sequenceItems = [...page.querySelectorAll('.route-sequence-item[data-order]')];
  if (!sequenceItems.length) return;

  const markerByOrder = new Map(markerViews.map(item => [String(item.point.order), item]));
  let pinnedOrder = null;

  const apply = order => {
    sequenceItems.forEach(item => {
      const active = String(item.dataset.order) === String(order);
      item.dataset.mapActive = active ? 'true' : 'false';
      item.dataset.mapSelected = active && pinnedOrder === String(order) ? 'true' : 'false';
    });
    markerViews.forEach(item => {
      const active = String(item.point.order) === String(order);
      item.marker.setOpacity(!order || active ? 1 : 0.5);
      item.marker.setIcon(markerIcon(maps, active));
      item.marker.setZIndex(active ? 100 : Number(item.point.order || 1));
    });
  };

  const select = (order, { openPopup = false, scrollSequence = false } = {}) => {
    pinnedOrder = order ? String(order) : null;
    apply(pinnedOrder);
    if (!pinnedOrder) {
      popup.close();
      return;
    }
    const markerView = markerByOrder.get(pinnedOrder);
    if (!markerView) return;
    map.panTo(markerView.marker.getPosition());
    if (openPopup) maps.event.trigger(markerView.marker, 'click');
    if (scrollSequence) {
      const target = sequenceItems.find(node => String(node.dataset.order) === pinnedOrder);
      target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  sequenceItems.forEach(item => {
    const order = String(item.dataset.order);
    const markerView = markerByOrder.get(order);
    if (!markerView) return;
    item.tabIndex = 0;
    item.addEventListener('pointerenter', () => apply(order));
    item.addEventListener('pointerleave', () => apply(pinnedOrder));
    item.addEventListener('focusin', () => apply(order));
    item.addEventListener('focusout', () => apply(pinnedOrder));
    item.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('a, button')) return;
      event.preventDefault();
      select(pinnedOrder === order ? null : order, { openPopup: true });
    });
    item.addEventListener('click', event => {
      if (event.target.closest('a, button')) return;
      select(pinnedOrder === order ? null : order, { openPopup: true });
    });
  });

  markerViews.forEach(item => {
    const order = String(item.point.order);
    item.marker.addListener('mouseover', () => apply(order));
    item.marker.addListener('mouseout', () => apply(pinnedOrder));
    item.marker.addListener('click', () => select(order, { scrollSequence: true }));
  });
}

function observeMapResize(canvas, map, maps, bounds, popup) {
  if (!globalThis.ResizeObserver || !canvas) return;
  let lastWidth = 0;
  let lastHeight = 0;
  const observer = new ResizeObserver(entries => {
    const entry = entries[0];
    const width = Math.round(entry?.contentRect?.width || canvas.clientWidth || 0);
    const height = Math.round(entry?.contentRect?.height || canvas.clientHeight || 0);
    if (!width || !height || (width === lastWidth && height === lastHeight)) return;
    lastWidth = width;
    lastHeight = height;
    requestAnimationFrame(() => {
      maps.event.trigger(map, 'resize');
      if (!bounds.isEmpty()) map.fitBounds(bounds, 36);
      popup?.draw?.();
    });
  });
  observer.observe(canvas);
}

async function hydrateMapView(view, { artifactLoader, resolver }) {
  if (view.dataset.mapState === 'ready' || view.dataset.mapState === 'loading') return;
  view.dataset.mapState = 'loading';
  const state = view.querySelector('.map-state');
  const canvas = view.querySelector('.map-canvas');

  try {
    const [artifact, maps] = await Promise.all([
      artifactLoader.load({ artifact_id: view.dataset.mapArtifactId }),
      loadGoogleMaps()
    ]);
    const points = artifact.points || [];
    if (!points.length) throw new Error('Map artifact has no points.');

    const map = new maps.Map(canvas, {
      center: latLng(points[0].position),
      zoom: 11,
      gestureHandling: 'cooperative',
      mapTypeControl: false,
      streetViewControl: false,
      styles: PERSONALOS_MAP_STYLES
    });
    const popup = createGoogleMapPopup({ maps, map });
    map.addListener('click', () => popup.close());

    const bounds = new maps.LatLngBounds();
    const pointById = new Map(points.map(point => [point.point_id, point]));
    const pointTitles = await Promise.all(points.map(point => titleForPoint(point, resolver)));
    const pointTitleById = new Map(points.map((point, index) => [point.point_id, pointTitles[index]]));
    const pointOrderById = new Map(points.map(point => [point.point_id, point.order]));

    const segmentViews = (artifact.segments || []).map((segment, index) =>
      drawResolvedSegment(maps, map, segment, bounds, index)
    );
    for (const connection of artifact.connections || []) {
      drawSemanticConnection(maps, map, connection, pointById, bounds);
    }

    const markerViews = [];
    points.forEach((point, index) => {
      const position = latLng(point.position);
      bounds.extend(position);
      const marker = new maps.Marker({
        map,
        position,
        title: pointTitles[index],
        label: markerLabel(point.order),
        icon: markerIcon(maps),
        zIndex: Number(point.order || index + 1),
        optimized: true
      });
      marker.addListener('click', () => {
        popup.open({
          position: marker.getPosition(),
          data: popupData(point, pointTitles[index])
        });
      });
      markerViews.push({ point, marker, title: pointTitles[index] });
    });

    view.querySelector('.map-segment-legend')?.remove();
    const legend = buildSegmentLegend(segmentViews, pointTitleById, pointOrderById);
    if (legend) canvas.insertAdjacentElement('afterend', legend);

    bindRouteSequence(view, markerViews, map, maps, popup);

    if (!bounds.isEmpty()) map.fitBounds(bounds, 36);
    observeMapResize(canvas, map, maps, bounds, popup);
    state?.remove();
    view.dataset.mapState = 'ready';
  } catch (error) {
    console.warn('[current-viewer] map unavailable', error);
    view.dataset.mapState = 'error';
    canvas?.replaceChildren();
    if (state) state.textContent = '地図を表示できませんでした。';
  }
}

function hydrateWhenUsable(view, context) {
  const disclosure = view.closest('details');
  const layoutSource = view.closest('[data-layout-source]');
  const isUsable = () => (!disclosure || disclosure.open) && (!layoutSource || !layoutSource.hidden);
  if (isUsable()) return hydrateMapView(view, context);

  const cleanup = () => {
    disclosure?.removeEventListener('toggle', tryHydrate);
    layoutSource?.removeEventListener('presentation:shown', tryHydrate);
  };
  const tryHydrate = () => {
    if (!isUsable()) return;
    cleanup();
    hydrateMapView(view, context);
  };
  disclosure?.addEventListener('toggle', tryHydrate);
  layoutSource?.addEventListener('presentation:shown', tryHydrate);
  return Promise.resolve();
}

export async function hydrateMapViews({ root, artifactLoader, resolver }) {
  const views = [...root.querySelectorAll('[data-map-artifact-id]')];
  await Promise.allSettled(views.map(view => hydrateWhenUsable(view, { artifactLoader, resolver })));
}
