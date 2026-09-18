import { loadStyle } from '../shared/load-style.js';

export async function render({ request, data }) {
  loadStyle(new URL('./route.css', import.meta.url).href);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="route-page"><h1>${data.title ?? request.id}</h1><p>Route page skeleton</p></section>`;
}
