const qs=new URLSearchParams(location.search);
if(qs.get('type')==='plan'&&qs.get('id')) init();

async function init(){
  const id=qs.get('id');
  let spec;
  try{
    const r=await fetch(`./data/concrete-plans/${encodeURIComponent(id)}-feasibility-poc.json`,{cache:'no-store'});
    if(!r.ok)return; spec=await r.json();
  }catch{return;}
  const attach=()=>{
    const panel=document.querySelector('#execution-mode-panel');
    if(!panel||panel.dataset.feasibilityPocAttached)return false;
    panel.dataset.feasibilityPocAttached='1';
    for(const [dayKey,daySpec] of Object.entries(spec.days||{})) decorateDay(panel,Number(dayKey),daySpec);
    return true;
  };
  if(attach())return;
  const ob=new MutationObserver(()=>{if(attach())ob.disconnect();});
  ob.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
}

const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function decorateDay(panel,dayNo,spec){
  const card=panel.querySelector(`.execution-day[data-day="${dayNo}"]`); if(!card)return;
  if(spec.execution_checks?.length){
    const old=card.querySelector('.exec-day-checks');
    const html=`<div class="exec-feasibility"><div class="exec-feasibility-title">実行可能性</div><div class="exec-feasibility-grid">${spec.execution_checks.map(checkHtml).join('')}</div></div>`;
    if(old) old.outerHTML=html; else card.querySelector('.exec-day-summary')?.insertAdjacentHTML('beforeend',html);
  }
  const variants=spec.variants||{};
  const activeId=card.dataset.activeVariant||Object.keys(variants)[0];
  renderVariantFlow(card,variants[activeId]);
  card.addEventListener('click',ev=>{
    const b=ev.target.closest('.exec-variant-tab');
    if(!b)return;
    queueMicrotask(()=>renderVariantFlow(card,variants[b.dataset.variant]));
  });
}

function checkHtml(c){
  const tone=c.status||'unknown';
  const meta=[];
  if(c.arrival_at)meta.push(`到着 ${c.arrival_at}`);
  if(c.target_at)meta.push(`目標 ${c.target_at}`);
  if(c.constraint_at)meta.push(`${c.constraint_label||'制約'} ${c.constraint_at}`);
  if(c.latest_safe_at)meta.push(`安心ライン ${c.latest_safe_at}`);
  if(c.fallback_at)meta.push(`次善 ${c.fallback_at}`);
  if(c.slack)meta.push(`余裕 ${c.slack}`);
  return `<div class="exec-feasibility-check is-${esc(tone)}"><div class="exec-feasibility-check-head"><span>${tone==='good'?'✓':tone==='attention'?'!':'?'}</span><strong>${esc(c.label)}</strong></div>${meta.length?`<div class="exec-feasibility-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${c.note?`<p>${esc(c.note)}</p>`:''}</div>`;
}

function renderVariantFlow(card,v){
  if(!v?.replace_flow)return;
  const host=card.querySelector('[data-view-panel="flow"]'); if(!host)return;
  host.innerHTML=`<ol class="exec-flow exec-flow-poc">${v.replace_flow.map(flowItem).join('')}</ol>`;
}

function flowItem(i){
  if(i.type==='transfer')return transfer(i);
  if(i.type==='route')return route(i);
  return destination(i);
}

function destination(i){
  const r=i.ref||{};
  const acts=(i.activities||[]).map(a=>`<div class="exec-activity"><span>${esc(a.label||'')}</span>${a.duration?`<strong>${esc(a.duration)}</strong>`:''}${a.deadline?`<em>締切 ${esc(a.deadline)}</em>`:''}</div>`).join('');
  const toilet=i.facilities?.toilet==='available'?'<span class="exec-facility-chip">🚻 トイレ有</span>':'';
  const deadline=deadlineHtml(i.deadline);
  const tt=timetableHtml(i.timetable);
  return `<li class="exec-flow-item exec-destination"><div class="exec-flow-time">${esc(i.time||'')}</div><div class="exec-destination-node">${icon(destinationIcon(r))}</div><div class="exec-flow-main"><div class="exec-destination-title">${esc(r.label||r.id||'')}${toilet}</div>${acts?`<div class="exec-activities">${acts}</div>`:''}${tt}${deadline}${conditions(i.conditions)}</div></li>`;
}

function transfer(i){
  const s=i.schedule||{},svc=i.service||{};
  return `<li class="exec-flow-item exec-transfer"><div class="exec-flow-time">${esc(s.depart_at||'')}</div><div class="exec-transfer-node">${icon(transferIcon(i.mode))}</div><div class="exec-transfer-main"><div class="exec-transfer-primary"><strong>${esc(s.depart_at||'—')} 発</strong><span>→</span><strong>${esc(s.arrive_at||'—')} 着</strong>${i.duration?`<small>${esc(i.duration)}</small>`:''}</div><div class="exec-service">${svc.service_name?`<strong>${esc(svc.service_name)}</strong>`:''}${svc.service_number?`<span>${esc(svc.service_number)}</span>`:''}</div>${deadlineHtml(i.deadline)}</div></li>`;
}

function route(i){
  const pts=i.route_execution?.points||[];
  return `<li class="exec-flow-item exec-route exec-route-expanded"><div class="exec-flow-time">${esc(i.time||'')}</div><div class="exec-route-node">★</div><div class="exec-flow-main"><div class="exec-destination-title">${esc(i.label||i.route_id||'Route')}</div>${pts.length?`<div class="exec-route-points">${pts.map(p=>`<div><time>${esc(p.time||'')}</time><span>${icon(p.kind==='sightseeing'?'photo':'map-pin')}</span><strong>${esc(p.label||'')}</strong>${p.toilet?'<em>🚻</em>':''}</div>`).join('')}</div>`:''}${conditions(i.conditions)}</div></li>`;
}

function deadlineHtml(d){
  if(!d)return'';
  return `<div class="exec-deadline is-${esc(d.status||'unknown')}"><span>${esc(d.label||'時間制約')}</span>${d.at?`<strong>${esc(d.at)}</strong>`:''}${d.slack?`<em>余裕 ${esc(d.slack)}</em>`:''}</div>`;
}

function timetableHtml(t){
  if(!t)return'';
  const rows=[];
  if(t.target)rows.push(['Target',t.target,'target']);
  if(t.latest_safe)rows.push(['安心ライン',t.latest_safe,'safe']);
  if(t.next)rows.push(['次便',t.next,'next']);
  if(t.fallback)rows.push(['次善',t.fallback,'safe']);
  for(const x of t.later||[])rows.push(['後続',x,'later']);
  return `<div class="exec-timetable"><div class="exec-timetable-title">時刻表</div>${rows.map(([label,x,cls])=>`<div class="is-${cls}"><span>${esc(label)}</span><strong>${esc(x.depart_at)} 発</strong><i>→</i><strong>${esc(x.arrive_at)} 着</strong></div>`).join('')}</div>`;
}

function conditions(c={}){
  const rows=Object.entries(c).filter(([,v])=>v!==null&&v!==undefined&&v!=='');
  return rows.length?`<div class="exec-conditions">${rows.map(([k,v])=>`<span><small>${esc(k)}</small>${esc(v)}</span>`).join('')}</div>`:'';
}

function destinationIcon(r){
  const p=r.point_type,c=r.category;
  if(p==='bus_stop')return'bus-stop';
  if(p==='parking')return'parking';
  if(p==='facility')return'building-community';
  if(p==='station')return'track';
  if(p==='sightseeing_point')return'photo';
  if(p==='bridge')return'building-bridge';
  if(p==='airport')return'building-airport';
  if(p==='home')return'home';
  if(p==='rental_car_office')return'building-store';
  if(c==='food')return'tools-kitchen-3';
  if(c==='lodging')return'bed';
  return'map-pin';
}
function transferIcon(m){return m==='bus'?'bus':m==='air'?'plane':m==='train'?'track':m==='rental_car'?'car':m==='walk'?'walk':'map-pin';}
function icon(name){
  const p={
    bus:'<path d="M6 17h12m-13 -4h14m-13 -8h12a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2"/><path d="M7 18v2m10 -2v2m-10 -10h10"/>',
    'bus-stop':'<path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16"/><path d="M6 8h12m-9 4h.01m6 0h.01m-7 5h8"/>',
    parking:'<path d="M6 4h7a5 5 0 0 1 0 10h-7z"/><path d="M6 14v6"/>',
    'building-bridge':'<path d="M4 18v-6m16 6v-6M2 18h20M5 12c2 -5 12 -5 14 0M8 12v6m8 -6v6"/>',
    'building-community':'<path d="M3 21h18M5 21v-12l7 -4l7 4v12M9 21v-6h6v6M9 11h.01m6 0h.01"/>',
    track:'<path d="M6 3l2 18m10 -18l-2 18M7 7h10M7.5 11h9M8 15h8M8.5 19h7"/>',
    photo:'<path d="M15 8h.01"/><path d="M3 6a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/><path d="M3 16l5 -5c.9 -.9 2.1 -.9 3 0l5 5m-2 -2l1 -1c.9 -.9 2.1 -.9 3 0l3 3"/>',
    plane:'<path d="M16 10h4a2 2 0 0 1 0 4h-4l-4 7h-3l2 -7h-4l-2 2h-3l2 -4l-2 -4h3l2 2h4l-2 -7h3z"/>',
    car:'<path d="M5 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0m10 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6"/>',
    walk:'<path d="M12 4a1 1 0 1 0 2 0a1 1 0 0 0 -2 0M7 21l3 -4m6 4l-2 -4l-3 -3l1 -6M6 12l2 -3l4 -1l3 3l3 1"/>',
    home:'<path d="M5 12l-2 0l9 -9l9 9l-2 0M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/>',
    'building-airport':'<path d="M3 21h18M6 21v-9h4v9M3 7h9l-2 5h-5zM16 5h6m-3 -3l3 3l-3 3"/>',
    'building-store':'<path d="M3 21h18M5 21v-10m14 10v-10M3 7h18l-2 -4h-14zM9 21v-5h6v5"/>',
    'tools-kitchen-3':'<path d="M7 4v17M4 4v3a3 3 0 1 0 6 0v-3M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0M17 12v9"/>',
    bed:'<path d="M5 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M22 17v-3h-20M2 8v9M12 14h10v-2a3 3 0 0 0 -3 -3h-7z"/>',
    'map-pin':'<path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/><path d="M17.7 16.7l-4.3 4.2a2 2 0 0 1 -2.8 0l-4.3 -4.2a8 8 0 1 1 11.4 0"/>'
  }[name]||'';
  return `<svg class="plan-tabler-icon exec-destination-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
