const qsPlan = new URLSearchParams(location.search);
const planType = qsPlan.get('type');
const planId = qsPlan.get('id');
if (planType === 'plan' && planId === 'P001') initPlanDemo();

const escPlan = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const transportLabel = (v='') => ({air_and_rental_car:'飛行機＋レンタカー',air:'飛行機',rental_car:'レンタカー',train:'電車',bus:'バス'}[v] || String(v).replaceAll('_',' '));
const rolePlan = (v='') => ({primary:'主役',main:'主役',core:'主役',lodging:'宿泊',dinner:'夕食',onsen:'温泉',optional:'任意',support:'補助'}[v] || String(v).replaceAll('_',' '));
const priorityPlan = (v='') => ({primary:'優先',secondary:'次点',high:'高',medium:'中',low:'低',optional:'任意'}[v] || String(v).replaceAll('_',' '));
const impactPlan = (v='') => ({high:'高',medium:'中',low:'低'}[v] || v);

function planFlowChevron(){
  return `<svg viewBox="0 0 34 24" fill="none" aria-hidden="true"><path d="M2 4l8 8-8 8"/><path d="M14 4l8 8-8 8"/></svg>`;
}

async function initPlanDemo(){
  let planData, extra;
  try{
    const [p,e] = await Promise.all([
      fetch(`./data/plans/${encodeURIComponent(planId)}.json`,{cache:'no-store'}),
      fetch('./data/plan-demo.json',{cache:'no-store'})
    ]);
    if(!p.ok || !e.ok) return;
    planData = await p.json(); extra = await e.json();
  }catch{return;}

  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    const itinerary = [...(app?.querySelectorAll('.section')||[])].find(x=>x.querySelector('h2')?.textContent.trim()==='日ごとの旅程');
    if(!hero || !itinerary || app.dataset.planDemoAttached) return false;
    app.dataset.planDemoAttached='1';
    enhancePlan(planData, extra, app, hero, itinerary);
    return true;
  };
  if(attach()) return;
  const observer = new MutationObserver(()=>{if(attach()) observer.disconnect();});
  observer.observe(app,{childList:true,subtree:true});
}

function enhancePlan(data, extra, app, hero, itinerary){
  const p = data.plan || {};
  hero.classList.add('plan-demo-hero');
  itinerary.classList.add('plan-demo-itinerary');

  const primary = extra.transport?.primary;
  const alternatives = extra.transport?.alternatives || [];
  if(primary || alternatives.length){
    const transportHtml = `<section class="plan-demo-facts">
      ${primary?`<div><span>主な移動</span><strong>${escPlan(transportLabel(primary))}</strong></div>`:''}
      ${alternatives.length?`<div><span>代替移動</span><strong>${alternatives.map(x=>escPlan(transportLabel(x))).join(' / ')}</strong></div>`:''}
    </section>`;
    hero.insertAdjacentHTML('afterend',transportHtml);
  }

  const tripValue = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の価値');
  const cert = extra.certainty || {};
  if((cert.fixed||[]).length || (cert.assumed||[]).length || (cert.variable||[]).length){
    const certaintyHtml = `<section class="section plan-demo-section plan-certainty"><h2>このPlanの確定度</h2><div class="plan-certainty-grid">
      ${certaintyCard('固定',cert.fixed,'fixed')}
      ${certaintyCard('仮置き',cert.assumed,'assumed')}
      ${certaintyCard('変動',cert.variable,'variable')}
    </div></section>`;
    (tripValue || hero).insertAdjacentHTML('afterend',certaintyHtml);
  }

  // Flow内のrole / priorityを小バッジで明示し、工程間はRouteと同系統の黄色chevronでつなぐ。
  const days = p.days || [];
  const dayCards = [...itinerary.querySelectorAll('.day-card')];
  dayCards.forEach((card,dayIndex)=>{
    const day = days[dayIndex]; if(!day) return;
    const items = [...card.querySelectorAll('.flow-item')];
    items.forEach((item,itemIndex)=>{
      const flow = day.flow?.[itemIndex]; if(!flow) return;
      const title = item.querySelector('.flow-title');
      const ref = flow.spot_ref || flow.route_ref || {};
      const role = ref.role || flow.role;
      const priority = ref.priority || flow.priority;
      if(title && role) title.insertAdjacentHTML('beforeend',`<span class="plan-flow-badge role">${escPlan(rolePlan(role))}</span>`);
      if(title && priority) title.insertAdjacentHTML('beforeend',`<span class="plan-flow-badge priority">${escPlan(priorityPlan(priority))}</span>`);
    });
    for(let i=items.length-2;i>=0;i--){
      items[i].insertAdjacentHTML('afterend',`<li class="plan-flow-arrow">${planFlowChevron()}</li>`);
    }
    const notes = extra.day_notes?.[String(day.day)] || [];
    if(notes.length) card.insertAdjacentHTML('beforeend',`<div class="plan-day-notes"><span>補足</span><ul>${notes.map(x=>`<li>${escPlan(x)}</li>`).join('')}</ul></div>`);
  });

  // 宿泊戦略のsummaryだけでなく、拠点としての具体的な使い方も表示する。
  const strategySection = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='旅を成立させる設計');
  const livingBase = p.strategies?.stay?.living_base || [];
  if(strategySection && livingBase.length){
    const stayCard = strategySection.querySelector('.strategy-grid .card');
    stayCard?.insertAdjacentHTML('beforeend',`<ul class="plan-living-base">${livingBase.map(x=>`<li>${escPlan(x)}</li>`).join('')}</ul>`);
  }

  // 金額未確定でも、何に費用が発生するPlanかは一覧できる。
  const breakdown = p.estimated_cost?.breakdown || [];
  if(breakdown.length){
    const costHtml = `<section class="section plan-demo-section plan-cost"><h2>費用の内訳</h2><div class="plan-cost-grid">${breakdown.map(x=>`<div>${escPlan(x)}</div>`).join('')}</div></section>`;
    (strategySection || itinerary).insertAdjacentHTML('afterend',costHtml);
  }

  // Risk impactは開発用コードではなく、利用者が判断するための重要度として表示する。
  const riskSection = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
  if(riskSection){
    const rows = [...riskSection.querySelectorAll('li')];
    (p.risks||[]).forEach((risk,index)=>{
      const row = rows[index]; if(!row || !risk.impact) return;
      row.insertAdjacentHTML('afterbegin',`<span class="plan-impact impact-${escPlan(risk.impact)}">${escPlan(impactPlan(risk.impact))}</span>`);
    });
  }
}

function certaintyCard(title,items=[],cls=''){
  if(!items?.length) return '';
  return `<article class="plan-certainty-card ${cls}"><h3>${escPlan(title)}</h3><ul>${items.map(x=>`<li>${escPlan(x)}</li>`).join('')}</ul></article>`;
}
