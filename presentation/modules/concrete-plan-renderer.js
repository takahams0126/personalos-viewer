import { renderTablerIcon, resolveDestinationIcon, resolveTransferIcon } from './icon-registry.js';
import { buildPlanDayViewModel, overlayConcreteDay, renderDayOverview, escapeDayHtml } from './day-viewmodel.js';

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');
if (type === 'plan' && id) initConcretePlanRenderer();

async function initConcretePlanRenderer(){
  let concrete, planData;
  try {
    const [c,p]=await Promise.all([
      fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`,{cache:'no-store'}),
      fetch(`./data/plans/${encodeURIComponent(id)}.json`,{cache:'no-store'})
    ]);
    if(!c.ok||!p.ok)return;
    [concrete,planData]=await Promise.all([c.json(),p.json()]);
  } catch { return; }

  const planDaysByNumber=Object.fromEntries((planData.plan?.days||[]).map(d=>[Number(d.day),d]));
  const app=document.querySelector('#app');
  const attach=()=>{
    const hero=app?.querySelector('.hero');
    const planReady=app?.querySelector('.plan-day-overview') || app?.querySelector('.plan-demo-itinerary');
    if(!hero || !planReady || app.dataset.concreteRendererAttached) return false;

    app.dataset.concreteRendererAttached='1';
    const planPanel=document.createElement('div');
    planPanel.id='plan-mode-panel';
    planPanel.className='mode-panel active';
    [...app.children].filter(x=>x!==hero).forEach(x=>planPanel.appendChild(x));

    const executionPanel=document.createElement('div');
    executionPanel.id='execution-mode-panel';
    executionPanel.className='mode-panel';
    executionPanel.hidden=true;
    executionPanel.innerHTML=executionHtml(concrete,planDaysByNumber,concrete);

    const switcher=document.createElement('div');
    switcher.className='plan-mode-switch';
    switcher.innerHTML='<button class="plan-mode-btn active" data-mode="plan">計画</button><button class="plan-mode-btn" data-mode="execution">実施</button>';
    hero.after(switcher,planPanel,executionPanel);
    bindModeSwitcher(switcher,planPanel,executionPanel);
    bindExecutionDays(executionPanel,concrete);
    return true;
  };

  if(attach())return;
  const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});
  observer.observe(app,{childList:true,subtree:true});
}

const e=escapeDayHtml;
const labels={mode:{walk:'徒歩',train:'電車',air:'飛行機',rental_car:'レンタカー',bus:'バス',motorbike:'バイク'},feasibility:{viable:'実施可能',conditional:'条件付き',confirmed:'確認済み',unknown:'未確認'},condition:{opening_hours:'営業時間',operating_hours:'営業時間',last_order_at:'LO',reservation:'予約',parking:'駐車',fee:'料金',weather:'天候',road:'道路',trail:'登山道',bus_operation:'バス運行',turnaround_rule:'短縮条件',check_in:'チェックイン',supplies:'買い出し',bus_ticket:'バス券',portable_toilet:'携帯トイレ',milestones:'主要地点',target_return:'目標帰着',switch_rule:'振替条件',closed:'休業',amenities:'備品',refuel_reason:'給油理由',refuel_checks:'確認'}};
const l=(g,v)=>labels[g]?.[v]||String(v||'').replaceAll('_',' ');
const destinationIcon=ref=>renderTablerIcon(resolveDestinationIcon(ref.type==='travel_point'?{pointType:ref.point_type}:{category:ref.category,role:ref.role}),'exec-destination-svg');
const transferIcon=mode=>renderTablerIcon(resolveTransferIcon(mode),'exec-transfer-svg');

function bindModeSwitcher(s,p,x){
  s.addEventListener('click',ev=>{
    const b=ev.target.closest('.plan-mode-btn'); if(!b)return;
    const m=b.dataset.mode;
    s.querySelectorAll('.plan-mode-btn').forEach(q=>q.classList.toggle('active',q===b));
    p.hidden=m!=='plan'; x.hidden=m!=='execution';
    p.classList.toggle('active',m==='plan'); x.classList.toggle('active',m==='execution');
  });
}

function summaryHtml(s={}){
  const rows=[['合計時間',s.total_time],['移動距離',s.travel_distance],['移動時間',s.travel_time],['手続時間',s.procedure_time],['観光・食事',s.experience_time],['概算費用',s.estimated_cost]];
  return `<div class="exec-summary-grid">${rows.map(([k,v])=>`<div><span>${e(k)}</span><strong>${e(v||'—')}</strong></div>`).join('')}</div>`;
}
function dayChecksHtml(checks=[]){
  if(!checks.length)return'';
  return `<div class="exec-day-checks"><span class="exec-detail-label">当日確認</span><div>${checks.map(x=>`<span class="exec-check-chip is-${e(x.status||'unknown')}">${e(x.label||x.kind||'')}</span>`).join('')}</div></div>`;
}
function moneyHtml(cost){
  if(cost?.amount===null||cost?.amount===undefined)return'';
  return `<span class="exec-money">¥${Number(cost.amount).toLocaleString('ja-JP')}</span>`;
}
function conditionsHtml(c={}){
  const rows=Object.entries(c||{}).filter(([,v])=>v!==null&&v!==undefined&&v!=='');
  if(!rows.length)return'';
  return `<div class="exec-conditions">${rows.map(([k,v])=>`<span><small>${e(l('condition',k))}</small>${e(v)}</span>`).join('')}</div>`;
}
function scheduleHtml(i){
  const s=i.schedule||{};
  if(!s.depart_at&&!s.arrive_at&&!s.last_return_at)return'';
  const main=(s.depart_at||s.arrive_at)?`${e(s.depart_at||'—')} → ${e(s.arrive_at||'—')}`:'';
  return `<span class="exec-schedule-meta">${main}${s.last_return_at?` <em>最終 ${e(s.last_return_at)}</em>`:''}</span>`;
}
function serviceHtml(i){
  const s=i.service; if(!s)return'';
  return `<div class="exec-service"><strong>${e(s.service_name||s.operator||'交通サービス')}</strong>${s.service_number?`<span>${e(s.service_number)}</span>`:''}${s.reservation?`<small>${e(s.reservation)}</small>`:''}</div>`;
}
function activityHtml(a){return `<div class="exec-activity"><span>${e(a.label||'')}</span>${a.duration?`<strong>${e(a.duration)}</strong>`:''}${a.required?'<b class="exec-required-badge">必須</b>':''}</div>`;}
function destinationHtml(i){
  const r=i.ref||{},acts=(i.activities||[]).map(activityHtml).join(''),acc=(i.accessories||[]).map(a=>`<span class="exec-accessory">${e(a.label||'')}</span>`).join(''),stay=i.stay_duration?`<span class="exec-stay">滞在 ${e(i.stay_duration)}</span>`:'';
  return `<li class="exec-flow-item exec-destination"><div class="exec-flow-time">${e(i.time||'')}</div><div class="exec-destination-node">${destinationIcon(r)}</div><div class="exec-flow-main"><div class="exec-destination-title">${e(r.label||r.id||'')}${stay}${moneyHtml(i.cost)}</div>${acts?`<div class="exec-activities">${acts}</div>`:''}${acc?`<div class="exec-accessories">${acc}</div>`:''}${conditionsHtml(i.conditions)}</div></li>`;
}
function transferHtml(i){
  const distance=i.distance?`<span>${e(i.distance)}</span>`:'';
  const buffer=[i.buffer_before?`前 ${i.buffer_before}`:'',i.buffer_after?`後 ${i.buffer_after}`:''].filter(Boolean).join(' / ');
  return `<li class="exec-flow-item exec-transfer"><div class="exec-flow-time"></div><div class="exec-transfer-node">${transferIcon(i.mode)}</div><div class="exec-transfer-main"><div class="exec-transfer-line"><span>${e(l('mode',i.mode))}</span>${i.duration?`<strong>${e(i.duration)}</strong>`:''}${distance}${moneyHtml(i.cost)}${scheduleHtml(i)}</div>${serviceHtml(i)}${buffer?`<div class="exec-buffer">余裕 ${e(buffer)}</div>`:''}${conditionsHtml(i.conditions)}</div></li>`;
}
function routeHtml(i){return `<li class="exec-flow-item exec-route"><div class="exec-flow-time">${e(i.time||'')}</div><div class="exec-route-node">★</div><div class="exec-flow-main"><div class="exec-destination-title">${e(i.label||i.route_id||'Route')}${i.duration?`<span class="exec-stay">${e(i.duration)}</span>`:''}</div>${conditionsHtml(i.conditions)}</div></li>`;}
function freeTimeHtml(i){return `<li class="exec-flow-item exec-free-time-poc"><div class="exec-flow-time">${e(i.time||'')}</div><div class="exec-free-time-node">○</div><div class="exec-flow-main"><div class="exec-destination-title">${e(i.label||'自由時間')}</div>${i.note?`<div class="exec-free-time-note">${e(i.note)}</div>`:''}</div></li>`;}
function flowHtml(flow=[]){return `<ol class="exec-flow">${flow.map(i=>i.type==='transfer'?transferHtml(i):i.type==='route'?routeHtml(i):i.type==='free_time'?freeTimeHtml(i):destinationHtml(i)).join('')}</ol>`;}

function variantTabs(day){
  const vs=day.variants||[]; if(vs.length<=1)return'';
  return `<div class="exec-variant-tabs" role="tablist">${vs.map((v,n)=>`<button class="exec-variant-tab ${n===0?'active':''}" data-variant="${e(v.id)}">${e(v.label||v.id)}${v.route_id?` [${e(v.route_id)}]`:''}</button>`).join('')}</div>`;
}
function viewTabs(){return '<div class="exec-view-tabs" role="tablist"><button class="exec-view-tab active" data-view="flow">行動順</button><button class="exec-view-tab" data-view="map">マップ</button></div>';}
function mapLegendHtml(spec={}){const modes=[...new Set((spec.segments||[]).map(s=>s.mode).filter(Boolean))];if(!modes.length)return'';return `<div class="exec-map-legend">${modes.map(mode=>`<span><i class="mode-${e(mode)}"></i>${e(l('mode',mode))}</span>`).join('')}</div>`;}

function executionDay(day,planDay={}){
  const planVM=buildPlanDayViewModel(planDay);
  const vm=overlayConcreteDay(planVM,day);
  const active=vm.execution.activeVariant||{id:'standard',summary:{},flow:[]};
  const f=day.feasibility?`<span class="exec-status ${e(day.feasibility)}">${e(l('feasibility',day.feasibility))}</span>`:'';
  const date=day.date?`<span class="exec-day-date-inline">${e(day.date)}${day.weekday?`（${e(day.weekday)}）`:''}${day.wake_up_at?`・起床 ${e(day.wake_up_at)}`:''}</span>`:'';
  const title=day.purpose_override||vm.title||day.purpose||'';
  return `<article class="execution-day" data-day="${e(day.day)}" data-active-variant="${e(active.id||'standard')}"><header class="execution-day-header" role="button" tabindex="0" aria-expanded="false"><div class="execution-day-no">${e(day.day)}日目</div><div><h3>${e(title)}</h3>${date}</div>${f}<i class="exec-day-toggle-icon" aria-hidden="true"></i></header><div class="exec-day-body" hidden>${renderDayOverview(vm,'exec-day-overview')}<div class="exec-day-summary"><div class="exec-summary-metrics">${summaryHtml(active.summary||{})}</div>${dayChecksHtml(day.day_of_checks||[])}</div>${variantTabs(day)}${viewTabs()}<div class="exec-view-body" data-view-panel="flow">${flowHtml(active.flow||[])}</div><div class="exec-view-body" data-view-panel="map" hidden><div class="exec-map-legend-host">${mapLegendHtml(active.map)}</div><div class="map-wrap exec-day-map-wrap"><div class="exec-day-map" id="execution-map-day-${e(day.day)}"></div><div class="exec-map-message"></div></div><p class="note exec-map-note">${e(active.map?.note||'')}</p></div></div></article>`;
}

function executionHtml(data,planDays={},meta={}){
  const display=meta.display||{};
  const intro=renderExecutionIntro(meta,data);
  const daysHeading=e(display.days_heading||'日ごとの実施計画');
  const daysDescription=e(display.days_description||'');
  return `${intro}<section class="section execution-days"><div class="section-heading"><h2>${daysHeading}</h2>${daysDescription?`<p>${daysDescription}</p>`:''}</div>${(data.days||[]).map(d=>executionDay(d,planDays[Number(d.day)]||{})).join('')}</section>`;
}

function renderExecutionIntro(meta={},data={}){
  const display=meta.display||{};
  const period=formatPeriod(data.execution_window);
  const transports=derivePrimaryTransports(data);
  const bookings=(data.booking_connections||[]).map(x=>x.label).filter(Boolean);
  const verified=meta.last_verified_at?formatDateTime(meta.last_verified_at):'未確認';
  const badge=display.badge?`<span class="demo-chip warn">${e(display.badge)}</span>`:'';
  const facts=[
    ['実施期間',period||'未設定'],
    ['元Plan',meta.source_plan_id||data.source_plan_id||'—'],
    ['主な移動',transports.length?transports.join('＋'):'未設定'],
    ['主要予約',bookings.length?bookings.join('・'):'未接続'],
    ['状態',l('feasibility',meta.status||'unknown')],
    ['最終確認',verified]
  ];
  return `<section class="section execution-intro execution-intro-meta"><div class="execution-title-row"><div><div class="kicker">${e(display.kicker||'実施プラン')}${meta.id?`・${e(meta.id)}`:''}</div><h2>${e(display.heading||'実施日の行動計画')}</h2></div>${badge}</div><div class="exec-meta-title">${e(meta.title||data.title||'')}</div><p>${e(meta.summary||data.summary||'')}</p><div class="exec-meta-facts">${facts.map(([k,v])=>`<div><span>${e(k)}</span><strong>${e(v)}</strong></div>`).join('')}</div></section>`;
}
function derivePrimaryTransports(data={}){
  const found=[];const add=x=>{if(x&&!found.includes(x))found.push(x);};
  for(const day of data.days||[])for(const v of day.variants||[])for(const item of v.flow||[])if(item?.type==='transfer')add(item.mode);
  const priority=['air','rental_car','bus','train','motorbike','walk'];
  return priority.filter(x=>found.includes(x)&&x!=='walk').map(x=>l('mode',x));
}
function formatPeriod(w={}){if(!w.start_date&&!w.end_date)return'';return `${formatDate(w.start_date)} 〜 ${formatDate(w.end_date)}`;}
function formatDate(v){if(!v)return'—';const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[1]}/${m[2]}/${m[3]}`:String(v);}
function formatDateTime(v){try{return new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(v));}catch{return String(v);}}

function bindExecutionDays(panel,data){
  panel.querySelectorAll('.execution-day').forEach(card=>{
    const day=(data.days||[]).find(d=>Number(d.day)===Number(card.dataset.day)); if(!day)return;
    const header=card.querySelector('.execution-day-header'),body=card.querySelector('.exec-day-body');
    const toggle=()=>{const open=header.getAttribute('aria-expanded')==='true';header.setAttribute('aria-expanded',String(!open));body.hidden=open;card.classList.toggle('is-open',!open);};
    header?.addEventListener('click',toggle);
    header?.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggle();}});
    card.addEventListener('click',async ev=>{
      const vb=ev.target.closest('.exec-variant-tab');
      if(vb){card.querySelectorAll('.exec-variant-tab').forEach(b=>b.classList.toggle('active',b===vb));card.dataset.activeVariant=vb.dataset.variant;renderVariant(card,day,vb.dataset.variant);return;}
      const vw=ev.target.closest('.exec-view-tab');
      if(vw){card.querySelectorAll('.exec-view-tab').forEach(b=>b.classList.toggle('active',b===vw));card.querySelectorAll('.exec-view-body').forEach(p=>p.hidden=p.dataset.viewPanel!==vw.dataset.view);if(vw.dataset.view==='map')await renderDayMap(card,day);}
    });
  });
}
function activeVariant(day,card){return (day.variants||[]).find(v=>v.id===card.dataset.activeVariant)||(day.variants||[])[0];}
function renderVariant(card,day,id){const v=(day.variants||[]).find(x=>x.id===id);if(!v)return;const summaryHost=card.querySelector('.exec-summary-metrics');if(summaryHost)summaryHost.innerHTML=summaryHtml(v.summary);const fp=card.querySelector('[data-view-panel="flow"]');if(fp)fp.innerHTML=flowHtml(v.flow);const lh=card.querySelector('.exec-map-legend-host');if(lh)lh.innerHTML=mapLegendHtml(v.map);const n=card.querySelector('.exec-map-note');if(n)n.textContent=v.map?.note||'';const m=card.querySelector('.exec-day-map');if(m){m.innerHTML='';delete m.dataset.loadedVariant;}if(card.querySelector('.exec-view-tab.active')?.dataset.view==='map')renderDayMap(card,day);}
function personalOsEntityUrl(p){return p.entity_type==='spot'?`./?type=spot&id=${encodeURIComponent(p.id)}`:null;}
function mapPopupHtml(p){const personal=personalOsEntityUrl(p),gm=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lon}`)}`;return `<div class="exec-map-popup"><div class="exec-map-popup-title">${e(p.name)}</div><div class="exec-map-popup-links">${personal?`<a class="exec-map-popup-link" href="${personal}">PersonalOS</a>`:'<span class="exec-map-popup-link is-disabled" title="TravelPoint詳細ページは未実装">PersonalOS</span>'}<a class="exec-map-popup-link" href="${gm}" target="_blank" rel="noopener">Google Maps ↗</a></div></div>`;}
function showMapError(card,err){const m=card.querySelector('.exec-day-map'),x=card.querySelector('.exec-map-message');if(m)m.style.display='none';if(x)x.textContent=`地図の読み込みに失敗しました: ${err.message}`;}
async function ensureMaps(){if(window.google?.maps)return;const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'';if(!key)throw new Error('Google Maps API key 未設定');if(window.__concreteMapsPromise)return window.__concreteMapsPromise;window.__concreteMapsPromise=new Promise((resolve,reject)=>{window.__personalosConcreteMapsReady=resolve;const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosConcreteMapsReady&v=weekly`;s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps JavaScript API load error'));document.head.appendChild(s);});return window.__concreteMapsPromise;}
async function renderDayMap(card,day){const v=activeVariant(day,card),spec=v?.map;if(!spec)return;const el=card.querySelector('.exec-day-map');if(!el||el.dataset.loadedVariant===v.id)return;try{await ensureMaps();el.style.display='block';el.innerHTML='';const map=new google.maps.Map(el,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true});const bounds=new google.maps.LatLngBounds(),byId=Object.fromEntries((spec.points||[]).map(p=>[p.id,p])),info=new google.maps.InfoWindow();for(const p of spec.points||[]){const pos={lat:Number(p.lat),lng:Number(p.lon)};bounds.extend(pos);const marker=new google.maps.Marker({map,position:pos,label:{text:String(p.order||''),color:'#fff',fontWeight:'700'},title:p.name,zIndex:100+Number(p.order||0)});marker.addListener('click',()=>{info.setContent(mapPopupHtml(p));info.open({map,anchor:marker});});}const style={train:{strokeColor:'#7b61ff',strokeWeight:6},air:{strokeColor:'#34a853',strokeWeight:4,strokeOpacity:.75},rental_car:{strokeColor:'#1a73e8',strokeWeight:7},walk:{strokeColor:'#f9ab00',strokeWeight:5},motorbike:{strokeColor:'#8e5ac7',strokeWeight:6},bus:{strokeColor:'#5f6368',strokeWeight:6}};for(const s of spec.segments||[]){const a=byId[s.from],b=byId[s.to];if(!a||!b)continue;new google.maps.Polyline({map,path:[{lat:Number(a.lat),lng:Number(a.lon)},{lat:Number(b.lat),lng:Number(b.lon)}],strokeOpacity:.9,...(style[s.mode]||{})});}if(!bounds.isEmpty())map.fitBounds(bounds,34);const msg=card.querySelector('.exec-map-message');if(msg)msg.textContent='';el.dataset.loadedVariant=v.id;}catch(err){showMapError(card,err);}}
