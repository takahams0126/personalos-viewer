import { renderTablerIcon, resolveDestinationIcon, resolveTransferIcon } from './icon-registry.js?v=20260915-16';
import { buildPlanDayViewModel, overlayConcreteDay, renderDayOverview, escapeDayHtml } from './day-viewmodel.js?v=20260915-29';

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');
if (type === 'plan' && id) initConcreteDemo();

async function initConcreteDemo(){
  let concrete, planData, detailPoc={};
  try {
    const [c,p,d]=await Promise.all([
      fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`,{cache:'no-store'}),
      fetch(`./data/plans/${encodeURIComponent(id)}.json`,{cache:'no-store'}),
      fetch(`./data/concrete-plans/${encodeURIComponent(id)}-detail-poc.json`,{cache:'no-store'})
    ]);
    if(!c.ok||!p.ok)return;
    [concrete,planData]=await Promise.all([c.json(),p.json()]);
    if(d.ok) detailPoc=await d.json();
  } catch { return; }

  concrete=mergeDetailPoc(concrete,detailPoc);
  const planDaysByNumber=Object.fromEntries((planData.plan?.days||[]).map(d=>[Number(d.day),d]));
  const app=document.querySelector('#app');
  const attach=()=>{
    const hero=app?.querySelector('.hero');
    const planReady=app?.querySelector('.plan-day-overview') || app?.querySelector('.plan-demo-itinerary');
    if(!hero || !planReady || app.dataset.concreteDemoAttached) return false;

    app.dataset.concreteDemoAttached='1';
    const planPanel=document.createElement('div');
    planPanel.id='plan-mode-panel';
    planPanel.className='mode-panel active';
    [...app.children].filter(x=>x!==hero).forEach(x=>planPanel.appendChild(x));

    const executionPanel=document.createElement('div');
    executionPanel.id='execution-mode-panel';
    executionPanel.className='mode-panel';
    executionPanel.hidden=true;
    executionPanel.innerHTML=executionHtml(concrete,planDaysByNumber,detailPoc);

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

function mergeDetailPoc(base,poc){
  const out=JSON.parse(JSON.stringify(base||{}));
  const byDay=new Map((out.days||[]).map(d=>[Number(d.day),d]));
  for(const [dayKey,extra] of Object.entries(poc.days||{})){
    const dayNo=Number(dayKey);
    let day=byDay.get(dayNo);
    if(!day && extra.prototype_variant){
      day={day:dayNo,date:extra.date,feasibility:'conditional',variants:[JSON.parse(JSON.stringify(extra.prototype_variant))]};
      (out.days||(out.days=[])).push(day); byDay.set(dayNo,day);
    }
    if(!day)continue;
    if(extra.date)day.date=extra.date;
    if(extra.weekday)day.weekday=extra.weekday;
    if(extra.wake_up_at)day.wake_up_at=extra.wake_up_at;
    if(extra.purpose_override)day.purpose_override=extra.purpose_override;
    day.day_of_checks=extra.day_of_checks||[];

    const variants=extra.variants||{};
    for(const [variantId,vx] of Object.entries(variants)){
      let v=(day.variants||[]).find(x=>x.id===variantId);
      if(!v && vx.prototype){
        v={id:variantId,label:vx.label||variantId,route_id:vx.route_id||null,summary:{},flow:[]};
        (day.variants||(day.variants=[])).push(v);
      }
      if(!v)continue;
      if(vx.label)v.label=vx.label;
      if(vx.route_id)v.route_id=vx.route_id;
      v.summary={...(v.summary||{}),...(vx.summary_extra||{})};
      if(Array.isArray(vx.replace_flow)) v.flow=JSON.parse(JSON.stringify(vx.replace_flow));
      for(const [idx,detail] of Object.entries(vx.flow_details||{})){
        const item=v.flow?.[Number(idx)]; if(item) Object.assign(item,detail);
      }
    }
  }
  out.days=(out.days||[]).sort((a,b)=>Number(a.day)-Number(b.day));
  return out;
}

const e=escapeDayHtml;
const labels={mode:{walk:'徒歩',train:'電車',air:'飛行機',rental_car:'レンタカー',bus:'バス',motorbike:'バイク'},feasibility:{viable:'実施可能',conditional:'条件付き',confirmed:'確認済み',unknown:'未確認'},condition:{opening_hours:'営業時間',operating_hours:'営業時間',last_order_at:'LO',reservation:'予約',parking:'駐車',fee:'料金',weather:'天候',road:'道路',trail:'登山道',bus_operation:'バス運行',turnaround_rule:'短縮条件',check_in:'チェックイン',supplies:'買い出し',bus_ticket:'バス券',portable_toilet:'携帯トイレ',milestones:'主要地点',target_return:'目標帰着',switch_rule:'振替条件',closed:'休業',amenities:'備品'}};
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
function activityHtml(a){return `<div class="exec-activity"><span>${e(a.label||'')}</span>${a.duration?`<strong>${e(a.duration)}</strong>`:''}</div>`;}
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
function flowHtml(flow=[]){return `<ol class="exec-flow">${flow.map(i=>i.type==='transfer'?transferHtml(i):i.type==='route'?routeHtml(i):destinationHtml(i)).join('')}</ol>`;}

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
function executionHtml(data,planDays={},detailPoc={}){return `<section class="section execution-intro"><div class="execution-title-row"><div><div class="kicker">実施プラン</div><h2>実施日の行動計画</h2></div><span class="demo-chip warn">PoC・ユーザー提供/未検証</span></div><p>${e(detailPoc.notice||data.notice||'')}</p><div class="execution-principle"><strong>計画のDay骨格を保ち、実行情報だけを重ねる</strong><span>便・時刻・営業時間・費用・buffer・当日確認を試作し、最終Schemaへ落とす前に表示価値を検証します。</span></div></section><section class="section execution-days"><div class="section-heading"><h2>日ごとの実施計画</h2><p>Plan Day ViewModelへConcrete実行差分を重ねます。</p></div>${(data.days||[]).map(d=>executionDay(d,planDays[Number(d.day)]||{})).join('')}</section>`;}

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
