function regionById(surfaceStrategy, id) {
  return (surfaceStrategy?.regions || []).find(region => region.id === id) || null;
}

function directChildBySemantic(container, semantic) {
  return [...container.children].find(child => child.dataset?.semantic === semantic) || null;
}

function firstDirectChildForSemantics(container, semantics) {
  const allowed = new Set(semantics);
  return [...container.children].find(child => allowed.has(child.dataset?.semantic)) || null;
}

function createTab({ id, label, panelId, selected }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = 'day-workspace-tab';
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', panelId);
  button.setAttribute('aria-selected', selected ? 'true' : 'false');
  button.tabIndex = selected ? 0 : -1;
  button.textContent = label;
  return button;
}

function createPanel({ id, tabId, viewId, viewGrammar, selected, node }) {
  const panel = document.createElement('div');
  panel.id = id;
  panel.className = 'day-workspace-panel';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', tabId);
  panel.dataset.presentationView = viewId;
  panel.dataset.presentationGrammar = viewGrammar;
  panel.hidden = !selected;
  panel.append(node);
  return panel;
}

function applyDayWorkspace(dayNode, dayStrategy) {
  const body = dayNode.querySelector(':scope > .concrete-day-body');
  const workspaceStrategy = dayStrategy?.workspace;
  if (!body || !workspaceStrategy || workspaceStrategy.view !== 'content-switcher') return;
  if (body.querySelector(':scope > [data-semantic="day-workspace"]')) return;

  const available = [];
  for (const definition of workspaceStrategy.views || []) {
    const node = directChildBySemantic(body, definition.semantic);
    if (!node) {
      if (definition.required) {
        throw new Error(`Required presentation semantic is missing: ${definition.semantic}`);
      }
      continue;
    }
    available.push({ definition, node });
  }

  if (!available.length) return;

  const defaultView = available.find(item => item.definition.id === workspaceStrategy.defaultView);
  if (!defaultView) {
    throw new Error(`Presentation default view is unavailable: ${workspaceStrategy.defaultView}`);
  }

  const supportingSemantics = dayStrategy.supporting?.semantics || [];
  const anchorSemantics = [
    ...(workspaceStrategy.views || []).map(view => view.semantic),
    ...supportingSemantics
  ];
  const anchor = firstDirectChildForSemantics(body, anchorSemantics);

  const dayKey = dayNode.dataset.day || 'day';
  const workspace = document.createElement('section');
  workspace.className = 'day-workspace';
  workspace.dataset.semantic = 'day-workspace';
  workspace.dataset.presentationGrammar = workspaceStrategy.view;
  workspace.dataset.contentSwitcher = `day-${dayKey}`;

  if (anchor) body.insertBefore(workspace, anchor);
  else body.append(workspace);

  if (available.length === 1 && workspaceStrategy.singleViewMode === 'direct') {
    workspace.dataset.presentationMode = 'direct';
    workspace.append(available[0].node);
    return;
  }

  const tabList = document.createElement('div');
  tabList.className = 'day-workspace-tabs';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', `Day ${dayKey} 表示`);

  const panels = document.createElement('div');
  panels.className = 'day-workspace-panels';

  for (const item of available) {
    const selected = item.definition.id === defaultView.definition.id;
    const tabId = `day-${dayKey}-${item.definition.id}-tab`;
    const panelId = `day-${dayKey}-${item.definition.id}-panel`;
    tabList.append(createTab({
      id: tabId,
      label: item.definition.label,
      panelId,
      selected
    }));
    panels.append(createPanel({
      id: panelId,
      tabId,
      viewId: item.definition.id,
      viewGrammar: item.definition.view,
      selected,
      node: item.node
    }));
  }

  workspace.append(tabList, panels);
}

function applyConcretePlanStrategy(root, surfaceStrategy) {
  const executionDays = regionById(surfaceStrategy, 'execution-days');
  const dayStrategy = executionDays?.day;
  if (!dayStrategy?.workspace) return;

  const days = root.querySelectorAll('[data-semantic="execution-day"]');
  days.forEach(dayNode => applyDayWorkspace(dayNode, dayStrategy));
}

const SURFACE_APPLIERS = Object.freeze({
  concrete_plan: applyConcretePlanStrategy
});

export function applyPresentationStrategy({ root, pageType, strategy }) {
  const surfaceStrategy = strategy?.surfaces?.[pageType];
  if (!surfaceStrategy) {
    throw new Error(`Presentation strategy does not define surface: ${pageType}`);
  }

  const apply = SURFACE_APPLIERS[pageType];
  if (!apply) return;
  apply(root, surfaceStrategy);
}
