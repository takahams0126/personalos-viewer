import { hrefFor } from '../core/router.js';
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

function renderControls(manifest) {
  return h('section', { className: 'top-controls', attrs: { 'aria-label': '検索と絞り込み' } },
    h('fieldset', { className: 'top-type-filter' },
      h('legend', { text: '種類' }),
      h('div', { className: 'top-type-options' },
        renderTypeOption('all', 'すべて', true),
        renderTypeOption('spot', 'スポット'),
        renderTypeOption('route', 'ルート'),
        renderTypeOption('plan', 'プラン')
      )
    ),
    h('div', { className: 'top-filter-fields', dataset: { categoryActive: 'false' } },
      h('div', { className: 'top-search-field' },
        h('label', { attrs: { for: 'top-search' }, text: '検索' }),
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
      h('div', { className: 'top-select-field' },
        h('label', { attrs: { for: 'top-area' }, text: 'エリア' }),
        h('select', { attrs: { id: 'top-area' }, dataset: { explorerArea: '' } },
          h('option', { attrs: { value: '' }, text: 'すべてのエリア' }),
          (manifest.areas || []).map(area =>
            h('option', { attrs: { value: area.id }, text: area.label })
          )
        )
      ),
      h('div', {
        className: 'top-select-field',
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
    )
  );
}

function renderTags(tags = []) {
  if (!tags.length) return null;
  return h('ul', { className: 'top-result-tags', attrs: { 'aria-label': 'タグ' } },
    tags.map(tag => h('li', { text: tag }))
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
    id,
    ...(explorer.tags || [])
  ].filter(Boolean).join(' ');

  return h('li', {
    className: 'top-result-item',
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
    h('a', {
      className: 'top-result-row',
      attrs: { href: hrefFor(entry.ref) }
    },
      explorer.image?.url
        ? h('div', { className: 'top-result-media' },
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
            className: 'top-result-media top-result-media-fallback',
            attrs: { 'aria-hidden': 'true' }
          },
            h('span', { text: explorer.type_label })
          ),
      h('div', { className: 'top-result-copy' },
        h('div', { className: 'top-result-heading' },
          h('p', { className: 'top-result-meta', text: `${explorer.type_label} · ${id}` }),
          renderTags(explorer.tags)
        ),
        h('h2', { text: entry.title }),
        explorer.summary ? h('p', { className: 'top-result-summary', text: explorer.summary }) : null
      )
    )
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
        text: 'スポット、ルート、プランを検索し、気になるものから詳しく見られます。'
      })
    ),
    renderControls(manifest),
    h('div', { className: 'top-results-header' },
      h('h2', { text: '検索結果' }),
      h('p', {
        className: 'top-result-count',
        attrs: { 'aria-live': 'polite' },
        dataset: { explorerCount: '' },
        text: `${entries.length}件`
      })
    ),
    h('section', { className: 'top-results', attrs: { 'aria-label': '検索結果一覧' } },
      h('ul', { className: 'top-result-list' }, entries.map(renderResult)),
      h('p', {
        className: 'top-empty-state',
        attrs: { hidden: true },
        dataset: { explorerEmpty: '' },
        text: '条件に合う項目がありません。'
      })
    )
  );
}
