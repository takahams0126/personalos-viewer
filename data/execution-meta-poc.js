const qs=new URLSearchParams(location.search);
if(qs.get('type')==='plan'&&qs.get('id')) initExecutionMetaPoc();

async function initExecutionMetaPoc(){
  const id=qs.get('id');
  let meta={},detail={};
  try{
    const [m,d]=await Promise.all([
      fetch(`./data/concrete-plans/${encodeURIComponent(id)}-meta-poc.json`,{cache:'no-store'}),
      fetch(`./data/concrete-plans/${encodeURIComponent(id)}-detail-poc.json`,{cache:'no-store'})
    ]);
    if(!m.ok)return;
    meta=await m.json();
    if(d.ok)detail=await d.json();
  }catch{return;}

  const attach=()=>{
    const panel=document.querySelector('#execution-mode-panel');
    const intro=panel?.querySelector('.execution-intro');
    if(!panel||!intro||intro.dataset.metaPocRendered)return false;
    intro.dataset.metaPocRendered='1';
    intro.outerHTML=renderIntro(meta,detail);
    const daysHeading=panel.querySelector('.execution-days>.section-heading');
    if(daysHeading)daysHeading.innerHTML=`<h2>${esc(meta.display?.days_heading||'日ごとの実施計画')}</h2><p>${esc(meta.display?.days_description||'')}</p>`;
    return true;
  };
  if(attach())return;
  const ob=new MutationObserver(()=>{if(attach())ob.disconnect();});
  ob.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
}

const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function renderIntro(meta,detail){
  const period=formatPeriod(detail.execution_window);
  const transports=derivePrimaryTransports(detail);
  const bookings=(detail.booking_connections||[]).map(x=>x.label).filter(Boolean);
  const status=statusLabel(meta.status);
  const verified=meta.last_verified_at?formatDateTime(meta.last_verified_at):'未確認';
  const badge=meta.display?.poc_badge?`<span class="demo-chip warn">${esc(meta.display.poc_badge)}</span>`:'';
  const facts=[
    ['実施期間',period||'未設定'],
    ['元Plan',meta.source_plan_id||detail.source_plan_id||'—'],
    ['主な移動',transports.length?transports.join('＋'):'未設定'],
    ['主要予約',bookings.length?bookings.join('・'):'未接続'],
    ['状態',status],
    ['最終確認',verified]
  ];
  return `<section class="section execution-intro execution-intro-meta"><div class="execution-title-row"><div><div class="kicker">${esc(meta.display?.kicker||'実施プラン')}・${esc(meta.concrete_plan_id||'')}</div><h2>${esc(meta.display?.heading||'実施日の行動計画')}</h2></div>${badge}</div><div class="exec-meta-title">${esc(meta.title||'')}</div><p>${esc(meta.description||'')}</p><div class="exec-meta-facts">${facts.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div></section>`;
}

function derivePrimaryTransports(detail){
  const found=[];
  const add=mode=>{if(mode&&!found.includes(mode))found.push(mode);};
  const scanFlow=flow=>{for(const item of flow||[])if(item?.type==='transfer')add(item.mode);};
  for(const day of Object.values(detail.days||{})){
    if(day.prototype_variant?.flow)scanFlow(day.prototype_variant.flow);
    for(const v of Object.values(day.variants||{}))scanFlow(v.replace_flow||v.flow);
  }
  const labels={air:'飛行機',rental_car:'レンタカー',bus:'バス',train:'電車',motorbike:'バイク',walk:'徒歩'};
  const priority=['air','rental_car','bus','train','motorbike','walk'];
  return priority.filter(x=>found.includes(x)&&x!=='walk').map(x=>labels[x]||x);
}

function statusLabel(v){return ({viable:'実施可能',conditional:'条件付き',confirmed:'確認済み',draft:'準備中',unknown:'未確認'})[v]||v||'未確認';}
function formatPeriod(w={}){if(!w.start_date&&!w.end_date)return'';return `${formatDate(w.start_date)} 〜 ${formatDate(w.end_date)}`;}
function formatDate(v){if(!v)return'—';const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[1]}/${m[2]}/${m[3]}`:String(v);}
function formatDateTime(v){try{return new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Tokyo'}).format(new Date(v));}catch{return String(v);}}
