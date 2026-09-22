const ROUTE_URL = '../../../legacy/maps/R011-google-preview.geojson';
const POINTS_URL = '../../../legacy/maps/R011-google-points.json';

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#9333ea',
  '#ea580c', '#0891b2', '#ca8a04', '#db2777', '#4f46e5'
];
const SINGLE_COLOR = '#2563eb';

const state = {
  map: null,
  mode: 'colored',
  segments: [],
  polylines: [],
  activeIndex: null
};

const normalizeId = (value = '') => {
  const m = String(value).match(/^([ST])(\d{1,4})$/i);
  return m ? `${m[1].toUpperCase()}${m[2].padStart(4, '0')}` : String(value);
};

const distanceSq = (coord, point) => {
  const lon = coord[0];
  const lat = coord[1];
  const cos = Math.cos(((lat + point.lat) / 2) * Math.PI / 180);
  const dx = (lon - point.lon) * cos;
  const dy = lat - point.lat;
  return dx * dx + dy * dy;
};

function nearestIndex(coords, point, startAt = 0) {
  let bestIndex = startAt;
  let bestDistance = Infinity;
  for (let i = startAt; i < coords.length; i += 1) {
    const d = distanceSq(coords[i], point);
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
    }
  }
  return bestIndex;
}

function buildSegments(route, pointsArtifact) {
  const routeFeature = (route.features || []).find(
    f => f?.properties?.feature_type === 'routed_path' && f?.geometry?.type === 'LineString'
  );
  if (!routeFeature) throw new Error('Legacy route geometry が見つかりません。');

  const coords = routeFeature.geometry.coordinates || [];
  if (coords.length < 2) throw new Error('Route geometry が空です。');

  const pointMap = new Map(
    (pointsArtifact.points || []).map(p => [normalizeId(p.entity_id), p])
  );
  const orderedIds = (route.ordered_spot_ids || []).map(normalizeId);
  const orderedPoints = orderedIds.map(id => pointMap.get(id)).filter(Boolean);
  if (orderedPoints.length < 2) throw new Error('区間分割に必要な waypoint が不足しています。');

  const matched = [];
  let cursor = 0;
  orderedPoints.forEach(point => {
    const index = nearestIndex(coords, point, cursor);
    matched.push({ point, index });
    cursor = Math.min(index + 1, coords.length - 1);
  });

  const segments = [];
  for (let i = 0; i < matched.length - 1; i += 1) {
    const from = matched[i];
    const to = matched[i + 1];
    const start = Math.min(from.index, to.index);
    const end = Math.max(from.index, to.index);
    if (end <= start) continue;
    segments.push({
      index: segments.length,
      from: from.point,
      to: to.point,
      coords: coords.slice(start, end + 1)
    });
  }

  return { segments, matched, coords, routeFeature };
}

function loadGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve();
  if (!key) return Promise.reject(new Error('Google Maps API key がありません。Pages deploy後のPoCで確認してください。'));
  return new Promise((resolve, reject) => {
    const callback = `__day3PocReady_${Date.now()}`;
    window[callback] = () => {
      delete window[callback];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callback}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps JavaScript API の読み込みに失敗しました。'));
    document.head.appendChild(script);
  });
}

function segmentColor(index) {
  return state.mode === 'single' ? SINGLE_COLOR : COLORS[index % COLORS.length];
}

function renderPolylines() {
  state.polylines.forEach(line => line.setMap(null));
  state.polylines = state.segments.map((segment, index) => {
    const active = state.activeIndex === null || state.activeIndex === index;
    return new google.maps.Polyline({
      map: state.map,
      path: segment.coords.map(([lon, lat]) => ({ lat, lng: lon })),
      strokeColor: segmentColor(index),
      strokeOpacity: active ? 0.92 : 0.16,
      strokeWeight: active && state.activeIndex === index ? 8 : 5,
      zIndex: active && state.activeIndex === index ? 10 : 2
    });
  });
}

function setActive(index) {
  state.activeIndex = index;
  document.querySelectorAll('.leg').forEach((el, i) => {
    el.classList.toggle('is-active', i === index);
  });
  renderPolylines();
}

function clearActive() {
  state.activeIndex = null;
  document.querySelectorAll('.leg').forEach(el => el.classList.remove('is-active'));
  renderPolylines();
}

function renderLegend() {
  const host = document.querySelector('#legend');
  host.replaceChildren();
  state.segments.forEach((segment, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'leg';
    button.innerHTML = `
      <span class="swatch" style="background:${segmentColor(index)}"></span>
      <span>
        <span class="leg-title">${index + 1}. ${escapeHtml(segment.from.name)} → ${escapeHtml(segment.to.name)}</span>
        <span class="leg-sub">${escapeHtml(segment.from.entity_id)} → ${escapeHtml(segment.to.entity_id)}</span>
      </span>`;
    button.addEventListener('mouseenter', () => setActive(index));
    button.addEventListener('mouseleave', clearActive);
    button.addEventListener('focus', () => setActive(index));
    button.addEventListener('blur', clearActive);
    host.appendChild(button);
  });
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderSummary(route) {
  const km = Number(route.distance || 0) / 1000;
  const minutes = Number(route.time || 0) / 60;
  document.querySelector('#summary').innerHTML = `
    <div class="metric"><small>Legacy距離</small><strong>${km ? `${km.toFixed(1)} km` : '—'}</strong></div>
    <div class="metric"><small>Legacy走行時間</small><strong>${minutes ? `${Math.round(minutes)} 分` : '—'}</strong></div>`;
}

function addMarkers(matched) {
  const info = new google.maps.InfoWindow();
  matched.forEach(({ point }, index) => {
    const marker = new google.maps.Marker({
      map: state.map,
      position: { lat: point.lat, lng: point.lon },
      label: { text: String(index + 1), color: '#ffffff', fontWeight: '700' },
      title: point.name,
      zIndex: 20
    });
    marker.addListener('click', () => {
      info.setContent(`<strong>${escapeHtml(point.name)}</strong><br>${escapeHtml(point.entity_id)}`);
      info.open({ map: state.map, anchor: marker });
    });
  });
}

function fitRoute(coords) {
  const bounds = new google.maps.LatLngBounds();
  coords.forEach(([lon, lat]) => bounds.extend({ lat, lng: lon }));
  state.map.fitBounds(bounds, 32);
}

function bindModeButtons() {
  const colored = document.querySelector('#mode-colored');
  const single = document.querySelector('#mode-single');
  const setMode = mode => {
    state.mode = mode;
    colored.classList.toggle('active', mode === 'colored');
    single.classList.toggle('active', mode === 'single');
    renderLegend();
    renderPolylines();
  };
  colored.addEventListener('click', () => setMode('colored'));
  single.addEventListener('click', () => setMode('single'));
}

async function main() {
  const message = document.querySelector('#message');
  try {
    const [routeResponse, pointsResponse] = await Promise.all([
      fetch(ROUTE_URL, { cache: 'no-store' }),
      fetch(POINTS_URL, { cache: 'no-store' })
    ]);
    if (!routeResponse.ok) throw new Error(`route artifact: HTTP ${routeResponse.status}`);
    if (!pointsResponse.ok) throw new Error(`points artifact: HTTP ${pointsResponse.status}`);

    const [route, points] = await Promise.all([routeResponse.json(), pointsResponse.json()]);
    const split = buildSegments(route, points);
    state.segments = split.segments;

    const key = window.PERSONALOS_CONFIG?.googleMapsApiKey || '';
    await loadGoogleMaps(key);

    state.map = new google.maps.Map(document.querySelector('#map'), {
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: 'greedy'
    });

    addMarkers(split.matched);
    fitRoute(split.coords);
    renderSummary(route);
    renderLegend();
    renderPolylines();
    bindModeButtons();
  } catch (error) {
    document.querySelector('#map').style.display = 'none';
    message.style.display = 'block';
    message.textContent = `PoCを表示できませんでした: ${error.message}`;
  }
}

main();
