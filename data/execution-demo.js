import { renderTablerIcon, resolveDestinationIcon, resolveTransferIcon } from './icon-registry.js?v=20260915-16';

const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');
if (type === 'plan' && id) initConcreteDemo();

async function initConcreteDemo(){
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
    executionPanel.innerHTML=executionHtml(concrete,planDaysByNumber);

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

function e(v=''){return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
const labels={mode:{walk:'徒歩',train:'電車',air:'飛行機',rental_car:'レンタカー',bus:'バス',motorbike:'バイク'},feasibility:{viable:'実施可能',conditional:'条件付き',confirmed:'確認済み',unknown:'未確認'}};
const l=(g,v)=>labels[g]?.[v]||String(v||'').replaceAll('_',' ');
const budgetTotalLabel=v=>({'1day':'終日',long_day:'長時間',full_day:'終日'}[v]||String(v||'').replace('-','〜'));
const budgetStartLabel=v=>({morning:'朝出発',early_morning:'早朝出発',afternoon:'午後開始',evening:'夕方開始'}[v]||String(v||'').replaceAll('_',' '));

const destinationIcon=ref=>renderTablerIcon(resolveDestinationIcon(ref.type==='travel_point'?{pointType:ref.point_type}:{category:ref.category,role:ref.role}),'exec-destination-svg');
const transferIcon=mode=>renderTablerIcon(resolveTransferIcon(mode),'exec-transfer-svg');

function bindModeSwitcher(s,p,x){
  s.addEventListener('click',ev=>{
    const b=ev.target.closest('.plan-mode-btn');
    if(!b)return;
    const m=b.dataset.mode;
    s.querySelectorAll('.plan-mode-btn').forEach(q=>q.classList.toggle('active',q===b));
    p.hidden=m!=='plan';
    x.hidden=m!=='execution';
    p.classList.toggle('active',m==='plan');
    x.classList.toggle('active',m==='execution');
  });
}

function summaryHtml(s={}){
  const rows=[['合計時間',s.total_time],['移動距離',s.travel_distance],['移動時間',s.travel_time],['手続時間',s.procedure_time],['観光・食事',s.experience_time]];
  return `<div class="exec-summary-grid">${rows.map(([k,v])=>`<div><span>${e(k)}</span><strong>${e(v||'—')}</strong></div>`).join('')}</div>`;
}
function planOverviewHtml(planDay={},summary={}){
  const tb=planDay.time_budget||{};
  const topBadges=[tb.expected_total?budgetTotalLabel(tb.expected_total):'',tb.preferred_start?budgetStartLabel(tb.preferred_start):''].filter(Boolean);
  const constraints=tb.constraints||[];
  const dayText=planDay.summary||planDay.appeal||'';
  return `<section class="exec-day-overview">
    <div class="plan-day-subhead">1日の概要</div>
    ${topBadges.length?`<div class="plan-day-overview-badges">${topBadges.map(x=>`<span>${e(x)}</span>`).join('')}</div>`:''}
    ${dayText?`<p>${e(dayText)}</p>`:''}
    ${constraints.length?`<div class="plan-day-constraints">${constraints.map(x=>`<span>${e(x)}</span>`).join('')}</div>`:''}
    <div class="exec-day-summary">${summaryHtml(summary)}</div>
  </section>`;
}
function activityHtml(a){return `<div class="exec-activity"><span>${e(a.label||'')}</span>${a.duration?`<strong>${e(a.duration)}</strong>`:''}</div>`;}
function destinationHtml(i){
  const r=i.ref||{},acts=(i.activities||[]).map(activityHtml).join(''),acc=(i.accessories||[]).map(a=>`<span class="exec-accessory">${e(a.label||'')}</span>`).join(''),stay=i.stay_duration?`<span class="exec-stay">滞在 ${e(i.stay_duration)}</span>`:'';
  return `<li class="exec-flow-item exec-destination"><div class="exec-flow-time">${e(i.time||'')}</div><div class="exec-destination-node">${destinationIcon(r)}</div><div class="exec-flow-main"><div class="exec-destination-title">${e(r.label||r.id||'')}${stay}</div>${acts?`<div class="exec-activities">${acts}</div>`:''}${acc?`<div class="exec-accessories">${acc}</div>`:''}</div></li>`;
}
function transferHtml(i){return `<li class="exec-flow-item exec-transfer"><div class="exec-flow-time"></div><div class="exec-transfer-node">${transferIcon(i.mode)}</div><div class="exec-transfer-main"><span>${e(l('mode',i.mode))}</span>${i.duration?`<strong>${e(i.duration)}</strong>`:''}</div></li>`;}
function routeHtml(i){return `<li class="exec-flow-item exec-route"><div class="exec-flow-time">${e(i.time||'')}</div><div class="exec-route-node">★</div><div class="exec-flow-main"><div class="exec-destination-title">${e(i.label||i.route_id||'Route')}</div></div></li>`;}
function flowHtml(flow=[]){return `<ol class="exec-flow">${flow.map(i=>i.type==='transfer'?transferHtml(i):i.type==='route'?routeHtml(i):destinationHtml(i)).join('')}</ol>`;}

function variantTabs(day){
  const vs=day.variants||[];
  if(vs.length<=1)return'';
  return `<div class="exec-variant-tabs" role="tablist">${vs.map((v,n)=>`<button class="exec-variant-tab ${n===0?'active':''}" data-variant="${e(v.id)}">${e(v.label||v.id)}${v.route_id?` [${e(v.route_id)}]`:''}</button>`).join('')}</div>`;
}
function viewTabs(){return '<div class="exec-view-tabs" role="tablist"><button class="exec-view-tab active" data-view="flow">行動順</button><button class="exec-view-tab" data-view="map">マップ</button></div>';}
function mapLegendHtml(spec={}){const modes=[...new Set((spec.segments||[]).map(s=>s.mode).filter(Boolean))];if(!modes.length)return'';return `<div class="exec-map-legend">${modes.map(mode=>`<span><i class="mode-${e(mode)}"></i>${e(l('mode',mode))}</span>`).join('')}</div>`;}

function executionDay(day,planDay={}){
  const first=(day.variants||[])[0]||{summary:{},flow:[]};
  const f=day.feasibility?`<span class="exec-status ${e(day.feasibility)}">${e(l('feasibility',day.feasibility))}</span>`:'';
  const title=planDay.purpose||day.purpose||'';
  return `<article class="execution-day" data-day="${e(day.day)}" data-active-variant="${e(first.id||'standard')}"><header class="execution-day-header" role="button" tabindex="0" aria-expanded="false"><div class="execution-day-no">${e(day.day)}日目</div><h3>${e(title)}</h3>${f}<i class="exec-day-toggle-icon" aria-hidden="true"></i></header><div class="exec-day-body" hidden>${planOverviewHtml(planDay,first.summary)}${variantTabs(day)}${viewTabs()}<div class="exec-view-body" data-view-panel="flow">${flowHtml(first.flow)}</div><div class="exec-view-body" data-view-panel="map" hidden><div class="exec-map-legend-host">${mapLegendHtml(first.map)}</div><div class="map-wrap exec-day-map-wrap"><div class="exec-day-map" id="execution-map-day-${e(day.day)}"></div><div class="exec-map-message"></div></div><p class="note exec-map-note">${e(first.map?.note||'')}</p></div></div></article>`;
}
function executionHtml(data,planDays={}){return `<section class="section execution-intro"><div class="execution-title-row"><div><div class="kicker">実施プラン</div><h2>実施日の行動計画</h2></div><span class="demo-chip warn">仮想データ</span></div><p>${e(data.notice||'')}</p><div class="execution-principle"><strong>計画のDay骨格を保ち、実行情報だけを重ねる</strong><span>DailyTitleを開くと1日の概要・代替条件・行動順・Mapをまとめて確認できます。</span></div></section><section class="section execution-days"><div class="section-heading"><h2>日ごとの実施計画</h2><p>計画と同じDayを展開し、Canonical由来の概要条件に実行Summaryを重ねます。</p></div>${(data.days||[]).map(d=>executionDay(d,planDays[Number(d.day)]||{})).join('')}</section>`;}

function bindExecutionDays(panel,data){
  panel.querySelectorAll('.execution-day').forEach(card=>{
    const day=(data.days||[]).find(d=>Number(d.day)===Number(card.dataset.day));
    if(!day)return;
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
function renderVariant(card,day,id){const v=(day.variants||[]).find(x=>x.id===id);if(!v)return;const summaryHost=card.querySelector('.exec-day-summary');if(summaryHost)summaryHost.innerHTML=summaryHtml(v.summary);const fp=card.querySelector('[data-view-panel="flow"]');if(fp)fp.innerHTML=flowHtml(v.flow);const lh=card.querySelector('.exec-map-legend-host');if(lh)lh.innerHTML=mapLegendHtml(v.map);const n=card.querySelector('.exec-map-note');if(n)n.textContent=v.map?.note||'';const m=card.querySelector('.exec-day-map');if(m){m.innerHTML='';delete m.dataset.loadedVariant;}if(card.querySelector('.exec-view-tab.active')?.dataset.view==='map')renderDayMap(card,day);}
function personalOsEntityUrl(p){return p.entity_type==='spot'?`./?type=spot&id=${encodeURIComponent(p.id)}`:null;}
function mapPopupHtml(p){const personal=personalOsEntityUrl(p),gm=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.lat},${p.lon}`)}`;return `<div class="exec-map-popup"><div class="exec-map-popup-title">${e(p.name)}</div><div class="exec-map-popup-links">${personal?`<a class="exec-map-popup-link" href="${personal}">PersonalOS</a>`:'<span class="exec-map-popup-link is-disabled" title="TravelPoint詳細ページは未実装">PersonalOS</span>'}<a class="exec-map-popup-link" href="${gm}" target="_blank" rel="noopener">Google Maps ↗</a></div></div>`;}
function showMapError(card,err){const m=card.querySelector('.exec-day-map'),x=card.querySelector('.exec-map-message');if(m)m.style.display='none';if(x)x.textContent=`地図の読み込みに失敗しました: ${err.message}`;}
async function ensureMaps(){if(window.google?.maps)return;const key=window.PERSONALOS_CONFIG?.googleMapsApiKey||'';if(!key)throw new Error('Google Maps API key 未設定');if(window.__concreteMapsPromise)return window.__concreteMapsPromise;window.__concreteMapsPromise=new Promise((resolve,reject)=>{window.__personalosConcreteMapsReady=resolve;const s=document.createElement('script');s.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=__personalosConcreteMapsReady&v=weekly`;s.async=true;s.defer=true;s.onerror=()=>reject(new Error('Google Maps JavaScript API load error'));document.head.appendChild(s);});return window.__concreteMapsPromise;}
async function renderDayMap(card,day){const v=activeVariant(day,card),spec=v?.map;if(!spec)return;const el=card.querySelector('.exec-day-map');if(!el||el.dataset.loadedVariant===v.id)return;try{await ensureMaps();el.style.display='block';el.innerHTML='';const map=new google.maps.Map(el,{mapTypeControl:true,streetViewControl:false,fullscreenControl:true});const bounds=new google.maps.LatLngBounds(),byId=Object.fromEntries((spec.points||[]).map(p=>[p.id,p])),info=new google.maps.InfoWindow();for(const p of spec.points||[]){const pos={lat:Number(p.lat),lng:Number(p.lon)};bounds.extend(pos);const marker=new google.maps.Marker({map,position:pos,label:{text:String(p.order||''),color:'#fff',fontWeight:'700'},title:p.name,zIndex:100+Number(p.order||0)});marker.addListener('click',()=>{info.setContent(mapPopupHtml(p));info.open({map,anchor:marker});});}const style={train:{strokeColor:'#7b61ff',strokeWeight:6},air:{strokeColor:'#34a853',strokeWeight:4,strokeOpacity:.75},rental_car:{strokeColor:'#1a73e8',strokeWeight:7},walk:{strokeColor:'#f9ab00',strokeWeight:5},motorbike:{strokeColor:'#8e5ac7',strokeWeight:6}};for(const s of spec.segments||[]){const a=byId[s.from],b=byId[s.to];if(!a||!b)continue;new google.maps.Polyline({map,path:[{lat:Number(a.lat),lng:Number(a.lon)},{lat:Number(b.lat),lng:Number(b.lon)}],strokeOpacity:.9,...(style[s.mode]||{})});}if(!bounds.isEmpty())map.fitBounds(bounds,34);const msg=card.querySelector('.exec-map-message');if(msg)msg.textContent='';el.dataset.loadedVariant=v.id;}catch(err){showMapError(card,err);}}
