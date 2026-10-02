function normalize(value) {
  return String(value || '').normalize('NFKC').toLocaleLowerCase('ja-JP').trim();
}

const CATALOG_TYPES = new Set(['spot', 'route', 'plan']);

function requestedCatalog() {
  const value = new URLSearchParams(window.location.search).get('catalog');
  return CATALOG_TYPES.has(value) ? value : 'all';
}

function selectedType(root) {
  return root.querySelector('[data-explorer-type]:checked')?.value || 'all';
}

function categoryOptions(cards, type) {
  const options = new Map();
  for (const card of cards) {
    if (card.dataset.entityType !== type) continue;
    const code = card.dataset.categoryCode;
    const label = card.dataset.categoryLabel;
    if (code && label && !options.has(code)) options.set(code, label);
  }
  return [...options.entries()].sort((a, b) => a[1].localeCompare(b[1], 'ja'));
}

function rebuildCategory(root, cards) {
  const field = root.querySelector('[data-explorer-category-field]');
  const select = root.querySelector('[data-explorer-category]');
  if (!select) return;

  const type = selectedType(root);
  select.replaceChildren();

  if (type === 'spot' || type === 'route') {
    if (field) field.hidden = false;
    select.disabled = false;
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'すべてのカテゴリ';
    select.append(all);

    for (const [code, label] of categoryOptions(cards, type)) {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = label;
      select.append(option);
    }
    return;
  }

  if (field) field.hidden = true;
  select.disabled = true;
  const option = document.createElement('option');
  option.value = '';
  option.textContent = type === 'plan' ? 'プランでは使用しません' : '種類を選択してください';
  select.append(option);
}

function matchesCard(card, state) {
  if (state.type !== 'all' && card.dataset.entityType !== state.type) return false;

  if (state.area) {
    const areas = (card.dataset.areaIds || '').split('|').filter(Boolean);
    if (!areas.includes(state.area)) return false;
  }

  if (state.category && card.dataset.categoryCode !== state.category) return false;

  if (state.query) {
    const haystack = normalize(card.dataset.searchText);
    if (!haystack.includes(state.query)) return false;
  }

  return true;
}

function applyFilters(root, cards) {
  const search = root.querySelector('[data-explorer-search]');
  const area = root.querySelector('[data-explorer-area]');
  const category = root.querySelector('[data-explorer-category]');

  const state = {
    type: selectedType(root),
    query: normalize(search?.value),
    area: area?.value || '',
    category: category?.value || ''
  };

  let visible = 0;
  for (const card of cards) {
    const match = matchesCard(card, state);
    card.hidden = !match;
    if (match) visible += 1;
  }

  const count = root.querySelector('[data-explorer-count]');
  if (count) count.textContent = `${visible}件`;

  const empty = root.querySelector('[data-explorer-empty]');
  if (empty) empty.hidden = visible !== 0;
}

export function hydrateExplorer(root) {
  const cards = [...root.querySelectorAll('[data-explorer-card]')];
  const typeControls = [...root.querySelectorAll('[data-explorer-type]')];
  const search = root.querySelector('[data-explorer-search]');
  const area = root.querySelector('[data-explorer-area]');
  const category = root.querySelector('[data-explorer-category]');

  const catalog = requestedCatalog();
  const catalogControl = typeControls.find(control => control.value === catalog);
  if (catalogControl) catalogControl.checked = true;

  for (const control of typeControls) {
    control.addEventListener('change', () => {
      if (!control.checked) return;
      if (category) category.value = '';
      rebuildCategory(root, cards);
      applyFilters(root, cards);
    });
  }

  search?.addEventListener('input', () => applyFilters(root, cards));
  area?.addEventListener('change', () => applyFilters(root, cards));
  category?.addEventListener('change', () => applyFilters(root, cards));

  rebuildCategory(root, cards);
  applyFilters(root, cards);
}
