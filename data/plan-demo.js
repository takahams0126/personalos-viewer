const qsPlan = new URLSearchParams(location.search);
const planType = qsPlan.get('type');
const planId = qsPlan.get('id');
if (planType === 'plan' && planId === 'P001') initPlanDemo();

const escPlan = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const transportLabel = (v='') => ({air_and_rental_car:'飛行機＋レンタカー',air:'飛行機',rental_car:'レンタカー',train:'電車',bus:'バス'}[v] || String(v).replaceAll('_',' '));
const rolePlan = (v='') => ({primary:'主役',main:'主役',core:'主役',stopover:'立ち寄り',lodging:'宿泊',dinner:'夕食',onsen:'温泉',optional:'任意',support:'補助',high_priority:'高優先',main_lunch:'昼食',condition_high:'条件付き',fallback_onsen:'代替温泉'}[v] || String(v).replaceAll('_',' '));
const priorityPlan = (v='') => ({primary:'優先',secondary:'次点',high:'高',medium:'中',low:'低',optional:'任意'}[v] || String(v).replaceAll('_',' '));
const impactPlan = (v='') => ({high:'高',medium:'中',low:'低'}[v] || v);

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

function makeDayToggle(card){
  const header = card.querySelector(':scope > .day-head');
  if(!header || card.dataset.dayToggle) return;
  card.dataset.dayToggle='1';
  const body = document.createElement('div');
  body.className='plan-day-body';
  while(header.nextSibling) body.appendChild(header.nextSibling);
  card.appendChild(body);
  body.hidden=true;
  header.classList.add('plan-day-toggle');
  header.setAttribute('role','button');
  header.setAttribute('tabindex','0');
  header.setAttribute('aria-expanded','false');
  header.insertAdjacentHTML('beforeend','<span class="plan-day-toggle-icon" aria-hidden="true">⌄</span>');
  const toggle=()=>{
    const open=body.hidden;
    body.hidden=!open;
    header.setAttribute('aria-expanded',open?'true':'false');
    card.classList.toggle('is-open',open);
  };
  header.addEventListener('click',toggle);
  header.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}});
}

function enhancePlan(data,extra,app,hero,itinerary,routeData,published){
  const p=data.plan||{};
  hero.classList.add('plan-demo-hero');
  itinerary.classList.add('plan-demo-itinerary');

  const primary=extra.transport?.primary;
  const alternatives=extra.transport?.alternatives||[];
  if(primary||alternatives.length){
    hero.insertAdjacentHTML('afterend',`<section class="plan-demo-facts">${primary?`<div><span>主な移動</span><strong>${escPlan(transportLabel(primary))}</strong></div>`:''}${alternatives.length?`<div><span>代替移動</span><strong>${alternatives.map(x=>escPlan(transportLabel(x))).join(' / ')}</strong></div>`:''}</section>`);
  }

  // Planの設計メタ情報はPublic Viewerへ出さない。
  [...app.querySelectorAll('.section')].filter(x=>['旅を成立させる設計','このPlanの確定度'].includes(x.querySelector('h2')?.textContent.trim())).forEach(x=>x.remove());

  // 計画Planでは全体Mapを持たず、Day内のRoute選択を中心に見せる。
  [...app.querySelectorAll('.section')].filter(x=>x.querySelector('h2')?.textContent.trim()==='旅全体の地図').forEach(x=>x.remove());

  const days=p.days||[];
  const dayCards=[...itinerary.querySelectorAll('.day-card')];
  dayCards.forEach((card,dayIndex)=>{
    const day=days[dayIndex]; if(!day) return;
    const items=[...card.querySelectorAll('.flow-item')];
    items.forEach((item,itemIndex)=>{
      const flow=day.flow?.[itemIndex]; if(!flow) return;
      const title=item.querySelector('.flow-title');
      const ref=flow.spot_ref||flow.route_ref||{};
      const role=ref.role||flow.role;
      const priority=ref.priority||flow.priority;
      if(title&&role) title.insertAdjacentHTML('beforeend',`<span class="plan-flow-badge role">${escPlan(rolePlan(role))}</span>`);
      if(title&&priority) title.insertAdjacentHTML('beforeend',`<span class="plan-flow-badge priority">${escPlan(priorityPlan(priority))}</span>`);
      if(flow.type==='route') addRouteSwitcher(flow,item,routeData,published);
    });
    const notes=extra.day_notes?.[String(day.day)]||[];
    if(notes.length) card.insertAdjacentHTML('beforeend',`<div class="plan-day-notes"><span>補足</span><ul>${notes.map(x=>`<li>${escPlan(x)}</li>`).join('')}</ul></div>`);
    makeDayToggle(card);
  });

  const breakdown=p.estimated_cost?.breakdown||[];
  if(breakdown.length){
    const costHtml=`<section class="section plan-demo-section plan-cost"><h2>費用の内訳</h2><div class="plan-cost-grid">${breakdown.map(x=>`<div>${escPlan(x)}</div>`).join('')}</div></section>`;
    itinerary.insertAdjacentHTML('afterend',costHtml);
  }

  const riskSection=[...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='変動要素・リスク');
  if(riskSection){
    riskSection.classList.add('plan-open-block');
    const rows=[...riskSection.querySelectorAll('li')];
    (p.risks||[]).forEach((risk,index)=>{
      const row=rows[index]; if(!row||!risk.impact) return;
      row.insertAdjacentHTML('afterbegin',`<span class="plan-impact impact-${escPlan(risk.impact)}">${escPlan(impactPlan(risk.impact))}</span>`);
    });
  }
}
