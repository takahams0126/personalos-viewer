const qsRoute = new URLSearchParams(location.search);
const routeType = qsRoute.get('type');
const routeId = qsRoute.get('id');

if (routeType === 'route' && routeId) initRouteRenderer();

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

function routeChipList(items=[]) {
  return items.length ? `<div class="route-demo-chips">${items.map(x=>`<span>${escRoute(x)}</span>`).join('')}</div>` : '';
}
function routeCards(items=[], cls='') {
  return items.length ? `<div class="route-demo-cards ${cls}">${items.map(x=>`<article>${escRoute(x)}</article>`).join('')}</div>` : '';
}
function internalChevron() {
  return `<svg class="route-ref-chevron" viewBox="0 0 54 24" fill="none" aria-hidden="true"><path d="M2 4l8 8-8 8"/><path d="M18 4l8 8-8 8"/><path d="M34 4l8 8-8 8"/></svg>`;
}
function routeRefMini(ref, published=new Set()) {
  const key = `${ref.type || 'spot'}:${ref.id || ''}`;
  const inner = `<span class="route-hero-ref-kind">主役Spot</span><strong>${escRoute(ref.label || ref.id || '')}</strong>${internalChevron()}`;
  return published.has(key)
    ? `<a class="route-hero-ref" href="?type=${encodeURIComponent(ref.type||'spot')}&id=${encodeURIComponent(ref.id||'')}">${inner}</a>`
    : `<span class="route-hero-ref route-hero-ref-disabled">${inner}</span>`;
}

function findSection(app, title) {
  return [...app.querySelectorAll(':scope > .section')].find(x => x.querySelector(':scope > h2')?.textContent.trim() === title) || null;
}

function makeCollapsible(section, open=true) {
  if (!section || section.dataset.routeCollapsible === '1') return;
  const heading = section.querySelector(':scope > h2');
  if (!heading) return;
  section.dataset.routeCollapsible = '1';
  section.classList.add('route-collapsible');

  const body = document.createElement('div');
  body.className = 'route-collapsible-body';
  [...section.children].filter(x => x !== heading).forEach(x => body.appendChild(x));
  section.appendChild(body);

  heading.classList.add('route-toggle-heading');
  heading.setAttribute('role','button');
  heading.setAttribute('tabindex','0');

  const apply = nextOpen => {
    section.classList.toggle('is-collapsed', !nextOpen);
    body.hidden = !nextOpen;
    heading.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  };
  const toggle = () => apply(heading.getAttribute('aria-expanded') !== 'true');
  heading.addEventListener('click', toggle);
  heading.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });
  apply(open);
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
  const attach = () => {
    const hero = app?.querySelector('.hero');
    if (!hero || app.dataset.routeRendererAttached) return false;
    app.dataset.routeRendererAttached = '1';
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
  hero.classList.add('route-demo-hero');

  if ((appeal.themes||[]).length) hero.insertAdjacentHTML('beforeend', routeChipList(appeal.themes));
  if (r.family || r.variant) {
    hero.insertAdjacentHTML('beforeend', `<div class="route-hero-meta">${r.family?`<span><small>系統</small><strong>${escRoute(r.family)}</strong></span>`:''}${r.variant?`<span><small>バリエーション</small><strong>${escRoute(variantRoute(r.variant))}</strong></span>`:''}</div>`);
  }
  if ((data.hero_refs||[]).length) {
    hero.insertAdjacentHTML('beforeend', `<div class="route-hero-refs">${data.hero_refs.map(x=>routeRefMini(x,published)).join('')}</div>`);
  }

  const facts = [
    ['所要時間', r.duration || ''],
    ['難易度', difficultyRoute(r.difficulty || '')],
    ['移動', r.route_type === 'driving' ? '車' : (r.route_type || '')],
  ].filter(([,value]) => value);
  if ((r.season||[]).length) {
    const season = `<span class="route-season-icons">${r.season.map(x=>`<i title="${escRoute(x)}">${escRoute(x.slice(0,1))}</i>`).join('')}</span>`;
    facts.push(['季節', season]);
  }
  if (facts.length) {
    hero.insertAdjacentHTML('beforeend', `<div class="route-hero-facts">${facts.map(([label,value])=>`<div><span>${escRoute(label)}</span><strong>${label==='季節'?value:escRoute(value)}</strong></div>`).join('')}</div>`);
  }

  const mapSection = findSection(app, 'ルートの地図');
  mapSection?.querySelector('.map-tabs')?.remove();
  mapSection?.querySelector('#route-summary')?.remove();
  mapSection?.querySelector('#map-mode-note')?.remove();

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

  makeCollapsible(appealSection, false);
  makeCollapsible(mapSection, true);
  makeCollapsible(sequenceSection, true);
  makeCollapsible(constraintSection, true);
}
