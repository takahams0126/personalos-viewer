import { hrefFor } from '../core/router.js';
import { resources } from '../core/resource-store.js';
import { h } from './dom.js';

const EXPLORER_TYPES = new Set(['spot', 'route', 'plan', 'concrete_plan']);

function explorerEntries(manifest) {
  return (manifest.entities || []).filter(entry =>
    entry.explorer && EXPLORER_TYPES.has(entry.ref?.entity_type)
  );
}

function renderTypeOption(value, label) {
  const id = `top-type-${value}`;
  return h('label', { className: 'top-type-option', attrs: { for: id } },
    h('input', {
      attrs: {
        id,
        type: 'radio',
        name: 'top-entity-type',
        value
      },
      dataset: { explorerType: value }
    }),
    h('span', { text: label })
  );
}

function renderFilterPanel(manifest) {
  return h('aside', { className: 'top-filter-panel', attrs: { 'aria-label': '検索と絞り込み' } },
    h('fieldset', { className: 'top-type-filter' },
      h('legend', { className: 'visually-hidden', text: '種類' }),
      h('div', { className: 'top-type-options' },
        renderTypeOption('spot', 'スポット'),
        renderTypeOption('route', 'ルート'),
        renderTypeOption('plan', 'プラン'),
        renderTypeOption('concrete_plan', '実施プラン')
      )
    ),
    h('div', { className: 'top-filter-field top-search-field' },
      h('label', { className: 'visually-hidden', attrs: { for: 'top-search' }, text: 'キーワード' }),
      h('input', {
        attrs: {
          id: 'top-search',
          type: 'search',
          placeholder: 'キーワード',
          autocomplete: 'off'
        },
        dataset: { explorerSearch: '' }
      })
    ),
    h('div', { className: 'top-filter-field' },
      h('label', { className: 'visually-hidden', attrs: { for: 'top-area' }, text: 'エリア' }),
      h('select', { attrs: { id: 'top-area', 'aria-label': 'エリア' }, dataset: { explorerArea: '' } },
        h('option', { attrs: { value: '' }, text: 'エリア' }),
        (manifest.areas || []).map(area =>
          h('option', { attrs: { value: area.id }, text: area.label })
        )
      )
    ),
    h('div', {
      className: 'top-filter-field',
      attrs: { hidden: true },
      dataset: { explorerCategoryField: '' }
    },
      h('label', { className: 'visually-hidden', attrs: { for: 'top-category' }, text: 'カテゴリ' }),
      h('select', {
        attrs: { id: 'top-category', disabled: true, 'aria-label': 'カテゴリ' },
        dataset: { explorerCategory: '' }
      },
        h('option', { attrs: { value: '' }, text: 'カテゴリ' })
      )
    )
  );
}

function compactDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${month}/${day}`;
}

function compactPeriod(period) {
  const start = compactDate(period?.start);
  const end = compactDate(period?.end);
  if (!start || !end) return null;
  return `${start}–${end}`;
}

function renderResultMeta(entry) {
  const type = entry.ref.entity_type;
  if (type !== 'plan' && type !== 'concrete_plan') return null;

  const meta = h('p', {
    className: 'top-result-meta',
    dataset: { semantic: 'explorer-result-meta' },
    text: type === 'concrete_plan' ? '実施' : 'プラン'
  });

  if (type === 'concrete_plan' && entry.data_path) {
    resources.loadJson(entry.data_path)
      .then(data => {
        const period = compactPeriod(data?.period);
        if (!period) return;
        meta.textContent = `実施 · ${period}`;
      })
      .catch(error => {
        console.warn('[current-viewer] Explorer ConcretePlan period unavailable', entry.ref?.id, error);
      });
  }

  return meta;
}

function renderResult(entry) {
  const explorer = entry.explorer;
  const type = entry.ref.entity_type;
  const id = entry.ref.id;
  const searchText = [
    entry.title,
    explorer.summary,
    explorer.type_label,
    explorer.category?.label,
    id,
    ...(explorer.tags || [])
  ].filter(Boolean).join(' ');

  return h('a', {
    className: 'top-result-row',
    attrs: { href: hrefFor(entry.ref) },
    dataset: {
      explorerCard: '',
      entityType: type,
      entityId: id,
      areaIds: (explorer.area_ids || []).join('|'),
      categoryCode: explorer.category?.code || '',
      categoryLabel: explorer.category?.label || '',
      searchText
    }
  },
    explorer.image?.url
      ? h('div', { className: 'top-result-thumbnail' },
          h('img', {
            attrs: {
              src: explorer.image.url,
              alt: explorer.image.alt || '',
              loading: 'lazy',
              decoding: 'async'
            }
          })
        )
      : h('div', {
          className: 'top-result-thumbnail top-result-thumbnail-fallback',
          attrs: { 'aria-hidden': 'true' }
        }, h('span', { text: explorer.type_label })),
    h('div', { className: 'top-result-body' },
      renderResultMeta(entry),
      h('h3', { text: entry.title }),
      explorer.summary ? h('p', { className: 'top-result-summary', text: explorer.summary }) : null
    )
  );
}

export function renderTop({ manifest }) {
  const entries = explorerEntries(manifest);

  return h('article', { className: 'top-page', dataset: { semantic: 'explorer' } },
    h('div', { className: 'top-explorer-layout' },
      renderFilterPanel(manifest),
      h('section', { className: 'top-results-panel', attrs: { 'aria-labelledby': 'top-results-title' } },
        h('header', { className: 'top-results-header' },
          h('h2', { attrs: { id: 'top-results-title' }, text: '検索結果' }),
          h('p', {
            className: 'top-result-count',
            attrs: { 'aria-live': 'polite' },
            dataset: { explorerCount: '' },
            text: `${entries.length}件`
          })
        ),
        h('div', { className: 'top-result-list' }, entries.map(renderResult)),
        h('p', {
          className: 'top-empty-state',
          attrs: { hidden: true },
          dataset: { explorerEmpty: '' },
          text: '条件に合う項目がありません。'
        })
      )
    )
  );
}
