const qsRoute = new URLSearchParams(location.search);
const routeType = qsRoute.get('type');
const routeId = qsRoute.get('id');

if (routeType === 'route' && routeId === 'R011') initRouteDemo();

const escRoute = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const roleRoute = (v='') => ({core:'主役',optional:'任意',main_lunch:'昼食',high_priority:'高優先',condition_high:'条件付き',fallback_onsen:'代替温泉',onsen:'温泉'}[v] || String(v).replaceAll('_',' '));
const difficultyRoute = (v='') => ({easy:'やさしい',easy_to_medium:'やさしい〜中程度',medium:'中程度',medium_to_hard:'中程度〜難しい',hard:'難しい'}[v] || v);

function routeChipList(items=[]) {
  return items.length ? `<div class="route-demo-chips">${items.map(x=>`<span>${escRoute(x)}</span>`).join('')}</div>` : '';
}
function routeCards(items=[], cls='') {
  return items.length ? `<div class="route-demo-cards ${cls}">${items.map(x=>`<article>${escRoute(x)}</article>`).join('')}</div>` : '';
}
function internalChevron() {
  return `<svg class="route-ref-chevron" viewBox="0 0 54 24" fill="none" aria-hidden="true"><path d="M2 4l8 8-8 8"/><path d="M18 4l8 8-8 8"/><path d="M34 4l8 8-8 8"/></svg>`;
}

async function initRouteDemo() {
  let data;
  try {
    const r = await fetch(`./data/routes/${encodeURIComponent(routeId)}.json`, {cache:'no-store'});
    if (!r.ok) return;
    data = await r.json();
  } catch { return; }

  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    if (!hero || app.dataset.routeDemoAttached) return false;
    app.dataset.routeDemoAttached = '1';
    enhanceRoute(data, app, hero);
    return true;
  };
  if (attach()) return;
  const observer = new MutationObserver(()=>{ if (attach()) observer.disconnect(); });
  observer.observe(app,{childList:true,subtree:true});
}

function enhanceRoute(data, app, hero) {
  const r = data.route || {};
  const appeal = r.appeal || {};

  if ((appeal.themes||[]).length) hero.insertAdjacentHTML('beforeend', routeChipList(appeal.themes));

  const facts = `
    <section class="route-demo-facts">
      <div><span>所要時間</span><strong>${escRoute(r.duration||'')}</strong></div>
      <div><span>難易度</span><strong>${escRoute(difficultyRoute(r.difficulty||''))}</strong></div>
      <div><span>移動</span><strong>${r.route_type==='driving'?'車':escRoute(r.route_type||'')}</strong></div>
      <div><span>季節</span><strong class="route-season-icons">${(r.season||[]).map(x=>`<i title="${escRoute(x)}">${escRoute(x.slice(0,1))}</i>`).join('')}</strong></div>
    </section>`;
  hero.insertAdjacentHTML('afterend', facts);

  const mapSection = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='ルートの地図');
  const anchor = mapSection || hero.nextElementSibling;

  const valueHtml = `
    <section class="section route-demo-section route-demo-value">
      <h2>このルートの魅力</h2>
      ${routeCards(r.highlights||[],'primary')}
      ${(appeal.strengths||[]).length?`<div class="route-demo-detail"><h3>組み合わせる意味</h3><ul>${appeal.strengths.map(x=>`<li>${escRoute(x)}</li>`).join('')}</ul></div>`:''}
    </section>`;

  const fitHtml = ((appeal.user_fit||[]).length || (r.suitable_for||[]).length) ? `
    <section class="section route-demo-section">
      <h2>こんな旅に向いている</h2>
      ${routeCards(appeal.user_fit||[],'fit')}
      ${routeChipList(r.suitable_for||[])}
    </section>` : '';

  const conditional = r.conditional_refs || [];
  const conditionalHtml = conditional.length ? `
    <section class="section route-demo-section route-conditional-section">
      <h2>条件付き・代替の立ち寄り</h2>
      <div class="route-ref-grid">${conditional.map(x=>`<a class="route-ref-card" href="?type=${encodeURIComponent(x.type||'spot')}&id=${encodeURIComponent(x.id||'')}"><span class="route-ref-kind">${escRoute(roleRoute(x.role||''))}</span><strong>${escRoute(x.label||x.id)}</strong><span class="route-ref-meta">${escRoute(x.insertion_policy || (x.fallback_for?`${x.fallback_for} の代替`:''))}</span>${internalChevron()}</a>`).join('')}</div>
    </section>` : '';

  const notesHtml = (r.notes||[]).length ? `
    <section class="section route-demo-section route-notes-section">
      <h2>このルートをうまく回るコツ</h2>
      <ul class="route-demo-notes">${r.notes.map(x=>`<li>${escRoute(x)}</li>`).join('')}</ul>
    </section>` : '';

  const wrapper = document.createElement('div');
  wrapper.className = 'route-demo-insert';
  wrapper.innerHTML = valueHtml + fitHtml + conditionalHtml + notesHtml;
  if (anchor) anchor.insertAdjacentElement('afterend', wrapper); else hero.insertAdjacentElement('afterend', wrapper);

  // Base renderer already has a simpler highlights section. Hide only that duplicate.
  [...app.querySelectorAll(':scope > .section')].forEach(section => {
    const h = section.querySelector(':scope > h2');
    if (h?.textContent.trim()==='このルートの魅力') section.classList.add('route-demo-hide-duplicate');
  });
}
