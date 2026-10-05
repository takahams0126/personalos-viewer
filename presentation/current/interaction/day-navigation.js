function tabsFor(navigation) {
  return [...navigation.querySelectorAll(':scope > [role="tab"]')];
}

function panelsFor(navigation) {
  const workspace = navigation.closest('[data-semantic="days"]');
  if (!workspace) return [];
  return [...workspace.querySelectorAll('[data-day-navigation-panel]')]
    .filter(panel => panel.closest('[data-semantic="days"]') === workspace);
}

function announceShown(panel) {
  panel.dispatchEvent(new Event('presentation:shown'));
  panel.querySelectorAll('[data-layout-source]:not([hidden])').forEach(source => {
    source.dispatchEvent(new Event('presentation:shown'));
  });
}

function activateDay(navigation, nextTab, { focus = false } = {}) {
  const day = nextTab.dataset.day;
  if (!day) return;

  const tabs = tabsFor(navigation);
  const panels = panelsFor(navigation);
  let selectedPanel = null;

  tabs.forEach(tab => {
    const selected = tab === nextTab;
    tab.setAttribute('aria-selected', selected ? 'true' : 'false');
    tab.tabIndex = selected ? 0 : -1;
  });

  panels.forEach(panel => {
    const selected = panel.dataset.day === day;
    const wasHidden = panel.hidden;
    panel.hidden = !selected;
    if (selected) {
      selectedPanel = panel;
      panel.setAttribute('aria-labelledby', nextTab.id);
      if (wasHidden) announceShown(panel);
    }
  });

  navigation.dataset.activeDay = day;
  if (focus) {
    nextTab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    nextTab.focus();
  }
  return selectedPanel;
}

function hydrateNavigation(navigation, initialDay = '') {
  if (navigation.dataset.dayNavigationReady === 'true') return;
  const tabs = tabsFor(navigation);
  if (!tabs.length) return;

  navigation.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !navigation.contains(tab)) return;
    activateDay(navigation, tab);
  });

  navigation.addEventListener('keydown', event => {
    const current = event.target.closest('[role="tab"]');
    if (!current || !navigation.contains(current)) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    const index = tabs.indexOf(current);
    if (index < 0) return;

    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;

    event.preventDefault();
    activateDay(navigation, tabs[nextIndex], { focus: true });
  });

  const restored = initialDay
    ? tabs.find(tab => tab.dataset.day === String(initialDay))
    : null;
  const selected = restored
    || tabs.find(tab => tab.getAttribute('aria-selected') === 'true')
    || tabs[0];
  activateDay(navigation, selected);
  navigation.dataset.dayNavigationReady = 'true';
}

export function hydrateDayNavigation(root, initialState = {}) {
  root.querySelectorAll('[data-day-navigation]').forEach(navigation => {
    const key = navigation.dataset.dayNavigation || '';
    hydrateNavigation(navigation, initialState?.[key] || '');
  });
}
