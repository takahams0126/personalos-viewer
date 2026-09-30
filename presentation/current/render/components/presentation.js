import { h } from '../dom.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export function renderChipList(items = [], {
  ariaLabel = 'タグ',
  className = '',
  compact = false
} = {}) {
  if (!items.length) return null;

  return h('ul', {
    className: classNames('entity-chip-list', compact ? 'entity-chip-list--compact' : '', className),
    attrs: { 'aria-label': ariaLabel }
  }, items.map(item => h('li', { className: 'entity-chip', text: item })));
}

export function renderEmphasisList(items = [], { className = '' } = {}) {
  if (!items.length) return null;

  return h('ul', {
    className: classNames('emphasis-card-list', className)
  }, items.map(item =>
    h('li', { className: 'emphasis-card' },
      h('p', { text: item })
    )
  ));
}

export function renderFactList(facts = [], {
  className = '',
  rowClassName = ''
} = {}) {
  if (!facts.length) return null;

  return h('dl', { className }, facts.map(fact =>
    h('div', {
      className: rowClassName,
      dataset: fact.semantic ? { semantic: fact.semantic } : {}
    },
      h('dt', { text: fact.label }),
      h('dd', { text: fact.value })
    )
  ));
}
