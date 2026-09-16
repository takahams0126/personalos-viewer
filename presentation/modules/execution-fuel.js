const qs=new URLSearchParams(location.search);
if(qs.get('type')==='plan'&&qs.get('id')) initFuel();

async function initFuel(){
  const id=qs.get('id'); let spec;
  try{const r=await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!r.ok)return;const payload=await r.json();spec=payload.fuel_plan||{};}catch{return;}
  const attach=()=>{
    const panel=document.querySelector('#execution-mode-panel');
    if(!panel||panel.dataset.fuelAttached)return false;
    panel.dataset.fuelAttached='1';
    renderFuelPlan(panel,spec);
    renderAlternativeCosts(panel,spec);
    panel.addEventListener('click',ev=>{
      const tab=ev.target.closest('.exec-variant-tab');
      if(!tab)return;
      queueMicrotask(()=>updateSelectedAlternativeCost(panel,spec,Number(tab.closest('.execution-day')?.dataset.day),tab.dataset.variant));
    });
    return true;
  };
  if(attach())return;
  const ob=new MutationObserver(()=>{if(attach())ob.disconnect();});
  ob.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
}

const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const yen=v=>v===null||v===undefined?'—':`¥${Number(v).toLocaleString('ja-JP')}`;

function renderFuelPlan(panel,spec){
  const days=panel.querySelector('.execution-days'); if(!days)return;
  const stations=Object.fromEntries((spec.travel_point_candidates||[]).map(s=>[s.poc_id,s]));
  const rows=(spec.planned_refuels||[]).map(p=>fuelRow(p,stations[p.station_poc_id])).join('');
  const cost=spec.fuel_cost||{};
  const html=`<section class="section exec-fuel-plan"><div class="section-heading"><h2>給油計画</h2><p>${esc(spec.purpose||'')}</p></div><div class="exec-fuel-grid">${rows}</div><div class="exec-fuel-cost"><span>燃料費</span><strong>${cost.estimated_cost_yen==null?'未算定':yen(cost.estimated_cost_yen)}</strong><small>${esc(cost.display_note||'')}</small></div></section>`;
  const costSection=panel.querySelector('.exec-trip-cost');
  if(costSection)costSection.insertAdjacentHTML('beforebegin',html); else days.insertAdjacentHTML('afterend',html);
}

function fuelRow(p,s={}){
  const required=p.required?'<span class="exec-fuel-required">必須</span>':'<span class="exec-fuel-recommended">推奨</span>';
  const constraint=p.constraint?`<div class="exec-fuel-constraint"><span>${esc(p.constraint.label||'制約')} ${esc(p.constraint.at||'')}</span><b>${p.constraint.slack&&p.constraint.slack!=='未算定'?`余裕 ${esc(p.constraint.slack)}`:'余裕 未算定'}</b></div>`:'';
  const checks=(p.checks||[]).map(x=>`<span>${esc(x)}</span>`).join('');
  return `<article class="exec-fuel-card ${p.required?'is-required':''}"><div class="exec-fuel-head"><div><span class="exec-fuel-day">Day${esc(p.day)}</span>${required}</div><strong>${esc(p.timing||'')}</strong></div><div class="exec-fuel-station"><div class="exec-fuel-icon">⛽</div><div><strong>${esc(s.label||'給油候補')}</strong><span>${esc(s.area||'')}</span><small>${esc(s.hours||'')}</small></div></div><p>${esc(p.reason||'')}</p>${constraint}<div class="exec-fuel-checks">${checks}</div>${p.timeline?'<div class="exec-fuel-flow-note">行動順へ組み込み済み</div>':'<div class="exec-fuel-flow-note is-passive">行動順には固定せず、残量に応じて実施</div>'}</article>`;
}

function renderAlternativeCosts(panel,spec){
  const impacts=spec.alternative_cost_impacts||[]; if(!impacts.length)return;
  const cost=panel.querySelector('.exec-trip-cost'); if(!cost||cost.querySelector('.exec-alt-costs'))return;
  const rows=impacts.filter(x=>x.delta_yen!==0).map(x=>`<div class="exec-alt-cost-row"><span><b>Day${esc(x.day)}</b> ${esc(x.label)}</span><strong class="${x.delta_yen<0?'is-minus':'is-plus'}">${x.delta_yen>0?'+':''}${yen(x.delta_yen)}</strong></div>`).join('');
  const policy=spec.cost_policy?.display_rule||'';
  cost.querySelector('.exec-cost-groups')?.insertAdjacentHTML('afterend',`<div class="exec-alt-costs"><div class="exec-alt-cost-head"><strong>代替案の費用影響</strong>${policy?`<span>${esc(policy)}</span>`:''}</div>${rows}<div class="exec-selected-cost" hidden></div></div>`);
}

function updateSelectedAlternativeCost(panel,spec,day,variant){
  const box=panel.querySelector('.exec-selected-cost'); if(!box)return;
  const impact=(spec.alternative_cost_impacts||[]).find(x=>Number(x.day)===Number(day)&&x.variant_id===variant);
  if(!impact||!impact.delta_yen){box.hidden=true;box.innerHTML='';return;}
  const base=parseMoney(panel.querySelector('.exec-cost-total .is-grand strong')?.textContent);
  const projected=base==null?null:base+Number(impact.delta_yen);
  box.hidden=false;
  box.innerHTML=`<span>現在選択中: Day${esc(day)} ${esc(impact.label)}</span><strong>基準比 ${impact.delta_yen>0?'+':''}${yen(impact.delta_yen)}${projected==null?'':` → 総額見込 ${yen(projected)}`}</strong>`;
}
function parseMoney(s=''){const n=String(s).replace(/[^0-9-]/g,'');return n?Number(n):null;}
