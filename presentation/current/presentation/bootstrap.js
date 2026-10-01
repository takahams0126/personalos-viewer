import { resolvePresentationPreset } from './registry.js';
import { resolvePageLayoutDefinition } from './layout-definition-registry.js';

function stylesheetResource(href, role, setId) {
  return { href, role, setId };
}

function loadStylesheet({ href, role, setId }) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.presentationRole = role;
    link.dataset.presentationSet = setId;
    link.addEventListener('load', () => resolve(link), { once: true });
    link.addEventListener('error', () => {
      reject(new Error(`Presentation stylesheet failed to load: ${href}`));
    }, { once: true });
    document.head.append(link);
  });
}

export async function activatePresentationPreset() {
  const requestedId = window.PERSONALOS_CONFIG?.presentationPreset;
  const preset = resolvePresentationPreset(requestedId);
  const pageLayoutDefinition = resolvePageLayoutDefinition(preset.pageLayoutDefinitionId);
  const root = document.documentElement;

  root.dataset.presentationPreset = preset.id;
  root.dataset.pageLayoutDefinition = pageLayoutDefinition.id;
  root.dataset.presentationTheme = preset.theme.id;
  root.dataset.presentationPatternSet = preset.patternSet.id;
  root.dataset.presentationLayoutSet = preset.layoutSet.id;

  const resources = [
    ...preset.theme.stylesheets.map(href => stylesheetResource(href, 'theme', preset.theme.id)),
    ...preset.patternSet.stylesheets.map(href => stylesheetResource(href, 'pattern', preset.patternSet.id)),
    ...preset.layoutSet.stylesheets.map(href => stylesheetResource(href, 'layout', preset.layoutSet.id))
  ];

  await Promise.all(resources.map(loadStylesheet));
  root.dataset.presentationReady = 'true';
  return Object.freeze({ preset, pageLayoutDefinition });
}

function renderBootstrapFailure(error) {
  console.error('[current-viewer] presentation bootstrap failed', error);
  const app = document.querySelector('#app');
  if (!app) return;

  const section = document.createElement('section');
  section.setAttribute('role', 'alert');

  const title = document.createElement('h1');
  title.textContent = 'Viewerを表示できませんでした';

  const message = document.createElement('p');
  message.textContent = error instanceof Error ? error.message : String(error);

  section.append(title, message);
  app.replaceChildren(section);
}

try {
  const presentation = await activatePresentationPreset();
  const { startCurrentViewer } = await import('../main.js');
  await startCurrentViewer({ presentation });
} catch (error) {
  renderBootstrapFailure(error);
}
