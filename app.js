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
const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function refCard(ref) {
  const label = esc(ref.label || ref.id);
  const body = canOpen(ref) ? `<a href="${hrefFor(ref)}"><strong>${label}</strong></a>` : `<strong>${label}</strong>`;
  const role = ref.role ? `<span class="badge">${esc(ref.role)}</span>` : '';
  const priority = ref.priority ? `<span class="badge">${esc(ref.priority)}</span>` : '';
  return `<article class="card">${body}${role}${priority}</article>`;
}

function refInline(ref) {
  const label = esc(ref.label || ref.id);
  return canOpen(ref) ? `<a href="${hrefFor(ref)}">${label}</a>` : label;
}

function renderHome(manifest) {
  document.title = 'PersonalOS Leisure';
  breadcrumb.innerHTML = '';
  app.innerHTML = `
    <section class="hero">
      <div class="kicker">Public materialized view</div>
      <h1>PersonalOS Leisure</h1>
      <p class="summary">Plan / Route / Spot の公開用Viewer。機微情報はprivate側に残します。</p>
    </section>
    <section class="section">
      <h2>Views</h2>
      <div class="home-list">
        ${manifest.items.map(x => `<div class="home-item"><a href="${hrefFor(x)}"><strong>${esc(x.id)}</strong> ${esc(x.title)}</a> <span class="badge">${esc(x.type)}</span></div>`).join('')}
      </div>
    </section>`;
}

function renderPlan(data) {
  const p = data.plan || {};
  breadcrumb.innerHTML = `<a href="./">Home</a><span>›</span><span>${esc(data.id)}</span>`;
  app.innerHTML = `
    <section class="hero"><div class="kicker">Plan · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary)}</p></section>
    <section class="section"><h2>この旅の主役</h2><div class="cards">${(data.hero_refs||[]).map(refCard).join('')}</div></section>
    <section class="section"><h2>日別Plan</h2>${(p.days||[]).map(day => `<article class="card" style="margin-bottom:10px"><h3>Day ${esc(day.day)}</h3><p>${esc(day.purpose)}</p>${(day.route_refs||[]).map(x=>`<div>Route: ${refInline(x)}</div>`).join('')}${(day.fallback_refs||[]).map(x=>`<div>Fallback: ${refInline(x)}</div>`).join('')}</article>`).join('')}</section>
    ${(p.food||[]).length ? `<section class="section"><h2>食事</h2><div class="cards">${p.food.map(refCard).join('')}</div></section>` : ''}
    ${(p.onsen||[]).length ? `<section class="section"><h2>温泉</h2><div class="cards">${p.onsen.map(refCard).join('')}</div></section>` : ''}
    ${p.public_note ? `<p class="note">${esc(p.public_note)}</p>` : ''}`;
}

function renderRoute(data) {
  const r = data.route || {};
  const m = data.map || null;
  const hasActual = Boolean(m?.actual_geojson);
  const actualMinutes = m?.actual_time_s ? Math.round(Number(m.actual_time_s) / 60) : null;
  const actualKm = m?.actual_distance_m ? (Number(m.actual_distance_m) / 1000).toFixed(1) : null;
  breadcrumb.innerHTML = `<a href="./">Home</a><span>›</span>${(data.parent_refs||[]).map(x=>`${refInline(x)}<span>›</span>`).join('')}<span>${esc(data.id)}</span>`;
  app.innerHTML = `
    <section class="hero"><div class="kicker">Route · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary)}</p><p>${esc(r.purpose||'')}</p></section>
    ${m ? `<section class="section"><h2>Map</h2>
      ${hasActual ? `<div class="map-tabs"><button id="map-conceptual" class="map-tab active" type="button">計画</button><button id="map-actual" class="map-tab" type="button">実道路プレビュー</button></div>` : ''}
      <div class="map-wrap"><div id="map"></div><div id="map-message" class="map-message"></div></div>
      <p id="map-mode-note" class="note">${esc(m.note||'')}</p>
      ${hasActual ? `<p class="note">実道路プレビュー: Geoapify Routing / 未確定${actualKm ? ` / 約${actualKm} km` : ''}${actualMinutes ? ` / 走行計算 約${actualMinutes}分` : ''}</p>` : ''}
    </section>` : ''}
    <section class="section"><h2>Route sequence</h2><ol class="route-sequence">${(r.sequence||[]).map(x=>`<li><div>${refInline(x)} ${x.role?`<span class="badge">${esc(x.role)}</span>`:''}</div></li>`).join('')}</ol></section>
    ${(r.highlights||[]).length ? `<section class="section"><h2>魅力</h2><ul class="list">${r.highlights.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}
    <section class="section"><h2>所要・難易度</h2><p>${esc(r.duration||'')} ${r.difficulty?`<span class="badge">${esc(r.difficulty)}</span>`:''}</p></section>
    ${(r.constraints||[]).length ? `<section class="section"><h2>重要制約</h2><ul class="list">${r.constraints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>` : ''}`;
  if (m) initRouteMap(m, r.sequence || []);
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
  const labels = Object.fromEntries(sequence.map(x => [x.id, x.label || x.id]));
  const conceptual = document.querySelector('#map-conceptual');
  const actual = document.querySelector('#map-actual');
  const setMode = (mode) => {
    if (conceptual) conceptual.classList.toggle('active', mode === 'conceptual');
    if (actual) actual.classList.toggle('active', mode === 'actual');
    const path = mode === 'actual' ? mapSpec.actual_geojson : mapSpec.geojson;
    const note = document.querySelector('#map-mode-note');
    if (note) note.textContent = mode === 'actual'
      ? '道路ネットワークに沿った実道路プレビュー。Routing providerによる派生結果で、実施確定ルートではありません。'
      : (mapSpec.note || '計画上の地点配置・概念geometry。');
    loadGoogleMap(path, labels, mode);
  };
  conceptual?.addEventListener('click', () => setMode('conceptual'));
  actual?.addEventListener('click', () => setMode('actual'));
  setMode('conceptual');
}

async function loadGoogleMap(geojsonPath, labels = {}, mode = 'conceptual') {
  const key = window.PERSONALOS_CONFIG?.googleMapsApiKey || '';
  const message = document.querySelector('#map-message');
  const mapElement = document.querySelector('#map');
  if (!mapElement || !message) return;
  mapElement.style.display = '';
  mapElement.replaceChildren();
  if (!key) {
    mapElement.style.display = 'none';
    message.innerHTML = `Google Maps API key 未設定。GeoJSONは <a href="${geojsonPath}">こちら</a>。`;
    return;
  }
  try {
    await ensureGoogleMaps(key);
    const map = new google.maps.Map(mapElement, {mapTypeControl:true, streetViewControl:false});
    const info = new google.maps.InfoWindow();
    map.data.loadGeoJson(geojsonPath, null, (features) => {
      const bounds = new google.maps.LatLngBounds();
      features.forEach(f => f.getGeometry()?.forEachLatLng?.(p => bounds.extend(p)));
      if (!bounds.isEmpty()) map.fitBounds(bounds, 28);
    });
    map.data.setStyle((feature) => {
      const role = feature.getProperty('role');
      const featureType = feature.getProperty('feature_type');
      if (featureType === 'routed_path') return {strokeWeight: 5, strokeOpacity: .9};
      return {strokeWeight: 5, strokeOpacity: .8, icon: role === 'optional' ? {path: google.maps.SymbolPath.CIRCLE, scale: 7} : undefined};
    });
    map.data.addListener('click', (event) => {
      const spotId = event.feature.getProperty('spot_id') || '';
      const rawName = event.feature.getProperty('name') || spotId || (mode === 'actual' ? '実道路プレビュー' : 'Spot');
      const name = labels[spotId] || rawName;
      const role = event.feature.getProperty('role') || '';
      const featureType = event.feature.getProperty('feature_type') || '';
      const extra = featureType === 'routed_path' ? '<br>実道路プレビュー（未確定）' : (role ? `<br>${esc(role)}` : '');
      info.setContent(`<strong>${esc(name)}</strong>${extra}`);
      info.setPosition(event.latLng);
      info.open(map);
    });
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
