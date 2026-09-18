import { loadEntity } from '../core/data.js';
import { loadStyle } from '../shared/load-style.js';

export async function render(request) {
  loadStyle(new URL('./route.css', import.meta.url).href);
  const data = await loadEntity('route', request.id);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="route-page"><h1>${data.title ?? request.id}</h1><p>Route page skeleton</p></section>`;
}
