const params = new URLSearchParams(location.search);
if (!params.get('type') && !params.get('id')) initHomeExplorer();

async function initHomeExplorer(){
  let catalog;
  try{
    const r=await fetch('./manifest.json',{cache:'no-store'});
    if(!r.ok)return;
    catalog=await r.json();
  }catch{return;}

  const app=document.querySelector('#app');
  const attach=()=>{
    const hero=app?.querySelector('.hero');
    if(!hero||app.dataset.homeExplorerAttached)return false;
    app.dataset.homeExplorerAttached='1';
    [...app.children].filter(x=>x!==hero).forEach(x=>x.remove());

    const wrap=document.createElement('section');
    wrap.className='home-explorer';
    wrap.innerHTML=`
      <div class="home-toolbar">
        <div class="home-tabs" role="tablist" aria-label="表示種別">
          <button class="home-tab active" data-type="plan">プラン</button>
          <button class="home-tab" data-type="route">ルート</button>
          <button class="home-tab" data-type="spot">スポット</button>
        </div>
        <div class="home-filters">
          <label>エリア<select id="home-area"><option value="">すべて</option>${(catalog.areas||[]).map(a=>`<option value="${esc(a.id)}">${esc(a.label)}</option>`).join('')}</select></label>
          <label>カテゴリ<select id="home-category"><option value="">すべて</option></select></label>
          <label>検索<input id="home-search" type="search" placeholder="名前・特徴・タグで検索"></label>
        </div>
      </div>
      <div class="home-summary-row"><div id="home-count" class="home-count"></div><div id="home-area-chips" class="home-area-chips"></div></div>
      <div id="explorer-grid" class="explorer-grid"></div>`;
    hero.after(wrap);

    const state={type:'plan',area:'',category:'',q:''};
    const area=document.querySelector('#home-area');
    const category=document.querySelector('#home-category');
    const search=document.querySelector('#home-search');
    const grid=document.querySelector('#explorer-grid');
    const count=document.querySelector('#home-count');
    const chips=document.querySelector('#home-area-chips');

    const categories=()=>[...new Set((catalog.items||[]).filter(x=>x.type===state.type).map(x=>x.category).filter(Boolean))].sort();
    const rebuildCategory=()=>{
      category.innerHTML='<option value="">すべて</option>'+categories().map(x=>`<option value="${esc(x)}">${esc(categoryLabel(x))}</option>`).join('');
      if(!categories().includes(state.category)){state.category='';category.value='';}
    };
    const render=()=>{
      const q=state.q.trim().toLowerCase();
      const rows=(catalog.items||[]).filter(x=>x.type===state.type)
        .filter(x=>!state.area||(x.area_ids||[]).includes(state.area))
        .filter(x=>!state.category||x.category===state.category)
        .filter(x=>!q||[x.title,x.summary,...(x.tags||[])].filter(Boolean).join(' ').toLowerCase().includes(q));
      count.textContent=`${typeLabel(state.type)} ${rows.length}件`;
      chips.innerHTML=(catalog.areas||[]).map(a=>`<button class="area-chip ${state.area===a.id?'active':''}" data-area="${esc(a.id)}">${esc(a.label)}</button>`).join('');
      grid.innerHTML=rows.length?rows.map(cardHtml).join(''):'<div class="home-empty">条件に合う項目がありません。</div>';
    };

    document.querySelectorAll('.home-tab').forEach(btn=>btn.addEventListener('click',()=>{
      state.type=btn.dataset.type;
      document.querySelectorAll('.home-tab').forEach(x=>x.classList.toggle('active',x===btn));
      rebuildCategory();render();
    }));
    area.addEventListener('change',()=>{state.area=area.value;render();});
    category.addEventListener('change',()=>{state.category=category.value;render();});
    search.addEventListener('input',()=>{state.q=search.value;render();});
    chips.addEventListener('click',e=>{const b=e.target.closest('.area-chip');if(!b)return;state.area=state.area===b.dataset.area?'':b.dataset.area;area.value=state.area;render();});
    rebuildCategory();render();
    return true;
  };

  if(attach())return;
  const observer=new MutationObserver(()=>{if(attach())observer.disconnect();});
  observer.observe(app,{childList:true,subtree:true});
}

function esc(v=''){return String(v).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}
function typeLabel(v){return ({plan:'プラン',route:'ルート',spot:'スポット'}[v]||v);}
function categoryLabel(v){return ({multi_day_trip:'複数日旅行',drive:'ドライブ',attraction:'観光スポット',mountain:'山',onsen:'温泉',lodging:'宿泊',food:'食事',facility:'施設'}[v]||String(v).replaceAll('_',' '));}
function cardHtml(x){
  const href=`./?type=${encodeURIComponent(x.type)}&id=${encodeURIComponent(x.id)}`;
  const image=x.image_url?`<div class="explorer-thumb"><img src="${esc(x.image_url)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>`:'';
  const tags=(x.tags||[]).slice(0,5).map(t=>`<span>${esc(t)}</span>`).join('');
  return `<article class="explorer-card">${image}<div class="explorer-body"><div class="explorer-meta"><span class="explorer-type">${esc(typeLabel(x.type))}</span><span class="explorer-id">${esc(x.id)}</span></div><h3><a href="${href}">${esc(x.title)}</a></h3>${x.summary?`<p>${esc(x.summary)}</p>`:''}${tags?`<div class="explorer-tags">${tags}</div>`:''}</div></article>`;
}
