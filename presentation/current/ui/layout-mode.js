const AVAILABLE_LAYOUTS = new Set(['timeline', 'grid']);
const DEFAULT_LAYOUT = 'timeline';

function readLayout(search = window.location.search) {
  const params = new URLSearchParams(search);
  const requested = params.get('layout');
  return AVAILABLE_LAYOUTS.has(requested) ? requested : DEFAULT_LAYOUT;
}

function applyLayout(layout) {
  document.documentElement.dataset.layout = layout;
  document.querySelectorAll('[data-layout-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.layoutChoice === layout));
  });
}

function writeLayout(layout) {
  const url = new URL(window.location.href);
  if (layout === DEFAULT_LAYOUT) {
    url.searchParams.delete('layout');
  } else {
    url.searchParams.set('layout', layout);
  }
  window.history.replaceState(null, '', url);
}

const initialLayout = readLayout();
applyLayout(initialLayout);

document.querySelectorAll('[data-layout-choice]').forEach(button => {
  button.addEventListener('click', () => {
    const layout = button.dataset.layoutChoice;
    if (!AVAILABLE_LAYOUTS.has(layout)) return;
    applyLayout(layout);
    writeLayout(layout);
  });
});
