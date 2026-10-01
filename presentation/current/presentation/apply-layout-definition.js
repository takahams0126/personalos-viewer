function blockById(contentLayout, id) {
  return (contentLayout?.blocks || []).find(block => block.id === id) || null;
}

function directChildBySemantic(container, semantic) {
  return [...container.children].find(child => child.dataset?.semantic === semantic) || null;
}

function firstDirectChildForSemantics(container, semantics) {
  const allowed = new Set(semantics);
  return [...container.children].find(child => allowed.has(child.dataset?.semantic)) || null;
}

function semanticIsAvailable(container, definition) {
  const availabilitySemantic = definition.availabilitySemantic || definition.sourceSemantic;
  return Boolean(container.querySelector(`[data-semantic="${CSS.escape(availabilitySemantic)}"]`));
}

function createTab({ id, definition, panelId, selected }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = id;
  button.className = 'day-workspace-tab';
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-controls', panelId);
  button.setAttribute('aria-selected', selected ? 'true' : 'false');
  button.tabIndex = selected ? 0 : -1;
  button.dataset.viewId = definition.id;
  button.dataset.sourceSemantic = definition.sourceSemantic;
  button.dataset.viewMode = definition.mode || definition.view;
  button.textContent = definition.label;
  return button;
}

function uniqueSources(available) {
  const seen = new Set();
  const sources = [];
  for (const item of available) {
    if (seen.has(item.definition.sourceSemantic)) continue;
    seen.add(item.definition.sourceSemantic);
    sources.push(item);
  }
  return sources;
}

function applyDayWorkspace(dayNode, dayDefinition) {
  const body = dayNode.querySelector(':scope > .concrete-day-body');
  const workspaceDefinition = dayDefinition?.workspace;
  if (!body || !workspaceDefinition || workspaceDefinition.view !== 'content-switcher') return;
  if (body.querySelector(':scope > [data-semantic="day-workspace"]')) return;

  const available = [];
  for (const definition of workspaceDefinition.views || []) {
    const node = directChildBySemantic(body, definition.sourceSemantic);
    const present = node && semanticIsAvailable(body, definition);
    if (!present) {
      if (definition.required) {
        throw new Error(`Required layout semantic is missing: ${definition.sourceSemantic}`);
      }
      continue;
    }
    available.push({ definition, node });
  }

  if (!available.length) return;

  const defaultView = available.find(item => item.definition.id === workspaceDefinition.defaultView);
  if (!defaultView) {
    throw new Error(`Layout default view is unavailable: ${workspaceDefinition.defaultView}`);
  }

  const sourceSemantics = uniqueSources(available).map(item => item.definition.sourceSemantic);
  const supportingSemantics = dayDefinition.supporting?.semantics || [];
  const anchor = firstDirectChildForSemantics(body, [...sourceSemantics, ...supportingSemantics]);

  const dayKey = dayNode.dataset.day || 'day';
  const workspace = document.createElement('section');
  workspace.className = 'day-workspace';
  workspace.dataset.semantic = 'day-workspace';
  workspace.dataset.layoutGrammar = workspaceDefinition.view;
  workspace.dataset.contentSwitcher = `day-${dayKey}`;
  workspace.dataset.activeView = defaultView.definition.id;
  workspace.dataset.activeMode = defaultView.definition.mode || defaultView.definition.view;

  if (anchor) body.insertBefore(workspace, anchor);
  else body.append(workspace);

  const sources = uniqueSources(available);

  if (available.length === 1 && workspaceDefinition.singleViewMode === 'direct') {
    workspace.dataset.presentationMode = 'direct';
    const source = sources[0].node;
    source.dataset.layoutSource = sources[0].definition.sourceSemantic;
    workspace.append(source);
    return;
  }

  const tabList = document.createElement('div');
  tabList.className = 'day-workspace-tabs';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', `Day ${dayKey} 表示`);

  const panel = document.createElement('div');
  const panelId = `day-${dayKey}-workspace-panel`;
  panel.id = panelId;
  panel.className = 'day-workspace-panel';
  panel.setAttribute('role', 'tabpanel');

  for (const item of available) {
    const selected = item.definition.id === defaultView.definition.id;
    const tabId = `day-${dayKey}-${item.definition.id}-tab`;
    const tab = createTab({ id: tabId, definition: item.definition, panelId, selected });
    tabList.append(tab);
    if (selected) panel.setAttribute('aria-labelledby', tabId);
  }

  for (const source of sources) {
    source.node.dataset.layoutSource = source.definition.sourceSemantic;
    source.node.hidden = source.definition.sourceSemantic !== defaultView.definition.sourceSemantic;
    panel.append(source.node);
  }

  workspace.append(tabList, panel);
}

function applyConcretePlanContentLayout(root, contentLayout) {
  const executionDays = blockById(contentLayout, 'execution-days');
  const dayDefinition = executionDays?.day;
  if (!dayDefinition?.workspace) return;

  root.querySelectorAll('[data-semantic="execution-day"]').forEach(dayNode => {
    applyDayWorkspace(dayNode, dayDefinition);
  });
}

const CONTENT_LAYOUT_APPLIERS = Object.freeze({
  concrete_plan: applyConcretePlanContentLayout
});

export function applyPageLayoutDefinition({ root, pageType, definition }) {
  const contentLayout = definition?.contentLayouts?.[pageType];
  if (!contentLayout) {
    throw new Error(`Page Layout Definition does not define content layout: ${pageType}`);
  }

  const apply = CONTENT_LAYOUT_APPLIERS[pageType];
  if (!apply) return;
  apply(root, contentLayout);
}
