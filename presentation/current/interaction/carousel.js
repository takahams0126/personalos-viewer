function iconSvg(pathData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  svg.append(path);
  return svg;
}

function bindCarousel(carousel) {
  if (carousel.dataset.carouselReady === 'true') return;
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  if (!slides.length) return;
  const current = carousel.querySelector('[data-carousel-current]');
  const thumbs = [...carousel.querySelectorAll('[data-carousel-go]')];
  const stage = carousel.querySelector('.carousel-stage');
  const previousControl = carousel.querySelector('[data-carousel-prev]');
  const nextControl = carousel.querySelector('[data-carousel-next]');
  let index = 0;

  previousControl?.replaceChildren(iconSvg('M15 18l-6-6 6-6'));
  nextControl?.replaceChildren(iconSvg('M9 18l6-6-6-6'));

  const show = nextIndex => {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => { slide.hidden = slideIndex !== index; });
    thumbs.forEach((thumb, thumbIndex) => { thumb.setAttribute('aria-current', thumbIndex === index ? 'true' : 'false'); });
    if (current) current.textContent = String(index + 1);
  };

  previousControl?.addEventListener('click', () => show(index - 1));
  nextControl?.addEventListener('click', () => show(index + 1));
  thumbs.forEach(thumb => thumb.addEventListener('click', () => show(Number(thumb.dataset.carouselGo))));
  stage?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
  });

  const lightbox = document.createElement('dialog');
  lightbox.className = 'carousel-lightbox';
  lightbox.setAttribute('aria-label', '画像を拡大表示');
  const lightboxFrame = document.createElement('div');
  lightboxFrame.className = 'carousel-lightbox-frame';
  const lightboxImage = document.createElement('img');
  lightboxImage.className = 'carousel-lightbox-image';
  const lightboxCaption = document.createElement('p');
  lightboxCaption.className = 'carousel-lightbox-caption';
  const lightboxStatus = document.createElement('p');
  lightboxStatus.className = 'carousel-lightbox-status';
  lightboxStatus.setAttribute('aria-live', 'polite');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'carousel-lightbox-close';
  close.setAttribute('aria-label', '拡大表示を閉じる');
  close.append(iconSvg('M6 6l12 12M18 6L6 18'));

  const previous = document.createElement('button');
  previous.type = 'button';
  previous.className = 'carousel-lightbox-nav carousel-lightbox-prev';
  previous.setAttribute('aria-label', '前の画像');
  previous.append(iconSvg('M15 18l-6-6 6-6'));

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-lightbox-nav carousel-lightbox-next';
  next.setAttribute('aria-label', '次の画像');
  next.append(iconSvg('M9 18l6-6-6-6'));

  function syncLightbox() {
    const slide = slides[index];
    const image = slide?.querySelector('img');
    const caption = slide?.querySelector('figcaption');
    if (!image) return;
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || '';
    lightboxCaption.textContent = caption?.textContent?.trim() || image.alt || '';
    lightboxCaption.hidden = !lightboxCaption.textContent;
    lightboxStatus.textContent = `${index + 1} / ${slides.length}`;
    previous.hidden = slides.length <= 1;
    next.hidden = slides.length <= 1;
  }

  function showLightbox(nextIndex = index) {
    show(nextIndex);
    syncLightbox();
    lightbox.showModal();
    close.focus();
  }

  function moveLightbox(delta) {
    show(index + delta);
    syncLightbox();
  }

  close.addEventListener('click', () => lightbox.close());
  previous.addEventListener('click', () => moveLightbox(-1));
  next.addEventListener('click', () => moveLightbox(1));
  lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
  });
  lightbox.addEventListener('close', () => stage?.focus());

  lightboxFrame.append(close, lightboxImage, previous, next, lightboxCaption, lightboxStatus);
  lightbox.append(lightboxFrame);
  document.body.append(lightbox);

  if (stage) {
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'carousel-lightbox-open';
    open.setAttribute('aria-label', '現在の画像を拡大表示');
    open.textContent = '拡大';
    open.addEventListener('click', () => showLightbox());
    stage.append(open);
  }
  carousel.dataset.carouselReady = 'true';
}

export function hydrateCarousels(root = document) {
  root.querySelectorAll('[data-carousel]').forEach(bindCarousel);
}
