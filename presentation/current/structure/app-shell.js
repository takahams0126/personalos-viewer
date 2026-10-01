import { h } from '../render/dom.js';

export function renderAppShell({ request, navigation }, root) {
  if (!root) return;

  root.replaceChildren();
  root.hidden = false;

  const isTop = request?.kind === 'top';
  const globalItems = [
    isTop
      ? h('span', {
          className: 'viewer-home-link',
          attrs: { 'aria-current': 'page' },
          text: 'Explorer'
        })
      : h('a', {
          className: 'viewer-home-link',
          attrs: { href: '?' },
          text: 'Explorer'
        })
  ];

  if (navigation?.source) {
    const back = h('button', {
      className: 'viewer-context-back',
      attrs: { type: 'button' },
      text: `← ${navigation.source.title}`
    });
    back.addEventListener('click', () => history.back());
    globalItems.push(back);
  }

  root.append(
    h('header', { className: 'viewer-product-shell' },
      h('a', {
        className: 'viewer-brand',
        attrs: { href: '?', 'aria-label': 'PersonalOS Leisure Explorer' },
        text: 'PersonalOS Leisure'
      }),
      h('nav', {
        className: 'viewer-navigation',
        attrs: { 'aria-label': 'Leisure navigation' }
      }, globalItems)
    )
  );
}
