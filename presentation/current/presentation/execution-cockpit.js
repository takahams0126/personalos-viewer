function directChildBySemantic(container, semantic) {
  return [...container.children].find(child => child.dataset?.semantic === semantic) || null;
}

function concreteWorkspaceDefinition(definition) {
  const blocks = definition?.contentLayouts?.concrete_plan?.blocks || [];
  const days = blocks.find(block => block.id === 'execution-days');
  return days?.day?.workspace || null;
}

function applyPackageSpatialSupport(packageNode, workspaceDefinition) {
  const workspace = directChildBySemantic(packageNode, 'day-workspace');
  if (!workspace) return;

  const supportDefinition = workspaceDefinition?.parallelSupport;
  if (!supportDefinition?.sourceSemantic) {
    workspace.dataset.hasSpatialContext = 'false';
    return;
  }

  const support = directChildBySemantic(packageNode, supportDefinition.sourceSemantic);
  workspace.dataset.hasSpatialContext = support ? 'true' : 'false';
  if (!support) return;

  const spatialContext = document.createElement('aside');
  spatialContext.className = 'day-spatial-context';
  spatialContext.dataset.semantic = 'spatial-context';
  spatialContext.dataset.layoutBlock = supportDefinition.id || 'spatial-context';
  spatialContext.dataset.layoutGrammar = supportDefinition.view || 'map';

  support.dataset.layoutSlot = 'spatial-support';
  spatialContext.append(support);
  workspace.append(spatialContext);
}

export function applyExecutionCockpitLayout({ root, definition }) {
  const workspaceDefinition = concreteWorkspaceDefinition(definition);
  if (!root || !workspaceDefinition?.parallelSupport) return;

  root.querySelectorAll('[data-semantic="execution-package"]').forEach(packageNode => {
    applyPackageSpatialSupport(packageNode, workspaceDefinition);
  });
}
