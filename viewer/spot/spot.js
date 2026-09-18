import { loadStyle } from '../shared/load-style.js';
import {
  escapeHtml as esc,
  makeCollapsible,
  renderEntityRefCard,
  renderHeroFacts,
  renderSeasonIcons
} from '../shared/component-contracts.js';
import { buildEntityHref } from '../shared/navigation.js';

export async function render({ request, data }) {
  loadStyle(new URL('./spot.css', import.meta.url).href);

  const app = document.querySelector('#app');
  if (!app) return;

  renderSpot(data, app, request);
  initCarousel(app);

  const sections = [...app.querySelectorAll(':scope > .spot-demo-section')];
  sections.forEach(section => makeCollapsible(section, {
    open: section.querySelector(':scope > h2')?.textContent.trim() === 'このスポットの魅力'
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

function heroLinks(links = []) {
  return links.length
    ? `<div class="spot-hero-links"><span class="spot-hero-links-label">公式・参考</span><div class="spot-hero-link-row">${links.map(link => `<a href="${esc(link.url)}" target="_blank" rel="noopener"><span>${esc(link.label)}</span>${externalLinkIcon()}</a>`).join('')}</div></div>`
    : '';
}

function heroFacts(facts = [], spot = {}) {
  const items = facts.map(fact => fact?.label === '季節' && (spot.season || []).length
    ? { label: fact.label, valueHtml: renderSeasonIcons(spot.season) }
    : { label: fact?.label || '', value: fact?.value || '' });
  return renderHeroFacts(items);
}

function relatedHeroCards(related = [], request) {
  if (!related.length) return '';

  return `<div class="spot-hero-related"><span class="spot-hero-related-label">関連スポット</span><div class="spot-hero-related-grid">${related.map(item => renderEntityRefCard({
    kind: '関連Spot',
    title: item.label || item.id || '',
    href: buildEntityHref({ type: item.type || 'spot', id: item.id || '' }, request)
  })).join('')}</div></div>`;
}

function galleryHtml(images = [], title = '') {
  const sorted = [...images].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  if (!sorted.length) return '';

  const slides = sorted.map((image, index) => `<figure class="spot-carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}"><img src="${esc(image.url)}" alt="${esc(image.caption || `${title} ${index + 1}`)}" draggable="false"><figcaption><span>${esc(image.caption || '')}</span>${image.credit ? `<small>${esc(image.credit)}</small>` : ''}</figcaption></figure>`).join('');
  const thumbs = sorted.map((image, index) => `<button class="spot-carousel-thumb ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="画像 ${index + 1} を表示"><img src="${esc(image.url)}" alt=""></button>`).join('');

  return `<div class="spot-carousel" data-count="${sorted.length}">
    <div class="spot-carousel-stage" tabindex="0">
      <div class="spot-carousel-track">${slides}</div>
      ${sorted.length > 1 ? `<button type="button" class="spot-carousel-nav prev" aria-label="前の画像">‹</button><button type="button" class="spot-carousel-nav next" aria-label="次の画像">›</button><div class="spot-carousel-count"><span class="current">1</span> / ${sorted.length}</div>` : ''}
    </div>
    ${sorted.length > 1 ? `<div class="spot-carousel-thumbs">${thumbs}</div>` : ''}
  </div>`;
}

function renderSpot(data, app, request) {
  const spot = data.spot || {};
  const reviews = spot.review_summary || {};
  const links = spot.links || [];
  const related = spot.related || [];

  app.innerHTML = `
    <section class="spot-demo-hero ui-entity-hero is-spot-hero">
      <div class="spot-demo-hero-copy ui-entity-hero-copy">
        <div class="kicker">スポット · ${esc(data.id)}</div>
        <h1>${esc(data.title)}</h1>
        <p class="ui-hero-copy">${esc(data.summary || '')}</p>
        ${chipList(spot.themes || [])}
        ${heroLinks(links)}
        ${relatedHeroCards(related, request)}
        ${heroFacts(spot.facts || [], spot)}
      </div>
      ${galleryHtml(spot.image_refs || [], data.title)}
    </section>

    ${(spot.highlights || []).length || (spot.strengths || []).length ? `<section class="section ui-section spot-demo-section"><h2>このスポットの魅力</h2>${cards(spot.highlights || [], 'highlight')}${(spot.strengths || []).length ? `<div class="spot-demo-sub"><h3>強み</h3>${list(spot.strengths)}</div>` : ''}</section>` : ''}

    ${(spot.user_fit || []).length || (spot.suitable_for || []).length ? `<section class="section ui-section spot-demo-section"><h2>こんな旅に向いている</h2>${cards(spot.user_fit || [], 'fit')}${chipList(spot.suitable_for || [])}</section>` : ''}

    ${(spot.value_points || []).length ? `<section class="section ui-section spot-demo-section"><h2>選ぶ価値</h2>${cards(spot.value_points || [], 'value')}</section>` : ''}

    ${(reviews.positives || []).length || (reviews.cautions || []).length || (reviews.best_for || []).length ? `<section class="section ui-section spot-demo-section"><h2>口コミから見える評価</h2><div class="spot-demo-review-head">${reviews.checked_at ? `<span>確認 ${esc(reviews.checked_at)}</span>` : ''}</div><div class="spot-review-grid"><article class="spot-review-card positive"><h3>よく評価されている点</h3>${list(reviews.positives)}</article><article class="spot-review-card caution"><h3>気をつけたい点</h3>${list(reviews.cautions)}</article><article class="spot-review-card best"><h3>特に向いているケース</h3>${list(reviews.best_for)}</article></div></section>` : ''}

    ${(spot.practicality || []).length ? `<section class="section ui-section spot-demo-section"><h2>利用情報</h2>${list(spot.practicality || [])}</section>` : ''}
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
