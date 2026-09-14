const qsRoute = new URLSearchParams(location.search);
const routeType = qsRoute.get('type');
const routeId = qsRoute.get('id');

if (routeType === 'route' && routeId === 'R011') initRouteDemo();

const escRoute = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const roleRoute = (v='') => ({core:'主役',optional:'任意',main_lunch:'昼食',high_priority:'高優先',condition_high:'条件付き',fallback_onsen:'代替温泉',onsen:'温泉'}[v] || String(v).replaceAll('_',' '));
const difficultyRoute = (v='') => ({easy:'やさしい',easy_to_medium:'やさしい〜中程度',medium:'中程度',medium_to_hard:'中程度〜難しい',hard:'難しい'}[v] || v);
const variantRoute = (v='') => ({standard:'標準',full:'フル',short:'短縮'}[v] || String(v).replaceAll('_',' '));

function routeChipList(items=[]) {
  return items.length ? `<div class="route-demo-chips">${items.map(x=>`<span>${escRoute(x)}</span>`).join('')}</div>` : '';
}
function routeCards(items=[], cls='') {
  return items.length ? `<div class="route-demo-cards ${cls}">${items.map(x=>`<article>${escRoute(x)}</article>`).join('')}</div>` : '';
}
function internalChevron() {
  return `<svg class="route-ref-chevron" viewBox="0 0 54 24" fill="none" aria-hidden="true"><path d="M2 4l8 8-8 8"/><path d="M18 4l8 8-8 8"/><path d="M34 4l8 8-8 8"/></svg>`;
}
function flowChevron() {
  return `<svg class="route-flow-chevron" viewBox="0 0 34 24" fill="none" aria-hidden="true" focusable="false"><path d="M2 4l8 8-8 8"/><path d="M14 4l8 8-8 8"/></svg>`;
}
function routeRefMini(ref, published=new Set()) {
  const key = `${ref.type || 'spot'}:${ref.id || ''}`;
  const inner = `<span class="route-hero-ref-kind">主役Spot</span><strong>${escRoute(ref.label || ref.id || '')}</strong>${internalChevron()}`;
  return published.has(key)
    ? `<a class="route-hero-ref" href="?type=${encodeURIComponent(ref.type||'spot')}&id=${encodeURIComponent(ref.id||'')}">${inner}</a>`
    : `<span class="route-hero-ref route-hero-ref-disabled">${inner}</span>`;
}

async function initRouteDemo() {
  let data, manifest;
  try {
    const [r,m] = await Promise.all([
      fetch(`./data/routes/${encodeURIComponent(routeId)}.json`, {cache:'no-store'}),
      fetch('./manifest.json',{cache:'no-store'})
    ]);
    if (!r.ok) return;
    data = await r.json();
    manifest = m.ok ? await m.json() : {items:[]};
  } catch { return; }

  const app = document.querySelector('#app');
  const attach = () => {
    const hero = app?.querySelector('.hero');
    if (!hero || app.dataset.routeDemoAttached) return false;
    app.dataset.routeDemoAttached = '1';
    enhanceRoute(data, app, hero, manifest);
    return true;
  };
  if (attach()) return;
  const observer = new MutationObserver(()=>{ if (attach()) observer.disconnect(); });
  observer.observe(app,{childList:true,subtree:true});
}

function enhanceRoute(data, app, hero, manifest={items:[]}) {
  const r = data.route || {};
  const appeal = r.appeal || {};
  const published = new Set((manifest.items||[]).map(x=>`${x.type}:${x.id}`));

  if ((appeal.themes||[]).length) hero.insertAdjacentHTML('beforeend', routeChipList(appeal.themes));
  if ((data.hero_refs||[]).length) {
    hero.insertAdjacentHTML('beforeend', `<div class="route-hero-refs">${data.hero_refs.map(x=>routeRefMini(x,published)).join('')}</div>`);
  }

  const endpointText = r.start_point || r.end_point ? `${escRoute(r.start_point||'—')} → ${escRoute(r.end_point||'—')}` : '';
  const facts = `
    <section class="route-demo-facts">
      <div><span>所要時間</span><strong>${escRoute(r.duration||'')}</strong></div>
      <div><span>難易度</span><strong>${escRoute(difficultyRoute(r.difficulty||''))}</strong></div>
      <div><span>移動</span><strong>${r.route_type==='driving'?'車':escRoute(r.route_type||'')}</strong></div>
      <div><span>季節</span><strong class="route-season-icons">${(r.season||[]).map(x=>`<i title="${escRoute(x)}">${escRoute(x.slice(0,1))}</i>`).join('')}</strong></div>
      ${endpointText?`<div class="route-endpoint-fact"><span>起点 → 終点</span><strong>${endpointText}</strong></div>`:''}
    </section>`;
  hero.insertAdjacentHTML('afterend', facts);

  const mapSection = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='ルートの地図');
  const anchor = mapSection || hero.nextElementSibling;

  const valueHtml = `
    <section class="section route-demo-section route-demo-value">
      <h2>このルートの魅力</h2>
      ${appeal.summary?`<p class="route-appeal-summary">${escRoute(appeal.summary)}</p>`:''}
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

  // Traversal固有の前提と理由を、順序そのものとは分けて補足表示する。
  const traversalSection = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='巡り方');
  if (traversalSection) {
    const cards = [...traversalSection.querySelectorAll(':scope > .card')];
    cards.forEach((card,index)=>{
      const t = (r.traversals||[])[index];
      if (!t) return;
      const heading = card.querySelector('h3');
      if (heading && (t.start_context || t.end_context)) {
        heading.insertAdjacentHTML('afterend', `<div class="route-traversal-context"><span>前提</span>${escRoute(t.start_context||'—')} → ${escRoute(t.end_context||'—')}</div>`);
      }
      const context = card.querySelector('.route-traversal-context');
      if (t.reason) (context || heading)?.insertAdjacentHTML('afterend', `<p class="route-traversal-reason">${escRoute(t.reason)}</p>`);
      const stops = [...card.querySelectorAll('.route-stop')];
      stops.forEach((stop,i)=>{
        const role = t.ordered_spot_refs?.[i]?.role;
        if (role) stop.insertAdjacentHTML('beforeend', `<small class="route-role-badge role-${escRoute(role)}">${escRoute(roleRoute(role))}</small>`);
      });
    });
  }

  // canonical sequenceのroleは、立ち寄り順で小バッジとして明示する。
  const sequenceSection = [...app.querySelectorAll('.section')].find(x=>x.querySelector('h2')?.textContent.trim()==='立ち寄り順');
  if (sequenceSection) {
    const stops = [...sequenceSection.querySelectorAll('.route-stop')];
    stops.forEach((stop,index)=>{
      const role = r.sequence?.[index]?.role;
      if (!role) return;
      const existing = stop.querySelector('small');
      if (existing) {
        existing.textContent = roleRoute(role);
        existing.classList.add('route-role-badge',`role-${role}`);
      } else {
        stop.insertAdjacentHTML('beforeend', `<small class="route-role-badge role-${escRoute(role)}">${escRoute(roleRoute(role))}</small>`);
      }
    });
  }

  // Route内部の進行は、ページ遷移用の青chevronとは分けて黄色の二重chevronで統一する。
  app.querySelectorAll('.route-arrow').forEach(arrow => {
    arrow.classList.add('route-flow-arrow');
    arrow.innerHTML = flowChevron();
  });

  // family / variant は実リンク先がない場合にリンクの見た目を偽装せず、位置づけ情報として最下部へ置く。
  if (r.family || r.variant) {
    app.insertAdjacentHTML('beforeend', `<section class="section route-demo-section route-family-section"><h2>このルートの位置づけ</h2><div class="route-family-card">${r.family?`<div><span>系統</span><strong>${escRoute(r.family)}</strong></div>`:''}${r.variant?`<div><span>バリエーション</span><strong>${escRoute(variantRoute(r.variant))}</strong></div>`:''}</div></section>`);
  }
}
