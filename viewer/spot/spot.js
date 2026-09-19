import { loadStyle } from '../shared/load-style.js';
import {
  escapeHtml as esc,
  makeCollapsible,
  renderEntityRefCard
} from '../shared/component-contracts.js';
import { buildEntityHref } from '../shared/navigation.js';

export async function render({ request, data }) {
  loadStyle(new URL('./spot.css', import.meta.url).href);
  loadStyle(new URL('./spot-final.css', import.meta.url).href);

  const app = document.querySelector('#app');
  if (!app) return;

  renderSpot(data, app, request);
  initCarousel(app);

  const sections = [...app.querySelectorAll(':scope > .spot-demo-section')];
  sections.forEach(section => makeCollapsible(section, {
    open: section.classList.contains('spot-appeal-section') || section.classList.contains('spot-related-section')
  }));
}

function chipList(items = []) {
  return items.length
    ? `<div class="spot-chip-row">${items.map(item => `<span class="spot-chip">${esc(item)}</span>`).join('')}</div>`
    : '';
}

function list(items = []) {
  return items.length
    ? `<ul class="spot-demo-list">${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '';
}

function cards(items = [], className = '') {
  return items.length
    ? `<div class="spot-demo-cards ${className ? `spot-demo-cards-${esc(className)}` : ''}">${items.map(item => `<article class="spot-demo-card ${className}">${esc(item)}</article>`).join('')}</div>`
    : '';
}

function externalLinkIcon() {
  return `<svg class="spot-link-icon external" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M14 5h5v5"/><path d="M10 14 19 5"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>`;
}

function heroAccess(access) {
  if (!access?.location_text) return '';
  const map = access.google_maps_url
    ? `<a class="spot-hero-map-link" href="${esc(access.google_maps_url)}" target="_blank" rel="noopener"><span>Googleマップ</span>${externalLinkIcon()}</a>`
    : '';

  return `<div class="spot-hero-info-row spot-hero-access">
    <span class="spot-hero-info-label">アクセス</span>
    <div class="spot-hero-info-content">
      <div class="spot-hero-access-main"><span>${esc(access.location_text)}</span>${map}</div>
      ${access.note ? `<small>${esc(access.note)}</small>` : ''}
    </div>
  </div>`;
}

function inlineFacts(facts = [], className = '') {
  if (!facts.length) return '';
  return `<div class="spot-inline-facts ${esc(className)}">${facts.map(fact => `<span class="spot-inline-fact"><b>${esc(fact.label)}</b><span>${esc(fact.value)}</span></span>`).join('')}</div>`;
}

function heroFacilities(facilities) {
  if (!facilities?.facts?.length) return '';
  return `<div class="spot-hero-info-row">
    <span class="spot-hero-info-label">設備・施設</span>
    <div class="spot-hero-info-content">
      ${inlineFacts(facilities.facts, 'spot-facility-facts')}
      ${facilities.note ? `<small>${esc(facilities.note)}</small>` : ''}
    </div>
  </div>`;
}

function heroReferences(references) {
  if (!references?.official && !references?.supplemental) return '';
  const links = [];
  if (references.official?.url) links.push({ label: '公式・観光情報', url: references.official.url });
  if (references.supplemental?.url) links.push({ label: '補足情報', url: references.supplemental.url });

  return `<div class="spot-hero-info-row">
    <span class="spot-hero-info-label">公式・参考</span>
    <div class="spot-hero-link-row">${links.map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener"><span>${esc(link.label)}</span>${externalLinkIcon()}</a>`).join('')}</div>
  </div>`;
}

function heroFacts(facts = []) {
  if (!facts.length) return '';
  return `<div class="spot-hero-info-row spot-hero-facts-row">
    ${inlineFacts(facts, 'spot-major-facts')}
  </div>`;
}

function relatedSection(related = [], request) {
  if (!related.length) return '';
  return `<section class="section ui-section spot-demo-section spot-related-section">
    <h2>関連スポット</h2>
    <div class="spot-related-grid">${related.map(item => renderEntityRefCard({
      kind: '関連Spot',
      title: item.label || item.id || '',
      href: buildEntityHref({ type: item.entity_type || 'spot', id: item.id || '' }, request)
    })).join('')}</div>
  </section>`;
}

function galleryHtml(images = [], title = '') {
  if (!images.length) return '';

  const slides = images.map((image, index) => `<figure class="spot-carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}"><img src="${esc(image.url)}" alt="${esc(image.caption || `${title} ${index + 1}`)}" draggable="false"><figcaption><span>${esc(image.caption || '')}</span>${image.credit ? `<small>${esc(image.credit)}</small>` : ''}</figcaption></figure>`).join('');
  const thumbs = images.map((image, index) => `<button class="spot-carousel-thumb ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="画像 ${index + 1} を表示"><img src="${esc(image.url)}" alt=""></button>`).join('');

  return `<div class="spot-carousel" data-count="${images.length}">
    <div class="spot-carousel-stage" tabindex="0">
      <div class="spot-carousel-track">${slides}</div>
      ${images.length > 1 ? `<button type="button" class="spot-carousel-nav prev" aria-label="前の画像">‹</button><button type="button" class="spot-carousel-nav next" aria-label="次の画像">›</button><div class="spot-carousel-count"><span class="current">1</span> / ${images.length}</div>` : ''}
    </div>
    ${images.length > 1 ? `<div class="spot-carousel-thumbs">${thumbs}</div>` : ''}
  </div>`;
}

function appealSection(appeal = {}) {
  const review = appeal.review || {};
  const hasHighlights = (appeal.highlights || []).length > 0;
  const hasReview = (review.positives || []).length > 0 || (review.cautions || []).length > 0;
  if (!hasHighlights && !hasReview) return '';

  return `<section class="section ui-section spot-demo-section spot-appeal-section">
    <h2>このスポットの魅力</h2>
    ${cards(appeal.highlights || [], 'highlight')}
    ${hasReview ? `<div class="spot-review-block">
      <div class="spot-review-title-row"><h3>口コミから見える評価</h3>${review.checked_label ? `<span>${esc(review.checked_label)}</span>` : ''}</div>
      <div class="spot-review-grid">
        ${(review.positives || []).length ? `<article class="spot-review-card positive"><h3>よく評価されている点</h3>${list(review.positives)}</article>` : ''}
        ${(review.cautions || []).length ? `<article class="spot-review-card caution"><h3>気をつけたい点</h3>${list(review.cautions)}</article>` : ''}
      </div>
    </div>` : ''}
  </section>`;
}

function renderSpot(data, app, request) {
  app.innerHTML = `
    <section class="spot-demo-hero ui-entity-hero is-spot-hero">
      <div class="spot-demo-hero-copy ui-entity-hero-copy">
        <div class="kicker">スポット · ${esc(data.id)}</div>
        <h1>${esc(data.title)}</h1>
        <p class="spot-demo-summary ui-hero-copy">${esc(data.summary || '')}</p>
        ${chipList(data.theme_chips || [])}
        <div class="spot-hero-info">
          ${heroAccess(data.access)}
          ${heroFacilities(data.facilities)}
          ${heroReferences(data.references)}
          ${heroFacts(data.hero_facts || [])}
        </div>
      </div>
      ${galleryHtml(data.images || [], data.title)}
    </section>

    ${appealSection(data.appeal || {})}
    ${relatedSection(data.related_spots || [], request)}
  `;
}

function initCarousel(root) {
  root.querySelectorAll('.spot-carousel').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('.spot-carousel-slide')];
    const thumbs = [...carousel.querySelectorAll('.spot-carousel-thumb')];
    const stage = carousel.querySelector('.spot-carousel-stage');
    const count = carousel.querySelector('.spot-carousel-count .current');
    if (!slides.length) return;

    let index = 0;
    const show = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === index));
      thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle('active', thumbIndex === index));
      if (count) count.textContent = String(index + 1);
      thumbs[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    };

    const openLightbox = () => openSpotLightbox(slides, index, show);
    const prev = carousel.querySelector('.prev');
    const next = carousel.querySelector('.next');

    [prev, next, ...thumbs].filter(Boolean).forEach(button => {
      button.addEventListener('pointerdown', event => event.stopPropagation());
      button.addEventListener('pointerup', event => event.stopPropagation());
    });

    prev?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      show(index - 1);
    });
    next?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      show(index + 1);
    });
    thumbs.forEach((thumb, thumbIndex) => thumb.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      show(thumbIndex);
    }));
    stage?.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') show(index - 1);
      if (event.key === 'ArrowRight') show(index + 1);
      if (event.key === 'Enter') openLightbox();
    });

    let startX = null;
    let startY = null;
    let pointerStartedOnImage = false;

    stage?.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      startX = event.clientX;
      startY = event.clientY;
      pointerStartedOnImage = Boolean(event.target.closest('.spot-carousel-slide img'));
      stage.setPointerCapture?.(event.pointerId);
    });
    stage?.addEventListener('pointerup', event => {
      if (startX === null || event.target.closest('button')) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const startedOnImage = pointerStartedOnImage;
      startX = null;
      startY = null;
      pointerStartedOnImage = false;
      if (Math.abs(dx) > 45) {
        show(index + (dx < 0 ? 1 : -1));
        return;
      }
      if (startedOnImage && Math.abs(dx) < 10 && Math.abs(dy) < 10) openLightbox();
    });
  });
}

function openSpotLightbox(slides, startIndex, syncCarousel) {
  let index = startIndex;
  const overlay = document.createElement('div');
  overlay.className = 'spot-lightbox';
  overlay.innerHTML = `
    <button type="button" class="spot-lightbox-close" aria-label="閉じる">×</button>
    ${slides.length > 1 ? `<button type="button" class="spot-lightbox-nav prev" aria-label="前の画像">‹</button><button type="button" class="spot-lightbox-nav next" aria-label="次の画像">›</button>` : ''}
    <figure class="spot-lightbox-figure"><img alt=""><figcaption></figcaption></figure>
    <div class="spot-lightbox-count"></div>`;

  const image = overlay.querySelector('img');
  const caption = overlay.querySelector('figcaption');
  const counter = overlay.querySelector('.spot-lightbox-count');

  const show = next => {
    index = (next + slides.length) % slides.length;
    const source = slides[index];
    const sourceImage = source.querySelector('img');
    image.src = sourceImage?.src || '';
    image.alt = sourceImage?.alt || '';
    caption.innerHTML = source.querySelector('figcaption')?.innerHTML || '';
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    syncCarousel?.(index);
  };

  const close = () => {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    document.body.classList.remove('spot-lightbox-open');
  };

  const onKey = event => {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  };

  overlay.querySelector('.spot-lightbox-close')?.addEventListener('click', close);
  overlay.querySelector('.prev')?.addEventListener('click', () => show(index - 1));
  overlay.querySelector('.next')?.addEventListener('click', () => show(index + 1));
  overlay.addEventListener('click', event => {
    if (event.target === overlay) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  document.body.classList.add('spot-lightbox-open');
  show(index);
}
