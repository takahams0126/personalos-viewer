const qsDayDecision = new URLSearchParams(location.search);
if (qsDayDecision.get('type') === 'plan' && qsDayDecision.get('id') === 'P001') initDayDecisionDemo();

async function initDayDecisionDemo(){
  let extra;
  try{
    const r = await fetch('./data/plan-demo.json',{cache:'no-store'});
    if(!r.ok) return;
    extra = await r.json();
  }catch{return;}
  const decisions = extra.day_decisions || {};
  const app = document.querySelector('#app');

  const renderPlan = () => {
    let changed = false;
    app?.querySelectorAll('#plan-mode-panel .day-card').forEach(card => {
      if(card.dataset.dayDecisionAttached) return;
      const dayText = card.querySelector('.day-number')?.textContent || '';
      const m = dayText.match(/(\d+)/);
      if(!m) return;
      const decision = decisions[m[1]];
      if(!decision) return;
      const body = card.querySelector('.plan-day-body');
      if(!body) return;
      const overview = body.querySelector('.plan-day-overview');
      const block = dayDecisionBlock(decision,'plan');
      if(overview) overview.insertAdjacentHTML('afterend',block);
      else body.insertAdjacentHTML('afterbegin',block);
      card.dataset.dayDecisionAttached='1';
      changed = true;
    });
    const riskSection=[...app?.querySelectorAll('#plan-mode-panel .section')||[]].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
    if(riskSection) riskSection.hidden = true;
    return changed;
  };

  const renderExecution = () => {
    let changed = false;
    app?.querySelectorAll('#execution-mode-panel .execution-day').forEach(card => {
      if(card.dataset.dayDecisionAttached) return;
      const dayNo = card.dataset.day;
      const decision = decisions[dayNo];
      if(!decision) return;
      const summary = card.querySelector('.exec-day-summary');
      if(summary) summary.insertAdjacentHTML('afterend',dayDecisionBlock(decision,'execution'));
      else card.querySelector('.exec-day-body')?.insertAdjacentHTML('afterbegin',dayDecisionBlock(decision,'execution'));
      card.dataset.dayDecisionAttached='1';
      changed = true;
    });
    return changed;
  };

  const apply = () => { renderPlan(); renderExecution(); };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(app,{childList:true,subtree:true});
}

function escDayDecision(v=''){
  return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
}
function dayDecisionBlock(decision,mode){
  const detail=(decision.detail||[]).map(x=>`<li>${escDayDecision(x)}</li>`).join('');
  const alts=(decision.alternatives||[]).map(alt=>{
    const conditions=(alt.switch_conditions||[]).map(x=>`<li>${escDayDecision(x)}</li>`).join('');
    const target=alt.target_route_id?`<span class="day-decision-target">${escDayDecision(alt.target_route_id)}</span>`:'';
    return `<article class="day-alt-card">
      <div class="day-alt-head"><strong>${escDayDecision(alt.label||'代替')}</strong>${target}</div>
      <div class="day-alt-condition-label">切替条件</div>
      <ul>${conditions}</ul>
      ${mode==='execution'?'<div class="day-alt-eval">当日判定：未確認</div>':''}
    </article>`;
  }).join('');
  return `<section class="day-decision-block">
    ${detail?`<div class="day-detail-part"><h4>Daily Detail</h4><ul>${detail}</ul></div>`:''}
    ${alts?`<div class="day-alternative-part"><h4>代替条件</h4><div class="day-alt-grid">${alts}</div></div>`:''}
  </section>`;
}
