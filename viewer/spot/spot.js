import { loadEntity } from '../core/data.js';
import { loadStyle } from '../shared/load-style.js';

export async function render(request) {
  loadStyle(new URL('./spot.css', import.meta.url).href);
  const data = await loadEntity('spot', request.id);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="spot-page"><h1>${data.title ?? request.id}</h1><p>Spot page skeleton</p></section>`;
}
