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

    const planDayTitles = collectPlanDayTitles(planPanel);
    const executionPanel = document.createElement('div');
    executionPanel.id = 'execution-mode-panel';
    executionPanel.className = 'mode-panel';
    executionPanel.hidden = true;
    executionPanel.innerHTML = executionHtml(concrete, planDayTitles);

    const switcher = document.createElement('div');
    switcher.className = 'plan-mode-switch';
    switcher.innerHTML = `
      <button class="plan-mode-btn active" data-mode="plan">計画</button>
      <button class="plan-mode-btn" data-mode="execution">実施</button>`;

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

function collectPlanDayTitles(planPanel) {
  const titles = {};
  planPanel.querySelectorAll('.day-card').forEach(card => {
    const dayText = card.querySelector('.day-number')?.textContent || '';
    const m = dayText.match(/(\d+)/);
    const title = card.querySelector('.day-head h3')?.textContent?.trim();
    if (m && title) titles[Number(m[1])] = title;
  });
  return titles;
}

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
    ['合計時間', summary.total_time],
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
function viewTabs() {
  return `<div class="exec-view-tabs" role="tablist"><button class="exec-view-tab active" data-view="flow">行動順</button><button class="exec-view-tab" data-view="map">マップ</button></div>`;
}
function mapLegendHtml(spec={}) {
  const modes = [...new Set((spec.segments||[]).map(s=>s.mode).filter(Boolean))];
  if (!modes.length) return '';
  return `<div class="exec-map-legend">${modes.map(mode=>`<span><i class="mode-${e(mode)}"></i>${e(l('mode',mode))}</span>`).join('')}</div>`;
}
function executionDay(day, title) {
  const variants = day.variants || [];
  const first = variants[0] || {summary:{},flow:[]};
  const f = day.feasibility ? `<span class="exec-status ${e(day.feasibility)}">${e(l('feasibility',day.feasibility))}</span>` : '';
  return `<article class="execution-day" data-day="${e(day.day)}" data-active-variant="${e(first.id||'standard')}">
    <header class="execution-day-header" role="button" tabindex="0" aria-expanded="false">
      <div class="execution-day-no">${e(day.day)}日目</div>
      <h3>${e(title||day.purpose||'')}</h3>
      ${f}
      <i class="exec-day-toggle-icon" aria-hidden="true"></i>
    </header>
    <div class="exec-day-body" hidden>
      <p class="exec-day-date">${e(day.date_label||'')}</p>
      <div class="exec-day-summary">${summaryHtml(first.summary)}</div>
      <button class="exec-schedule-toggle" type="button" aria-expanded="false"><span>タイムスケジュール</span><i></i></button>
      <div class="exec-schedule-body" hidden>
        ${variantTabs(day)}
        ${viewTabs()}
        <div class="exec-view-body" data-view-panel="flow">${flowHtml(first.flow)}</div>
        <div class="exec-view-body" data-view-panel="map" hidden>
          <div class="exec-map-legend-host">${mapLegendHtml(first.map)}</div>
          <div class="map-wrap exec-day-map-wrap"><div class="exec-day-map" id="execution-map-day-${e(day.day)}"></div><div class="exec-map-message"></div></div>
          <p class="note exec-map-note">${e(first.map?.note||'')}</p>
        </div>
      </div>
    </div>
  </article>`;
}
function executionHtml(data, planDayTitles={}) {
  return `
    <section class="section execution-intro">
      <div class="execution-title-row"><div><div class="kicker">実施プラン</div><h2>実施日の行動計画</h2></div><span class="demo-chip warn">仮想データ</span></div>
      <p>${e(data.notice||'')}</p>
      <div class="execution-principle"><strong>計画のDay骨格を保ち、実行情報だけを重ねる</strong><span>Dayの目的・順序はPlanと共通。ConcreteではSpot / TravelPoint、移動、手続、実時間、Mapを詳細化します。</span></div>
    </section>
    <section class="section execution-days"><div class="section-heading"><h2>日ごとの実施計画</h2><p>計画と同じDayを展開し、Summaryと必要なタイムスケジュール・Mapを確認します。</p></div>${(data.days||[]).map(day=>executionDay(day, planDayTitles[Number(day.day)])).join('')}</section>`;
}

function bindExecutionDays(panel, data) {
  panel.querySelectorAll('.execution-day').forEach(card => {
    const dayNo = Number(card.dataset.day);
    const day = (data.days||[]).find(d => Number(d.day) === dayNo);
    if (!day) return;
    const dayHeader = card.querySelector('.execution-day-header');
    const dayBody = card.querySelector('.exec-day-body');
    const toggleDay = () => {
      const open = dayHeader.getAttribute('aria-expanded') === 'true';
      dayHeader.setAttribute('aria-expanded', String(!open));
      dayBody.hidden = open;
      card.classList.toggle('is-open', !open);
    };
    dayHeader?.addEventListener('click', toggleDay);
    dayHeader?.addEventListener('keydown', ev => { if (ev.key==='Enter' || ev.key===' ') { ev.preventDefault(); toggleDay(); } });

    const scheduleBody = card.querySelector('.exec-schedule-body');
    const scheduleToggle = card.querySelector('.exec-schedule-toggle');
    scheduleToggle?.addEventListener('click', () => {
      const open = scheduleToggle.getAttribute('aria-expanded') === 'true';
      scheduleToggle.setAttribute('aria-expanded', String(!open));
      scheduleBody.hidden = open;
      card.classList.toggle('schedule-open', !open);
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
  const legendHost = card.querySelector('.exec-map-legend-host');
  if (legendHost) legendHost.innerHTML = mapLegendHtml(variant.map);
  const note = card.querySelector('.exec-map-note');
  if (note) note.textContent = variant.map?.note || '';
  const mapEl = card.querySelector('.exec-day-map');
  if (mapEl) { mapEl.innerHTML=''; delete mapEl.dataset.loadedVariant; }
  const activeView = card.querySelector('.exec-view-tab.active')?.dataset.view;
  if (activeView === 'map') renderDayMap(card, day);
}

function personalOsEntityUrl(p) {
  if (p.entity_type === 'spot') return `./?type=spot&id=${encodeURIComponent(p.id)}`;
  return null;
}
function mapPopupHtml(p) {
  const personal = personalOsEntityUrl(p);
  const googleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lon}`)}`;
  return `<div class="exec-map-popup">
    <div class="exec-map-popup-title">${e(p.name)}</div>
    <div class="exec-map-popup-links">
      ${personal?`<a class="exec-map-popup-link" href="${personal}">PersonalOS</a>`:`<span class="exec-map-popup-link is-disabled" title="TravelPoint詳細ページは未実装">PersonalOS</span>`}
      <a class="exec-map-popup-link" href="${googleMaps}" target="_blank" rel="noopener">Google Maps ↗</a>
    </div>
  </div>`;
}
function showMapError(card, err){const msg=card.querySelector('.exec-map-message');const map=card.querySelector('.exec-day-map');if(map)map.style.display='none';if(msg)msg.textContent=`地図の読み込みに失敗しました: ${err.message}`;}
async function ensureMaps(){if(window.google?.maps)return;const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'';if(!key)throw new Error('Google Maps API key 未設定');if(window.__concreteMapsPromise)return window.__concreteMapsPromise;window.__concreteMapsPromise=new Promise((resolve,reject)=>{window.__personalosConcreteMapsReady=resolve;const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosConcreteMapsReady&v=weekly`;s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps JavaScript API load error'));document.head.appendChild(s);});return window.__concreteMapsPromise;}
async function renderDayMap(card, day){
  const variant = activeVariant(day, card); const spec = variant?.map; if(!spec)return;
  const el=card.querySelector('.exec-day-map'); if(!el)return;
  if(el.dataset.loadedVariant===variant.id)return;
  try{await ensureMaps(); el.style.display='block'; el.innerHTML=''; const map=new google.maps.Map(el,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true}); const bounds=new google.maps.LatLngBounds(); const byId=Object.fromEntries((spec.points||[]).map(p=>[p.id,p])); const info=new google.maps.InfoWindow();
    for(const p of spec.points||[]){const pos={lat:Number(p.lat),lng:Number(p.lon)};bounds.extend(pos);const marker=new google.maps.Marker({map,position:pos,label:{text:String(p.order||''),color:'#fff',fontWeight:'700'},title:p.name,zIndex:100+Number(p.order||0)});marker.addListener('click',()=>{info.setContent(mapPopupHtml(p));info.open({map,anchor:marker});});}
    const segmentStyle={train:{strokeColor:'#7b61ff',strokeWeight:6},air:{strokeColor:'#34a853',strokeWeight:4,strokeOpacity:.75},rental_car:{strokeColor:'#1a73e8',strokeWeight:7},walk:{strokeColor:'#f9ab00',strokeWeight:5},motorbike:{strokeColor:'#8e5ac7',strokeWeight:6}};
    for(const s of spec.segments||[]){const a=byId[s.from],b=byId[s.to];if(!a||!b)continue;new google.maps.Polyline({map,path:[{lat:Number(a.lat),lng:Number(a.lon)},{lat:Number(b.lat),lng:Number(b.lon)}],strokeOpacity:.9,...(segmentStyle[s.mode]||{})});}
    if(!bounds.isEmpty())map.fitBounds(bounds,34); const msg=card.querySelector('.exec-map-message'); if(msg)msg.textContent=''; el.dataset.loadedVariant=variant.id;
  }catch(err){showMapError(card,err);}
}
