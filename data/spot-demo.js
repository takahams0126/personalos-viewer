const qs = new URLSearchParams(location.search);
const type = qs.get('type');
const id = qs.get('id');

if (type === 'spot' && id === 'S0036') initSpotDemo();

function esc(v='') { return String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c])); }
function chipList(items=[]) { return items.length ? `<div class="spot-chip-row">${items.map(x=>`<span class="spot-chip">${esc(x)}</span>`).join('')}</div>` : ''; }
function list(items=[]) { return items.length ? `<ul class="spot-demo-list">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>` : ''; }
function cards(items=[], className='') { return items.length ? `<div class="spot-demo-cards">${items.map(x=>`<article class="spot-demo-card ${className}">${esc(x)}</article>`).join('')}</div>` : ''; }

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
    return true;
  };
  if (attach()) return;
  const observer = new MutationObserver(()=>{ if (attach()) observer.disconnect(); });
  observer.observe(app,{childList:true,subtree:true});
}

function render(data, app) {
  const s = data.spot || {};
  const heroImg = (s.image_refs||[])[0]?.url || '';
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
      </div>
      ${heroImg?`<figure class="spot-demo-hero-image"><img src="${esc(heroImg)}" alt="${esc(data.title)}"></figure>`:''}
    </section>

    ${(s.facts||[]).length?`<section class="spot-demo-facts">${s.facts.map(x=>`<div><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong></div>`).join('')}</section>`:''}

    ${(s.highlights||[]).length|| (s.strengths||[]).length?`<section class="section spot-demo-section"><h2>このスポットの魅力</h2>${cards(s.highlights||[],'highlight')}${(s.strengths||[]).length?`<div class="spot-demo-sub"><h3>強み</h3>${list(s.strengths)}</div>`:''}</section>`:''}

    ${(s.user_fit||[]).length || (s.suitable_for||[]).length?`<section class="section spot-demo-section"><h2>こんな旅に向いている</h2>${cards(s.user_fit||[],'fit')}${chipList(s.suitable_for||[])}</section>`:''}

    ${(s.value_points||[]).length?`<section class="section spot-demo-section"><h2>選ぶ価値</h2>${cards(s.value_points||[],'value')}</section>`:''}

    ${(reviews.positives||[]).length || (reviews.cautions||[]).length || (reviews.best_for||[]).length?`<section class="section spot-demo-section"><div class="spot-demo-review-head"><div><h2>口コミから見える評価</h2><p>正本に保存された口コミ要約を表示しています。</p></div>${reviews.checked_at?`<span>確認 ${esc(reviews.checked_at)}</span>`:''}</div><div class="spot-review-grid"><article class="spot-review-card positive"><h3>よく評価されている点</h3>${list(reviews.positives)}</article><article class="spot-review-card caution"><h3>気をつけたい点</h3>${list(reviews.cautions)}</article><article class="spot-review-card best"><h3>特に向いているケース</h3>${list(reviews.best_for)}</article></div></section>`:''}

    ${(s.practicality||[]).length || (s.season||[]).length?`<section class="section spot-demo-section"><h2>利用情報</h2>${list(s.practicality||[])}${(s.season||[]).length?`<div class="spot-demo-sub"><h3>季節</h3>${chipList(s.season)}</div>`:''}</section>`:''}

    ${related.length?`<section class="section spot-demo-section"><h2>組み合わせやすいスポット</h2><div class="spot-related-grid">${related.map(x=>`<article class="spot-related-card"><strong>${esc(x.label||x.id)}</strong><span>${esc(x.relation_type==='good_pair'?'相性のよい組み合わせ':x.relation_type||'関連')}</span></article>`).join('')}</div></section>`:''}

    ${links.length?`<section class="section spot-demo-section"><h2>公式・参考情報</h2><div class="spot-link-row">${links.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join('')}</div></section>`:''}
  `;
}
