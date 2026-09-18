const qs=new URLSearchParams(location.search);
if(qs.get('type')==='plan'&&qs.get('id')) init();

async function init(){
  const id=qs.get('id'); let spec;
  try{const r=await fetch(`./data/concrete-plans/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!r.ok)return;spec=await r.json();}catch{return;}
  const attach=()=>{
    const panel=document.querySelector('#execution-mode-panel');
    if(!panel||panel.dataset.feasibilityAttached)return false;
    panel.dataset.feasibilityAttached='1';
    for(const daySpec of spec.days||[])decorateDay(panel,Number(daySpec.day),daySpec);
    renderTripCostSummary(panel,spec.cost_summary);
    return true;
  };
  if(attach())return;
  const ob=new MutationObserver(()=>{if(attach())ob.disconnect();});
  ob.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
}

const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const yen=v=>v===null||v===undefined?'—':`¥${Number(v).toLocaleString('ja-JP')}`;

function decorateDay(panel,dayNo,spec){
  const card=panel.querySelector(`.execution-day[data-day="${dayNo}"]`);
  if(!card||!spec.execution_checks?.length)return;
  const old=card.querySelector('.exec-day-checks');
  const html=`<div class="exec-feasibility"><div class="exec-feasibility-title">実行可能性</div><div class="exec-feasibility-grid">${spec.execution_checks.map(checkHtml).join('')}</div></div>`;
  if(old)old.outerHTML=html;
  else card.querySelector('.exec-day-summary')?.insertAdjacentHTML('beforeend',html);
}

function checkHtml(c){
  const tone=c.status||'unknown';
  const meta=[];
  if(c.arrival_at)meta.push(`到着 ${c.arrival_at}`);
  if(c.target_at)meta.push(`Target ${c.target_at}`);
  if(c.constraint_at)meta.push(`${c.constraint_label||'制約'} ${c.constraint_at}`);
  if(c.latest_safe_at)meta.push(`安心ライン ${c.latest_safe_at}`);
  if(c.fallback_at)meta.push(`次善 ${c.fallback_at}`);
  if(c.slack)meta.push(`余裕 ${c.slack}`);
  return `<div class="exec-feasibility-check is-${esc(tone)}"><div class="exec-feasibility-check-head"><span>${tone==='good'?'✓':tone==='attention'?'!':tone==='danger'?'!':'?'}</span><strong>${esc(c.label)}</strong>${c.required?'<b class="exec-required-badge">必須</b>':''}</div>${meta.length?`<div class="exec-feasibility-meta">${meta.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${c.note?`<p>${esc(c.note)}</p>`:''}</div>`;
}

function renderTripCostSummary(panel,s){
  if(!s)return;
  const days=panel.querySelector('.execution-days');
  if(!days||panel.querySelector('.exec-trip-cost'))return;
  const confirmed=(s.confirmed||[]).map(costRow).join('');
  const daily=(s.daily_costs||[]).map(dayCostRow).join('');
  days.insertAdjacentHTML('afterend',`<section class="section exec-trip-cost"><div class="section-heading"><h2>旅行費用サマリー</h2><p>確定額と日別実行費を分けます。日別金額は表示検討用テストデータです。</p></div><div class="exec-cost-groups"><div class="exec-cost-group"><h3>確定・予約済み</h3>${confirmed}</div><div class="exec-cost-group"><h3>日別実行費 <span class="exec-test-chip">テスト</span></h3><div class="exec-day-costs">${daily}</div></div></div><div class="exec-cost-total"><div><span>確定済み</span><strong>${yen(s.confirmed_total)}</strong></div><div><span>日別見積（テスト）</span><strong>${yen(s.estimated_total)}</strong></div><div class="is-grand"><span>総額見込（テスト）</span><strong>${yen(s.grand_total)}</strong></div></div></section>`);
}
function costRow(x){const value=x.amount==null?(x.status==='included_in_package'?'パッケージ内訳未取得':'未集計'):yen(x.amount);return `<div class="exec-cost-row"><div><strong>${esc(x.label||'')}</strong>${x.note?`<small>${esc(x.note)}</small>`:''}</div><b>${esc(value)}</b></div>`;}
function dayCostRow(d){return `<details class="exec-day-cost"><summary><span><b>Day${esc(d.day)}</b> ${esc(d.label||'')}</span><strong>${yen(d.amount)}</strong></summary><div class="exec-day-cost-detail">${(d.items||[]).map(x=>`<div><span><small>${esc(x.category||'')}</small>${esc(x.label||'')}</span><b>${yen(x.amount)}</b></div>`).join('')}</div></details>`;}
