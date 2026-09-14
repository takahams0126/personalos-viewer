const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');

if (type === 'spot' && id === 'S0036') initSpotDemo();

function esc(v='') { return String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }
function chipList(items=[]) { return items.length ? `<div class="spot-chip-row">${items.map(x=>`<span class="spot-chip">${esc(x)}</span>`).join('')}</div>` : ''; }
function list(items=[]) { return items.length ? `<ul class="spot-demo-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''; }
function cards(items=[], className='') { return items.length ? `<div class="spot-demo-cards ${className?`spot-demo-cards-${esc(className)}`:''}">${items.map(x=>`<article class="spot-demo-card ${className}">${esc(x)}</article>`).join('')}</div>` : ''; }
function heroLinks(links=[]) { return links.length ? `<div class="spot-hero-links"><span class="spot-hero-links-label">公式・参考</span><div class="spot-hero-link-row">${links.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)} <span aria-hidden="true">↗</span></a>`).join('')}</div></div>` : ''; }
function factValue(fact, spot={}) {
  if (fact?.label === '季節' && (spot.season||[]).length) {
    const seasons = spot.season.map(x=>`<i class="spot-season-icon" title="${esc(x)}" aria-label="${esc(x)}">${esc(x.slice(0,1))}</i>`).join('');
    return `<strong class="spot-season-fact"><span class="spot-season-icons">${seasons}</span></strong>`;
  }
  return `<strong>${esc(fact?.value||'')}</strong>`;
}

async function initSpotDemo() {
  let data;
  try {
    const r = await fetch(`./data/spots/${encodeURIComponent(id)}.json`, {cache:'no-store'});
    if (!r.ok) return;
    data = await r.json();
  } catch { return; }

  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    if (!hero || app.dataset.spotDemoAttached) return false;
    app.dataset.spotDemoAttached = '1';
    render(data, app);
    initCarousel(app);
    return true;
  };
  if (attach()) return;
  const observer = new MutationObserver(()=>{ if (attach()) observer.disconnect(); });
  observer.observe(app,{childList:true,subtree:true});
}

function galleryHtml(images=[], title='') {
  const sorted = [...images].sort((a,b)=>(a.priority??999)-(b.priority??999));
  if (!sorted.length) return '';
  const slides = sorted.map((img,i)=>`<figure class="spot-carousel-slide ${i===0?'active':''}" data-index="${i}"><img src="${esc(img.url)}" alt="${esc(img.caption||`${title} ${i+1}`)}" draggable="false"><figcaption><span>${esc(img.caption||'')}</span>${img.credit?`<small>${esc(img.credit)}</small>`:''}</figcaption></figure>`).join('');
  const thumbs = sorted.map((img,i)=>`<button class="spot-carousel-thumb ${i===0?'active':''}" data-index="${i}" aria-label="画像 ${i+1} を表示"><img src="${esc(img.url)}" alt=""></button>`).join('');
  return `<div class="spot-carousel" data-count="${sorted.length}">
    <div class="spot-carousel-stage" tabindex="0">
      <div class="spot-carousel-track">${slides}</div>
      ${sorted.length>1?`<button type="button" class="spot-carousel-nav prev" aria-label="前の画像">‹</button><button type="button" class="spot-carousel-nav next" aria-label="次の画像">›</button><div class="spot-carousel-count"><span class="current">1</span> / ${sorted.length}</div>`:''}
    </div>
    ${sorted.length>1?`<div class="spot-carousel-thumbs">${thumbs}</div>`:''}
  </div>`;
}

function render(data, app) {
  const s = data.spot || {};
  const reviews = s.review_summary || {};
  const links = s.links || [];
  const related = s.related || [];

  app.innerHTML = `
    <section class="spot-demo-hero">
      <div class="spot-demo-hero-copy">
        <div class="kicker">スポット · ${esc(data.id)}</div>
        <h1>${esc(data.title)}</h1>
        <p class="spot-demo-summary">${esc(data.summary||'')}</p>
        ${chipList(s.themes||[])}
        ${heroLinks(links)}
      </div>
      ${galleryHtml(s.image_refs||[], data.title)}
    </section>

    ${(s.facts||[]).length?`<section class="spot-demo-facts">${s.facts.map(x=>`<div><span>${esc(x.label)}</span>${factValue(x,s)}</div>`).join('')}</section>`:''}

    ${(s.highlights||[]).length|| (s.strengths||[]).length?`<section class="section spot-demo-section"><h2>このスポットの魅力</h2>${cards(s.highlights||[],'highlight')}${(s.strengths||[]).length?`<div class="spot-demo-sub"><h3>強み</h3>${list(s.strengths)}</div>`:''}</section>`:''}

    ${(s.user_fit||[]).length || (s.suitable_for||[]).length?`<section class="section spot-demo-section"><h2>こんな旅に向いている</h2>${cards(s.user_fit||[],'fit')}${chipList(s.suitable_for||[])}</section>`:''}

    ${(s.value_points||[]).length?`<section class="section spot-demo-section"><h2>選ぶ価値</h2>${cards(s.value_points||[],'value')}</section>`:''}

    ${(reviews.positives||[]).length || (reviews.cautions||[]).length || (reviews.best_for||[]).length?`<section class="section spot-demo-section"><div class="spot-demo-review-head"><div><h2>口コミから見える評価</h2><p>正本に保存された口コミ要約を表示しています。</p></div>${reviews.checked_at?`<span>確認 ${esc(reviews.checked_at)}</span>`:''}</div><div class="spot-review-grid"><article class="spot-review-card positive"><h3>よく評価されている点</h3>${list(reviews.positives)}</article><article class="spot-review-card caution"><h3>気をつけたい点</h3>${list(reviews.cautions)}</article><article class="spot-review-card best"><h3>特に向いているケース</h3>${list(reviews.best_for)}</article></div></section>`:''}

    ${(s.practicality||[]).length?`<section class="section spot-demo-section"><h2>利用情報</h2>${list(s.practicality||[])}</section>`:''}

    ${related.length?`<section class="section spot-demo-section"><h2>組み合わせやすいスポット</h2><div class="spot-related-grid">${related.map(x=>`<article class="spot-related-card"><strong>${esc(x.label||x.id)}</strong><span>${esc(x.relation_type==='good_pair'?'相性のよい組み合わせ':x.relation_type||'関連')}</span></article>`).join('')}</div></section>`:''}
  `;
}

function initCarousel(root) {
  root.querySelectorAll('.spot-carousel').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.spot-carousel-slide')];
    const thumbs = [...carousel.querySelectorAll('.spot-carousel-thumb')];
    const stage = carousel.querySelector('.spot-carousel-stage');
    const count = carousel.querySelector('.spot-carousel-count .current');
    if (!slides.length) return;
    let index = 0;
    const show = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((x,i)=>x.classList.toggle('active', i===index));
      thumbs.forEach((x,i)=>x.classList.toggle('active', i===index));
      if (count) count.textContent = String(index+1);
      thumbs[index]?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    };
    const openLightbox = () => openSpotLightbox(slides, index, show);
    const prev = carousel.querySelector('.prev');
    const next = carousel.querySelector('.next');
    [prev,next,...thumbs].filter(Boolean).forEach(btn => {
      btn.addEventListener('pointerdown', e => e.stopPropagation());
      btn.addEventListener('pointerup', e => e.stopPropagation());
    });
    prev?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); show(index-1); });
    next?.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); show(index+1); });
    thumbs.forEach((thumb,i)=>thumb.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); show(i); }));
    stage?.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft')show(index-1); if(e.key==='ArrowRight')show(index+1); if(e.key==='Enter')openLightbox(); });
    let startX = null;
    let startY = null;
    let pointerStartedOnImage = false;
    stage?.addEventListener('pointerdown',e=>{
      if (e.target.closest('button')) return;
      startX=e.clientX;
      startY=e.clientY;
      pointerStartedOnImage = Boolean(e.target.closest('.spot-carousel-slide img'));
      stage.setPointerCapture?.(e.pointerId);
    });
    stage?.addEventListener('pointerup',e=>{
      if (startX===null || e.target.closest('button')) return;
      const dx=e.clientX-startX;
      const dy=e.clientY-startY;
      const startedOnImage = pointerStartedOnImage;
      startX=null;
      startY=null;
      pointerStartedOnImage=false;
      if(Math.abs(dx)>45){ show(index+(dx<0?1:-1)); return; }
      if(startedOnImage && Math.abs(dx)<10 && Math.abs(dy)<10) openLightbox();
    });
  });
}

function openSpotLightbox(slides, startIndex, syncCarousel) {
  let index = startIndex;
  const overlay = document.createElement('div');
  overlay.className = 'spot-lightbox';
  overlay.innerHTML = `
    <button type="button" class="spot-lightbox-close" aria-label="閉じる">×</button>
    ${slides.length>1?`<button type="button" class="spot-lightbox-nav prev" aria-label="前の画像">‹</button><button type="button" class="spot-lightbox-nav next" aria-label="次の画像">›</button>`:''}
    <figure class="spot-lightbox-figure"><img alt=""><figcaption></figcaption></figure>
    <div class="spot-lightbox-count"></div>`;
  const img = overlay.querySelector('img');
  const caption = overlay.querySelector('figcaption');
  const counter = overlay.querySelector('.spot-lightbox-count');
  const show = next => {
    index = (next + slides.length) % slides.length;
    const source = slides[index];
    const sourceImg = source.querySelector('img');
    img.src = sourceImg?.src || '';
    img.alt = sourceImg?.alt || '';
    caption.innerHTML = source.querySelector('figcaption')?.innerHTML || '';
    if (counter) counter.textContent = `${index+1} / ${slides.length}`;
    syncCarousel?.(index);
  };
  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    document.body.classList.remove('spot-lightbox-open');
  };
  const onKey = e => {
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index-1);
    if (e.key === 'ArrowRight') show(index+1);
  };
  overlay.querySelector('.spot-lightbox-close')?.addEventListener('click', close);
  overlay.querySelector('.prev')?.addEventListener('click',()=>show(index-1));
  overlay.querySelector('.next')?.addEventListener('click',()=>show(index+1));
  overlay.addEventListener('click',e=>{ if(e.target===overlay) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  document.body.classList.add('spot-lightbox-open');
  show(index);
}