import { loadManifest } from '../core/data.js';
import { loadStyle } from '../shared/load-style.js';

const TYPE_LABELS = { plan: 'プラン', route: 'ルート', spot: 'スポット' };
const CATEGORY_LABELS = {
  multi_day_trip: '複数日旅行',
  drive: 'ドライブ',
  attraction: '観光スポット',
  mountain: '山',
  onsen: '温泉',
  lodging: '宿泊',
  food: '食事',
  facility: '施設'
};

export async function render() {
  loadStyle(new URL('./top.css', import.meta.url).href);
  const catalog = await loadManifest();
  const app = document.querySelector('#app');
  const breadcrumb = document.querySelector('#breadcrumb');
  if (!app) return;

  document.title = 'PersonalOS Leisure';
  if (breadcrumb) breadcrumb.innerHTML = '';

  app.innerHTML = `
    <section class="top-hero">
      <div class="top-kicker">PersonalOS Leisure</div>
      <h1>レジャー</h1>
      <p>旅の計画から、ルート、スポットへ掘り下げて見られます。</p>
    </section>
    <section class="home-explorer" aria-label="レジャー一覧">
      <div class="home-toolbar">
        <div class="home-tabs" role="tablist" aria-label="表示種別">
          <button class="home-tab active" data-type="plan" type="button">プラン</button>
          <button class="home-tab" data-type="route" type="button">ルート</button>
          <button class="home-tab" data-type="spot" type="button">スポット</button>
        </div>
        <div class="home-filters">
          <label>エリア<select id="home-area"><option value="">すべて</option>${(catalog.areas || []).map(a => `<option value="${esc(a.id)}">${esc(a.label)}</option>`).join('')}</select></label>
          <label>カテゴリ<select id="home-category"><option value="">すべて</option></select></label>
          <label>検索<input id="home-search" type="search" placeholder="名前・特徴・タグで検索"></label>
        </div>
      </div>
      <div class="home-summary-row"><div id="home-count" class="home-count"></div></div>
      <div id="explorer-grid" class="explorer-grid"></div>
    </section>`;

  const state = { type: 'plan', area: '', category: '', q: '' };
  const area = app.querySelector('#home-area');
  const category = app.querySelector('#home-category');
  const search = app.querySelector('#home-search');
  const grid = app.querySelector('#explorer-grid');
  const count = app.querySelector('#home-count');
  const tabs = [...app.querySelectorAll('.home-tab')];

  const categories = () => [...new Set((catalog.items || [])
    .filter(item => item.type === state.type)
    .map(item => item.category)
    .filter(Boolean))].sort();

  const rebuildCategory = () => {
    const values = categories();
    category.innerHTML = '<option value="">すべて</option>' + values
      .map(value => `<option value="${esc(value)}">${esc(categoryLabel(value))}</option>`)
      .join('');
    if (!values.includes(state.category)) state.category = '';
    category.value = state.category;
  };

  const renderGrid = () => {
    const q = state.q.trim().toLowerCase();
    const rows = (catalog.items || [])
      .filter(item => item.type === state.type)
      .filter(item => !state.area || (item.area_ids || []).includes(state.area))
      .filter(item => !state.category || item.category === state.category)
      .filter(item => !q || [item.title, item.summary, ...(item.tags || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(q));

    count.textContent = `${typeLabel(state.type)} ${rows.length}件`;
    grid.innerHTML = rows.length
      ? rows.map(cardHtml).join('')
      : '<div class="home-empty">条件に合う項目がありません。</div>';
  };

  tabs.forEach(button => button.addEventListener('click', () => {
    state.type = button.dataset.type;
    tabs.forEach(tab => tab.classList.toggle('active', tab === button));
    rebuildCategory();
    renderGrid();
  }));
  area.addEventListener('change', () => { state.area = area.value; renderGrid(); });
  category.addEventListener('change', () => { state.category = category.value; renderGrid(); });
  search.addEventListener('input', () => { state.q = search.value; renderGrid(); });

  rebuildCategory();
  renderGrid();
}

function esc(value = '') {
  return String(value).replace(/[&<>'\"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;'
  }[char]));
}

function typeLabel(value) {
  return TYPE_LABELS[value] || value;
}

function categoryLabel(value) {
  return CATEGORY_LABELS[value] || String(value).replaceAll('_', ' ');
}

function cardHtml(item) {
  const href = `./index2.html?type=${encodeURIComponent(item.type)}&id=${encodeURIComponent(item.id)}`;
  const image = item.image_url
    ? `<div class="explorer-thumb"><img src="${esc(item.image_url)}" alt="" loading="lazy" onerror="this.parentElement.remove()"></div>`
    : '';
  const tags = (item.tags || []).slice(0, 5)
    .map(tag => `<span class="ui-badge is-tag">${esc(tag)}</span>`)
    .join('');

  return `<article class="explorer-card">${image}<div class="explorer-body"><div class="explorer-meta"><span class="explorer-type">${esc(typeLabel(item.type))}</span><span class="explorer-id">${esc(item.id)}</span></div><h3><a href="${href}">${esc(item.title)}</a></h3>${item.summary ? `<p>${esc(item.summary)}</p>` : ''}${tags ? `<div class="explorer-tags">${tags}</div>` : ''}</div></article>`;
}
