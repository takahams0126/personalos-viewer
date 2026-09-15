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

  const addRouteBadgeToTitle = (header, decision) => {
    const route = decision?.base_route;
    if(!header || !route?.id || header.querySelector('.day-route-id-badge')) return;
    const title = header.querySelector('h3');
    if(!title) return;
    title.insertAdjacentHTML('afterend',`<span class="day-route-id-badge" title="基本Route">${escDayDecision(route.id)}</span>`);
  };

  const addOverviewBadges = (host, decision, mode) => {
    const badges = decision?.overview_badges || [];
    if(!badges.length || !host || host.querySelector('.day-decision-overview-badges')) return;
    const wrap = document.createElement('div');
    wrap.className = 'day-decision-overview-badges';
    wrap.innerHTML = badges.map(x=>`<span>${escDayDecision(x)}</span>`).join('');
    if(mode==='plan'){
      const existing = host.querySelector('.plan-day-overview-badges');
      if(existing) existing.append(...wrap.children);
      else host.appendChild(wrap);
    }else{
      host.insertAdjacentElement('afterend',wrap);
    }
  };

  const renderPlan = () => {
    app?.querySelectorAll('#plan-mode-panel .day-card').forEach(card => {
      const dayText = card.querySelector('.day-number')?.textContent || '';
      const m = dayText.match(/(\d+)/);
      if(!m) return;
      const decision = decisions[m[1]];
      if(!decision) return;
      addRouteBadgeToTitle(card.querySelector('.day-head'),decision);
      const body = card.querySelector('.plan-day-body');
      if(!body) return;
      const overview = body.querySelector('.plan-day-overview');
      addOverviewBadges(overview,decision,'plan');
      if(card.dataset.dayDecisionAttached) return;
      const block = dayDecisionBlock(decision,'plan');
      if(overview) overview.insertAdjacentHTML('afterend',block);
      else body.insertAdjacentHTML('afterbegin',block);
      card.dataset.dayDecisionAttached='1';
    });
    const riskSection=[...app?.querySelectorAll('#plan-mode-panel .section')||[]].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
    if(riskSection) riskSection.hidden = true;
  };

  const renderExecution = () => {
    app?.querySelectorAll('#execution-mode-panel .execution-day').forEach(card => {
      const dayNo = card.dataset.day;
      const decision = decisions[dayNo];
      if(!decision) return;
      addRouteBadgeToTitle(card.querySelector('.execution-day-header'),decision);
      const summary = card.querySelector('.exec-day-summary');
      addOverviewBadges(summary,decision,'execution');
      if(card.dataset.dayDecisionAttached) return;
      const block = dayDecisionBlock(decision,'execution');
      if(summary) summary.insertAdjacentHTML('afterend',block);
      else card.querySelector('.exec-day-body')?.insertAdjacentHTML('afterbegin',block);
      card.dataset.dayDecisionAttached='1';
    });
  };

  const apply = () => { renderPlan(); renderExecution(); };
  apply();
  const observer = new MutationObserver(apply);
  observer.observe(app,{childList:true,subtree:true});
}

function escDayDecision(v=''){
  return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
}
function routePill(route){
  if(!route?.id) return '';
  return `<span class="day-decision-target">${escDayDecision(route.id)}</span>`;
}
function alternativeTitle(alt){
  if(alt.target_route_id){
    const prefix = alt.kind==='day_swap' && alt.target_day ? `Day${escDayDecision(alt.target_day)} ` : '';
    return `${prefix}${escDayDecision(alt.target_route_label||alt.target_route_id)}`;
  }
  if(Array.isArray(alt.target_routes) && alt.target_routes.length){
    return alt.target_routes.map((r,i)=>`Day${escDayDecision((alt.target_days||[])[i]||'')} ${escDayDecision(r.label||r.id)}`).join(' / ');
  }
  return '代替案';
}
function alternativeRoutePills(alt){
  if(alt.target_route_id) return routePill({id:alt.target_route_id});
  if(Array.isArray(alt.target_routes)) return alt.target_routes.map(routePill).join('');
  return '';
}
function dayDecisionBlock(decision,mode){
  const alts=(decision.alternatives||[]).map(alt=>{
    const conditions=(alt.switch_conditions||[]).map(x=>`<li>${escDayDecision(x)}</li>`).join('');
    const title=alternativeTitle(alt);
    const targets=alternativeRoutePills(alt);
    return `<article class="day-alt-card">
      <div class="day-alt-head"><strong>${title}</strong><div class="day-alt-targets">${targets}</div></div>
      ${alt.description?`<p class="day-alt-description">${escDayDecision(alt.description)}</p>`:''}
      <div class="day-alt-condition-label">切替条件</div>
      <ul>${conditions}</ul>
      ${mode==='execution'?'<div class="day-alt-eval">当日判定：未確認</div>':''}
    </article>`;
  }).join('');
  if(!alts) return '';
  return `<section class="day-decision-block">
    <div class="day-alternative-part"><h4>代替条件</h4><div class="day-alt-grid">${alts}</div></div>
  </section>`;
}
