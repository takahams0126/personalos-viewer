import {
  makeCollapsible,
  renderEntityRefCard,
  renderHeroFacts,
  renderSeasonIcons
} from '../shared/component-contracts.js';

const qsRoute = new URLSearchParams(location.search);
const routeType = qsRoute.get('type');
const routeId = qsRoute.get('id');

const escRoute = (v='') => String(v).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
const roleRoute = (v='') => ({
  core:'主役', main:'主役', optional:'任意', main_lunch:'昼食', high_priority:'高優先',
  condition_high:'条件付き', fallback_onsen:'代替温泉', onsen:'温泉', fallback:'代替'
}[v] || String(v).replaceAll('_',' '));
const difficultyRoute = (v='') => ({
  easy:'やさしい', easy_to_medium:'やさしい〜中程度', medium:'中程度',
  medium_to_hard:'中程度〜難しい', hard:'難しい'
}[v] || v);
const variantRoute = (v='') => ({standard:'標準',full:'フル',short:'短縮'}[v] || String(v).replaceAll('_',' '));
const routeSpotSummaryCache = new Map();

function routeChipList(items=[]) {
  return items.length ? `<div class="route-demo-chips">${items.map(x=>`<span>${escRoute(x)}</span>`).join('')}</div>` : '';
}
function routeCards(items=[], cls='') {
  return items.length ? `<div class="route-demo-cards ${cls}">${items.map(x=>`<article>${escRoute(x)}</article>`).join('')}</div>` : '';
}
function routeExternalLinkIcon() {
  return `<svg class="route-popup-link-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M14 5h5v5"/><path d="M10 14 19 5"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>`;
}
function routeRefMini(ref, published=new Set()) {
  const key = `${ref.type || 'spot'}:${ref.id || ''}`;
  const href = `?type=${encodeURIComponent(ref.type||'spot')}&id=${encodeURIComponent(ref.id||'')}`;
  return renderEntityRefCard({
    kind:'主役Spot',
    title:ref.label || ref.id || '',
    href,
    disabled:!published.has(key)
  });
}

function findSection(app, title) {
  return [...app.querySelectorAll(':scope > .section')].find(x => x.querySelector(':scope > h2')?.textContent.trim() === title) || null;
}

async function loadRouteSpotSummary(id) {
  if (!id) return '';
  if (routeSpotSummaryCache.has(id)) return routeSpotSummaryCache.get(id);
  const promise = fetch(`./data/spots/${encodeURIComponent(id)}.json`, {cache:'no-store'})
    .then(r => r.ok ? r.json() : null)
    .then(data => data?.summary || '')
    .catch(() => '');
  routeSpotSummaryCache.set(id, promise);
  return promise;
}

async function enhanceRoutePopup(popup) {
  if (!popup || popup.dataset.routePopupEnhanced === '1') return;
  popup.dataset.routePopupEnhanced = '1';
  popup.classList.add('route-popup-enhanced');

  const title = popup.querySelector(':scope > strong');
  const links = popup.querySelector(':scope > .pin-links');
  [...popup.children].forEach(child => {
    if (child !== title && child !== links) child.remove();
  });

  const windowRoot = popup.closest('.gm-style-iw-c');
  const header = windowRoot?.querySelector('.gm-style-iw-chr');
  if (windowRoot) windowRoot.classList.add('route-popup-window');
  if (title && header) {
    title.remove();
    title.className = 'route-popup-header-title';
    header.prepend(title);
  } else if (title) {
    title.classList.add('route-popup-title');
  }

  if (!links) return;
  links.classList.add('route-popup-actions');
  const anchors = [...links.querySelectorAll('a')];
  const personal = anchors.find(a => {
    try { return new URL(a.href, location.href).searchParams.get('type') === 'spot'; }
    catch { return false; }
  });
  const google = anchors.find(a => /google\.com\/maps/i.test(a.href));

  if (personal) {
    personal.innerHTML = `<span>PersonalOSで詳しく見る</span>${routeExternalLinkIcon()}`;
    personal.classList.add('route-popup-action','is-primary');
  }
  if (google) {
    google.innerHTML = `<span>Google Mapsで開く</span>${routeExternalLinkIcon()}`;
    google.classList.add('route-popup-action','is-secondary');
  }

  let spotId = '';
  if (personal) {
    try { spotId = new URL(personal.href, location.href).searchParams.get('id') || ''; }
    catch { spotId = ''; }
  }
  const summary = await loadRouteSpotSummary(spotId);
  if (!summary || !popup.isConnected || popup.querySelector('.route-popup-summary')) return;
  const p = document.createElement('p');
  p.className = 'route-popup-summary';
  p.textContent = summary;
  links.before(p);
}

function installRoutePopupEnhancer() {
  const apply = root => {
    if (root?.matches?.('.pin-popup')) enhanceRoutePopup(root);
    root?.querySelectorAll?.('.pin-popup').forEach(enhanceRoutePopup);
  };
  apply(document);
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) apply(node);
  })));
  observer.observe(document.body,{childList:true,subtree:true});
}

async function initRouteRenderer() {
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
  const hero = app?.querySelector('.hero');
  if (!app || !hero || app.dataset.routeRendererAttached) return;

  app.dataset.routeRendererAttached = '1';
  installRoutePopupEnhancer();
  enhanceRoute(data, app, hero, manifest);
}

function enhanceRoute(data, app, hero, manifest={items:[]}) {
  const r = data.route || {};
  const appeal = r.appeal || {};
  const published = new Set((manifest.items||[]).map(x=>`${x.type}:${x.id}`));
  hero.classList.add('route-demo-hero');
  hero.querySelectorAll(':scope > p').forEach(p => p.classList.add('ui-hero-copy'));

  if ((appeal.themes||[]).length) hero.insertAdjacentHTML('beforeend', routeChipList(appeal.themes));
  if (r.family || r.variant) {
    hero.insertAdjacentHTML('beforeend', `<div class="route-hero-meta">${r.family?`<span><small>系統</small><strong>${escRoute(r.family)}</strong></span>`:''}${r.variant?`<span><small>バリエーション</small><strong>${escRoute(variantRoute(r.variant))}</strong></span>`:''}</div>`);
  }
  if ((data.hero_refs||[]).length) {
    hero.insertAdjacentHTML('beforeend', `<div class="route-hero-refs">${data.hero_refs.map(x=>routeRefMini(x,published)).join('')}</div>`);
  }

  const facts = [
    {label:'所要時間', value:r.duration || ''},
    {label:'難易度', value:difficultyRoute(r.difficulty || '')},
    {label:'移動', value:r.route_type === 'driving' ? '車' : (r.route_type || '')},
  ].filter(item => item.value);
  if ((r.season||[]).length) facts.push({label:'季節', valueHtml:renderSeasonIcons(r.season)});
  if (facts.length) hero.insertAdjacentHTML('beforeend', renderHeroFacts(facts));

  const mapSection = findSection(app, 'ルートの地図');
  mapSection?.querySelector('.map-tabs')?.remove();
  mapSection?.querySelector('#route-summary')?.remove();
  mapSection?.querySelector('#map-mode-note')?.remove();
  mapSection?.querySelector('.note')?.remove();

  findSection(app, 'このルートの魅力')?.remove();
  findSection(app, '巡り方')?.remove();
  findSection(app, '所要時間・難易度')?.remove();

  const strengths = (appeal.strengths||r.highlights||[]);
  const appealSection = document.createElement('section');
  appealSection.className = 'section route-demo-section route-demo-value';
  appealSection.innerHTML = `
    <h2>このルートの魅力</h2>
    ${appeal.summary?`<p class="route-appeal-summary">${escRoute(appeal.summary)}</p>`:''}
    ${routeCards(strengths,'primary')}`;
  hero.insertAdjacentElement('afterend', appealSection);

  const sequenceSection = findSection(app, '立ち寄り順');
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

  const constraintSection = findSection(app, '重要な条件');

  if (mapSection) appealSection.insertAdjacentElement('afterend', mapSection);
  if (sequenceSection) (mapSection || appealSection).insertAdjacentElement('afterend', sequenceSection);
  if (constraintSection) app.appendChild(constraintSection);

  makeCollapsible(appealSection, {open:false});
  makeCollapsible(mapSection, {open:true});
  makeCollapsible(sequenceSection, {open:true});
  makeCollapsible(constraintSection, {open:true});
}

if (routeType === 'route' && routeId) initRouteRenderer();
