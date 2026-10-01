function tabsFor(switcher) {
  return [...switcher.querySelectorAll(':scope > .day-workspace-tabs [role="tab"]')];
}

function panelFor(switcher, tab) {
  const panelId = tab.getAttribute('aria-controls');
  if (!panelId) return null;
  return switcher.querySelector(`#${CSS.escape(panelId)}`);
}

function activateTab(switcher, nextTab, { focus = false } = {}) {
  const tabs = tabsFor(switcher);
  for (const tab of tabs) {
    const selected = tab === nextTab;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.tabIndex = selected ? 0 : -1;

    const panel = panelFor(switcher, tab);
    if (!panel) continue;
    const wasHidden = panel.hidden;
    panel.hidden = !selected;
    if (selected && wasHidden) {
      panel.dispatchEvent(new Event('presentation:shown'));
    }
  }

  if (focus) nextTab.focus();
}

function hydrateSwitcher(switcher) {
  if (switcher.dataset.contentSwitcherReady === 'true') return;
  const tabs = tabsFor(switcher);
  if (tabs.length <= 1) {
    switcher.dataset.contentSwitcherReady = 'true';
    return;
  }

  switcher.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !switcher.contains(tab)) return;
    activateTab(switcher, tab);
  });

  switcher.addEventListener('keydown', event => {
    const current = event.target.closest('[role="tab"]');
    if (!current || !switcher.contains(current)) return;

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

  switcher.dataset.contentSwitcherReady = 'true';
}

export function hydrateContentSwitchers(root) {
  root.querySelectorAll('[data-content-switcher]').forEach(hydrateSwitcher);
}
