import { buildPlanDayViewModel, renderDayOverviewInner, renderDayAlternatives, addBaseRouteBadge, syncRouteTabs } from './day-viewmodel.js?v=20260915-29';

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

  const vmFor = dayNo => buildPlanDayViewModel(planDays[String(dayNo)]||{},decisions[String(dayNo)]||null);

  const renderPlan = () => {
    app?.querySelectorAll('#plan-mode-panel .day-card').forEach(card => {
      const dayText = card.querySelector('.day-number')?.textContent || '';
      const m = dayText.match(/(\d+)/);
      if(!m) return;
      const vm = vmFor(m[1]);
      if(!vm.day) return;

      addBaseRouteBadge(card.querySelector('.day-head'),vm);
      syncRouteTabs(card,vm,'plan');

      const body = card.querySelector('.plan-day-body');
      if(!body) return;
      const overview = body.querySelector('.plan-day-overview');
      if(overview) overview.innerHTML=renderDayOverviewInner(vm);

      // Plan owns the canonical day decision presentation here.
      // Replace any earlier simplified alternative block produced from route refs only,
      // so switch_conditions from the validated decision fixture are always visible.
      const existing=card.querySelector('.day-decision-block');
      const block=renderDayAlternatives(vm,'plan');
      if(block){
        existing?.remove();
        if(overview) overview.insertAdjacentHTML('afterend',block);
        else body.insertAdjacentHTML('afterbegin',block);
      }else{
        existing?.remove();
      }
      card.dataset.dayDecisionAttached='1';
    });

    const riskSection=[...app?.querySelectorAll('#plan-mode-panel .section')||[]].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
    if(riskSection) riskSection.hidden = true;
  };

  const renderExecution = () => {
    app?.querySelectorAll('#execution-mode-panel .execution-day').forEach(card => {
      const dayNo = card.dataset.day;
      const vm = vmFor(dayNo);
      if(!vm.day) return;

      addBaseRouteBadge(card.querySelector('.execution-day-header'),vm);
      syncRouteTabs(card,vm,'execution');

      const overview=card.querySelector('.exec-day-overview');
      if(overview) overview.innerHTML=renderDayOverviewInner(vm);

      let decisionBlock=card.querySelector('.day-decision-block');
      const block=renderDayAlternatives(vm,'execution');
      if(block && !decisionBlock){
        if(overview) overview.insertAdjacentHTML('afterend',block);
        else card.querySelector('.exec-day-body')?.insertAdjacentHTML('afterbegin',block);
        decisionBlock=card.querySelector('.day-decision-block');
      }

      const summary=card.querySelector('.exec-day-summary');
      if(summary){
        summary.classList.add('exec-day-summary-separated');
        if(decisionBlock) decisionBlock.insertAdjacentElement('afterend',summary);
        else if(overview) overview.insertAdjacentElement('afterend',summary);
      }
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
