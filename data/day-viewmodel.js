const esc=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

export const budgetTotalLabel=(v='')=>({'1day':'終日',long_day:'長時間',full_day:'終日'}[v]||String(v||'').replace('-','〜'));
export const budgetStartLabel=(v='')=>({morning:'朝出発',early_morning:'早朝出発',afternoon:'午後開始',evening:'夕方開始'}[v]||String(v||'').replaceAll('_',' '));

function routeRefFromPlanDay(planDay={}){
  const flow=(planDay.flow||[]).find(x=>x.type==='route'&&x.route_ref?.id);
  return flow?.route_ref?{id:flow.route_ref.id,label:flow.route_ref.label||flow.route_ref.id}:null;
}

function routeAlternativesFromPlanDay(planDay={}){
  const flow=(planDay.flow||[]).find(x=>x.type==='route');
  return (flow?.alternative_route_refs||[]).map(x=>({
    kind:'route_switch',
    target_route_id:x.id,
    target_route_label:x.label||x.id,
    description:null,
    switch_conditions:[]
  }));
}

export function buildPlanDayViewModel(planDay={},decision=null){
  const tb=planDay.time_budget||{};
  const topBadges=[
    tb.expected_total?budgetTotalLabel(tb.expected_total):'',
    tb.preferred_start?budgetStartLabel(tb.preferred_start):''
  ].filter(Boolean);
  const baseRoute=decision?.base_route||routeRefFromPlanDay(planDay);
  const alternatives=Array.isArray(decision?.alternatives)?decision.alternatives:routeAlternativesFromPlanDay(planDay);
  return {
    day:Number(planDay.day||0),
    title:planDay.purpose||'',
    overview:{
      badges:topBadges,
      description:planDay.summary||planDay.appeal||'',
      constraints:Array.isArray(tb.constraints)?tb.constraints:[]
    },
    baseRoute,
    alternatives,
    planDay
  };
}

export function overlayConcreteDay(planVM,concreteDay={},variantId=null){
  const variants=Array.isArray(concreteDay.variants)?concreteDay.variants:[];
  const active=variants.find(v=>v.id===variantId)||variants[0]||{id:'standard',summary:{},flow:[],map:null};
  return {
    ...planVM,
    execution:{
      feasibility:concreteDay.feasibility||'unknown',
      variants,
      activeVariant:active,
      summary:active.summary||{},
      flow:active.flow||[],
      map:active.map||null
    }
  };
}

export function renderDayOverviewInner(vm={}){
  const o=vm.overview||{};
  return `<div class="plan-day-subhead">1日の概要</div>
    ${(o.badges||[]).length?`<div class="plan-day-overview-badges">${o.badges.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}
    ${o.description?`<p>${esc(o.description)}</p>`:''}
    ${(o.constraints||[]).length?`<div class="plan-day-constraints">${o.constraints.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}`;
}

export function renderDayOverview(vm={},className='plan-day-overview'){
  return `<section class="${esc(className)}">${renderDayOverviewInner(vm)}</section>`;
}

function routePill(id){return id?`<span class="day-decision-target">${esc(id)}</span>`:'';}
function alternativeTitle(alt={}){
  if(alt.target_route_id){
    const prefix=alt.kind==='day_swap'&&alt.target_day?`Day${esc(alt.target_day)} `:'';
    return `${prefix}${esc(alt.target_route_label||alt.target_route_id)}`;
  }
  if(Array.isArray(alt.target_routes)&&alt.target_routes.length){
    return alt.target_routes.map((r,i)=>`Day${esc((alt.target_days||[])[i]||'')} ${esc(r.label||r.id)}`).join(' / ');
  }
  return '代替案';
}
function alternativePills(alt={}){
  if(alt.target_route_id)return routePill(alt.target_route_id);
  if(Array.isArray(alt.target_routes))return alt.target_routes.map(r=>routePill(r.id)).join('');
  return '';
}

export function renderDayAlternatives(vm={},mode='plan'){
  const alts=vm.alternatives||[];
  if(!alts.length)return'';
  const cards=alts.map(alt=>{
    const conditions=(alt.switch_conditions||[]).map(x=>`<li>${esc(x)}</li>`).join('');
    return `<article class="day-alt-card">
      <div class="day-alt-head"><strong>${alternativeTitle(alt)}</strong><div class="day-alt-targets">${alternativePills(alt)}</div></div>
      ${alt.description?`<p class="day-alt-description">${esc(alt.description)}</p>`:''}
      ${conditions?`<div class="day-alt-condition-label">切替条件</div><ul>${conditions}</ul>`:''}
      ${mode==='execution'?'<div class="day-alt-eval">当日判定：未確認</div>':''}
    </article>`;
  }).join('');
  return `<section class="day-decision-block"><div class="day-alternative-part"><h4>代替条件</h4><div class="day-alt-grid">${cards}</div></div></section>`;
}

export function addBaseRouteBadge(header,vm={}){
  const route=vm.baseRoute;
  if(!header||!route?.id||header.querySelector('.day-route-id-badge'))return;
  const title=header.querySelector('h3');
  if(!title)return;
  title.insertAdjacentHTML('beforeend',` <span class="day-route-id-badge" title="基本Route">${esc(route.id)}</span>`);
}

export function syncRouteTabs(card,vm={},mode='plan'){
  const selector=mode==='execution'?'.exec-variant-tab':'.plan-route-tab';
  const tabs=[...card.querySelectorAll(selector)];
  if(!tabs.length)return;
  const routeAlts=(vm.alternatives||[]).filter(x=>x.kind==='route_switch');
  tabs.forEach((tab,index)=>{
    let next='';
    if(index===0&&vm.baseRoute){
      next=`${mode==='execution'?'標準':'基本'} [${vm.baseRoute.id}] ${vm.baseRoute.label||vm.baseRoute.id}`;
    }else{
      const alt=routeAlts[index-1];
      if(alt?.target_route_id)next=`代替 [${alt.target_route_id}] ${alt.target_route_label||alt.target_route_id}`;
    }
    if(next&&tab.textContent!==next)tab.textContent=next;
  });
}

export {esc as escapeDayHtml};
