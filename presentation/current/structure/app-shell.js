import { h } from '../render/dom.js';

export function renderAppShell({ request, navigation }, root) {
  if (!root) return;

  root.replaceChildren();
  if (request?.kind === 'top') {
    root.hidden = true;
    return;
  }

  root.hidden = false;

  const items = [
    h('a', {
      className: 'viewer-home-link',
      attrs: { href: '?' },
      text: 'レジャーTOP'
    })
  ];

  if (navigation?.source) {
    const back = h('button', {
      className: 'viewer-context-back',
      attrs: { type: 'button' },
      text: `← ${navigation.source.title}`
    });
    back.addEventListener('click', () => history.back());
    items.push(back);
  }

  root.append(
    h('nav', {
      className: 'viewer-navigation',
      attrs: { 'aria-label': 'Viewer navigation' }
    }, items)
  );
}
