import { loadManifest } from '../core/data.js';
import { loadStyle } from '../shared/load-style.js';

export async function render() {
  loadStyle(new URL('./top.css', import.meta.url).href);
  const manifest = await loadManifest();
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = `<section class="top-page"><h1>PersonalOS Leisure</h1><p>Top page skeleton</p><p>${manifest.items?.length ?? 0} published items</p></section>`;
}
