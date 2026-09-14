const app = document.querySelector('#app');
const breadcrumb = document.querySelector('#breadcrumb');

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');
let published = new Set();

const pathFor = (t, i) => `./data/${t === 'plan' ? 'plans' : t === 'route' ? 'routes' : 'spots'}/${i}.json`;
const hrefFor = (ref) => `./?type=${encodeURIComponent(ref.type)}&id=${encodeURIComponent(ref.id)}`;
const keyFor = (ref) => `${ref.type}:${ref.id}`;
const canOpen = (ref) => published.has(keyFor(ref));
const esc = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

function refCard(ref) {
  const label = esc(ref.label || ref.id);
  const body = canOpen(ref) ? `<a href="${hrefFor(ref)}"><strong>${label}</strong></a>` : `<strong>${label}</strong>`;
  const role = ref.role ? `<span class="badge">${esc(ref.role)}</span>` : '';
  const priority = ref.priority ? `<span class="badge">${esc(ref.priority)}</span>` : '';
  return `<article class="card">${body}${role}${priority}</article>`;
}

function refInline(ref) {
  if (!ref) return '';
  const label = esc(ref.label || ref.id || '');
  return canOpen(ref) ? `<a href="${hrefFor(ref)}">${label}</a>` : label;
}

function endpointInline(endpoint) {
  if (!endpoint) return '';
  if (endpoint.type === 'route_endpoint') {
    const route = refInline(endpoint.route_ref || {});
    return `${route}${endpoint.endpoint ? ` ${esc(endpoint.endpoint)}` : ''}`;
  }
  if (endpoint.type === 'travel_point') {
    const pointType = endpoint.point_type ? `<span class="badge">${esc(endpoint.point_type)}</span>` : '';
    return `${esc(endpoint.label || endpoint.id || '')}${pointType}`;
  }
  if (endpoint.type && endpoint.id) return refInline(endpoint);
  return esc(endpoint.label || endpoint.name || endpoint.id || '');
}

function flowItemHtml(item) {
  if (!item) return '';
  if (item.type === 'transfer') {
    const from = endpointInline(item.from);
    const to = endpointInline(item.to);
    const mode = item.mode ? `<span class="badge">${esc(item.mode)}</span>` : '';
    return `<li><div><strong>移動</strong> ${mode}</div><div>${from}${from && to ? ' → ' : ''}${to}</div></li>`;
  }
  if (item.type === 'route') {
    const traversal = item.traversal_id && item.traversal_id !== 'canonical'
      ? `<span class="badge">${esc(item.direction || item.traversal_id)}</span>` : '';
    const alternatives = (item.alternative_route_refs || []).length
      ? `<div class="note">代替: ${(item.alternative_route_refs || []).map(refInline).join(' / ')}</div>` : '';
    const sequence = (item.ordered_spot_refs || []).length
      ? `<ol class="route-sequence">${item.ordered_spot_refs.map(x => `<li>${refInline(x)}${x.role ? ` <span class="badge">${esc(x.role)}</span>` : ''}</li>`).join('')}</ol>` : '';
    return `<li><div><strong>Route</strong> ${refInline(item.route_ref || {})} ${traversal}</div>${sequence}${alternatives}</li>`;
  }
  if (item.type === 'spot') {
    const ref = item.spot_ref || {};
    const role = ref.role ? `<span class="badge">${esc(ref.role)}</span>` : '';
    const fallback = (item.fallback_spot_refs || []).length
      ? `<div class="note">Fallback: ${item.fallback_spot_refs.map(refInline).join(' / ')}</div>` : '';
    return `<li><div><strong>立寄り</strong> ${refInline(ref)} ${role}</div>${fallback}</li>`;
  }
  if (item.type === 'activity') {
    const from = endpointInline(item.from);
    const to = endpointInline(item.to);
    const location = from || to ? `<div>${from}${from && to ? ' → ' : ''}${to}</div>` : '';
    return `<li><div><strong>${esc(item.label || item.activity || 'Activity')}</strong></div>${location}</li>`;
  }
  return `<li>${esc(item.label || item.type || '')}</li>`;
}

function dayHtml(day) {
  const flow = day.flow || [];
  const oldRoutes = day.route_refs || [];
  const oldFallbacks = day.fallback_refs || [];
  const endpoint = (day.start || day.end)
    ? `<div class="note">${endpointInline(day.start)}${day.start && day.end ? ' → ' : ''}${endpointInline(day.end)}</div>` : '';
  return `<article class="card" style="margin-bottom:14px">
    <h3>Day ${esc(day.day)}</h3>
    ${day.appeal ? `<p class="summary">${esc(day.appeal)}</p>` : ''}
    <p>${esc(day.purpose || '')}</p>
    ${endpoint}
    ${flow.length ? `<ol class="route-sequence">${flow.map(flowItemHtml).join('')}</ol>` : ''}
    ${oldRoutes.map(x => `<div>Route: ${refInline(x)}</div>`).join('')}
    ${oldFallbacks.map(x => `<div>Fallback: ${refInline(x)}</div>`).join('')}
  </article>`;
}

function renderHome(manifest) {
  document.title = 'PersonalOS Leisure';
  breadcrumb.innerHTML = '';
  const plans = (manifest.items || []).filter(x => x.type === 'plan');
  const routes = (manifest.items || []).filter(x => x.type === 'route');
  const spots = (manifest.items || []).filter(x => x.type === 'spot');
  const section = (title, items) => items.length ? `<section class="section"><h2>${esc(title)}</h2><div class="home-list">${items.map(x => `<div class="home-item"><a href="${hrefFor(x)}"><strong>${esc(x.id)}</strong> ${esc(x.title)}</a> <span class="badge">${esc(x.type)}</span></div>`).join('')}</div></section>` : '';
  app.innerHTML = `
    <section class="hero">
      <div class="kicker">PersonalOS Leisure</div>
      <h1>レジャー</h1>
      <p class="summary">旅程Planを入口に、RouteとSpotへ掘り下げられます。</p>
    </section>
    ${section('Plans', plans)}
    ${section('Routes', routes)}
    ${section('Spots', spots)}`;
}

function renderPlan(data) {
  const p = data.plan || {};
  const m = data.map || null;
  breadcrumb.innerHTML = `<a href="./">Home</a><span>›</span><span>${esc(data.id)}</span>`;
  app.innerHTML = `
    <section class="hero"><div class="kicker">Plan · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary)}</p></section>
    ${(data.hero_refs||[]).length ? `<section class="section"><h2>この旅の主役</h2><div class="cards">${data.hero_refs.map(refCard).join('')}</div></section>` : ''}
    <section class="section"><h2>旅程</h2>${(p.days||[]).map(dayHtml).join('')}</section>
    ${m ? `<section class="section"><h2>旅のMap</h2><div class="map-wrap"><div id="map"></div><div id="map-message" class="map-message"></div></div><p class="note">${esc(m.note||'旅程上の主要地点を表示します。')}</p></section>` : ''}
    ${p.strategies?.stay?.summary ? `<section class="section"><h2>宿泊戦略</h2><p>${esc(p.strategies.stay.summary)}</p></section>` : ''}
    ${p.strategies?.meal?.summary ? `<section class="section"><h2>食事戦略</h2><p>${esc(p.strategies.meal.summary)}</p></section>` : ''}
    ${p.strategies?.onsen?.summary ? `<section class="section"><h2>温泉戦略</h2><p>${esc(p.strategies.onsen.summary)}</p></section>` : ''}
    ${(p.risks||p.risk_items||[]).length ? `<section class="section"><h2>変動要素・リスク</h2><ul class="list">${(p.risks||p.risk_items||[]).map(x=>`<li>${esc(x.risk || x)}</li>`).join('')}</ul></section>` : ''}
    ${p.public_note ? `<p class="note">${esc(p.public_note)}</p>` : ''}`;
  if (m) loadGoogleMap(m, {}, 'conceptual');
}

function renderRoute(data) {
  const r = data.route || {};
  const m = data.map || null;
  const hasActual = Boolean(m?.route_json);
  const actualMinutes = m?.actual_time_s ? Math.round(Number(m.actual_time_s) / 60) : null;
  const actualKm = m?.actual_distance_m ? (Number(m.actual_distance_m) / 1000).toFixed(1) : null;
  const routingLabel = m?.routing_provider === 'google_routes' ? 'Google Routes API' : (m?.routing_provider || 'Routing provider');
  breadcrumb.innerHTML = `<a href="./">Home</a><span>›</span>${(data.parent_refs||[]).map(x=>`${refInline(x)}<span>›</span>`).join('')}<span>${esc(data.id)}</span>`;
  const traversals = r.traversals || [];
  app.innerHTML = `
    <section class="hero"><div class="kicker">Route · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary)}</p><p>${esc(r.purpose||'')}</p></section>
    ${m ? `<section class="section"><h2>Map</h2>
      ${hasActual ? `<div class="map-tabs"><button id="map-conceptual" class="map-tab active" type="button">計画（Google）</button><button id="map-actual" class="map-tab" type="button">実道路（Google）</button></div>` : ''}
      ${hasActual ? `<div id="route-summary" class="route-summary" hidden><div><strong>${actualKm ? `${actualKm} km` : ''}</strong>${actualMinutes ? `<span>走行計算 約${actualMinutes}分</span>` : ''}</div><div class="route-summary-provider">${esc(routingLabel)} · 未確定</div></div>` : ''}
      <div class="map-wrap"><div id="map"></div><div id="map-message" class="map-message"></div></div>
      <p id="map-mode-note" class="note">${esc(m.note||'')}</p>
    </section>` : ''}
    ${traversals.length ? `<section class="section"><h2>周回方向</h2>${traversals.map(t => `<article class="card" style="margin-bottom:10px"><h3>${esc(t.direction || t.traversal_id)}</h3><ol class="route-sequence">${(t.ordered_spot_refs||[]).map(x=>`<li>${refInline(x)}</li>`).join('')}</ol></article>`).join('')}</section>` : ''}
    <section class="section"><h2>Route sequence</h2><ol class="route-sequence">${(r.sequence||r.sequence_refs||[]).map(x=>`<li><div>${refInline(x)} ${x.role?`<span class="badge">${esc(x.role)}</span>`:''}</div></li>`).join('')}</ol></section>
    ${(r.highlights||r.highlight_items||[]).length ? `<section class="section"><h2>魅力</h2><ul class="list">${(r.highlights||r.highlight_items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    <section class="section"><h2>所要・難易度</h2><p>${esc(r.duration||'')} ${r.difficulty?`<span class="badge">${esc(r.difficulty)}</span>`:''}</p></section>
    ${(r.constraints||r.constraint_items||[]).length ? `<section class="section"><h2>重要制約</h2><ul class="list">${(r.constraints||r.constraint_items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}`;
  if (m) initRouteMap(m, r.sequence || r.sequence_refs || []);
}

function renderSpot(data) {
  const s = data.spot || {};
  breadcrumb.innerHTML = `<a href="./">Home</a><span>›</span><span>${esc(data.id)}</span>`;
  app.innerHTML = `
    <section class="hero"><div class="kicker">Spot · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary)}</p></section>
    ${(s.highlights||[]).length ? `<section class="section"><h2>Highlights</h2><ul class="list">${s.highlights.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${(s.value_points||[]).length ? `<section class="section"><h2>Value</h2><ul class="list">${s.value_points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${(s.practicality||[]).length ? `<section class="section"><h2>Practicality</h2><ul class="list">${s.practicality.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    ${(s.related||[]).length ? `<section class="section"><h2>関連</h2><div class="cards">${s.related.map(refCard).join('')}</div></section>` : ''}`;
}

function initRouteMap(mapSpec, sequence) {
  const spots = Object.fromEntries(sequence.map((x, index) => [x.id, {...x, sequenceOrder: index + 1}]));
  const conceptual = document.querySelector('#map-conceptual');
  const actual = document.querySelector('#map-actual');
  const summary = document.querySelector('#route-summary');
  const setMode = (mode) => {
    conceptual?.classList.toggle('active', mode === 'conceptual');
    actual?.classList.toggle('active', mode === 'actual');
    if (summary) summary.hidden = mode !== 'actual';
    const note = document.querySelector('#map-mode-note');
    if (note) note.textContent = mode === 'actual'
      ? 'Google Routes APIで事前計算した短期route artifactを表示。A/B/C…は実道路計算に使った立寄り地点。ページ再表示ではRoutes APIを再計算しません。'
      : (mapSpec.note || 'Google Placesで解決した計画上の地点配置。');
    loadGoogleMap(mapSpec, spots, mode);
  };
  conceptual?.addEventListener('click', () => setMode('conceptual'));
  actual?.addEventListener('click', () => setMode('actual'));
  setMode('conceptual');
}

function googleMapsSearchUrl(name, placeId = '') {
  const params = new URLSearchParams({api: '1', query: name});
  if (placeId) params.set('query_place_id', placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function routeLetter(order) {
  const n = Number(order || 0);
  return n > 0 && n <= 26 ? String.fromCharCode(64 + n) : '';
}

function popupHtml({entityType='spot', entityId, name, role, order, googlePlaceId}) {
  const ref = {type: entityType, id: entityId};
  const personalosLink = entityId && canOpen(ref)
    ? `<a href="${hrefFor(ref)}" target="_blank" rel="noopener">PersonalOSで見る</a>`
    : '';
  const googleLink = `<a href="${esc(googleMapsSearchUrl(name, googlePlaceId))}" target="_blank" rel="noopener">Google Mapsで開く</a>`;
  const context = [order ? `#${esc(order)}` : '', role ? esc(role) : ''].filter(Boolean).join(' · ');
  const links = [personalosLink, googleLink].filter(Boolean).map(link => `<div>${link}</div>`).join('');
  const caption = entityType === 'travel_point' ? '旅程上の移動・アクセス地点' : '旅程上の立寄り地点';
  return `<div class="pin-popup"><strong>${esc(name)}</strong>${context ? `<div class="pin-context">${context}</div>` : ''}<div class="pin-caption">${caption}</div>${links ? `<div class="pin-links">${links}</div>` : ''}</div>`;
}

function decodePolyline(encoded) {
  const path = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    path.push({lat: lat / 1e5, lng: lng / 1e5});
  }
  return path;
}

async function fetchJson(path) {
  const response = await fetch(path, {cache: 'no-store'});
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function addPointMarker({map, info, point, spot, mode, bounds}) {
  const position = {lat: Number(point.lat), lng: Number(point.lon)};
  bounds.extend(position);
  const displayOrder = point.order || '';
  const entityType = point.entity_type || 'spot';
  const entityId = point.entity_id || point.spot_id;
  const labelText = mode === 'actual' ? routeLetter(displayOrder) : (displayOrder ? String(displayOrder) : '');
  const marker = new google.maps.Marker({
    map,
    position,
    label: labelText ? {text: labelText, color: '#fff', fontWeight: '700'} : undefined,
    title: point.name || spot.label || entityId,
    zIndex: 100 + Number(displayOrder || 0),
  });
  marker.addListener('click', () => {
    const name = spot.label || point.name || entityId || 'Point';
    info.setContent(popupHtml({
      entityType,
      entityId,
      name,
      role: point.role || spot.role || '',
      order: displayOrder,
      googlePlaceId: point.place_id || '',
    }));
    info.open({map, anchor: marker});
  });
  return marker;
}

async function loadGoogleMap(mapSpec, spots = {}, mode = 'conceptual') {
  const key = window.PERSONALOS_CONFIG?.googleMapsApiKey || '';
  const message = document.querySelector('#map-message');
  const mapElement = document.querySelector('#map');
  if (!mapElement || !message) return;
  mapElement.style.display = '';
  mapElement.replaceChildren();
  if (!key) {
    mapElement.style.display = 'none';
    message.textContent = 'Google Maps API key 未設定。';
    return;
  }

  try {
    await ensureGoogleMaps(key);
    const [pointArtifact, routeArtifact] = await Promise.all([
      fetchJson(mapSpec.points_json),
      mode === 'actual' && mapSpec.route_json ? fetchJson(mapSpec.route_json) : Promise.resolve(null),
    ]);

    const map = new google.maps.Map(mapElement, {mapTypeControl:true, streetViewControl:false, fullscreenControl:true});
    const info = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    const points = pointArtifact.points || [];

    if (mode === 'actual') {
      const encoded = (routeArtifact?.encoded_polyline_chunks || []).join('');
      if (!encoded) throw new Error('route artifactにencoded polylineがありません');
      const path = decodePolyline(encoded);
      path.forEach(p => bounds.extend(p));
      const routeLine = new google.maps.Polyline({
        map,
        path,
        geodesic: false,
        strokeColor: '#1a73e8',
        strokeOpacity: 0.95,
        strokeWeight: 7,
        clickable: true,
      });
      routeLine.addListener('click', (event) => {
        info.setContent('<div class="pin-popup"><strong>実道路プレビュー</strong><div class="pin-caption">Google Routes APIで事前計算した短期派生結果（未確定）</div></div>');
        info.setPosition(event.latLng);
        info.open(map);
      });
      points.filter(p => p.order).forEach(point => {
        const entityId = point.entity_id || point.spot_id;
        addPointMarker({map, info, point, spot: spots[entityId] || {}, mode, bounds});
      });
    } else {
      points.forEach(point => {
        const entityId = point.entity_id || point.spot_id;
        addPointMarker({map, info, point, spot: spots[entityId] || {}, mode, bounds});
      });
    }

    if (!bounds.isEmpty()) map.fitBounds(bounds, 28);
    message.textContent = '';
  } catch (e) {
    mapElement.style.display = 'none';
    message.textContent = `地図の読み込みに失敗しました: ${e.message}`;
  }
}

let googlePromise;
function ensureGoogleMaps(key) {
  if (window.google?.maps) return Promise.resolve();
  if (googlePromise) return googlePromise;
  googlePromise = new Promise((resolve, reject) => {
    window.__personalosGoogleMapsReady = resolve;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosGoogleMapsReady&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps JavaScript API load error'));
    document.head.appendChild(script);
  });
  return googlePromise;
}

async function main() {
  try {
    const manifest = await fetch('./manifest.json', {cache:'no-store'}).then(r => r.ok ? r.json() : Promise.reject(new Error(`manifest ${r.status}`)));
    published = new Set((manifest.items || []).map(keyFor));
    if (!type || !id) {
      renderHome(manifest);
      return;
    }
    if (!['plan','route','spot'].includes(type)) throw new Error(`unsupported type: ${type}`);
    if (!published.has(`${type}:${id}`)) throw new Error(`not published: ${type}:${id}`);
    const data = await fetch(pathFor(type,id), {cache:'no-store'}).then(r => r.ok ? r.json() : Promise.reject(new Error(`${r.status} ${r.statusText}`)));
    document.title = `${data.title} · PersonalOS Leisure`;
    if (type === 'plan') renderPlan(data);
    if (type === 'route') renderRoute(data);
    if (type === 'spot') renderSpot(data);
  } catch (e) {
    app.innerHTML = `<section class="section"><h1>表示できませんでした</h1><p class="error">${esc(e.message)}</p><p><a href="./">Homeへ戻る</a></p></section>`;
  }
}

main();