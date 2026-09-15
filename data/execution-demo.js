import {
  renderTablerIcon,
  resolveDestinationIcon,
  resolveTransferIcon
} from './icon-registry.js?v=20260915-16';

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');

if (type === 'plan' && id) initConcreteDemo();

async function initConcreteDemo() {
  let concrete;
  try {
    const r = await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`, {cache:'no-store'});
    if (!r.ok) return;
    concrete = await r.json();
  } catch { return; }

  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    if (!hero || app.dataset.concreteDemoAttached) return false;
    app.dataset.concreteDemoAttached = '1';

    const planPanel = document.createElement('div');
    planPanel.id = 'plan-mode-panel';
    planPanel.className = 'mode-panel active';
    const current = [...app.children].filter(x => x !== hero);
    current.forEach(x => planPanel.appendChild(x));

    const executionPanel = document.createElement('div');
    executionPanel.id = 'execution-mode-panel';
    executionPanel.className = 'mode-panel';
    executionPanel.hidden = true;
    executionPanel.innerHTML = executionHtml(concrete);

    const switcher = document.createElement('div');
    switcher.className = 'plan-mode-switch';
    switcher.innerHTML = `
      <button class="plan-mode-btn active" data-mode="plan"><span>◯</span> 計画</button>
      <button class="plan-mode-btn" data-mode="execution"><span>✓</span> 実施</button>
      <span class="demo-chip">表示仕様デモ</span>`;

    hero.after(switcher, planPanel, executionPanel);
    bindModeSwitcher(switcher, planPanel, executionPanel);
    bindExecutionDays(executionPanel, concrete);
    return true;
  };

  if (attach()) return;
  const observer = new MutationObserver(() => { if (attach()) observer.disconnect(); });
  observer.observe(app, {childList:true, subtree:true});
}

function e(v='') { return String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }
const labels = {
  mode:{walk:'徒歩',train:'電車',air:'飛行機',rental_car:'レンタカー',bus:'バス',motorbike:'バイク'},
  feasibility:{viable:'実施可能',conditional:'条件付き',confirmed:'確認済み',unknown:'未確認'}
};
const l=(g,v)=>labels[g]?.[v]||String(v||'').replaceAll('_',' ');

function destinationSemantics(ref={}) {
  if (ref.type === 'travel_point') return {pointType:ref.point_type};
  if (ref.type === 'spot') return {category:ref.category, role:ref.role};
  return {};
}
function destinationIcon(ref={}) {
  return renderTablerIcon(resolveDestinationIcon(destinationSemantics(ref)), 'exec-destination-svg');
}
function transferIcon(mode) {
  return renderTablerIcon(resolveTransferIcon(mode), 'exec-transfer-svg');
}

function bindModeSwitcher(switcher, planPanel, executionPanel) {
  switcher.addEventListener('click', e => {
    const btn = e.target.closest('.plan-mode-btn');
    if (!btn) return;
    const mode = btn.dataset.mode;
    switcher.querySelectorAll('.plan-mode-btn').forEach(x => x.classList.toggle('active', x === btn));
    planPanel.hidden = mode !== 'plan';
    executionPanel.hidden = mode !== 'execution';
    planPanel.classList.toggle('active', mode === 'plan');
    executionPanel.classList.toggle('active', mode === 'execution');
  });
}

function summaryHtml(summary={}) {
  const rows = [
    ['移動距離', summary.travel_distance],
    ['移動時間', summary.travel_time],
    ['手続時間', summary.procedure_time],
    ['観光・食事', summary.experience_time]
  ];
  return `<div class="exec-summary-grid">${rows.map(([k,v])=>`<div><span>${e(k)}</span><strong>${e(v||'—')}</strong></div>`).join('')}</div>`;
}

function activityHtml(a) {
  return `<div class="exec-activity"><span>${e(a.label||'')}</span>${a.duration?`<strong>${e(a.duration)}</strong>`:''}</div>`;
}
function destinationHtml(item) {
  const ref = item.ref || {};
  const activities = (item.activities||[]).map(activityHtml).join('');
  const accessories = (item.accessories||[]).map(a=>`<span class="exec-accessory">${e(a.label||'')}</span>`).join('');
  const stay = item.stay_duration ? `<span class="exec-stay">滞在 ${e(item.stay_duration)}</span>` : '';
  return `<li class="exec-flow-item exec-destination">
    <div class="exec-flow-time">${e(item.time||'')}</div>
    <div class="exec-destination-node">${destinationIcon(ref)}</div>
    <div class="exec-flow-main">
      <div class="exec-destination-title">${e(ref.label||ref.id||'')}${stay}</div>
      ${activities?`<div class="exec-activities">${activities}</div>`:''}
      ${accessories?`<div class="exec-accessories">${accessories}</div>`:''}
    </div>
  </li>`;
}
function transferHtml(item) {
  return `<li class="exec-flow-item exec-transfer">
    <div class="exec-flow-time"></div>
    <div class="exec-transfer-node">${transferIcon(item.mode)}</div>
    <div class="exec-transfer-main"><span>${e(l('mode',item.mode))}</span>${item.duration?`<strong>${e(item.duration)}</strong>`:''}</div>
  </li>`;
}
function routeHtml(item) {
  return `<li class="exec-flow-item exec-route"><div class="exec-flow-time">${e(item.time||'')}</div><div class="exec-route-node">★</div><div class="exec-flow-main"><div class="exec-destination-title">${e(item.label||item.route_id||'Route')}</div></div></li>`;
}
function flowHtml(flow=[]) {
  return `<ol class="exec-flow">${flow.map(item => item.type==='transfer' ? transferHtml(item) : item.type==='route' ? routeHtml(item) : destinationHtml(item)).join('')}</ol>`;
}

function variantTabs(day) {
  const variants = day.variants || [];
  if (variants.length <= 1) return '';
  return `<div class="exec-variant-tabs" role="tablist">${variants.map((v,i)=>`<button class="exec-variant-tab ${i===0?'active':''}" data-variant="${e(v.id)}">${e(v.label||v.id)}</button>`).join('')}</div>`;
}
function viewTabs(day) {
  return `<div class="exec-view-tabs" role="tablist"><button class="exec-view-tab active" data-view="flow">行動順</button><button class="exec-view-tab" data-view="map">マップ</button></div>`;
}
function executionDay(day) {
  const variants = day.variants || [];
  const first = variants[0] || {summary:{},flow:[]};
  const f = day.feasibility ? `<span class="exec-status ${e(day.feasibility)}">${e(l('feasibility',day.feasibility))}</span>` : '';
  return `<article class="execution-day" data-day="${e(day.day)}" data-active-variant="${e(first.id||'standard')}">
    <header class="execution-day-header">
      <div><div class="execution-day-no">${e(day.day)}日目</div><h3>${e(day.purpose||'')}</h3><p>${e(day.date_label||'')}</p></div>${f}
    </header>
    <div class="exec-day-summary">${summaryHtml(first.summary)}</div>
    <button class="exec-schedule-toggle" type="button" aria-expanded="false"><span>タイムスケジュール</span><i></i></button>
    <div class="exec-schedule-body" hidden>
      ${variantTabs(day)}
      ${viewTabs(day)}
      <div class="exec-view-body" data-view-panel="flow">${flowHtml(first.flow)}</div>
      <div class="exec-view-body" data-view-panel="map" hidden><div class="map-wrap exec-day-map-wrap"><div class="exec-day-map" id="execution-map-day-${e(day.day)}"></div><div class="exec-map-message"></div></div><p class="note exec-map-note">${e(first.map?.note||'')}</p></div>
    </div>
  </article>`;
}
function executionHtml(data) {
  return `
    <section class="section execution-intro">
      <div class="execution-title-row"><div><div class="kicker">実施プラン</div><h2>実施日の行動計画</h2></div><span class="demo-chip warn">仮想データ</span></div>
      <p>${e(data.notice||'')}</p>
      <div class="execution-principle"><strong>地点を主役に、移動と手続を実行レベルまで具体化</strong><span>Spot / TravelPointを縦軸の主ノードとし、移動は接続、手続は地点内activityとして表示します。</span></div>
    </section>
    <section class="section execution-days"><div class="section-heading"><h2>日ごとの実施計画</h2><p>日別Summaryを確認し、必要な日だけタイムスケジュールやMapを開けます。</p></div>${(data.days||[]).map(executionDay).join('')}</section>`;
}

function bindExecutionDays(panel, data) {
  panel.querySelectorAll('.execution-day').forEach(card => {
    const dayNo = Number(card.dataset.day);
    const day = (data.days||[]).find(d => Number(d.day) === dayNo);
    if (!day) return;
    const body = card.querySelector('.exec-schedule-body');
    const toggle = card.querySelector('.exec-schedule-toggle');
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
      card.classList.toggle('is-open', !open);
    });

    card.addEventListener('click', async ev => {
      const variantBtn = ev.target.closest('.exec-variant-tab');
      if (variantBtn) {
        card.querySelectorAll('.exec-variant-tab').forEach(b=>b.classList.toggle('active', b===variantBtn));
        card.dataset.activeVariant = variantBtn.dataset.variant;
        renderVariant(card, day, variantBtn.dataset.variant);
        return;
      }
      const viewBtn = ev.target.closest('.exec-view-tab');
      if (viewBtn) {
        card.querySelectorAll('.exec-view-tab').forEach(b=>b.classList.toggle('active', b===viewBtn));
        card.querySelectorAll('.exec-view-body').forEach(p=>p.hidden = p.dataset.viewPanel !== viewBtn.dataset.view);
        if (viewBtn.dataset.view === 'map') await renderDayMap(card, day);
      }
    });
  });
}

function activeVariant(day, card) {
  return (day.variants||[]).find(v=>v.id===card.dataset.activeVariant) || (day.variants||[])[0];
}
function renderVariant(card, day, variantId) {
  const variant = (day.variants||[]).find(v=>v.id===variantId);
  if (!variant) return;
  card.querySelector('.exec-day-summary').innerHTML = summaryHtml(variant.summary);
  const flowPanel = card.querySelector('[data-view-panel="flow"]');
  if (flowPanel) flowPanel.innerHTML = flowHtml(variant.flow);
  const note = card.querySelector('.exec-map-note');
  if (note) note.textContent = variant.map?.note || '';
  const mapEl = card.querySelector('.exec-day-map');
  if (mapEl) { mapEl.innerHTML=''; delete mapEl.dataset.loadedVariant; }
  const activeView = card.querySelector('.exec-view-tab.active')?.dataset.view;
  if (activeView === 'map') renderDayMap(card, day);
}

function showMapError(card, err){const msg=card.querySelector('.exec-map-message');const map=card.querySelector('.exec-day-map');if(map)map.style.display='none';if(msg)msg.textContent=`地図の読み込みに失敗しました: ${err.message}`;}
async function ensureMaps(){if(window.google?.maps)return;const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'';if(!key)throw new Error('Google Maps API key 未設定');if(window.__concreteMapsPromise)return window.__concreteMapsPromise;window.__concreteMapsPromise=new Promise((resolve,reject)=>{window.__personalosConcreteMapsReady=resolve;const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosConcreteMapsReady&v=weekly`;s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps JavaScript API load error'));document.head.appendChild(s);});return window.__concreteMapsPromise;}
async function renderDayMap(card, day){
  const variant = activeVariant(day, card); const spec = variant?.map; if(!spec)return;
  const el=card.querySelector('.exec-day-map'); if(!el)return;
  if(el.dataset.loadedVariant===variant.id)return;
  try{await ensureMaps(); el.style.display='block'; el.innerHTML=''; const map=new google.maps.Map(el,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true}); const bounds=new google.maps.LatLngBounds(); const byId=Object.fromEntries((spec.points||[]).map(p=>[p.id,p])); const info=new google.maps.InfoWindow();
    for(const p of spec.points||[]){const pos={lat:Number(p.lat),lng:Number(p.lon)};bounds.extend(pos);const marker=new google.maps.Marker({map,position:pos,label:{text:String(p.order||''),color:'#fff',fontWeight:'700'},title:p.name,zIndex:100+Number(p.order||0)});marker.addListener('click',()=>{info.setContent(`<div class="pin-popup"><strong>${e(p.name)}</strong></div>`);info.open({map,anchor:marker});});}
    const segmentStyle={train:{strokeColor:'#7b61ff',strokeWeight:6},air:{strokeColor:'#34a853',strokeWeight:4,strokeOpacity:.75},rental_car:{strokeColor:'#1a73e8',strokeWeight:7},walk:{strokeColor:'#f9ab00',strokeWeight:5},motorbike:{strokeColor:'#8e5ac7',strokeWeight:6}};
    for(const s of spec.segments||[]){const a=byId[s.from],b=byId[s.to];if(!a||!b)continue;new google.maps.Polyline({map,path:[{lat:Number(a.lat),lng:Number(a.lon)},{lat:Number(b.lat),lng:Number(b.lon)}],strokeOpacity:.9,...(segmentStyle[s.mode]||{})});}
    if(!bounds.isEmpty())map.fitBounds(bounds,34); const msg=card.querySelector('.exec-map-message'); if(msg)msg.textContent=''; el.dataset.loadedVariant=variant.id;
  }catch(err){showMapError(card,err);}
}
