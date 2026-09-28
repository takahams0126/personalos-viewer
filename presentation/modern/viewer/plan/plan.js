import { loadStyle } from '../shared/load-style.js';

export async function render({ request, data }) {
  loadStyle(new URL('./plan.css', import.meta.url).href);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="plan-page"><h1>${data.title ?? request.id}</h1><p>Plan page skeleton</p></section>`;
}
