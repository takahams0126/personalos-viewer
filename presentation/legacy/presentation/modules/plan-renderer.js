import {
  addBaseRouteBadge,
  buildPlanDayViewModel,
  renderDayAlternatives,
  renderDayOverview,
  syncRouteTabs
} from './day-viewmodel.js';
import {
  makeCollapsible,
  renderEntityRefCard
} from '../shared/component-contracts.js';

const qsPlan = new URLSearchParams(location.search);
const planType = qsPlan.get('type');
const planId = qsPlan.get('id');

const escPlan = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const impactPlan = (v='') => ({high:'高',medium:'中',low:'低'}[v] || v);
const rolePlan = (v='') => ({primary:'主役',main:'主役',core:'主役',stopover:'立ち寄り',lodging:'宿泊',dinner:'夕食',onsen:'温泉',optional:'任意',support:'補助',high_priority:'高優先',main_lunch:'昼食',condition_high:'条件付き',fallback_onsen:'代替温泉',transfer:'乗換・移動',end:'終点'}[v] || String(v).replaceAll('_',' '));
const priorityPlan = (v='') => ({primary:'優先',secondary:'次点',high:'高',medium:'中',low:'低',optional:'任意'}[v] || String(v).replaceAll('_',' '));
const pointTypePlan = (v='') => ({home:'自宅',station:'駅',airport:'空港',bus_stop:'バス停',parking:'駐車場',trailhead:'登山口',ferry_terminal:'フェリー乗り場',rental_car_office:'レンタカー営業所',operational_point:'運用地点',other:'その他'}[v] || String(v).replaceAll('_',' '));

function planMainRouteCard(ref,published){
  const key=`${ref?.type||'route'}:${ref?.id||''}`;
  return renderEntityRefCard({
    kind:'主役Route',
    title:ref?.label||ref?.id||'',
    href:`?type=${encodeURIComponent(ref?.type||'route')}&id=${encodeURIComponent(ref?.id||'')}`,
    disabled:!published.has(key)
  });
}

function enhanceTripValue(section,value={}){
  if(!section) return;
  const heading=section.querySelector(':scope > h2');
  if(!heading) return;
  const highlights=Array.isArray(value.highlights)?value.highlights:[];
  const keyRows=[['旅の流れ',value.flow],['体験の幅',value.diversity],['移動効率',value.travel_efficiency],['トレードオフ',Array.isArray(value.tradeoffs)?value.tradeoffs.join(' / '):value.tradeoffs]].filter(([,text])=>text);
  [...section.children].filter(node=>node!==heading).forEach(node=>node.remove());
  section.insertAdjacentHTML('beforeend',`${value.summary?`<p class="plan-value-summary">${escPlan(value.summary)}</p>`:''}${highlights.length?`<div class="plan-value-highlights">${highlights.map(text=>`<article>${escPlan(text)}</article>`).join('')}</div>`:''}${keyRows.length?`<div class="plan-value-key-wrap"><h3>旅の要点</h3><div class="plan-value-key-grid">${keyRows.map(([label,text])=>`<article><span>${escPlan(label)}</span><p>${escPlan(text)}</p></article>`).join('')}</div></div>`:''}`);
}

function refPlan(ref,published){
  const label=escPlan(ref?.label||ref?.id||'');
  const key=`${ref?.type||'spot'}:${ref?.id||''}`;
  return published.has(key)?`<a href="?type=${encodeURIComponent(ref?.type||'spot')}&id=${encodeURIComponent(ref?.id||'')}">${label}</a>`:label;
}
function endpointKey(ref){return ref ? `${ref.type||''}:${ref.id||''}` : '';}
function axisEndpointItem(ref,label,published,cls=''){
  if(!ref) return '';
  const pointType=ref.point_type?`<span class="plan-axis-type">${escPlan(pointTypePlan(ref.point_type))}</span>`:'';
  return `<li class="flow-item plan-axis-point plan-axis-destination ${cls}"><div class="flow-icon">●</div><div><div class="flow-title"><span class="plan-axis-kicker">${escPlan(label)}</span>${refPlan(ref,published)} ${pointType}</div></div></li>`;
}
function routeStopsHtml(refs=[],published){
  if(!refs.length) return '<div class="plan-route-empty">立ち寄り順はRouteページで確認できます。</div>';
  return `<div class="route-stops vertical plan-route-stops">${refs.map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span><span class="plan-route-stop-main">${refPlan(x,published)}</span></span>`).join('')}</div>`;
}
function routeSequence(routeData,routeId,fallback=[]){const data=routeData.get(routeId);const sequence=data?.route?.sequence;return Array.isArray(sequence)&&sequence.length ? sequence : fallback;}

function makeDayToggle(card){
  const header=card.querySelector(':scope > .day-head');if(!header || card.dataset.dayToggle==='1') return;card.dataset.dayToggle='1';
  const headerDetail=header.querySelector(':scope > div > p') || header.querySelector(':scope > p');headerDetail?.remove();
  const body=document.createElement('div');body.className='plan-day-body';while(header.nextSibling) body.appendChild(header.nextSibling);card.appendChild(body);body.hidden=true;
  header.classList.add('plan-day-toggle');header.setAttribute('role','button');header.setAttribute('tabindex','0');header.setAttribute('aria-expanded','false');header.insertAdjacentHTML('beforeend','<span class="plan-day-toggle-icon" aria-hidden="true"></span>');
  const toggle=()=>{const open=body.hidden;body.hidden=!open;header.setAttribute('aria-expanded',open?'true':'false');card.classList.toggle('is-open',open);};header.addEventListener('click',toggle);header.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
}

function addRouteSwitcher(flow,item,routeData,published){
  const primary=flow.route_ref;if(!primary?.id) return;const alternatives=flow.alternative_route_refs||[];const existingStops=item.querySelector('.route-stops');if(!existingStops) return;
  const options=[primary,...alternatives];const sequences=new Map();sequences.set(primary.id,flow.ordered_spot_refs||routeSequence(routeData,primary.id,[]));alternatives.forEach(alt=>sequences.set(alt.id,routeSequence(routeData,alt.id,[])));
  const host=document.createElement('div');host.className='plan-route-choice';const tabs=document.createElement('div');tabs.className='plan-route-tabs';tabs.setAttribute('role','tablist');const panel=document.createElement('div');panel.className='plan-route-panel';
  options.forEach((opt,index)=>{const button=document.createElement('button');button.type='button';button.className=`plan-route-tab${index===0?' active':''}`;button.setAttribute('role','tab');button.setAttribute('aria-selected',index===0?'true':'false');button.textContent=index===0?`基本｜${opt.label||opt.id}`:`代替｜${opt.label||opt.id}`;button.addEventListener('click',()=>{tabs.querySelectorAll('.plan-route-tab').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-selected','false');});button.classList.add('active');button.setAttribute('aria-selected','true');panel.innerHTML=routeStopsHtml(sequences.get(opt.id)||[],published);});tabs.appendChild(button);});
  panel.innerHTML=routeStopsHtml(sequences.get(primary.id)||[],published);host.append(tabs,panel);existingStops.replaceWith(host);
}

function localizeDestinationBadges(item,flow){
  const title=item.querySelector('.flow-title');if(!title) return;const subtle=title.querySelector('.badge.subtle');if(subtle && flow.destination_ref?.point_type) subtle.textContent=pointTypePlan(flow.destination_ref.point_type);const badges=[...title.querySelectorAll('.badge:not(.subtle)')];let index=0;if(flow.role && badges[index]) badges[index++].textContent=rolePlan(flow.role);if(flow.priority && badges[index]) badges[index++].textContent=priorityPlan(flow.priority);
}

function decorateDayAxis(body,day,published){
  const list=body.querySelector(':scope > .flow-list');if(!list || list.dataset.planAxis==='1') return;list.dataset.planAxis='1';list.classList.add('plan-axis');list.insertAdjacentHTML('beforebegin','<div class="plan-day-flow-heading"><span>1日のFlow</span></div>');list.insertAdjacentHTML('afterbegin',axisEndpointItem(day.start,'始点',published,'plan-axis-start'));
  const items=[...list.querySelectorAll(':scope > .flow-item:not(.plan-axis-point)')];(day.flow||[]).forEach((flow,index)=>{const item=items[index];if(!item) return;item.dataset.flowId=flow.flow_id||'';item.dataset.flowType=flow.type||'';if(flow.type==='transfer') item.classList.add('plan-axis-transfer');else if(flow.type==='destination'){item.classList.add('plan-axis-point','plan-axis-destination');localizeDestinationBadges(item,flow);}else if(flow.type==='route') item.classList.add('plan-axis-route');else if(flow.type==='free_time') item.classList.add('plan-axis-activity');});
  const lastFlow=(day.flow||[]).at(-1);const lastItem=items.at(-1);const lastRef=lastFlow?.type==='destination' ? lastFlow.destination_ref : null;if(lastItem && lastRef && endpointKey(lastRef)===endpointKey(day.end)) lastItem.classList.add('plan-axis-end');else list.insertAdjacentHTML('beforeend',axisEndpointItem(day.end,'終点',published,'plan-axis-end'));
}

function enhanceDay(card,day,routeData,published){
  makeDayToggle(card);const body=card.querySelector('.plan-day-body');if(!body) return;const vm=buildPlanDayViewModel(day);body.querySelector('.day-time')?.remove();body.querySelector('.day-endpoints')?.remove();body.insertAdjacentHTML('afterbegin',renderDayOverview(vm));const altHtml=renderDayAlternatives(vm,'plan');if(altHtml){const overview=body.querySelector('.plan-day-overview');overview?.insertAdjacentHTML('afterend',altHtml);}addBaseRouteBadge(card.querySelector('.day-head'),vm);decorateDayAxis(body,day,published);const items=[...body.querySelectorAll(':scope > .flow-list > .flow-item:not(.plan-axis-start):not(.plan-axis-end)')];(day.flow||[]).forEach((flow,index)=>{const item=items[index];if(item&&flow.type==='route') addRouteSwitcher(flow,item,routeData,published);});syncRouteTabs(card,vm,'plan');
}

function addPlanTailSections(plan,app,itinerary){
  const breakdown=plan.estimated_cost?.breakdown||[];let costSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='費用の内訳');if(breakdown.length && !costSection){itinerary.insertAdjacentHTML('afterend',`<section class="section plan-demo-section plan-cost"><h2>費用の内訳</h2><div class="plan-cost-grid">${breakdown.map(x=>`<div>${escPlan(x)}</div>`).join('')}</div></section>`);costSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='費用の内訳');}
  const risks=plan.risks||[];let riskSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');if(risks.length && !riskSection){const rows=risks.map(risk=>`<li><span class="plan-impact impact-${escPlan(risk.impact||'medium')}">${escPlan(impactPlan(risk.impact||''))}</span><strong>${escPlan(risk.risk||'')}</strong>${risk.mitigation?`<div class="flow-note">対策: ${escPlan(risk.mitigation)}</div>`:''}</li>`).join('');const anchor=costSection||itinerary;anchor.insertAdjacentHTML('afterend',`<section class="section plan-demo-section plan-risk"><h2>変動要素・リスク</h2><ul class="list">${rows}</ul></section>`);riskSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');}
  makeCollapsible(costSection,{open:false});makeCollapsible(riskSection,{open:false});
}

function enhancePlan(planData,app,routeData,published){
  if(app.dataset.planViewAttached==='1') return;
  const hero=app.querySelector('.hero');
  const itinerary=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='日ごとの旅程');
  if(!hero || !itinerary) return;
  app.dataset.planViewAttached='1';
  hero.classList.add('plan-demo-hero');
  hero.querySelector(':scope > .summary')?.classList.add('ui-hero-copy','is-summary');
  itinerary.classList.add('plan-demo-itinerary');
  const value=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の価値');
  const stars=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の主役');
  enhanceTripValue(value,planData.plan?.trip_value||{});
  if(stars && (planData.hero_refs||[]).length){const oldCards=stars.querySelector('.cards');const html=`<div class="plan-main-route-grid">${planData.hero_refs.map(ref=>planMainRouteCard(ref,published)).join('')}</div>`;if(oldCards) oldCards.outerHTML=html;else stars.insertAdjacentHTML('beforeend',html);}
  makeCollapsible(value,{open:false});makeCollapsible(stars,{open:true});makeCollapsible(itinerary,{open:true});
  const cards=[...itinerary.querySelectorAll('.day-card')];
  (planData.plan?.days||[]).forEach((day,index)=>{const card=cards[index];if(card) enhanceDay(card,day,routeData,published);});
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

  const published=new Set((manifest.items||[]).map(x=>`${x.type}:${x.id}`));
  const routeIds=new Set();
  for(const day of planData.plan?.days||[]){
    for(const flow of day.flow||[]){
      if(flow.type!=='route') continue;
      if(flow.route_ref?.id && published.has(`route:${flow.route_ref.id}`)) routeIds.add(flow.route_ref.id);
      for(const alt of flow.alternative_route_refs||[]) if(alt.id && published.has(`route:${alt.id}`)) routeIds.add(alt.id);
    }
  }
  const routeData=new Map();
  await Promise.all([...routeIds].map(async routeId=>{
    try{
      const response=await fetch(`./data/routes/${encodeURIComponent(routeId)}.json`,{cache:'no-store'});
      if(response.ok) routeData.set(routeId,await response.json());
    }catch{}
  }));

  const app=document.querySelector('#app');
  if(!app) return;
  const itinerary=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='日ごとの旅程');
  if(!itinerary) return;
  enhancePlan(planData,app,routeData,published);
}

if (planType === 'plan' && planId) initPlanView();
