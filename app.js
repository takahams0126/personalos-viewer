const app = document.querySelector('#app');
const breadcrumb = document.querySelector('#breadcrumb');
const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');
let published = new Set();

const dirFor = (t) => t === 'plan' ? 'plans' : t === 'route' ? 'routes' : 'spots';
const pathFor = (t, i) => `./data/${dirFor(t)}/${i}.json`;
const hrefFor = (ref) => `./?type=${encodeURIComponent(ref.type)}&id=${encodeURIComponent(ref.id)}`;
const keyFor = (ref) => `${ref.type}:${ref.id}`;
const canOpen = (ref) => ref?.type && ref?.id && published.has(keyFor(ref));
const esc = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

const presentationLabels = {
  mode: {train:'電車',air:'飛行機',rental_car:'レンタカー',rental_car_and_mountain_access:'車＋登山アクセス',walk:'徒歩',bus:'バス',drive:'車'},
  activity: {rental_car_pickup:'レンタカー受取',rental_car_return:'レンタカー返却',shopping_and_hiking_preparation:'買い出し・登山準備',optional_local_time:'自由時間・予備枠'},
  direction: {canonical:'基本ルート',clockwise:'時計回り',counterclockwise:'反時計回り',outbound_return:'往復',other:'その他'},
  difficulty: {unknown:'未評価',easy:'やさしい',easy_to_medium:'やさしい〜中程度',medium:'中程度',medium_to_hard:'中程度〜難しい',hard:'難しい'},
  pointType: {home:'自宅',station:'駅',airport:'空港',bus_stop:'バス停',parking:'駐車場',trailhead:'登山口',ferry_terminal:'フェリー乗り場',rental_car_office:'レンタカー営業所',operational_point:'運用地点',other:'その他'},
  role: {main:'主役',core:'主役',support:'補助',optional:'任意',fallback:'代替',start:'開始',end:'終了',parking:'駐車',access:'アクセス',transfer:'乗換・移動'},
  priority: {primary:'優先',secondary:'次点',high:'高',medium:'中',low:'低'}
};
const humanize = (group, value='') => value ? (presentationLabels[group]?.[value] || String(value).replaceAll('_',' ')) : '';
const modeLabel = (v='') => humanize('mode', v);
const activityLabel = (v='') => humanize('activity', v);
const directionLabel = (v='') => humanize('direction', v);
const difficultyLabel = (v='') => humanize('difficulty', v);
const pointTypeLabel = (v='') => humanize('pointType', v);
const roleLabel = (v='') => humanize('role', v);
const priorityLabel = (v='') => humanize('priority', v);

function refInline(ref) {
  if (!ref) return '';
  const label = esc(ref.label || ref.id || '');
  return canOpen(ref) ? `<a href="${hrefFor(ref)}">${label}</a>` : label;
}

function refCard(ref) {
  const role = ref.role ? `<span class="badge">${esc(roleLabel(ref.role))}</span>` : '';
  const priority = ref.priority ? `<span class="badge">${esc(priorityLabel(ref.priority))}</span>` : '';
  return `<article class="card ref-card"><div>${refInline(ref)}</div><div>${role}${priority}</div></article>`;
}

function endpointInline(endpoint) {
  if (!endpoint) return '';
  if (endpoint.type === 'route_endpoint') {
    const route = refInline(endpoint.route_ref || {});
    const side = endpoint.endpoint === 'start' ? '開始地点' : endpoint.endpoint === 'end' ? '終了地点' : endpoint.endpoint || '';
    return `${route}${side ? ` <span class="muted">${esc(side)}</span>` : ''}`;
  }
  if (endpoint.type === 'travel_point') {
    const kind = endpoint.point_type ? `<span class="badge subtle">${esc(pointTypeLabel(endpoint.point_type))}</span>` : '';
    return `${esc(endpoint.label || endpoint.id || '')}${kind}`;
  }
  if (endpoint.type && endpoint.id) return refInline(endpoint);
  return esc(endpoint.label || endpoint.name || endpoint.id || '');
}

function routeStops(item) {
  const refs = item.ordered_spot_refs || [];
  if (!refs.length) return '';
  return `<div class="route-stops">${refs.map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span>${refInline(x)}${x.role?` <small>${esc(roleLabel(x.role))}</small>`:''}</span>`).join('<span class="route-arrow">→</span>')}</div>`;
}

function flowItemHtml(item) {
  if (!item) return '';
  if (item.type === 'transfer') {
    const from = endpointInline(item.from), to = endpointInline(item.to);
    return `<li class="flow-item transfer"><div class="flow-icon">↔</div><div><div class="flow-title">移動 <span class="badge">${esc(modeLabel(item.mode||''))}</span></div><div class="flow-detail">${from}${from&&to?' → ':''}${to}</div></div></li>`;
  }
  if (item.type === 'route') {
    const traversalValue = item.direction || item.traversal_id;
    const traversal = item.traversal_id && item.traversal_id !== 'canonical' ? `<span class="badge">${esc(directionLabel(traversalValue))}</span>` : '';
    const alt = (item.alternative_route_refs||[]).length ? `<div class="flow-note">代替: ${(item.alternative_route_refs||[]).map(refInline).join(' / ')}</div>` : '';
    const adjust = (item.adjustments||[]).length ? `<div class="flow-note">${item.adjustments.map(esc).join(' / ')}</div>` : '';
    return `<li class="flow-item route"><div class="flow-icon">★</div><div><div class="flow-title">${refInline(item.route_ref||{})} ${traversal}</div>${routeStops(item)}${alt}${adjust}</div></li>`;
  }
  if (item.type === 'spot') {
    const ref = item.spot_ref || {};
    const role = ref.role ? `<span class="badge">${esc(roleLabel(ref.role))}</span>` : '';
    const fallback = (item.fallback_spot_refs||[]).length ? `<div class="flow-note">代替: ${item.fallback_spot_refs.map(refInline).join(' / ')}</div>` : '';
    return `<li class="flow-item spot"><div class="flow-icon">●</div><div><div class="flow-title">${refInline(ref)} ${role}</div>${fallback}${(item.notes||[]).map(x=>`<div class="flow-note">${esc(x)}</div>`).join('')}</div></li>`;
  }
  if (item.type === 'activity') {
    const from = endpointInline(item.from), to = endpointInline(item.to);
    return `<li class="flow-item activity"><div class="flow-icon">✓</div><div><div class="flow-title">${esc(activityLabel(item.label || item.activity || 'Activity'))}</div>${from||to?`<div class="flow-detail">${from}${from&&to?' → ':''}${to}</div>`:''}${(item.notes||[]).map(x=>`<div class="flow-note">${esc(x)}</div>`).join('')}</div></li>`;
  }
  return `<li class="flow-item"><div class="flow-icon">•</div><div>${esc(item.label || item.type || '')}</div></li>`;
}

function timeBudgetHtml(tb) {
  if (!tb) return '';
  const tags = [tb.expected_total, tb.preferred_start].filter(Boolean).map(x=>`<span class="badge">${esc(x)}</span>`).join('');
  const constraints = (tb.constraints||[]).length ? `<div class="day-constraints">${tb.constraints.map(x=>`<span>${esc(x)}</span>`).join('')}</div>` : '';
  return `<div class="day-time">${tags}${constraints}</div>`;
}

function dayHtml(day) {
  const flow = day.flow || [];
  const endpoints = day.start || day.end ? `<div class="day-endpoints">${endpointInline(day.start)}<span>→</span>${endpointInline(day.end)}</div>` : '';
  return `<article class="day-card">
    <header class="day-head"><div class="day-number">${esc(day.day)}日目</div><div><h3>${esc(day.purpose||'')}</h3>${day.appeal?`<p>${esc(day.appeal)}</p>`:''}</div></header>
    ${timeBudgetHtml(day.time_budget)}${endpoints}
    ${flow.length?`<ol class="flow-list">${flow.map(flowItemHtml).join('')}</ol>`:''}
  </article>`;
}

function tripValueHtml(v={}) {
  const highlights = (v.highlights||[]).length ? `<div class="cards">${v.highlights.map(x=>`<article class="card value-card">${esc(x)}</article>`).join('')}</div>` : '';
  const rows = [['旅の流れ',v.flow],['体験の幅',v.diversity],['移動効率',v.travel_efficiency],['トレードオフ',v.tradeoffs]].filter(([,x])=>x);
  return `<section class="section value-section"><h2>この旅の価値</h2>${v.summary?`<p class="summary">${esc(v.summary)}</p>`:''}${highlights}${rows.length?`<dl class="fact-grid">${rows.map(([k,x])=>`<div><dt>${esc(k)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl>`:''}</section>`;
}

function imageCandidates(raw=[]) { return raw.map(x => typeof x === 'string' ? x : (x.url || x.source_url || x.image_url || x.href || '')).filter(Boolean); }
function imageGallery(raw=[]) {
  const urls=imageCandidates(raw); if(!urls.length) return '';
  return `<section class="section"><h2>写真</h2><div class="image-grid">${urls.map((u,i)=>`<figure class="image-card"><img src="${esc(u)}" loading="lazy" alt="写真 ${i+1}" onerror="this.closest('figure').remove()"></figure>`).join('')}</div></section>`;
}

function renderHome(manifest) {
  document.title='PersonalOS Leisure'; breadcrumb.innerHTML=''; const items=manifest.items||[];
  const section=(title,t)=>{const a=items.filter(x=>x.type===t);return a.length?`<section class="section"><h2>${esc(title)}</h2><div class="home-list">${a.map(x=>`<div class="home-item"><a href="${hrefFor(x)}"><strong>${esc(x.title||x.id)}</strong></a><span class="badge">${esc(x.id)}</span></div>`).join('')}</div></section>`:'';};
  app.innerHTML=`<section class="hero"><div class="kicker">PersonalOS Leisure</div><h1>レジャー</h1><p class="summary">旅の計画から、ルート、スポットへ掘り下げて見られます。</p></section>${section('旅のプラン','plan')}${section('ルート','route')}${section('スポット','spot')}`;
}

function renderPlan(data) {
  const p=data.plan||{},m=data.map||null; breadcrumb.innerHTML=`<a href="./">Home</a><span>›</span><span>${esc(data.id)}</span>`;
  app.innerHTML=`<section class="hero"><div class="kicker">旅のプラン · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary||'')}</p></section>
    ${tripValueHtml(p.trip_value||{})}
    ${(data.hero_refs||[]).length?`<section class="section"><h2>この旅の主役</h2><div class="cards">${data.hero_refs.map(refCard).join('')}</div></section>`:''}
    <section class="section itinerary"><div class="section-heading"><div><h2>日ごとの旅程</h2><p>その日の魅力と、旅を成立させる移動・宿泊・準備を順番に見られます。</p></div></div>${(p.days||[]).map(dayHtml).join('')}</section>
    ${m?`<section class="section"><h2>旅全体の地図</h2><div class="map-wrap"><div id="map"></div><div id="map-message" class="map-message"></div></div><p class="note">${esc(m.note||'旅程上の主要地点を表示します。')}</p></section>`:''}
    ${(p.strategies?.stay?.summary||p.strategies?.meal?.summary||p.strategies?.onsen?.summary)?`<section class="section"><h2>旅を成立させる設計</h2><div class="strategy-grid">${p.strategies?.stay?.summary?`<article class="card"><h3>宿泊</h3><p>${esc(p.strategies.stay.summary)}</p></article>`:''}${p.strategies?.meal?.summary?`<article class="card"><h3>食事</h3><p>${esc(p.strategies.meal.summary)}</p></article>`:''}${p.strategies?.onsen?.summary?`<article class="card"><h3>温泉</h3><p>${esc(p.strategies.onsen.summary)}</p></article>`:''}</div></section>`:''}
    ${(p.risks||[]).length?`<section class="section"><h2>変動要素・リスク</h2><ul class="list">${p.risks.map(x=>`<li><strong>${esc(x.risk||x)}</strong>${x.mitigation?` — ${esc(x.mitigation)}`:''}</li>`).join('')}</ul></section>`:''}`;
  if(m) loadGoogleMap(m,{},'conceptual');
}

function renderRoute(data) {
  const r=data.route||{},m=data.map||null,traversals=r.traversals||[]; breadcrumb.innerHTML=`<a href="./">Home</a><span>›</span>${(data.parent_refs||[]).map(x=>`${refInline(x)}<span>›</span>`).join('')}<span>${esc(data.id)}</span>`;
  const hasActual=Boolean(m?.route_json),actualMinutes=m?.actual_time_s?Math.round(Number(m.actual_time_s)/60):null,actualKm=m?.actual_distance_m?(Number(m.actual_distance_m)/1000).toFixed(1):null;
  app.innerHTML=`<section class="hero"><div class="kicker">ルート · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary||'')}</p><p>${esc(r.purpose||'')}</p></section>
    ${m?`<section class="section"><h2>ルートの地図</h2>${hasActual?`<div class="map-tabs"><button id="map-conceptual" class="map-tab active">計画</button><button id="map-actual" class="map-tab">実際の道路</button></div><div id="route-summary" class="route-summary" hidden><div><strong>${actualKm?`${actualKm} km`:''}</strong>${actualMinutes?`<span> 約${actualMinutes}分</span>`:''}</div></div>`:''}<div class="map-wrap"><div id="map"></div><div id="map-message" class="map-message"></div></div><p id="map-mode-note" class="note">${esc(m.note||'')}</p></section>`:''}
    ${(r.highlights||[]).length?`<section class="section"><h2>このルートの魅力</h2><div class="cards">${r.highlights.map(x=>`<article class="card">${esc(x)}</article>`).join('')}</div></section>`:''}
    ${traversals.length?`<section class="section"><h2>巡り方</h2>${traversals.map(t=>`<article class="card"><h3>${esc(directionLabel(t.direction||t.traversal_id))}</h3><div class="route-stops">${(t.ordered_spot_refs||[]).map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span>${refInline(x)}</span>`).join('<span class="route-arrow">→</span>')}</div></article>`).join('')}</section>`:''}
    <section class="section"><h2>立ち寄り順</h2><div class="route-stops vertical">${(r.sequence||r.sequence_refs||[]).map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span>${refInline(x)}${x.role?` <small>${esc(roleLabel(x.role))}</small>`:''}</span>`).join('')}</div></section>
    <section class="section"><h2>所要時間・難易度</h2><p>${esc(r.duration||'')} ${r.difficulty?`<span class="badge">${esc(difficultyLabel(r.difficulty))}</span>`:''}</p></section>
    ${(r.constraints||[]).length?`<section class="section"><h2>重要な条件</h2><ul class="list">${r.constraints.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}`;
  if(m) initRouteMap(m,r.sequence||r.sequence_refs||[]);
}

function renderSpot(data) {
  const s=data.spot||{}; breadcrumb.innerHTML=`<a href="./">Home</a><span>›</span><span>${esc(data.id)}</span>`;
  app.innerHTML=`<section class="hero"><div class="kicker">スポット · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary||'')}</p></section>
    ${imageGallery(s.image_refs||s.images||[])}
    ${(s.highlights||[]).length?`<section class="section"><h2>魅力</h2><div class="cards">${s.highlights.map(x=>`<article class="card">${esc(x)}</article>`).join('')}</div></section>`:''}
    ${(s.value_points||[]).length?`<section class="section"><h2>このスポットの価値</h2><ul class="list">${s.value_points.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
    ${(s.practicality||[]).length?`<section class="section"><h2>利用情報</h2><ul class="list">${s.practicality.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
    ${(s.related||[]).length?`<section class="section"><h2>関連スポット</h2><div class="cards">${s.related.map(refCard).join('')}</div></section>`:''}`;
}

function initRouteMap(mapSpec,sequence){const spots=Object.fromEntries(sequence.map((x,index)=>[x.id,{...x,sequenceOrder:index+1}]));const conceptual=document.querySelector('#map-conceptual'),actual=document.querySelector('#map-actual'),summary=document.querySelector('#route-summary');const setMode=(mode)=>{conceptual?.classList.toggle('active',mode==='conceptual');actual?.classList.toggle('active',mode==='actual');if(summary)summary.hidden=mode!=='actual';const note=document.querySelector('#map-mode-note');if(note)note.textContent=mode==='actual'?'事前計算した実際の道路ルートを表示しています。':(mapSpec.note||'計画上の地点配置。');loadGoogleMap(mapSpec,spots,mode);};conceptual?.addEventListener('click',()=>setMode('conceptual'));actual?.addEventListener('click',()=>setMode('actual'));setMode('conceptual');}
function googleMapsSearchUrl(name,placeId=''){const p=new URLSearchParams({api:'1',query:name});if(placeId)p.set('query_place_id',placeId);return `https://www.google.com/maps/search/?${p}`;}
function routeLetter(order){const n=Number(order||0);return n>0&&n<=26?String.fromCharCode(64+n):'';}
function normalizeEntityId(id=''){const m=String(id).match(/^([ST])(\d{1,4})$/);return m?`${m[1]}${m[2].padStart(4,'0')}`:String(id);}
function popupHtml({entityType='spot',entityId,name,role,order,googlePlaceId}){const ref={type:entityType,id:entityId};const pl=entityId&&canOpen(ref)?`<a href="${hrefFor(ref)}">PersonalOSで見る</a>`:'';const gl=`<a href="${esc(googleMapsSearchUrl(name,googlePlaceId))}" target="_blank" rel="noopener">Google Mapsで開く</a>`;return `<div class="pin-popup"><strong>${esc(name)}</strong>${role?`<div>${esc(roleLabel(role))}</div>`:''}${order?`<div>${esc(order)}番目</div>`:''}<div class="pin-links">${pl}${gl}</div></div>`;}
function decodePolyline(encoded){const path=[];let index=0,lat=0,lng=0;while(index<encoded.length){let result=0,shift=0,byte;do{byte=encoded.charCodeAt(index++)-63;result|=(byte&0x1f)<<shift;shift+=5;}while(byte>=0x20);lat+=(result&1)?~(result>>1):(result>>1);result=0;shift=0;do{byte=encoded.charCodeAt(index++)-63;result|=(byte&0x1f)<<shift;shift+=5;}while(byte>=0x20);lng+=(result&1)?~(result>>1):(result>>1);path.push({lat:lat/1e5,lng:lng/1e5});}return path;}
async function fetchJson(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json();}
function addPointMarker({map,info,point,spot,mode,bounds}){const position={lat:Number(point.lat),lng:Number(point.lon)};bounds.extend(position);const order=point.order||'',entityType=point.entity_type||'spot',entityId=normalizeEntityId(point.entity_id||point.spot_id),label=mode==='actual'?routeLetter(order):(order?String(order):'');const marker=new google.maps.Marker({map,position,label:label?{text:label,color:'#fff',fontWeight:'700'}:undefined,title:point.name||spot.label||entityId,zIndex:100+Number(order||0)});marker.addListener('click',()=>{const name=spot.label||point.name||entityId||'Point';info.setContent(popupHtml({entityType,entityId,name,role:point.role||spot.role||'',order,googlePlaceId:point.place_id||''}));info.open({map,anchor:marker});});}
async function loadGoogleMap(mapSpec,spots={},mode='conceptual'){const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'',message=document.querySelector('#map-message'),mapElement=document.querySelector('#map');if(!mapElement||!message)return;mapElement.style.display='';mapElement.replaceChildren();if(!key){mapElement.style.display='none';message.textContent='Google Maps API key 未設定。';return;}try{await ensureGoogleMaps(key);const [pointArtifact,routeArtifact]=await Promise.all([fetchJson(mapSpec.points_json),mode==='actual'&&mapSpec.route_json?fetchJson(mapSpec.route_json):Promise.resolve(null)]);const map=new google.maps.Map(mapElement,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true}),info=new google.maps.InfoWindow(),bounds=new google.maps.LatLngBounds(),points=pointArtifact.points||[];if(mode==='actual'){const encoded=(routeArtifact?.encoded_polyline_chunks||[]).join('');if(!encoded)throw new Error('ルート情報がありません');const path=decodePolyline(encoded);path.forEach(p=>bounds.extend(p));new google.maps.Polyline({map,path,strokeColor:'#1a73e8',strokeOpacity:.95,strokeWeight:7});points.filter(p=>p.order).forEach(point=>addPointMarker({map,info,point,spot:spots[normalizeEntityId(point.entity_id||point.spot_id)]||{},mode,bounds}));}else{points.forEach(point=>addPointMarker({map,info,point,spot:spots[normalizeEntityId(point.entity_id||point.spot_id)]||{},mode,bounds}));}if(!bounds.isEmpty())map.fitBounds(bounds,28);message.textContent='';}catch(e){mapElement.style.display='none';message.textContent=`地図の読み込みに失敗しました: ${e.message}`;}}
let googlePromise;function ensureGoogleMaps(key){if(window.google?.maps)return Promise.resolve();if(googlePromise)return googlePromise;googlePromise=new Promise((resolve,reject)=>{window.__personalosGoogleMapsReady=resolve;const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosGoogleMapsReady&v=weekly`;s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps JavaScript API load error'));document.head.appendChild(s);});return googlePromise;}

async function main(){try{const manifest=await fetch('./manifest.json',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error(`manifest ${r.status}`)));published=new Set((manifest.items||[]).map(keyFor));if(!type||!id){renderHome(manifest);return;}if(!['plan','route','spot'].includes(type))throw new Error(`unsupported type: ${type}`);if(!published.has(`${type}:${id}`))throw new Error(`not published: ${type}:${id}`);const data=await fetch(pathFor(type,id),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error(`${r.status} ${r.statusText}`)));document.title=`${data.title} · PersonalOS Leisure`;if(type==='plan')renderPlan(data);if(type==='route')renderRoute(data);if(type==='spot')renderSpot(data);}catch(e){app.innerHTML=`<section class="section"><h1>表示できませんでした</h1><p class="error">${esc(e.message)}</p><p><a href="./">Homeへ戻る</a></p></section>`;}}
main();