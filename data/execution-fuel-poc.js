const qs=new URLSearchParams(location.search);
if(qs.get('type')==='plan'&&qs.get('id')) initFuelPoc();

async function initFuelPoc(){
  const id=qs.get('id'); let spec;
  try{const r=await fetch(`./data/concrete-plans/${encodeURIComponent(id)}-fuel-poc.json`,{cache:'no-store'});if(!r.ok)return;spec=await r.json();}catch{return;}
  const attach=()=>{
    const panel=document.querySelector('#execution-mode-panel');
    if(!panel||panel.dataset.fuelPocAttached)return false;
    panel.dataset.fuelPocAttached='1';
    renderFuelPlan(panel,spec);
    return true;
  };
  if(attach())return;
  const ob=new MutationObserver(()=>{if(attach())ob.disconnect();});
  ob.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
}

const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function renderFuelPlan(panel,spec){
  const days=panel.querySelector('.execution-days'); if(!days)return;
  const stations=Object.fromEntries((spec.travel_point_candidates||[]).map(s=>[s.poc_id,s]));
  const rows=(spec.planned_refuels||[]).map(p=>fuelRow(p,stations[p.station_poc_id])).join('');
  const cost=spec.fuel_cost||{};
  const html=`<section class="section exec-fuel-plan"><div class="section-heading"><h2>給油計画</h2><p>給油候補はTravelPointとして特定し、途中給油は実行可能性、返却前給油は実行手順として扱います。</p></div><div class="exec-fuel-grid">${rows}</div><div class="exec-fuel-cost"><span>燃料費</span><strong>${cost.estimated_cost_yen==null?'未算定':`¥${Number(cost.estimated_cost_yen).toLocaleString('ja-JP')}`}</strong><small>${esc(cost.display_note||'')}</small></div></section>`;
  const costSection=panel.querySelector('.exec-trip-cost');
  if(costSection)costSection.insertAdjacentHTML('beforebegin',html); else days.insertAdjacentHTML('afterend',html);
}

function fuelRow(p,s={}){
  const required=p.required?'<span class="exec-fuel-required">必須</span>':'<span class="exec-fuel-recommended">推奨</span>';
  const constraint=p.constraint?`<div class="exec-fuel-constraint"><span>${esc(p.constraint.label||'制約')} ${esc(p.constraint.at||'')}</span><b>${p.constraint.slack&&p.constraint.slack!=='未算定'?`余裕 ${esc(p.constraint.slack)}`:'余裕 未算定'}</b></div>`:'';
  const checks=(p.checks||[]).map(x=>`<span>${esc(x)}</span>`).join('');
  return `<article class="exec-fuel-card ${p.required?'is-required':''}"><div class="exec-fuel-head"><div><span class="exec-fuel-day">Day${esc(p.day)}</span>${required}</div><strong>${esc(p.timing||'')}</strong></div><div class="exec-fuel-station"><div class="exec-fuel-icon">⛽</div><div><strong>${esc(s.label||'給油候補')}</strong><span>${esc(s.area||'')}</span><small>${esc(s.hours||'')}</small></div></div><p>${esc(p.reason||'')}</p>${constraint}<div class="exec-fuel-checks">${checks}</div>${p.timeline?'<div class="exec-fuel-flow-note">返却日の行動順へ組み込む対象</div>':'<div class="exec-fuel-flow-note is-passive">通常の行動順には入れず、残量に応じて実施</div>'}</article>`;
}
