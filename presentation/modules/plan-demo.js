import {
  addBaseRouteBadge,
  buildPlanDayViewModel,
  renderDayAlternatives,
  renderDayOverview,
  syncRouteTabs
} from './day-viewmodel.js';

const qsPlan = new URLSearchParams(location.search);
const planType = qsPlan.get('type');
const planId = qsPlan.get('id');
if (planType === 'plan' && planId) initPlanView();

const escPlan = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const impactPlan = (v='') => ({high:'高',medium:'中',low:'低'}[v] || v);

function planInternalChevron(){
  return `<svg class="plan-ref-chevron" viewBox="0 0 54 24" fill="none" aria-hidden="true"><path d="M2 4l8 8-8 8"/><path d="M18 4l8 8-8 8"/><path d="M34 4l8 8-8 8"/></svg>`;
}

function planMainRouteCard(ref,published){
  const key=`${ref?.type||'route'}:${ref?.id||''}`;
  const content=`<span class="plan-main-route-kind">主役Route</span><strong>${escPlan(ref?.label||ref?.id||'')}</strong>${planInternalChevron()}`;
  return published.has(key)
    ? `<a class="plan-main-route-card" href="?type=${encodeURIComponent(ref?.type||'route')}&id=${encodeURIComponent(ref?.id||'')}">${content}</a>`
    : `<span class="plan-main-route-card is-disabled">${content}</span>`;
}

function enhanceTripValue(section,value={}){
  if(!section) return;
  const heading=section.querySelector(':scope > h2');
  if(!heading) return;

  const highlights=Array.isArray(value.highlights)?value.highlights:[];
  const keyRows=[
    ['旅の流れ',value.flow],
    ['体験の幅',value.diversity],
    ['移動効率',value.travel_efficiency],
    ['トレードオフ',Array.isArray(value.tradeoffs)?value.tradeoffs.join(' / '):value.tradeoffs]
  ].filter(([,text])=>text);

  [...section.children].filter(node=>node!==heading).forEach(node=>node.remove());
  section.insertAdjacentHTML('beforeend',`
    ${value.summary?`<p class="plan-value-summary">${escPlan(value.summary)}</p>`:''}
    ${highlights.length?`<div class="plan-value-highlights">${highlights.map(text=>`<article>${escPlan(text)}</article>`).join('')}</div>`:''}
    ${keyRows.length?`<div class="plan-value-key-wrap"><h3>旅の要点</h3><div class="plan-value-key-grid">${keyRows.map(([label,text])=>`<article><span>${escPlan(label)}</span><p>${escPlan(text)}</p></article>`).join('')}</div></div>`:''}
  `);
}

function routeStopsHtml(refs=[],published){
  if(!refs.length) return '<div class="plan-route-empty">立ち寄り順はRouteページで確認できます。</div>';
  const refHtml=(ref)=>{
    const key=`${ref?.type||'spot'}:${ref?.id||''}`;
    const label=escPlan(ref?.label||ref?.id||'');
    return published.has(key)
      ? `<a href="?type=${encodeURIComponent(ref.type||'spot')}&id=${encodeURIComponent(ref.id||'')}">${label}</a>`
      : label;
  };
  return `<div class="route-stops vertical plan-route-stops">${refs.map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span><span class="plan-route-stop-main">${refHtml(x)}</span></span>`).join('')}</div>`;
}

function routeSequence(routeData,routeId,fallback=[]){
  const data=routeData.get(routeId);
  const sequence=data?.route?.sequence;
  return Array.isArray(sequence)&&sequence.length ? sequence : fallback;
}

function makePlanCollapsible(section,open=true){
  if(!section || section.dataset.planCollapsible==='1') return;
  const headingHost=section.querySelector(':scope > h2') || section.querySelector(':scope > .section-heading');
  const title=headingHost?.matches('h2') ? headingHost : headingHost?.querySelector('h2');
  if(!headingHost || !title) return;
  section.dataset.planCollapsible='1';
  section.classList.add('plan-collapsible');

  const body=document.createElement('div');
  body.className='plan-collapsible-body';
  [...section.children].filter(x=>x!==headingHost).forEach(x=>body.appendChild(x));
  section.appendChild(body);

  headingHost.classList.add('plan-toggle-heading');
  headingHost.setAttribute('role','button');
  headingHost.setAttribute('tabindex','0');
  const apply=(nextOpen)=>{
    section.classList.toggle('is-collapsed',!nextOpen);
    body.hidden=!nextOpen;
    headingHost.setAttribute('aria-expanded',nextOpen?'true':'false');
  };
  const toggle=()=>apply(headingHost.getAttribute('aria-expanded')!=='true');
  headingHost.addEventListener('click',toggle);
  headingHost.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}
  });
  apply(open);
}

function makeDayToggle(card){
  const header=card.querySelector(':scope > .day-head');
  if(!header || card.dataset.dayToggle==='1') return;
  card.dataset.dayToggle='1';

  const body=document.createElement('div');
  body.className='plan-day-body';
  while(header.nextSibling) body.appendChild(header.nextSibling);
  card.appendChild(body);
  body.hidden=true;

  header.classList.add('plan-day-toggle');
  header.setAttribute('role','button');
  header.setAttribute('tabindex','0');
  header.setAttribute('aria-expanded','false');
  header.insertAdjacentHTML('beforeend','<span class="plan-day-toggle-icon" aria-hidden="true"></span>');
  const toggle=()=>{
    const open=body.hidden;
    body.hidden=!open;
    header.setAttribute('aria-expanded',open?'true':'false');
    card.classList.toggle('is-open',open);
  };
  header.addEventListener('click',toggle);
  header.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}
  });
}

function addRouteSwitcher(flow,item,routeData,published){
  const primary=flow.route_ref;
  if(!primary?.id) return;
  const alternatives=flow.alternative_route_refs||[];
  const existingStops=item.querySelector('.route-stops');
  if(!existingStops) return;

  const options=[primary,...alternatives];
  const sequences=new Map();
  sequences.set(primary.id,flow.ordered_spot_refs||routeSequence(routeData,primary.id,[]));
  alternatives.forEach(alt=>sequences.set(alt.id,routeSequence(routeData,alt.id,[])));

  const host=document.createElement('div');
  host.className='plan-route-choice';
  const tabs=document.createElement('div');
  tabs.className='plan-route-tabs';
  tabs.setAttribute('role','tablist');
  const panel=document.createElement('div');
  panel.className='plan-route-panel';

  options.forEach((opt,index)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className=`plan-route-tab${index===0?' active':''}`;
    button.setAttribute('role','tab');
    button.setAttribute('aria-selected',index===0?'true':'false');
    button.textContent=index===0?`基本｜${opt.label||opt.id}`:`代替｜${opt.label||opt.id}`;
    button.addEventListener('click',()=>{
      tabs.querySelectorAll('.plan-route-tab').forEach(x=>{
        x.classList.remove('active');
        x.setAttribute('aria-selected','false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected','true');
      panel.innerHTML=routeStopsHtml(sequences.get(opt.id)||[],published);
    });
    tabs.appendChild(button);
  });

  panel.innerHTML=routeStopsHtml(sequences.get(primary.id)||[],published);
  host.append(tabs,panel);
  existingStops.replaceWith(host);
}

function enhanceDay(card,day,routeData,published){
  makeDayToggle(card);
  const body=card.querySelector('.plan-day-body');
  if(!body) return;

  const vm=buildPlanDayViewModel(day);
  const oldTime=body.querySelector('.day-time');
  if(oldTime) oldTime.remove();
  const oldEndpoints=body.querySelector('.day-endpoints');
  if(oldEndpoints) oldEndpoints.remove();

  body.insertAdjacentHTML('afterbegin',renderDayOverview(vm));
  const altHtml=renderDayAlternatives(vm,'plan');
  if(altHtml){
    const overview=body.querySelector('.plan-day-overview');
    overview?.insertAdjacentHTML('afterend',altHtml);
  }

  addBaseRouteBadge(card.querySelector('.day-head'),vm);
  const items=[...body.querySelectorAll(':scope > .flow-list > .flow-item')];
  (day.flow||[]).forEach((flow,index)=>{
    const item=items[index];
    if(!item) return;
    item.dataset.flowId=flow.flow_id||'';
    item.dataset.flowType=flow.type||'';
    if(flow.type==='route') addRouteSwitcher(flow,item,routeData,published);
  });
  syncRouteTabs(card,vm,'plan');
}

function addPlanTailSections(plan,app,itinerary){
  const breakdown=plan.estimated_cost?.breakdown||[];
  let costSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='費用の内訳');
  if(breakdown.length && !costSection){
    itinerary.insertAdjacentHTML('afterend',`<section class="section plan-demo-section plan-cost"><h2>費用の内訳</h2><div class="plan-cost-grid">${breakdown.map(x=>`<div>${escPlan(x)}</div>`).join('')}</div></section>`);
    costSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='費用の内訳');
  }

  const risks=plan.risks||[];
  let riskSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
  if(risks.length && !riskSection){
    const rows=risks.map(risk=>`<li><span class="plan-impact impact-${escPlan(risk.impact||'medium')}">${escPlan(impactPlan(risk.impact||''))}</span><strong>${escPlan(risk.risk||'')}</strong>${risk.mitigation?`<div class="flow-note">対策: ${escPlan(risk.mitigation)}</div>`:''}</li>`).join('');
    const anchor=costSection||itinerary;
    anchor.insertAdjacentHTML('afterend',`<section class="section plan-demo-section plan-risk"><h2>変動要素・リスク</h2><ul class="list">${rows}</ul></section>`);
    riskSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
  }

  makePlanCollapsible(costSection,false);
  makePlanCollapsible(riskSection,false);
}

function enhancePlan(planData,app,routeData,published){
  if(app.dataset.planViewAttached==='1') return;
  const hero=app.querySelector('.hero');
  const itinerary=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='日ごとの旅程');
  if(!hero || !itinerary) return;
  app.dataset.planViewAttached='1';

  const value=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の価値');
  const stars=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の主役');

  enhanceTripValue(value,planData.plan?.trip_value||{});
  if(stars && (planData.hero_refs||[]).length){
    const oldCards=stars.querySelector('.cards');
    const html=`<div class="plan-main-route-grid">${planData.hero_refs.map(ref=>planMainRouteCard(ref,published)).join('')}</div>`;
    if(oldCards) oldCards.outerHTML=html;
    else stars.insertAdjacentHTML('beforeend',html);
  }

  makePlanCollapsible(value,false);
  makePlanCollapsible(stars,true);
  makePlanCollapsible(itinerary,true);

  const cards=[...itinerary.querySelectorAll('.day-card')];
  (planData.plan?.days||[]).forEach((day,index)=>{
    const card=cards[index];
    if(card) enhanceDay(card,day,routeData,published);
  });

  addPlanTailSections(planData.plan||{},app,itinerary);
}

async function initPlanView(){
  let planData,manifest;
  try{
    const [planResponse,manifestResponse]=await Promise.all([
      fetch(`./data/plans/${encodeURIComponent(planId)}.json`,{cache:'no-store'}),
      fetch('./manifest.json',{cache:'no-store'})
    ]);
    if(!planResponse.ok) return;
    planData=await planResponse.json();
    manifest=manifestResponse.ok ? await manifestResponse.json() : {items:[]};
  }catch{return;}

  const routeIds=new Set();
  for(const day of planData.plan?.days||[]){
    for(const flow of day.flow||[]){
      if(flow.type!=='route') continue;
      if(flow.route_ref?.id) routeIds.add(flow.route_ref.id);
      for(const alt of flow.alternative_route_refs||[]) if(alt.id) routeIds.add(alt.id);
    }
  }

  const routeData=new Map();
  await Promise.all([...routeIds].map(async routeId=>{
    try{
      const response=await fetch(`./data/routes/${encodeURIComponent(routeId)}.json`,{cache:'no-store'});
      if(response.ok) routeData.set(routeId,await response.json());
    }catch{}
  }));

  const published=new Set((manifest.items||[]).map(x=>`${x.type}:${x.id}`));
  const app=document.querySelector('#app');
  const attach=()=>{
    if(!app) return false;
    const itinerary=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='日ごとの旅程');
    if(!itinerary) return false;
    enhancePlan(planData,app,routeData,published);
    return true;
  };
  if(attach()) return;
  const observer=new MutationObserver(()=>{
    if(attach()) observer.disconnect();
  });
  observer.observe(app,{childList:true,subtree:true});
}
