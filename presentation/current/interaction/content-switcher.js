function tabsFor(switcher) {
  return [...switcher.querySelectorAll(':scope > .day-workspace-tabs [role="tab"]')];
}

function panelFor(switcher, tab) {
  const panelId = tab.getAttribute('aria-controls');
  if (!panelId) return null;
  return switcher.querySelector(`#${CSS.escape(panelId)}`);
}

function belongsToSwitcher(node, switcher) {
  return Boolean(node && node.closest('[data-content-switcher]') === switcher);
}

function activateTab(switcher, nextTab, { focus = false } = {}) {
  const tabs = tabsFor(switcher);
  const sourceSemantic = nextTab.dataset.sourceSemantic;
  const viewId = nextTab.dataset.viewId;
  const viewMode = nextTab.dataset.viewMode;
  const panel = panelFor(switcher, nextTab);

  for (const tab of tabs) {
    const selected = tab === nextTab;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.tabIndex = selected ? 0 : -1;
  }

  switcher.dataset.activeView = viewId || '';
  switcher.dataset.activeMode = viewMode || '';

  if (panel) {
    panel.setAttribute('aria-labelledby', nextTab.id);
    panel.querySelectorAll(':scope > [data-layout-source]').forEach(source => {
      const selected = source.dataset.layoutSource === sourceSemantic;
      const wasHidden = source.hidden;
      source.hidden = !selected;
      if (selected && wasHidden) {
        source.dispatchEvent(new Event('presentation:shown'));
      }
    });
  }

  if (focus) nextTab.focus();
}

function routeDetailTarget(event, switcher, tabs) {
  const routeLink = event.target.closest('[data-semantic="route-execution-summary"] h4 a');
  if (!routeLink || !belongsToSwitcher(routeLink, switcher)) return null;
  if (switcher.dataset.activeView === 'route') return null;
  return tabs.find(tab => tab.dataset.viewId === 'route') || null;
}

function hydrateSwitcher(switcher, initialState = null) {
  if (switcher.dataset.contentSwitcherReady === 'true') return;
  const tabs = tabsFor(switcher);
  if (!tabs.length) {
    switcher.dataset.contentSwitcherReady = 'true';
    return;
  }

  switcher.addEventListener('click', event => {
    const localRouteTarget = routeDetailTarget(event, switcher, tabs);
    if (localRouteTarget) {
      event.preventDefault();
      activateTab(switcher, localRouteTarget, { focus: true });
      return;
    }

    const tab = event.target.closest('[role="tab"]');
    if (!tab || !belongsToSwitcher(tab, switcher)) return;
    activateTab(switcher, tab);
  });

  switcher.addEventListener('keydown', event => {
    const current = event.target.closest('[role="tab"]');
    if (!current || !belongsToSwitcher(current, switcher)) return;

    const index = tabs.indexOf(current);
    if (index < 0) return;

    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex == null) return;

    event.preventDefault();
    activateTab(switcher, tabs[nextIndex], { focus: true });
  });

  const restored = initialState?.viewId
    ? tabs.find(tab => tab.dataset.viewId === initialState.viewId)
    : null;
  const selected = restored
    || tabs.find(tab => tab.getAttribute('aria-selected') === 'true')
    || tabs[0];
  activateTab(switcher, selected);
  switcher.dataset.contentSwitcherReady = 'true';
}

export function hydrateContentSwitchers(root, initialState = {}) {
  root.querySelectorAll('[data-content-switcher]').forEach(switcher => {
    const key = switcher.dataset.contentSwitcher || '';
    hydrateSwitcher(switcher, initialState?.[key] || null);
  });
}
