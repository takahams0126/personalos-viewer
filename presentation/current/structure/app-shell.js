import { h } from '../render/dom.js';

const CATALOGS = Object.freeze([
  { id: 'all', label: 'Explorer', href: '?' },
  { id: 'plan', label: 'Plans', href: '?catalog=plan' },
  { id: 'route', label: 'Routes', href: '?catalog=route' },
  { id: 'spot', label: 'Spots', href: '?catalog=spot' }
]);

const PAGE_LABELS = Object.freeze({
  spot: 'Spot',
  route: 'Route',
  plan: 'Plan',
  concrete_plan: 'Execution'
});

function currentCatalog(request) {
  if (request?.kind !== 'top') return null;
  const catalog = new URLSearchParams(window.location.search).get('catalog');
  return ['plan', 'route', 'spot'].includes(catalog) ? catalog : 'all';
}

function renderCatalogNavigation(request) {
  const activeCatalog = currentCatalog(request);
  return CATALOGS.map(item => {
    if (activeCatalog === item.id) {
      return h('span', {
        className: 'viewer-nav-link',
        attrs: { 'aria-current': 'page' },
        text: item.label
      });
    }
    return h('a', {
      className: 'viewer-nav-link',
      attrs: { href: item.href },
      text: item.label
    });
  });
}

export function renderAppShell({ request, navigation }, root) {
  if (!root) return;

  root.replaceChildren();
  root.hidden = false;

  const contextItems = [];
  if (request?.kind === 'entity') {
    contextItems.push(h('span', {
      className: 'viewer-context-label',
      text: PAGE_LABELS[request.type] || 'Detail'
    }));
  }

  if (navigation?.source) {
    const back = h('button', {
      className: 'viewer-context-back',
      attrs: { type: 'button' },
      text: `← ${navigation.source.title}`
    });
    back.addEventListener('click', () => history.back());
    contextItems.push(back);
  }

  root.append(
    h('header', { className: 'viewer-product-shell' },
      h('div', { className: 'viewer-shell-primary' },
        h('a', {
          className: 'viewer-brand',
          attrs: { href: '?', 'aria-label': 'PersonalOS Leisure Explorer' },
          text: 'PersonalOS Leisure'
        }),
        h('nav', {
          className: 'viewer-global-navigation',
          attrs: { 'aria-label': 'Leisure product navigation' }
        }, renderCatalogNavigation(request))
      ),
      contextItems.length
        ? h('nav', {
            className: 'viewer-context-navigation',
            attrs: { 'aria-label': 'Current context navigation' }
          }, contextItems)
        : null
    )
  );
}
