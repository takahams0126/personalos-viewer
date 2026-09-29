import { hrefFor } from '../core/router.js';
import { renderChipList } from './components/presentation.js';
import { h } from './dom.js';

const EXPLORER_TYPES = new Set(['spot', 'route', 'plan']);

function explorerEntries(manifest) {
  return (manifest.entities || []).filter(entry =>
    entry.explorer && EXPLORER_TYPES.has(entry.ref?.entity_type)
  );
}

function renderTypeOption(value, label, checked = false) {
  const id = `top-type-${value}`;
  return h('label', { className: 'top-type-option', attrs: { for: id } },
    h('input', {
      attrs: {
        id,
        type: 'radio',
        name: 'top-entity-type',
        value,
        checked
      },
      dataset: { explorerType: value }
    }),
    h('span', { text: label })
  );
}

function renderFilterPanel(manifest) {
  return h('aside', { className: 'top-filter-panel', attrs: { 'aria-label': '検索と絞り込み' } },
    h('div', { className: 'top-filter-heading' },
      h('h2', { text: '絞り込み' })
    ),
    h('fieldset', { className: 'top-type-filter' },
      h('legend', { text: '種類' }),
      h('div', { className: 'top-type-options' },
        renderTypeOption('all', 'すべて', true),
        renderTypeOption('spot', 'スポット'),
        renderTypeOption('route', 'ルート'),
        renderTypeOption('plan', 'プラン')
      )
    ),
    h('div', { className: 'top-filter-field top-search-field' },
      h('label', { attrs: { for: 'top-search' }, text: 'キーワード' }),
      h('input', {
        attrs: {
          id: 'top-search',
          type: 'search',
          placeholder: '名称・概要・タグで検索',
          autocomplete: 'off'
        },
        dataset: { explorerSearch: '' }
      })
    ),
    h('div', { className: 'top-filter-field' },
      h('label', { attrs: { for: 'top-area' }, text: 'エリア' }),
      h('select', { attrs: { id: 'top-area' }, dataset: { explorerArea: '' } },
        h('option', { attrs: { value: '' }, text: 'すべてのエリア' }),
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
      h('label', { attrs: { for: 'top-category' }, text: 'カテゴリ' }),
      h('select', {
        attrs: { id: 'top-category', disabled: true },
        dataset: { explorerCategory: '' }
      },
        h('option', { attrs: { value: '' }, text: '種類を選択してください' })
      )
    )
  );
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
    className: 'top-result-row entity-link-card',
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
      h('div', { className: 'top-result-meta' },
        h('span', { className: 'top-result-type', text: explorer.type_label }),
        h('span', { className: 'top-result-id', text: id })
      ),
      h('h3', { text: entry.title }),
      explorer.summary ? h('p', { className: 'top-result-summary', text: explorer.summary }) : null,
      renderChipList(explorer.tags, { ariaLabel: 'タグ', className: 'top-result-tags', compact: true })
    ),
    h('span', { className: 'top-result-arrow', attrs: { 'aria-hidden': 'true' }, text: '›' })
  );
}

export function renderTop({ manifest }) {
  const entries = explorerEntries(manifest);

  return h('article', { className: 'top-page', dataset: { semantic: 'explorer' } },
    h('header', { className: 'top-hero' },
      h('p', { className: 'entity-kind', text: 'PERSONALOS LEISURE' }),
      h('h1', { text: '行き先とプランを探す' }),
      h('p', {
        className: 'top-intro',
        text: 'スポット、ルート、プランを一覧から探し、条件で絞り込めます。'
      })
    ),
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
