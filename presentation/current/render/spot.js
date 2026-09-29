import { hrefFor } from '../core/router.js';
import { renderChipList, renderEmphasisList } from './components/presentation.js';
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
  return h('section', { className: 'spot-hero-detail spot-access', dataset: { semantic: 'access' } },
    h('h2', { text: 'アクセス' }),
    h('p', { className: 'spot-location', text: access.location_text }),
    access.note ? h('p', { className: 'spot-detail-note', text: access.note }) : null,
    access.google_maps_url
      ? h('a', {
          className: 'spot-external-link',
          text: 'Google Mapsで開く',
          attrs: { href: access.google_maps_url, target: '_blank', rel: 'noopener' }
        })
      : null
  );
}

function renderFacilities(facilities) {
  if (!facilities?.facts?.length) return null;
  return h('section', { className: 'spot-hero-detail spot-facilities', dataset: { semantic: 'facilities' } },
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
      attrs: { href: references.official.url, target: '_blank', rel: 'noopener' }
    }));
  }
  if (references.supplemental?.url) {
    links.push(h('a', {
      text: '補足情報',
      attrs: { href: references.supplemental.url, target: '_blank', rel: 'noopener' }
    }));
  }

  return h('section', { className: 'spot-hero-detail spot-references', dataset: { semantic: 'references' } },
    h('h2', { text: '公式・参考' }),
    h('div', { className: 'spot-reference-links' }, links)
  );
}

function renderHeroFacts(facts = []) {
  if (!facts.length) return null;
  return h('section', { className: 'spot-hero-detail spot-compact-facts', dataset: { semantic: 'facts' } },
    h('h2', { className: 'visually-hidden', text: '利用情報' }),
    renderFacts(facts, 'spot-major-facts')
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
        h('button', { attrs: { type: 'button', 'data-carousel-prev': true, 'aria-label': '前の画像' }, text: '‹' }),
        h('p', { className: 'carousel-status', attrs: { 'aria-live': 'polite' } },
          h('span', { attrs: { 'data-carousel-current': true }, text: '1' }),
          ` / ${images.length}`
        ),
        h('button', { attrs: { type: 'button', 'data-carousel-next': true, 'aria-label': '次の画像' }, text: '›' })
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

  return h('div', { className: 'spot-review', dataset: { semantic: 'review' } },
    h('header', { className: 'spot-review-header' },
      h('h3', { text: '口コミから見える評価' }),
      review.checked_label ? h('span', { className: 'spot-review-checked', text: review.checked_label }) : null
    ),
    h('div', { className: 'spot-review-grid' },
      positives.length
        ? h('section', { className: 'spot-review-positive' },
            h('h4', { text: 'よく評価されている点' }),
            h('ul', {}, positives.map(item => h('li', { text: item })))
          )
        : null,
      cautions.length
        ? h('section', { className: 'spot-review-caution' },
            h('h4', { text: '気をつけたい点' }),
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

  return h('section', { className: 'spot-appeal content-section content-section--roomy', dataset: { semantic: 'appeal' } },
    h('h2', { text: 'このスポットの魅力' }),
    renderEmphasisList(highlights, { className: 'spot-highlights' }),
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
        h('div', { className: 'spot-hero-details' },
          renderAccess(spot.access),
          renderFacilities(spot.facilities),
          renderReferences(spot.references),
          renderHeroFacts(spot.hero_facts)
        )
      ),
      renderCarousel(spot.images, spot.title)
    ),
    renderAppeal(spot.appeal),
    await renderRelatedSpots(spot.related_spots, resolver)
  );
}
