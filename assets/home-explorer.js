const params=new URLSearchParams(location.search);
if(!params.get('type')&&!params.get('id')) initHomeExplorer();

const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const dirs={plan:'plans',concrete_plan:'concrete-plans',route:'routes',spot:'spots'};
const typeLabel=v=>({plan:'プラン',concrete_plan:'実施プラン',route:'ルート',spot:'スポット'}[v]||v);
const pathFor=x=>`./data/${dirs[x.type]}/${encodeURIComponent(x.id)}.json`;

async function initHomeExplorer(){
  let manifest;
  try{const r=await fetch('./manifest.json',{cache:'no-store'});if(!r.ok)return;manifest=await r.json();}catch{return;}
  const app=document.querySelector('#app');
  if(!app)return;
  const rows=await Promise.all((manifest.items||[]).filter(x=>dirs[x.type]).map(loadRow));
  const attach=()=>{
    const hero=app.querySelector('.hero');
    if(!hero||app.dataset.homeExplorerAttached)return false;
    app.dataset.homeExplorerAttached='1';
    [...app.children].filter(x=>x!==hero).forEach(x=>x.remove());
    const types=['plan','concrete_plan','route','spot'].filter(t=>rows.some(x=>x.type===t));
    const wrap=document.createElement('section');
    wrap.className='home-explorer';
    wrap.innerHTML=`<div class="home-toolbar"><div class="home-tabs" role="tablist" aria-label="表示種別">${types.map((t,i)=>`<button class="home-tab ${i===0?'active':''}" data-type="${t}">${typeLabel(t)}</button>`).join('')}</div><div class="home-filters"><label id="home-area-label">エリア<select id="home-area"><option value="">すべて</option></select></label><label id="home-category-label">カテゴリ<select id="home-category"><option value="">すべて</option></select></label><label>検索<input id="home-search" type="search" placeholder="名前・特徴・タグで検索"></label></div></div><div class="home-summary-row"><div id="home-count" class="home-count"></div><div id="home-area-chips" class="home-area-chips"></div></div><div id="explorer-grid" class="explorer-grid"></div>`;
    hero.after(wrap);
    const state={type:types[0]||'plan',area:'',category:'',q:''};
    const area=wrap.querySelector('#home-area'),category=wrap.querySelector('#home-category'),search=wrap.querySelector('#home-search'),grid=wrap.querySelector('#explorer-grid'),count=wrap.querySelector('#home-count'),chips=wrap.querySelector('#home-area-chips');
    const rebuildFilters=()=>{
      const current=rows.filter(x=>x.type===state.type);
      const areas=[...new Set(current.flatMap(x=>x.areas).filter(Boolean))].sort();
      const categories=[...new Set(current.map(x=>x.category).filter(Boolean))].sort();
      area.innerHTML='<option value="">すべて</option>'+areas.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      category.innerHTML='<option value="">すべて</option>'+categories.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
      wrap.querySelector('#home-area-label').classList.toggle('home-filter-hidden',!areas.length);
      wrap.querySelector('#home-category-label').classList.toggle('home-filter-hidden',!categories.length);
      state.area='';state.category='';
    };
    const render=()=>{
      const q=state.q.trim().toLowerCase();
      const visible=rows.filter(x=>x.type===state.type).filter(x=>!state.area||x.areas.includes(state.area)).filter(x=>!state.category||x.category===state.category).filter(x=>!q||[x.title,x.summary,...x.tags].join(' ').toLowerCase().includes(q));
      count.textContent=`${typeLabel(state.type)} ${visible.length}件`;
      const areas=[...new Set(rows.filter(x=>x.type===state.type).flatMap(x=>x.areas).filter(Boolean))].sort();
      chips.innerHTML=areas.map(x=>`<button class="area-chip ${state.area===x?'active':''}" data-area="${esc(x)}">${esc(x)}</button>`).join('');
      grid.innerHTML=visible.length?visible.map(cardHtml).join(''):'<div class="home-empty">条件に合う項目がありません。</div>';
    };
    wrap.querySelectorAll('.home-tab').forEach(btn=>btn.addEventListener('click',()=>{state.type=btn.dataset.type;wrap.querySelectorAll('.home-tab').forEach(x=>x.classList.toggle('active',x===btn));rebuildFilters();render();}));
    area.addEventListener('change',()=>{state.area=area.value;render();});category.addEventListener('change',()=>{state.category=category.value;render();});search.addEventListener('input',()=>{state.q=search.value;render();});chips.addEventListener('click',e=>{const b=e.target.closest('.area-chip');if(!b)return;state.area=state.area===b.dataset.area?'':b.dataset.area;area.value=state.area;render();});
    rebuildFilters();render();return true;
  };
  if(attach())return;const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});observer.observe(app,{childList:true,subtree:true});
}

async function loadRow(item){
  let data={};try{const r=await fetch(pathFor(item),{cache:'no-store'});if(r.ok)data=await r.json();}catch{}
  const entity=data[item.type==='concrete_plan'?'concrete_plan':item.type]||{};
  const appeal=entity.appeal||{};
  const explicitAreas=[...(data.area_refs||[]),...(entity.area_refs||[]),...(data.area_ids||[]),...(entity.area_ids||[])].map(x=>typeof x==='string'?x:(x.label||x.id)).filter(Boolean);
  if(data.area_id)explicitAreas.push(data.area_id);if(entity.area_id)explicitAreas.push(entity.area_id);
  const category=entity.category||data.category||'';
  const tags=[...(entity.themes||[]),...(appeal.themes||[]),...(entity.suitable_for||[])].filter(x=>typeof x==='string');
  const imageRef=(entity.image_refs||[])[0];const image=typeof imageRef==='string'?imageRef:(imageRef?.url||imageRef?.source_url||imageRef?.image_url||'');
  return {type:item.type,id:item.id,title:item.title||data.title||item.id,summary:data.summary||entity.summary||'',areas:[...new Set(explicitAreas)],category,tags,image};
}
function cardHtml(x){const href=`./?type=${encodeURIComponent(x.type)}&id=${encodeURIComponent(x.id)}`;return `<article class="explorer-card">${x.image?`<div class="explorer-thumb"><img src="${esc(x.image)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>`:''}<div class="explorer-body"><div class="explorer-meta"><span class="explorer-type">${esc(typeLabel(x.type))}</span><span class="explorer-id">${esc(x.id)}</span></div><h3><a href="${href}">${esc(x.title)}</a></h3>${x.summary?`<p>${esc(x.summary)}</p>`:''}${x.tags.length?`<div class="explorer-tags">${x.tags.slice(0,5).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</div></article>`;}