const q=new URLSearchParams(location.search);
const type=q.get('type');
const id=q.get('id');
const app=document.querySelector('#app');
const esc=(v='')=>String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

if(type&&id&&app){
  const attach=()=>{
    if(!app.children.length||app.querySelector('.loading')) return false;
    if(app.dataset.approvedLayout==='1') return true;
    app.dataset.approvedLayout='1';
    if(type==='plan') enhancePlan();
    else if(type==='route') enhanceRoute();
    else if(type==='spot') enhanceSpot();
    else if(type==='concrete_plan') enhanceConcrete();
    return true;
  };
  if(!attach()){
    const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});
    observer.observe(app,{childList:true,subtree:true});
  }
}

function findSection(title){
  return [...app.querySelectorAll(':scope > .section, :scope > details.section')].find(x=>{
    const h=x.querySelector(':scope > h2')||x.querySelector(':scope > summary');
    return h?.textContent.trim()===title;
  })||null;
}
function modeSwitch(){
  const node=app.querySelector('.mode-switch');
  if(!node)return;
  node.classList.remove('mode-switch');
  node.classList.add('plan-mode-switch');
  [...node.children].forEach(x=>x.classList.add('plan-mode-btn'));
}
function decorateFlow(root){
  root.querySelectorAll('.flow-list').forEach(x=>x.classList.add('plan-axis'));
  root.querySelectorAll('.flow-item').forEach(item=>{
    if(item.classList.contains('transfer')) item.classList.add('plan-axis-transfer');
    if(item.classList.contains('destination')) item.classList.add('plan-axis-point','plan-axis-destination');
    if(item.classList.contains('route')) item.classList.add('plan-axis-point','plan-axis-route');
    if(item.classList.contains('free-time')) item.classList.add('plan-axis-point');
  });
}
function enhanceDayCards(root){
  root.querySelectorAll('.day-card').forEach(card=>{
    const details=card.querySelector(':scope > details');
    if(!details)return;
    const summary=details.querySelector(':scope > summary');
    const body=details.querySelector(':scope > .day-card-body');
    if(summary){summary.classList.add('day-head','plan-day-toggle');summary.querySelector('.day-number')?.classList.add('plan-day-number');}
    if(body){body.classList.add('plan-day-body');const overview=body.querySelector('.day-overview');if(overview){overview.classList.add('plan-day-overview');overview.querySelector('h4')?.classList.add('plan-day-subhead');}}
    decorateFlow(card);
  });
}
function enhancePlan(){
  modeSwitch();
  const hero=app.querySelector('.hero');
  const meta=hero?.querySelector('.hero-meta');
  if(meta) meta.classList.add('plan-hero-meta');

  const value=findSection('この旅の価値');
  value?.classList.add('plan-demo-section','plan-collapsible');
  if(value){const body=value.querySelector('.collapsible-body');const summary=value.querySelector(':scope > summary');summary?.classList.add('plan-toggle-heading');body?.querySelector('p')?.classList.add('plan-value-summary');const cards=body?.querySelector('.cards');if(cards){cards.classList.add('plan-value-highlights');cards.querySelectorAll('.card').forEach(x=>x.classList.remove('card','value-card'));}const facts=body?.querySelector('.fact-grid');if(facts){facts.classList.add('plan-value-key-grid');facts.querySelectorAll('div').forEach(x=>x.classList.add('plan-value-key-card'));}}

  const stars=findSection('この旅の主役');
  stars?.classList.add('plan-demo-section');
  const starCards=stars?.querySelector('.cards');
  if(starCards){starCards.classList.add('plan-main-route-grid');starCards.querySelectorAll('.ref-card').forEach(card=>{card.classList.remove('card','ref-card');card.classList.add('plan-main-route-card');});}

  const itinerary=findSection('日ごとの旅程');
  itinerary?.classList.add('plan-demo-itinerary');
  enhanceDayCards(itinerary||app);
  itinerary?.querySelectorAll('.plan-route-choice').forEach(x=>{x.querySelector('.variant-tabs')?.classList.add('plan-route-tabs');x.querySelectorAll('.variant-tabs button').forEach(b=>b.classList.add('plan-route-tab'));x.querySelectorAll('.plan-route-choice-panel').forEach(p=>p.classList.add('plan-route-panel'));});

  const cost=findSection('費用の内訳');
  cost?.classList.add('plan-demo-section','plan-collapsible');
}

function enhanceRoute(){
  const hero=app.querySelector('.hero');
  hero?.classList.add('route-demo-hero');
  const facts=hero?.querySelector('.fact-grid');
  if(facts){facts.classList.add('route-hero-facts');}
  const appeal=findSection('このルートの魅力');
  appeal?.classList.add('route-demo-section','route-demo-value','route-collapsible');
  const appealBody=appeal?.querySelector('.collapsible-body');
  appealBody?.querySelector('p')?.classList.add('route-appeal-summary');
  const cards=appealBody?.querySelector('.cards');
  if(cards){cards.classList.add('route-demo-cards','primary');cards.querySelectorAll('.card').forEach(x=>x.classList.remove('card'));}
  for(const title of ['ルートの地図','立ち寄り順','重要な条件'])findSection(title)?.classList.add('route-demo-section','route-collapsible');
}

async function enhanceSpot(){
  let data;
  try{const r=await fetch(`./data/spots/${encodeURIComponent(id)}.json`,{cache:'no-store'});if(!r.ok)return;data=await r.json();}catch{return;}
  const s=data.spot||{},a=s.appeal||{},v=s.value||{},p=s.practicality||{},reviews=s.review_summary||{};
  const links=[...(s.official_url?[{label:'公式情報',url:s.official_url}]:[]),...(s.info_urls||[])];
  const list=items=>(items||[]).length?`<ul class="spot-demo-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';
  const cards=(items,cls)=>(items||[]).length?`<div class="spot-demo-cards spot-demo-cards-${cls}">${items.map(x=>`<article class="spot-demo-card ${cls}">${esc(x)}</article>`).join('')}</div>`:'';
  const chips=items=>(items||[]).length?`<div class="spot-chip-row">${items.map(x=>`<span class="spot-chip">${esc(x)}</span>`).join('')}</div>`:'';
  const imgs=(s.image_refs||[]).map(x=>typeof x==='string'?{url:x}:x).filter(x=>x?.url||x?.source_url||x?.image_url);
  const imageUrl=x=>x.url||x.source_url||x.image_url;
  const gallery=imgs.length?`<div class="spot-carousel" data-count="${imgs.length}"><div class="spot-carousel-stage" tabindex="0"><div class="spot-carousel-track">${imgs.map((img,i)=>`<figure class="spot-carousel-slide ${i===0?'active':''}" data-index="${i}"><img src="${esc(imageUrl(img))}" alt="${esc(img.caption||`${data.title} ${i+1}`)}"><figcaption><span>${esc(img.caption||'')}</span></figcaption></figure>`).join('')}</div>${imgs.length>1?`<button type="button" class="spot-carousel-nav prev">‹</button><button type="button" class="spot-carousel-nav next">›</button><div class="spot-carousel-count"><span class="current">1</span> / ${imgs.length}</div>`:''}</div>${imgs.length>1?`<div class="spot-carousel-thumbs">${imgs.map((img,i)=>`<button class="spot-carousel-thumb ${i===0?'active':''}" data-index="${i}"><img src="${esc(imageUrl(img))}" alt=""></button>`).join('')}</div>`:''}</div>`:'';
  app.innerHTML=`<section class="spot-demo-hero"><div class="spot-demo-hero-copy"><div class="kicker">スポット · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="spot-demo-summary">${esc(data.summary||'')}</p>${chips(a.themes||[])}${links.length?`<div class="spot-hero-links"><span class="spot-hero-links-label">公式・参考</span><div class="spot-hero-link-row">${links.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label||'参考情報')} ↗</a>`).join('')}</div></div>`:''}</div>${gallery}</section>${(s.highlights||[]).length||(a.strengths||[]).length?`<section class="section spot-demo-section"><h2>このスポットの魅力</h2>${cards(s.highlights||[],'highlight')}${a.strengths?.length?`<div class="spot-demo-sub"><h3>強み</h3>${list(a.strengths)}</div>`:''}</section>`:''}${a.user_fit?.length||(s.suitable_for||[]).length?`<section class="section spot-demo-section"><h2>こんな旅に向いている</h2>${cards(a.user_fit||[],'fit')}${chips(s.suitable_for||[])}</section>`:''}${v.value_points?.length?`<section class="section spot-demo-section"><h2>選ぶ価値</h2>${cards(v.value_points,'value')}</section>`:''}${reviews.positives?.length||reviews.cautions?.length||reviews.best_for?.length?`<section class="section spot-demo-section"><div class="spot-demo-review-head"><div><h2>口コミから見える評価</h2><p>保存済みの口コミ要約を表示しています。</p></div>${reviews.checked_at?`<span>確認 ${esc(reviews.checked_at)}</span>`:''}</div><div class="spot-review-grid"><article class="spot-review-card positive"><h3>よく評価されている点</h3>${list(reviews.positives)}</article><article class="spot-review-card caution"><h3>気をつけたい点</h3>${list(reviews.cautions)}</article><article class="spot-review-card best"><h3>特に向いているケース</h3>${list(reviews.best_for)}</article></div></section>`:''}<section class="section spot-demo-section"><h2>利用情報</h2>${p.access?`<p><strong>アクセス</strong> ${esc(p.access)}</p>`:''}${p.reservation?`<p><strong>予約</strong> ${esc(p.reservation)}</p>`:''}${p.time_fit?.length?`<h3>時間の目安</h3>${list(p.time_fit)}`:''}${p.strengths?.length?`<h3>利用しやすさ</h3>${list(p.strengths)}`:''}${p.constraints?.length?`<h3>注意点</h3>${list(p.constraints)}`:''}</section>${(s.related||[]).length?`<section class="section spot-demo-section spot-related-section"><h2>組み合わせやすいスポット</h2><div class="spot-related-grid">${s.related.map(x=>`<a class="spot-related-card" href="./?type=${encodeURIComponent(x.type||'spot')}&id=${encodeURIComponent(x.id)}"><span class="spot-related-kind">関連スポット</span><strong>${esc(x.label||x.id)}</strong><span class="spot-related-meta">${esc(x.relation_type||'関連')}</span><span class="spot-related-arrow">›››</span></a>`).join('')}</div></section>`:''}`;
  bindCarousel();
}
function bindCarousel(){
  app.querySelectorAll('.spot-carousel').forEach(carousel=>{const slides=[...carousel.querySelectorAll('.spot-carousel-slide')],thumbs=[...carousel.querySelectorAll('.spot-carousel-thumb')],count=carousel.querySelector('.spot-carousel-count .current');let i=0;const show=n=>{i=(n+slides.length)%slides.length;slides.forEach((x,j)=>x.classList.toggle('active',j===i));thumbs.forEach((x,j)=>x.classList.toggle('active',j===i));if(count)count.textContent=String(i+1);};carousel.querySelector('.prev')?.addEventListener('click',()=>show(i-1));carousel.querySelector('.next')?.addEventListener('click',()=>show(i+1));thumbs.forEach((x,j)=>x.addEventListener('click',()=>show(j)));});
}

function enhanceConcrete(){
  modeSwitch();
  const itinerary=findSection('日ごとの実施計画');
  itinerary?.classList.add('plan-demo-itinerary','execution-demo-section');
  enhanceDayCards(itinerary||app);
  app.querySelectorAll('.exec-day').forEach(x=>x.classList.add('execution-day-card'));
  decorateFlow(app);
}
