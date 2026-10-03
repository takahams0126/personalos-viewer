import { hrefFor } from '../core/router.js';
import { renderChipList, renderEmphasisList, renderFactList } from './components/presentation.js';
import { h } from './dom.js';

function renderFacts(facts = []) {
  return renderFactList(facts, { className: 'route-facts', rowClassName: 'route-fact' });
}

async function resolveSpot(ref, resolver) {
  try {
    const loaded = await resolver.load(ref);
    return {
      ref,
      title: loaded.data.title || loaded.entry.title,
      unavailable: false
    };
  } catch (error) {
    console.warn('[current-viewer] Route Spot unavailable', ref, error);
    try {
      const described = await resolver.describe(ref);
      return { ref, title: described.title, unavailable: true };
    } catch {
      return { ref, title: ref.id, unavailable: true };
    }
  }
}

async function renderHeroSpots(refs = [], resolver) {
  if (!refs.length) return null;
  const spots = await Promise.all(refs.map(ref => resolveSpot(ref, resolver)));
  return h('nav', {
    className: 'route-key-spots',
    dataset: { semantic: 'hero-spots' },
    attrs: { 'aria-label': '主役スポット' }
  },
    h('span', { className: 'route-key-spots-label', text: '主役スポット' }),
    h('div', { className: 'route-key-spots-links' }, spots.map(spot =>
      h('a', {
        className: 'route-key-spot-link',
        attrs: { href: hrefFor(spot.ref) },
        text: spot.title
      })
    ))
  );
}

function renderIdentity(route) {
  const facts = [];
  if (route.family_label) facts.push({ label: 'ルート系列', value: route.family_label });
  if (route.variant?.label) facts.push({ label: 'バリエーション', value: route.variant.label });
  return renderFactList(facts, { className: 'route-identity' });
}

function renderAppeal(appeal) {
  if (!appeal) return null;
  const strengths = appeal.strengths || [];
  if (!appeal.summary && !strengths.length) return null;
  return h('section', { className: 'route-appeal route-appeal-lead', dataset: { semantic: 'appeal' } },
    h('h2', { text: 'このルートの魅力' }),
    appeal.summary ? h('p', { className: 'route-appeal-summary', text: appeal.summary }) : null,
    renderEmphasisList(strengths, { className: 'route-strengths' })
  );
}

function renderMap(map) {
  if (!map?.artifact_ref) return null;
  return h('section', { className: 'route-map-section content-section', dataset: { semantic: 'conceptual-map' } },
    h('h2', { text: '地図' }),
    h('figure', { className: 'map-view route-map', dataset: { mapArtifactId: map.artifact_ref } },
      h('div', { className: 'map-canvas', attrs: { role: 'img', 'aria-label': 'ルートマップ' } }),
      h('p', { className: 'map-state', text: '地図を読み込み中…' })
    )
  );
}

function renderBadges(item) {
  const badges = [];
  if (item.visit_purpose?.label) badges.push(h('span', { className: 'route-occurrence-badge', text: item.visit_purpose.label }));
  if (item.inclusion_requirement?.label) {
    badges.push(h('span', {
      className: 'route-occurrence-badge',
      dataset: { code: item.inclusion_requirement.code || '' },
      text: item.inclusion_requirement.label
    }));
  }
  return badges.length ? h('div', { className: 'route-occurrence-badges' }, badges) : null;
}

function renderRelationRow(label, value, className = '') {
  if (!value) return null;
  return h('div', { className: ['route-relation-row', className].filter(Boolean).join(' ') },
    h('dt', { text: label }),
    h('dd', {}, value)
  );
}

async function renderAlternatives(alternatives = [], resolver, parentOrder) {
  if (!alternatives.length) return null;
  const items = await Promise.all(alternatives.map(async alternative => {
    const spot = await resolveSpot(alternative.spot_ref, resolver);
    return h('li', {
      className: 'route-alternative-item',
      dataset: { semantic: 'route-alternative', parentOrder }
    },
      h('dl', { className: 'route-relation-facts' },
        renderRelationRow('代替', h('a', { attrs: { href: hrefFor(spot.ref) }, text: spot.title })),
        alternative.selection_condition?.text
          ? renderRelationRow('条件', alternative.selection_condition.text, 'route-alternative-condition')
          : null
      ),
      h('p', { className: 'route-alternative-parent', text: `#${parentOrder} の代替` })
    );
  }));
  return h('ul', { className: 'route-alternatives' }, items);
}

async function renderSequenceItem(item, resolver) {
  const spot = await resolveSpot(item.spot_ref, resolver);
  return h('li', {
    className: 'route-sequence-item',
    dataset: { semantic: 'route-stop', order: item.order }
  },
    h('div', { className: 'route-sequence-marker', attrs: { 'aria-hidden': 'true' }, text: String(item.order) }),
    h('article', { className: 'route-sequence-body' },
      h('header', { className: 'route-sequence-header' },
        h('h3', {}, h('a', { attrs: { href: hrefFor(spot.ref) }, text: spot.title })),
        renderBadges(item)
      ),
      spot.unavailable ? h('p', { className: 'component-unavailable', text: '参照先を解決できませんでした' }) : null,
      item.condition?.text
        ? h('dl', { className: 'route-relation-facts' }, renderRelationRow('条件', item.condition.text, 'route-condition'))
        : null,
      await renderAlternatives(item.alternatives, resolver, item.order)
    )
  );
}

async function renderSequence(sequence = [], resolver) {
  if (!sequence.length) return null;
  const items = await Promise.all(sequence.map(item => renderSequenceItem(item, resolver)));
  return h('section', { className: 'route-sequence-section content-section', dataset: { semantic: 'sequence' } },
    h('h2', { text: '立ち寄り順' }),
    h('ol', { className: 'route-sequence' }, items)
  );
}

function renderConstraints(constraints = []) {
  if (!constraints.length) return null;
  return h('section', { className: 'route-constraints content-section', dataset: { semantic: 'constraints' } },
    h('h2', { text: '重要な条件' }),
    h('ul', {}, constraints.map(item => h('li', { text: item })))
  );
}

export async function renderRoute({ route, resolver }) {
  return h('article', { className: 'route-page', dataset: { semantic: 'route', entityId: route.id } },
    h('header', { className: 'route-hero' },
      h('div', { className: 'route-hero-copy' },
        h('div', { className: 'route-meta', dataset: { semantic: 'route-meta' } },
          h('p', { className: 'entity-kind', text: `Route · ${route.id}` }),
          renderIdentity(route)
        ),
        h('h1', { text: route.title }),
        renderChipList(route.theme_chips, { ariaLabel: 'テーマ', className: 'route-theme-chips' }),
        renderFacts(route.hero_facts),
        renderAppeal(route.appeal),
        await renderHeroSpots(route.hero_spots, resolver)
      )
    ),
    await renderSequence(route.sequence, resolver),
    renderMap(route.map),
    renderConstraints(route.constraints)
  );
}
