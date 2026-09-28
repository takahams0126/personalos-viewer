export function renderError(error) {
  const app = document.querySelector('#app');
  if (!app) return;

  const message = error instanceof Error ? error.message : String(error);
  app.textContent = '';

  const section = document.createElement('section');
  section.className = 'viewer-error';

  const title = document.createElement('h1');
  title.textContent = '表示できませんでした';

  const detail = document.createElement('p');
  detail.textContent = message;

  section.append(title, detail);
  app.append(section);
}
