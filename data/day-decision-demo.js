const qsDayDecision = new URLSearchParams(location.search);
if (qsDayDecision.get('type') === 'plan' && qsDayDecision.get('id') === 'P001') initDayDecisionDemo();

async function initDayDecisionDemo(){
  let extra, planData;
  try{
    const [r,p] = await Promise.all([
      fetch('./data/plan-demo.json',{cache:'no-store'}),
      fetch('./data/plans/P001.json',{cache:'no-store'})
    ]);
    if(!r.ok || !p.ok) return;
    [extra,planData] = await Promise.all([r.json(),p.json()]);
  }catch{return;}
  const decisions = extra.day_decisions || {};
  const planDays = Object.fromEntries((planData.plan?.days||[]).map(d=>[String(d.day),d]));
  const app = document.querySelector('#app');

  const addRouteBadgeToTitle = (header, decision) => {
    const route = decision?.base_route;
    if(!header || !route?.id || header.querySelector('.day-route-id-badge')) return;
    const title = header.querySelector('h3');
    if(!title) return;
    title.insertAdjacentHTML('beforeend',` <span class="day-route-id-badge" title="基本Route">${escDayDecision(route.id)}</span>`);
  };

  const syncPlanRouteTabs = (card, decision) => {
    const tabs = [...card.querySelectorAll('.plan-route-tab')];
    if(!tabs.length) return;
    const routeAlt = (decision.alternatives||[]).filter(x=>x.kind==='route_switch');
    tabs.forEach((tab,index)=>{
      let next='';
      if(index===0 && decision.base_route) next=`基本 [${decision.base_route.id}] ${decision.base_route.label}`;
      else {
        const alt=routeAlt[index-1];
        if(alt?.target_route_id) next=`代替 [${alt.target_route_id}] ${alt.target_route_label||alt.target_route_id}`;
      }
      if(next && tab.textContent!==next) tab.textContent=next;
    });
  };

  const syncExecutionVariantTabs = (card, decision) => {
    const tabs = [...card.querySelectorAll('.exec-variant-tab')];
    if(!tabs.length) return;
    const routeAlt = (decision.alternatives||[]).filter(x=>x.kind==='route_switch');
    tabs.forEach((tab,index)=>{
      let next='';
      if(index===0 && decision.base_route) next=`標準 [${decision.base_route.id}] ${decision.base_route.label}`;
      else {
        const alt=routeAlt[index-1];
        if(alt?.target_route_id) next=`代替 [${alt.target_route_id}] ${alt.target_route_label||alt.target_route_id}`;
      }
      if(next && tab.textContent!==next) tab.textContent=next;
    });
  };

  const syncExecutionOverview = (card, planDay) => {
    const overview = card.querySelector('.exec-day-overview');
    if(!overview || !planDay) return;
    const summary = overview.querySelector('.exec-day-summary') || card.querySelector('.exec-day-summary');
    const tb = planDay.time_budget || {};
    const topBadges = [
      tb.expected_total ? budgetTotalLabelDayDecision(tb.expected_total) : '',
      tb.preferred_start ? budgetStartLabelDayDecision(tb.preferred_start) : ''
    ].filter(Boolean);
    const constraints = tb.constraints || [];
    const description = planDay.summary || planDay.appeal || '';
    overview.innerHTML = `<div class="plan-day-subhead">1日の概要</div>
      ${topBadges.length?`<div class="plan-day-overview-badges">${topBadges.map(x=>`<span>${escDayDecision(x)}</span>`).join('')}</div>`:''}
      ${description?`<p>${escDayDecision(description)}</p>`:''}
      ${constraints.length?`<div class="plan-day-constraints">${constraints.map(x=>`<span>${escDayDecision(x)}</span>`).join('')}</div>`:''}`;
    if(summary){
      summary.classList.add('exec-day-summary-separated');
      card.dataset.pendingSummary='1';
      card._pendingExecutionSummary = summary;
    }
  };

  const placeExecutionSummary = (card, anchor) => {
    const summary = card._pendingExecutionSummary || card.querySelector('.exec-day-summary');
    if(!summary) return;
    const body = card.querySelector('.exec-day-body');
    if(anchor) anchor.insertAdjacentElement('afterend',summary);
    else body?.querySelector('.exec-day-overview')?.insertAdjacentElement('afterend',summary);
    delete card._pendingExecutionSummary;
    delete card.dataset.pendingSummary;
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
      syncPlanRouteTabs(card,decision);
      if(card.dataset.dayDecisionAttached) return;
      const block = dayDecisionBlock(decision,'plan');
      const overview = body.querySelector('.plan-day-overview');
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
      const planDay = planDays[dayNo];
      syncExecutionOverview(card,planDay);
      if(decision){
        addRouteBadgeToTitle(card.querySelector('.execution-day-header'),decision);
        syncExecutionVariantTabs(card,decision);
      }
      if(card.dataset.dayDecisionAttached){
        const existing = card.querySelector('.day-decision-block');
        placeExecutionSummary(card,existing);
        return;
      }
      let blockEl = null;
      if(decision){
        const block = dayDecisionBlock(decision,'execution');
        const overview = card.querySelector('.exec-day-overview');
        if(block){
          if(overview) overview.insertAdjacentHTML('afterend',block);
          else card.querySelector('.exec-day-body')?.insertAdjacentHTML('afterbegin',block);
          blockEl = card.querySelector('.day-decision-block');
        }
      }
      placeExecutionSummary(card,blockEl);
      card.dataset.dayDecisionAttached='1';
    });
  };

  const applyWhenReady = () => {
    const planPanel = app?.querySelector('#plan-mode-panel');
    const executionPanel = app?.querySelector('#execution-mode-panel');
    if(!planPanel || !executionPanel) return false;
    renderPlan();
    renderExecution();
    app.dataset.dayDecisionReady='1';
    return true;
  };

  if(applyWhenReady()) return;
  const observer = new MutationObserver(()=>{
    if(applyWhenReady()) observer.disconnect();
  });
  observer.observe(app,{childList:true,subtree:true});
}

function escDayDecision(v=''){
  return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
}
function budgetTotalLabelDayDecision(v=''){
  return ({'1day':'終日',long_day:'長時間',full_day:'終日'}[v] || String(v).replace('-','〜'));
}
function budgetStartLabelDayDecision(v=''){
  return ({morning:'朝出発',early_morning:'早朝出発',afternoon:'午後開始',evening:'夕方開始'}[v] || String(v).replaceAll('_',' '));
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
