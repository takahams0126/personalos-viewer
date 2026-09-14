const qsPlan = new URLSearchParams(location.search);
const planType = qsPlan.get('type');
const planId = qsPlan.get('id');
if (planType === 'plan' && planId === 'P001') initPlanDemo();

const escPlan = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const transportLabel = (v='') => ({air_and_rental_car:'飛行機＋レンタカー',air:'飛行機',rental_car:'レンタカー',train:'電車',bus:'バス',rental_car_and_mountain_access:'車＋登山アクセス'}[v] || String(v).replaceAll('_',' '));
const rolePlan = (v='') => ({primary:'主役',main:'主役',core:'主役',stopover:'立ち寄り',lodging:'宿泊',dinner:'夕食',onsen:'温泉',optional:'任意',support:'補助',high_priority:'高優先',main_lunch:'昼食',condition_high:'条件付き',fallback_onsen:'代替温泉',transfer:'乗換・移動',end:'終点'}[v] || String(v).replaceAll('_',' '));
const priorityPlan = (v='') => ({primary:'優先',secondary:'次点',high:'高',medium:'中',low:'低',optional:'任意'}[v] || String(v).replaceAll('_',' '));
const impactPlan = (v='') => ({high:'高',medium:'中',low:'低'}[v] || v);
const pointTypePlan = (v='') => ({home:'自宅',station:'駅',airport:'空港',bus_stop:'バス停',parking:'駐車場',trailhead:'登山口',ferry_terminal:'フェリー乗り場',rental_car_office:'レンタカー営業所',operational_point:'運用地点',other:'その他'}[v] || String(v).replaceAll('_',' '));
const budgetTotalLabel = (v='') => ({'1day':'終日',long_day:'長時間',full_day:'終日'}[v] || v.replace?.('-', '〜') || v);
const budgetStartLabel = (v='') => ({morning:'朝出発',early_morning:'早朝出発',afternoon:'午後開始',evening:'夕方開始'}[v] || v.replaceAll?.('_',' ') || v);
const badgeLabelPlan = (v='') => ({
  home:'自宅',station:'駅',airport:'空港',bus_stop:'バス停',parking:'駐車場',trailhead:'登山口',ferry_terminal:'フェリー乗り場',rental_car_office:'レンタカー営業所',operational_point:'運用地点',
  primary:'優先',secondary:'次点',optional:'任意',high:'高',medium:'中',low:'低',
  main:'主役',core:'主役',support:'補助',stopover:'立ち寄り',lodging:'宿泊',dinner:'夕食',onsen:'温泉',main_lunch:'昼食',high_priority:'高優先',condition_high:'条件付き',fallback_onsen:'代替温泉',transfer:'乗換・移動'
}[v] || v);

function planInternalChevron(){
  return `<svg class="plan-ref-chevron" viewBox="0 0 54 24" fill="none" aria-hidden="true"><path d="M2 4l8 8-8 8"/><path d="M18 4l8 8-8 8"/><path d="M34 4l8 8-8 8"/></svg>`;
}

function planMainRouteCard(ref,published){
  const key=`${ref?.type||'route'}:${ref?.id||''}`;
  const content=`<span class="plan-main-route-kind">主役Route</span><strong>${escPlan(ref?.label||ref?.id||'')}</strong>${planInternalChevron()}`;
  return published.has(key)
    ? `<a class="plan-main-route-card" href="?type=${encodeURIComponent(ref.type||'route')}&id=${encodeURIComponent(ref.id||'')}">${content}</a>`
    : `<span class="plan-main-route-card is-disabled">${content}</span>`;
}

async function initPlanDemo(){
  let planData, extra, manifest;
  try{
    const [p,e,m] = await Promise.all([
      fetch(`./data/plans/${encodeURIComponent(planId)}.json`,{cache:'no-store'}),
      fetch('./data/plan-demo.json',{cache:'no-store'}),
      fetch('./manifest.json',{cache:'no-store'})
    ]);
    if(!p.ok || !e.ok) return;
    planData = await p.json();
    extra = await e.json();
    manifest = m.ok ? await m.json() : {items:[]};
  }catch{return;}

  const routeIds = new Set();
  for(const day of planData.plan?.days || []){
    for(const flow of day.flow || []){
      if(flow.type !== 'route') continue;
      if(flow.route_ref?.id) routeIds.add(flow.route_ref.id);
      for(const alt of flow.alternative_route_refs || []) if(alt.id) routeIds.add(alt.id);
    }
  }
  const routeData = new Map();
  await Promise.all([...routeIds].map(async id=>{
    try{
      const res = await fetch(`./data/routes/${encodeURIComponent(id)}.json`,{cache:'no-store'});
      if(res.ok) routeData.set(id,await res.json());
    }catch{}
  }));

  const published = new Set((manifest.items||[]).map(x=>`${x.type}:${x.id}`));
  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    const itinerary = [...(app?.querySelectorAll('.section')||[])].find(x=>x.querySelector('h2')?.textContent.trim()==='日ごとの旅程');
    if(!hero || !itinerary || app.dataset.planDemoAttached) return false;
    app.dataset.planDemoAttached='1';
    enhancePlan(planData,extra,app,hero,itinerary,routeData,published);
    return true;
  };
  if(attach()) return;
  const observer = new MutationObserver(()=>{if(attach()) observer.disconnect();});
  observer.observe(app,{childList:true,subtree:true});
}

function refPlan(ref,published){
  const label = escPlan(ref?.label || ref?.id || '');
  const key = `${ref?.type||'spot'}:${ref?.id||''}`;
  return published.has(key)
    ? `<a href="?type=${encodeURIComponent(ref.type||'spot')}&id=${encodeURIComponent(ref.id||'')}">${label}</a>`
    : label;
}

function endpointKey(ref){
  if(!ref) return '';
  return `${ref.type||''}:${ref.id||''}`;
}

function endpointInlinePlan(ref,published){
  if(!ref) return '';
  if(ref.type==='route_endpoint') return refPlan(ref.route_ref||{},published);
  return refPlan(ref,published);
}

function localizeBadges(root){
  root?.querySelectorAll('.badge').forEach(el=>{
    const raw=el.textContent.trim();
    const localized=badgeLabelPlan(raw);
    if(localized!==raw) el.textContent=localized;
  });
}

function hasBadgeText(title,text){
  return [...(title?.querySelectorAll('.badge,.plan-flow-badge')||[])].some(x=>x.textContent.trim()===text);
}

function axisEndpointItem(ref,label,published,cls=''){
  if(!ref) return '';
  const pointType=ref.point_type?`<span class="plan-axis-type">${escPlan(pointTypePlan(ref.point_type))}</span>`:'';
  return `<li class="flow-item plan-axis-point ${cls}"><div class="flow-icon">●</div><div><div class="flow-title"><span class="plan-axis-kicker">${escPlan(label)}</span>${endpointInlinePlan(ref,published)} ${pointType}</div></div></li>`;
}

function routeSequenceFrom(data,fallback=[]){
  const seq = data?.route?.sequence;
  return Array.isArray(seq) && seq.length ? seq : fallback;
}

function routeStopsHtml(refs=[],published){
  if(!refs.length) return '<div class="plan-route-empty">立ち寄り順はRouteページで確認できます。</div>';
  return `<div class="route-stops vertical plan-route-stops">${refs.map((x,i)=>`<span class="route-stop"><span class="stop-no">${i+1}</span><span class="plan-route-stop-main">${refPlan(x,published)}${x.role?`<small class="plan-route-role">${escPlan(rolePlan(x.role))}</small>`:''}</span></span>`).join('')}</div>`;
}

function addRouteSwitcher(flow,item,routeData,published){
  const primary = flow.route_ref;
  const alternatives = flow.alternative_route_refs || [];
  if(!primary) return;
  const options = [primary,...alternatives];
  const existingStops = item.querySelector('.route-stops');
  if(!existingStops) return;

  const host = document.createElement('div');
  host.className = 'plan-route-choice';
  const tabs = document.createElement('div');
  tabs.className = 'plan-route-tabs';
  tabs.setAttribute('role','tablist');
  const panel = document.createElement('div');
  panel.className = 'plan-route-panel';

  const sequences = new Map();
  sequences.set(primary.id,flow.ordered_spot_refs || routeSequenceFrom(routeData.get(primary.id),[]));
  for(const alt of alternatives) sequences.set(alt.id,routeSequenceFrom(routeData.get(alt.id),[]));

  options.forEach((opt,index)=>{
    const btn = document.createElement('button');
    btn.type='button';
    btn.className=`plan-route-tab${index===0?' active':''}`;
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected',index===0?'true':'false');
    btn.textContent=index===0?`基本｜${opt.label||opt.id}`:`代替｜${opt.label||opt.id}`;
    btn.addEventListener('click',()=>{
      tabs.querySelectorAll('.plan-route-tab').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-selected','false');});
      btn.classList.add('active');
      btn.setAttribute('aria-selected','true');
      panel.innerHTML=routeStopsHtml(sequences.get(opt.id)||[],published);
    });
    tabs.appendChild(btn);
  });
  panel.innerHTML=routeStopsHtml(sequences.get(primary.id)||[],published);
  host.append(tabs,panel);
  existingStops.replaceWith(host);
}

function makePlanCollapsible(section,open=true){
  if(!section || section.dataset.planCollapsible==='1') return;
  const headingHost = section.querySelector(':scope > h2') || section.querySelector(':scope > .section-heading');
  const title = headingHost?.matches('h2') ? headingHost : headingHost?.querySelector('h2');
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
  const apply=nextOpen=>{
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
  const header = card.querySelector(':scope > .day-head');
  if(!header || card.dataset.dayToggle) return;
  card.dataset.dayToggle='1';

  const detail = header.querySelector(':scope > div > p') || header.querySelector(':scope > p');
  const body = document.createElement('div');
  body.className='plan-day-body';
  while(header.nextSibling) body.appendChild(header.nextSibling);
  if(detail){
    detail.classList.add('plan-day-detail');
    body.prepend(detail);
  }
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
  header.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
}

function flowOverrideHtml(nodes=[],published){
  return nodes.map(node=>{
    if(node.type==='transfer'){
      const mode=node.mode?` <span class="badge">${escPlan(transportLabel(node.mode))}</span>`:'';
      return `<li class="flow-item transfer plan-axis-transfer"><div class="flow-icon">↔</div><div><div class="flow-title">移動${mode}</div></div></li>`;
    }
    const isStart=node.type==='start', isEnd=node.type==='end';
    const kicker=isStart?'始点':isEnd?'終点':'目的地';
    const ref=node.ref||null;
    const name=ref?refPlan(ref,published):escPlan(node.label||'');
    const type=node.point_type?`<span class="plan-axis-type">${escPlan(pointTypePlan(node.point_type))}</span>`:'';
    const role=node.role?`<span class="plan-flow-badge role">${escPlan(rolePlan(node.role))}</span>`:'';
    const priority=node.priority?`<span class="plan-flow-badge priority">${escPlan(priorityPlan(node.priority))}</span>`:'';
    const activities=(node.activities||[]).length?`<div class="plan-axis-activities">${node.activities.map(x=>`<span>${escPlan(x)}</span>`).join('')}</div>`:'';
    const notes=(node.notes||[]).map(x=>`<div class="flow-note">${escPlan(x)}</div>`).join('');
    return `<li class="flow-item plan-axis-point plan-axis-destination${isStart?' plan-axis-start':''}${isEnd?' plan-axis-end':''}"><div class="flow-icon">●</div><div><div class="flow-title"><span class="plan-axis-kicker">${kicker}</span>${name} ${type}${role}${priority}</div>${activities}${notes}</div></li>`;
  }).join('');
}

function enhanceDayStructure(card,day,published,flowOverride=null){
  const body=card.querySelector('.plan-day-body');
  if(!body) return;

  const detail=body.querySelector('.plan-day-detail');
  const oldTime=body.querySelector('.day-time');
  const oldEndpoints=body.querySelector('.day-endpoints');
  const total=day.time_budget?.expected_total;
  const start=day.time_budget?.preferred_start;
  const constraints=day.time_budget?.constraints||[];
  const badges=[total?budgetTotalLabel(total):'',start?budgetStartLabel(start):''].filter(Boolean);

  const overview=document.createElement('section');
  overview.className='plan-day-overview';
  overview.innerHTML=`<div class="plan-day-subhead">1日の概要</div>${badges.length?`<div class="plan-day-overview-badges">${badges.map(x=>`<span>${escPlan(x)}</span>`).join('')}</div>`:''}${detail?`<p>${detail.innerHTML}</p>`:''}${constraints.length?`<div class="plan-day-constraints">${constraints.map(x=>`<span>${escPlan(x)}</span>`).join('')}</div>`:''}`;
  detail?.remove();
  oldTime?.remove();
  oldEndpoints?.remove();
  body.prepend(overview);

  const list=body.querySelector('.flow-list');
  if(!list) return;
  list.classList.add('plan-axis');
  list.insertAdjacentHTML('beforebegin','<div class="plan-day-flow-heading"><span>1日のFlow</span></div>');

  if(Array.isArray(flowOverride) && flowOverride.length){
    list.innerHTML=flowOverrideHtml(flowOverride,published);
    return;
  }

  list.insertAdjacentHTML('afterbegin',axisEndpointItem(day.start,'始点',published,'plan-axis-start'));
  const items=[...list.querySelectorAll(':scope > .flow-item:not(.plan-axis-point)')];
  (day.flow||[]).forEach((flow,index)=>{
    const item=items[index];
    if(!item) return;
    if(flow.type==='transfer'){
      item.classList.add('plan-axis-transfer');
      item.querySelector('.flow-detail')?.remove();
      const title=item.querySelector('.flow-title');
      if(title && flow.duration_estimate) title.insertAdjacentHTML('beforeend',`<span class="plan-axis-duration">${escPlan(flow.duration_estimate)}</span>`);
      const to=flow.to;
      const next=(day.flow||[])[index+1];
      const nextSpot=next?.spot_ref;
      const targetIsEnd=endpointKey(to) && endpointKey(to)===endpointKey(day.end);
      const representedByNext=to && ((nextSpot && endpointKey(nextSpot)===endpointKey(to)) || next?.type==='route' || next?.type==='activity');
      if(to && ['spot','travel_point'].includes(to.type) && !targetIsEnd && !representedByNext){
        item.insertAdjacentHTML('afterend',axisEndpointItem(to,'目的地',published,'plan-axis-destination'));
      }
    }else if(flow.type==='spot'){
      item.classList.add('plan-axis-destination');
    }else if(flow.type==='route'){
      item.classList.add('plan-axis-route');
    }else if(flow.type==='activity'){
      item.classList.add('plan-axis-activity');
    }
  });

  const lastFlow=(day.flow||[]).at(-1);
  const lastItem=[...list.querySelectorAll(':scope > .flow-item:not(.plan-axis-start)')].at(-1);
  const lastSpot=lastFlow?.spot_ref;
  if(lastSpot && endpointKey(lastSpot)===endpointKey(day.end) && lastItem){
    lastItem.classList.add('plan-axis-end');
    lastItem.querySelector('.flow-title')?.insertAdjacentHTML('afterbegin','<span class="plan-axis-kicker">終点</span>');
  }else{
    list.insertAdjacentHTML('beforeend',axisEndpointItem(day.end,'終点',published,'plan-axis-end'));
  }
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
  ].filter(([,v])=>v);
  [...section.children].filter(x=>x!==heading).forEach(x=>x.remove());
  section.insertAdjacentHTML('beforeend',`
    ${value.summary?`<p class="plan-value-summary">${escPlan(value.summary)}</p>`:''}
    ${highlights.length?`<div class="plan-value-highlights">${highlights.map(x=>`<article>${escPlan(x)}</article>`).join('')}</div>`:''}
    ${keyRows.length?`<div class="plan-value-key-wrap"><h3>旅の要点</h3><div class="plan-value-key-grid">${keyRows.map(([label,text])=>`<article><span>${escPlan(label)}</span><p>${escPlan(text)}</p></article>`).join('')}</div></div>`:''}`);
}

function enhancePlan(data,extra,app,hero,itinerary,routeData,published){
  const p=data.plan||{};
  hero.classList.add('plan-demo-hero');
  itinerary.classList.add('plan-demo-itinerary');

  const primary=extra.transport?.primary;
  const alternatives=extra.transport?.alternatives||[];
  if(primary||alternatives.length){
    hero.insertAdjacentHTML('beforeend',`<div class="plan-hero-meta">${primary?`<span><small>主な移動</small><strong>${escPlan(transportLabel(primary))}</strong></span>`:''}${alternatives.length?`<span><small>代替移動</small><strong>${alternatives.map(x=>escPlan(transportLabel(x))).join(' / ')}</strong></span>`:''}</div>`);
  }

  [...app.querySelectorAll('.section')].filter(x=>['旅を成立させる設計','このPlanの確定度'].includes(x.querySelector('h2')?.textContent.trim())).forEach(x=>x.remove());
  [...app.querySelectorAll('.section')].filter(x=>x.querySelector('h2')?.textContent.trim()==='旅全体の地図').forEach(x=>x.remove());

  const tripValue=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の価値');
  enhanceTripValue(tripValue,p.trip_value||{});

  const mainRoutes=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='この旅の主役');
  if(mainRoutes && (data.hero_refs||[]).length){
    const oldCards=mainRoutes.querySelector('.cards');
    const html=`<div class="plan-main-route-grid">${data.hero_refs.map(x=>planMainRouteCard(x,published)).join('')}</div>`;
    if(oldCards) oldCards.outerHTML=html;
    else mainRoutes.insertAdjacentHTML('beforeend',html);
  }

  const days=p.days||[];
  const dayCards=[...itinerary.querySelectorAll('.day-card')];
  dayCards.forEach((card,dayIndex)=>{
    const day=days[dayIndex]; if(!day) return;
    localizeBadges(card);
    const items=[...card.querySelectorAll('.flow-item')];
    items.forEach((item,itemIndex)=>{
      const flow=day.flow?.[itemIndex]; if(!flow) return;
      const title=item.querySelector('.flow-title');
      const ref=flow.spot_ref||flow.route_ref||{};
      const role=ref.role||flow.role;
      const priority=ref.priority||flow.priority;
      const roleText=rolePlan(role||'');
      const priorityText=priorityPlan(priority||'');
      if(title&&role&&!hasBadgeText(title,roleText)) title.insertAdjacentHTML('beforeend',`<span class="plan-flow-badge role">${escPlan(roleText)}</span>`);
      if(title&&priority&&!hasBadgeText(title,priorityText)) title.insertAdjacentHTML('beforeend',`<span class="plan-flow-badge priority">${escPlan(priorityText)}</span>`);
      if(flow.type==='route') addRouteSwitcher(flow,item,routeData,published);
    });
    const notes=extra.day_notes?.[String(day.day)]||[];
    if(notes.length) card.insertAdjacentHTML('beforeend',`<div class="plan-day-notes"><span>補足</span><ul>${notes.map(x=>`<li>${escPlan(x)}</li>`).join('')}</ul></div>`);
    makeDayToggle(card);
    enhanceDayStructure(card,day,published,extra.day_flow_overrides?.[String(day.day)]||null);
  });

  const breakdown=p.estimated_cost?.breakdown||[];
  if(breakdown.length){
    const costHtml=`<section class="section plan-demo-section plan-cost"><h2>費用の内訳</h2><div class="plan-cost-grid">${breakdown.map(x=>`<div>${escPlan(x)}</div>`).join('')}</div></section>`;
    itinerary.insertAdjacentHTML('afterend',costHtml);
  }

  const riskSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
  if(riskSection){
    const rows=[...riskSection.querySelectorAll('li')];
    (p.risks||[]).forEach((risk,index)=>{
      const row=rows[index]; if(!row||!risk.impact) return;
      row.insertAdjacentHTML('afterbegin',`<span class="plan-impact impact-${escPlan(risk.impact)}">${escPlan(impactPlan(risk.impact))}</span>`);
    });
  }

  const costSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='費用の内訳');
  makePlanCollapsible(tripValue,false);
  makePlanCollapsible(mainRoutes,true);
  makePlanCollapsible(itinerary,true);
  makePlanCollapsible(costSection,false);
  makePlanCollapsible(riskSection,false);
}
