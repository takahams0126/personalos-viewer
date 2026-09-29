function bindCarousel(carousel) {
  if (carousel.dataset.carouselReady === 'true') return;

  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  if (!slides.length) return;

  const current = carousel.querySelector('[data-carousel-current]');
  const thumbs = [...carousel.querySelectorAll('[data-carousel-go]')];
  const stage = carousel.querySelector('.carousel-stage');
  let index = 0;

  const show = nextIndex => {
    index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== index;
    });
    thumbs.forEach((thumb, thumbIndex) => {
      thumb.setAttribute('aria-current', thumbIndex === index ? 'true' : 'false');
    });
    if (current) current.textContent = String(index + 1);
  };

  carousel.querySelector('[data-carousel-prev]')?.addEventListener('click', () => show(index - 1));
  carousel.querySelector('[data-carousel-next]')?.addEventListener('click', () => show(index + 1));
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => show(Number(thumb.dataset.carouselGo)));
  });

  stage?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    }
  });

  carousel.dataset.carouselReady = 'true';
}

export function hydrateCarousels(root = document) {
  root.querySelectorAll('[data-carousel]').forEach(bindCarousel);
}
