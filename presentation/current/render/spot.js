import { hrefFor } from '../core/router.js';
import { renderChipList } from './components/presentation.js';
import { h } from './dom.js';

function renderFacts(facts = [], className = 'spot-facts') {
  if (!facts.length) return null;
  return h('dl', { className }, facts.map(fact =>
    h('div', { className: 'spot-fact', dataset: { semantic: fact.semantic || '' } },
      h('dt', { text: fact.label }),
      h('dd', { text: fact.value })
    )
  ));
}

function renderAccess(access) {
  if (!access?.location_text) return null;
  return h('section', { className: 'spot-access-block', dataset: { semantic: 'access' } },
    h('h2', { text: 'アクセス' }),
    h('p', { className: 'spot-location', text: access.location_text }),
    access.note ? h('p', { className: 'spot-detail-note', text: access.note }) : null,
    access.google_maps_url
      ? h('a', {
          className: 'spot-external-link',
          text: 'Google Mapsで開く',
          attrs: { href: access.google_maps_url, target: '_blank', rel: 'noopener noreferrer' }
        })
      : null
  );
}

function renderFacilities(facilities) {
  if (!facilities?.facts?.length) return null;
  return h('section', { className: 'spot-facilities', dataset: { semantic: 'facilities' } },
    h('h2', { text: '設備・施設' }),
    renderFacts(facilities.facts, 'spot-facility-facts'),
    facilities.note ? h('p', { className: 'spot-detail-note', text: facilities.note }) : null
  );
}

function renderReferences(references) {
  if (!references?.official && !references?.supplemental) return null;
  const links = [];
  if (references.official?.url) {
    links.push(h('a', {
      text: '公式・観光情報',
      attrs: { href: references.official.url, target: '_blank', rel: 'noopener noreferrer' }
    }));
  }
  if (references.supplemental?.url) {
    links.push(h('a', {
      text: '補足情報',
      attrs: { href: references.supplemental.url, target: '_blank', rel: 'noopener noreferrer' }
    }));
  }
  return h('nav', {
    className: 'spot-reference-utility',
    dataset: { semantic: 'references' },
    attrs: { 'aria-label': '公式・参考' }
  },
    h('span', { className: 'spot-reference-label', text: '公式・参考' }),
    h('div', { className: 'spot-reference-links' }, links)
  );
}

function renderFees(fees) {
  if (!fees?.applicability) return null;
  const state = fees.applicability.code;
  if (state === 'not_applicable') return null;
  if (state === 'free' || state === 'unknown') {
    return h('section', { className: 'spot-fees', dataset: { semantic: 'fees' } },
      h('h3', { text: '料金' }),
      h('p', { className: 'spot-fee-state', text: fees.applicability.label })
    );
  }

  const items = fees.items || [];
  if (!items.length) return null;
  return h('section', { className: 'spot-fees', dataset: { semantic: 'fees' } },
    h('h3', { text: '料金' }),
    h('div', { className: 'spot-fee-list' }, items.map(item =>
      h('div', { className: 'spot-fee-row', dataset: { semantic: 'fee' } },
        h('span', { className: 'spot-fee-scope', text: item.scope || '料金' }),
        h('strong', { className: 'spot-fee-value', text: item.pricing === null ? '料金変動' : item.pricing.label })
      )
    ))
  );
}

function renderUsageDecision(fees, facts = []) {
  const feeNode = renderFees(fees);
  if (!facts.length && !feeNode) return null;
  return h('section', {
    className: 'spot-usage-decision',
    dataset: { semantic: 'utilization-decision' }
  },
    h('h2', { text: '利用案内' }),
    facts.length ? renderFacts(facts, 'spot-major-facts') : null,
    feeNode
  );
}

function renderCarousel(images = [], title = '') {
  if (!images.length) return null;
  const slides = images.map((image, index) =>
    h('figure', {
      className: 'carousel-slide',
      dataset: { carouselSlide: index },
      attrs: index === 0 ? {} : { hidden: true }
    },
      h('img', {
        attrs: {
          src: image.url,
          alt: image.caption || `${title}の画像 ${index + 1}`,
          loading: index === 0 ? 'eager' : 'lazy',
          decoding: 'async'
        }
      }),
      image.caption || image.credit
        ? h('figcaption', {},
            image.caption ? h('span', { text: image.caption }) : null,
            image.credit ? h('small', { text: image.credit }) : null
          )
        : null
    )
  );

  const controls = images.length > 1
    ? h('div', { className: 'carousel-controls' },
        h('button', { attrs: { type: 'button', 'data-carousel-prev': true, 'aria-label': '前の画像' }, text: '前へ' }),
        h('p', { className: 'carousel-status', attrs: { 'aria-live': 'polite' } },
          h('span', { attrs: { 'data-carousel-current': true }, text: '1' }),
          ` / ${images.length}`
        ),
        h('button', { attrs: { type: 'button', 'data-carousel-next': true, 'aria-label': '次の画像' }, text: '次へ' })
      )
    : null;

  const thumbs = images.length > 1
    ? h('div', { className: 'carousel-thumbs', attrs: { 'aria-label': '画像一覧' } },
        images.map((image, index) =>
          h('button', {
            className: 'carousel-thumb',
            attrs: {
              type: 'button',
              'data-carousel-go': index,
              'aria-label': `画像 ${index + 1} を表示`,
              'aria-current': index === 0 ? 'true' : 'false'
            }
          }, h('img', { attrs: { src: image.url, alt: '', loading: 'lazy', decoding: 'async' } }))
        )
      )
    : null;

  return h('section', {
    className: 'image-carousel spot-carousel',
    dataset: { semantic: 'image-carousel', carousel: true },
    attrs: { 'aria-label': `${title}の画像` }
  },
    h('div', { className: 'carousel-stage', attrs: { tabindex: '0' } }, slides),
    controls,
    thumbs
  );
}

function renderReview(review) {
  if (!review) return null;
  const positives = review.positives || [];
  const cautions = review.cautions || [];
  if (!positives.length && !cautions.length) return null;
  return h('section', { className: 'spot-review', dataset: { semantic: 'review' } },
    h('header', { className: 'spot-review-header' },
      h('h3', { text: '口コミから' }),
      review.checked_label ? h('span', { className: 'spot-review-checked', text: review.checked_label }) : null
    ),
    h('div', { className: 'spot-review-grid' },
      positives.length
        ? h('div', { className: 'spot-review-positive' },
            h('h4', { text: 'よく評価される点' }),
            h('ul', {}, positives.map(item => h('li', { text: item })))
          )
        : null,
      cautions.length
        ? h('div', { className: 'spot-review-caution' },
            h('h4', { text: '注意したい点' }),
            h('ul', {}, cautions.map(item => h('li', { text: item })))
          )
        : null
    )
  );
}

function renderAppeal(appeal = {}) {
  const highlights = appeal.highlights || [];
  const review = renderReview(appeal.review);
  if (!highlights.length && !review) return null;
  return h('section', { className: 'spot-appeal content-section', dataset: { semantic: 'appeal' } },
    h('h2', { text: 'このスポットの魅力' }),
    highlights.length
      ? h('ul', { className: 'spot-highlight-list' }, highlights.map(item => h('li', { text: item })))
      : null,
    review
  );
}

async function describeRelated(ref, resolver) {
  try {
    const loaded = await resolver.load(ref);
    return {
      ref,
      title: loaded.data.title,
      summary: loaded.data.summary || '',
      image: loaded.data.images?.[0]?.url || null,
      unavailable: false
    };
  } catch (error) {
    console.warn('[current-viewer] related Spot unavailable', ref, error);
    try {
      const described = await resolver.describe(ref);
      return { ref, title: described.title, summary: '', image: null, unavailable: true };
    } catch {
      return { ref, title: ref.id, summary: '', image: null, unavailable: true };
    }
  }
}

async function renderRelatedSpots(refs = [], resolver) {
  if (!refs.length) return null;
  const items = await Promise.all(refs.map(ref => describeRelated(ref, resolver)));
  return h('section', { className: 'spot-related content-section content-section--roomy', dataset: { semantic: 'related-spots' } },
    h('h2', { text: '関連スポット' }),
    h('div', { className: 'spot-related-grid' },
      items.map(item =>
        h('a', { className: 'spot-related-card entity-link-card', attrs: { href: hrefFor(item.ref) } },
          item.image ? h('img', { attrs: { src: item.image, alt: '', loading: 'lazy', decoding: 'async' } }) : null,
          h('div', { className: 'spot-related-copy' },
            h('h3', { text: item.title }),
            item.summary ? h('p', { text: item.summary }) : null,
            item.unavailable ? h('small', { text: '詳細を読み込めませんでした' }) : null
          )
        )
      )
    )
  );
}

export async function renderSpot({ spot, resolver }) {
  return h('article', {
    className: 'spot-page',
    dataset: { semantic: 'spot', entityId: spot.id }
  },
    h('header', { className: 'spot-hero' },
      h('div', { className: 'spot-hero-copy' },
        h('p', { className: 'entity-kind', text: `Spot · ${spot.id}` }),
        h('h1', { text: spot.title }),
        spot.summary ? h('p', { className: 'spot-summary', text: spot.summary }) : null,
        renderChipList(spot.theme_chips, { ariaLabel: 'テーマ', className: 'spot-theme-chips' }),
        h('div', { className: 'spot-decision-grid' },
          renderAccess(spot.access),
          renderUsageDecision(spot.fees, spot.hero_facts)
        ),
        renderReferences(spot.references),
        renderFacilities(spot.facilities)
      ),
      renderCarousel(spot.images, spot.title)
    ),
    renderAppeal(spot.appeal),
    await renderRelatedSpots(spot.related_spots, resolver)
  );
}
