import { loadEntity } from '../core/data.js';
import { loadStyle } from '../shared/load-style.js';

export async function render(request) {
  loadStyle(new URL('./plan.css', import.meta.url).href);
  const data = await loadEntity('plan', request.id);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="plan-page"><h1>${data.title ?? request.id}</h1><p>Plan page skeleton</p></section>`;
}
