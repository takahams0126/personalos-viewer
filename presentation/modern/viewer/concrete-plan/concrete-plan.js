import { loadStyle } from '../shared/load-style.js';

export async function render({ request, data }) {
  loadStyle(new URL('./concrete-plan.css', import.meta.url).href);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="concrete-plan-page"><h1>${data.title ?? request.id}</h1><p>ConcretePlan page skeleton</p></section>`;
}
