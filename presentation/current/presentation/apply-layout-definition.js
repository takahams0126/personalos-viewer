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

function nodeForBlock(root, definition) {
  if (!definition) return null;
  if (definition.sourceSemantic) {
    return directChildBySemantic(root, definition.sourceSemantic)
      || root.querySelector(`[data-semantic="${CSS.escape(definition.sourceSemantic)}"]`);
  }
  if (definition.sourceSelector) return root.querySelector(definition.sourceSelector);
  return null;
}

function markBlock(node, definition) {
  if (!node || !definition) return;
  node.dataset.layoutBlock = definition.id;
  node.dataset.layoutGrammar = definition.view;
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

function applyDayWorkspace(container, workspaceDefinition, workspaceKey) {
  if (!container || !workspaceDefinition || workspaceDefinition.view !== 'content-switcher') return;
  if (container.querySelector(':scope > [data-semantic="day-workspace"]')) return;

  const available = [];
  for (const definition of workspaceDefinition.views || []) {
    const node = directChildBySemantic(container, definition.sourceSemantic);
    const present = node && semanticIsAvailable(container, definition);
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
  const anchor = firstDirectChildForSemantics(container, sourceSemantics);

  const workspace = document.createElement('section');
  workspace.className = 'day-workspace';
  workspace.dataset.semantic = 'day-workspace';
  workspace.dataset.layoutGrammar = workspaceDefinition.view;
  workspace.dataset.contentSwitcher = workspaceKey;
  workspace.dataset.activeView = defaultView.definition.id;
  workspace.dataset.activeMode = defaultView.definition.mode || defaultView.definition.view;

  if (anchor) container.insertBefore(workspace, anchor);
  else container.append(workspace);

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
  tabList.setAttribute('aria-label', '表示切替');

  const panel = document.createElement('div');
  const panelId = `${workspaceKey}-panel`;
  panel.id = panelId;
  panel.className = 'day-workspace-panel';
  panel.setAttribute('role', 'tabpanel');

  for (const item of available) {
    const selected = item.definition.id === defaultView.definition.id;
    const tabId = `${workspaceKey}-${item.definition.id}-tab`;
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

function createExecutionSequenceFromVariant(variantNode) {
  const timeline = variantNode.querySelector(':scope > [data-semantic="execution-timeline"]');
  if (!timeline) return null;

  const sequence = document.createElement('section');
  sequence.className = 'day-execution';
  sequence.dataset.semantic = 'execution-sequence';

  const title = document.createElement('h3');
  title.className = 'execution-sequence-title';
  title.textContent = '行動順';
  sequence.append(title, timeline);
  return sequence;
}

function createPackageMeta({ label, intent, condition }) {
  if (!intent && !condition) return null;
  const header = document.createElement('header');
  header.className = 'execution-package-meta';
  header.dataset.semantic = 'execution-package-meta';

  const title = document.createElement('h3');
  title.textContent = label;
  header.append(title);

  if (intent) {
    const description = document.createElement('p');
    description.className = 'execution-package-intent';
    description.textContent = intent;
    header.append(description);
  }

  if (condition) {
    const conditionText = document.createElement('p');
    conditionText.className = 'execution-package-condition';
    conditionText.textContent = condition;
    header.append(conditionText);
  }

  return header;
}

function createPackage({ packageId, packageKind, label }) {
  const node = document.createElement('section');
  node.className = `execution-package execution-package-${packageKind}`;
  node.dataset.semantic = 'execution-package';
  node.dataset.packageId = packageId;
  node.dataset.packageKind = packageKind;
  node.dataset.packageLabel = label;
  return node;
}

function createPackageSelector(packages, dayKey, definition) {
  const selector = document.createElement('section');
  selector.className = 'execution-package-selector';
  selector.dataset.semantic = 'execution-package-selector';
  selector.dataset.packageSwitcher = `day-${dayKey}-execution-package`;

  const heading = document.createElement('h3');
  heading.textContent = '実施案';

  const choices = document.createElement('div');
  choices.className = 'execution-package-options';
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-label', '実施案切替');

  packages.forEach((packageNode, index) => {
    const selected = packageNode.dataset.packageId === definition.defaultPackage;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'execution-package-option';
    button.dataset.packageTarget = packageNode.dataset.packageId;
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    button.tabIndex = selected || index === 0 ? 0 : -1;
    button.textContent = packageNode.dataset.packageLabel;
    choices.append(button);
  });

  const note = document.createElement('p');
  note.className = 'execution-package-note';
  note.textContent = '表示上の切替です。採用時は実行内容を再具体化します。';

  selector.append(heading, choices, note);
  return selector;
}

function buildExecutionPackages(body, dayDefinition, dayKey) {
  const definition = dayDefinition?.executionPackages;
  if (!body || !definition || definition.view !== 'content-switcher') return null;
  if (body.querySelector(':scope > [data-semantic="execution-packages"]')) {
    return body.querySelector(':scope > [data-semantic="execution-packages"]');
  }

  const baselineSequence = directChildBySemantic(body, 'execution-sequence');
  if (!baselineSequence) {
    throw new Error('Required layout semantic is missing: execution-sequence');
  }
  const baselineMap = directChildBySemantic(body, 'map');
  const variantsContainer = directChildBySemantic(body, 'variants');
  const variantNodes = variantsContainer
    ? [...variantsContainer.querySelectorAll(':scope > [data-semantic="variant"]')]
    : [];

  const packagesContainer = document.createElement('section');
  packagesContainer.className = 'execution-packages';
  packagesContainer.dataset.semantic = 'execution-packages';
  packagesContainer.dataset.packageGroup = `day-${dayKey}-execution-package`;
  packagesContainer.dataset.activePackage = definition.defaultPackage;

  const anchor = firstDirectChildForSemantics(body, ['execution-sequence', 'map', 'variants']);
  if (anchor) body.insertBefore(packagesContainer, anchor);
  else body.append(packagesContainer);

  const baseline = createPackage({
    packageId: 'baseline',
    packageKind: 'baseline',
    label: definition.baselineLabel || '標準'
  });
  baseline.append(baselineSequence);
  if (baselineMap) baseline.append(baselineMap);
  packagesContainer.append(baseline);

  variantNodes.forEach((variantNode, index) => {
    const packageId = `variant-${index + 1}`;
    const label = `${definition.variantLabelPrefix || '代替案'} ${index + 1}`;
    const summary = variantNode.querySelector(':scope > summary');
    const condition = variantNode.querySelector(':scope > .variant-condition');
    const packageNode = createPackage({ packageId, packageKind: 'variant', label });
    const meta = createPackageMeta({
      label,
      intent: summary?.textContent?.trim() || '',
      condition: condition?.textContent?.trim() || ''
    });
    const sequence = createExecutionSequenceFromVariant(variantNode);
    const map = variantNode.querySelector(':scope > [data-semantic="map"]');

    if (meta) packageNode.append(meta);
    if (sequence) packageNode.append(sequence);
    if (map) packageNode.append(map);
    packageNode.hidden = packageId !== definition.defaultPackage;
    packagesContainer.append(packageNode);
  });

  if (variantsContainer) variantsContainer.remove();

  const packages = [...packagesContainer.querySelectorAll(':scope > [data-semantic="execution-package"]')];
  if (packages.length > 1) {
    const selector = createPackageSelector(packages, dayKey, definition);
    body.insertBefore(selector, packagesContainer);
  }

  return packagesContainer;
}

function applyTopContentLayout(root, contentLayout) {
  for (const block of contentLayout.blocks || []) {
    const node = nodeForBlock(root, block);
    if (!node) continue;
    markBlock(node, block);
    if (block.id === 'results') {
      const list = node.querySelector(':scope > .top-result-list');
      if (list) {
        list.dataset.layoutBlock = 'result-items';
        list.dataset.layoutGrammar = block.view;
      }
    }
  }
}

function applySpotContentLayout(root, contentLayout) {
  const heroDefinition = blockById(contentLayout, 'hero');
  const hero = nodeForBlock(root, heroDefinition);
  if (hero) {
    markBlock(hero, heroDefinition);
    const primary = hero.querySelector(':scope > .spot-hero-copy');
    const secondary = hero.querySelector(':scope > [data-semantic="image-carousel"]');
    if (primary) primary.dataset.layoutSlot = 'primary';
    if (secondary) secondary.dataset.layoutSlot = 'secondary';
    hero.dataset.hasSecondary = secondary ? 'true' : 'false';
  }

  const appealDefinition = blockById(contentLayout, 'appeal-review');
  const appeal = nodeForBlock(root, appealDefinition);
  markBlock(appeal, appealDefinition);

  const relatedDefinition = blockById(contentLayout, 'related-spots');
  const related = nodeForBlock(root, relatedDefinition);
  markBlock(related, relatedDefinition);

  const supportingDefinition = blockById(contentLayout, 'supporting-information');
  if (!supportingDefinition?.semantics?.length) return;
  let supporting = directChildBySemantic(root, 'supporting-information');
  if (!supporting) {
    const details = supportingDefinition.semantics
      .map(semantic => hero?.querySelector(`[data-semantic="${CSS.escape(semantic)}"]`) || null)
      .filter(Boolean);
    if (!details.length) return;

    supporting = document.createElement('section');
    supporting.className = 'spot-supporting-information';
    supporting.dataset.semantic = 'supporting-information';
    markBlock(supporting, supportingDefinition);
    details.forEach(node => supporting.append(node));

    if (related?.parentNode === root) root.insertBefore(supporting, related);
    else root.append(supporting);
  } else {
    markBlock(supporting, supportingDefinition);
  }
}

function applyRouteContentLayout(root, contentLayout) {
  const identityDefinition = blockById(contentLayout, 'identity');
  markBlock(nodeForBlock(root, identityDefinition), identityDefinition);

  const appealDefinition = blockById(contentLayout, 'appeal');
  markBlock(nodeForBlock(root, appealDefinition), appealDefinition);

  const supportingDefinition = blockById(contentLayout, 'supporting-conditions');
  markBlock(nodeForBlock(root, supportingDefinition), supportingDefinition);

  const workspaceDefinition = blockById(contentLayout, 'route-workspace');
  if (!workspaceDefinition?.slots) return;
  let workspace = directChildBySemantic(root, 'route-workspace');
  if (workspace) {
    markBlock(workspace, workspaceDefinition);
    return;
  }

  const primarySemantics = workspaceDefinition.slots.primary || [];
  const secondarySemantics = workspaceDefinition.slots.secondary || [];
  const allSemantics = [...primarySemantics, ...secondarySemantics];
  const nodes = allSemantics
    .map(semantic => ({ semantic, node: directChildBySemantic(root, semantic) }))
    .filter(item => item.node);
  if (!nodes.length) return;

  workspace = document.createElement('section');
  workspace.className = 'route-workspace';
  workspace.dataset.semantic = 'route-workspace';
  markBlock(workspace, workspaceDefinition);

  const anchor = firstDirectChildForSemantics(root, allSemantics);
  if (anchor) root.insertBefore(workspace, anchor);
  else root.append(workspace);

  for (const item of nodes) {
    item.node.dataset.layoutSlot = primarySemantics.includes(item.semantic) ? 'primary' : 'secondary';
    workspace.append(item.node);
  }
  workspace.dataset.singleSlot = nodes.length === 1 ? 'true' : 'false';
}

function selectedRouteTitle(routeNode, detailDefinition) {
  const detail = routeNode.querySelector(`[data-semantic="${CSS.escape(detailDefinition.detailSemantic)}"]`);
  const heading = detail?.querySelector(':scope > h4');
  return heading?.textContent?.trim() || 'ルート詳細';
}

function updatePlanRouteDisclosureSummary(routeNode, disclosure, detailDefinition) {
  const title = disclosure.querySelector(':scope > summary .plan-route-detail-title');
  if (title) title.textContent = selectedRouteTitle(routeNode, detailDefinition);
}

function applyPlanRouteDisclosure(routeNode, detailDefinition) {
  if (!routeNode || !detailDefinition || detailDefinition.view !== 'disclosure') return;
  if (routeNode.querySelector(':scope [data-semantic="route-detail-disclosure"]')) return;

  const routeChoice = routeNode.querySelector(':scope > article > [data-semantic="route-choice"]');
  const detailHost = routeChoice?.querySelector(':scope > .plan-route-choice-host');
  if (!routeChoice || !detailHost) return;

  const disclosure = document.createElement('details');
  disclosure.className = 'plan-route-detail-disclosure';
  disclosure.dataset.semantic = 'route-detail-disclosure';
  disclosure.dataset.layoutGrammar = detailDefinition.view;
  disclosure.open = detailDefinition.defaultOpen === true;

  const summary = document.createElement('summary');
  summary.className = 'plan-route-detail-summary';

  const title = document.createElement('span');
  title.className = 'plan-route-detail-title';
  title.textContent = selectedRouteTitle(routeNode, detailDefinition);

  const action = document.createElement('span');
  action.className = 'plan-route-detail-action';
  action.textContent = '詳細を見る';

  summary.append(title, action);
  disclosure.append(summary, detailHost);
  routeChoice.append(disclosure);

  const select = routeChoice.querySelector(':scope > .plan-route-choice-label select');
  if (select) {
    select.addEventListener('change', () => {
      queueMicrotask(() => updatePlanRouteDisclosureSummary(routeNode, disclosure, detailDefinition));
    });
  }
}

function applyPlanContentLayout(root, contentLayout) {
  const identity = blockById(contentLayout, 'identity');
  const reorder = blockById(contentLayout, 'day-reorder');
  const days = blockById(contentLayout, 'days');

  const overviewNode = directChildBySemantic(root, 'plan-overview');
  if (overviewNode && identity) {
    overviewNode.dataset.layoutBlock = identity.id;
    overviewNode.dataset.layoutGrammar = identity.view;
  }

  const reorderNode = directChildBySemantic(root, 'day-reorder');
  if (reorderNode && reorder) {
    reorderNode.dataset.layoutBlock = reorder.id;
    reorderNode.dataset.layoutGrammar = reorder.view;
  }

  const daysNode = directChildBySemantic(root, 'days');
  if (!daysNode || !days?.day) return;
  daysNode.dataset.layoutBlock = days.id;
  daysNode.dataset.layoutGrammar = days.view;

  const dayDefinition = days.day;
  daysNode.querySelectorAll('[data-semantic="day"]').forEach(dayNode => {
    dayNode.dataset.layoutGrammar = days.view;
    const sequence = dayNode.querySelector('[data-semantic="conceptual-sequence"]');
    if (!sequence) return;
    sequence.dataset.layoutGrammar = dayDefinition.sequence;

    const detailDefinition = dayDefinition.routeDetail;
    if (!detailDefinition || typeof detailDefinition !== 'object') return;
    sequence.querySelectorAll(`:scope > [data-semantic="${CSS.escape(detailDefinition.sourceSemantic)}"]`).forEach(routeNode => {
      applyPlanRouteDisclosure(routeNode, detailDefinition);
    });
  });
}

function applyConcretePlanContentLayout(root, contentLayout) {
  const executionDays = blockById(contentLayout, 'execution-days');
  const dayDefinition = executionDays?.day;
  if (!dayDefinition?.workspace) return;

  root.querySelectorAll('[data-semantic="execution-day"]').forEach(dayNode => {
    const body = dayNode.querySelector(':scope > .concrete-day-body');
    if (!body) return;
    const dayKey = dayNode.dataset.day || 'day';
    const packagesContainer = buildExecutionPackages(body, dayDefinition, dayKey);
    if (!packagesContainer) return;

    const packages = [...packagesContainer.querySelectorAll(':scope > [data-semantic="execution-package"]')];
    packages.forEach(packageNode => {
      const packageKey = packageNode.dataset.packageId || 'package';
      applyDayWorkspace(packageNode, dayDefinition.workspace, `day-${dayKey}-${packageKey}-workspace`);
    });
  });
}

const CONTENT_LAYOUT_APPLIERS = Object.freeze({
  top: applyTopContentLayout,
  spot: applySpotContentLayout,
  route: applyRouteContentLayout,
  plan: applyPlanContentLayout,
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
