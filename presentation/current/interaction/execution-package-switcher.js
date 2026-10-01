function choicesFor(selector) {
  return [...selector.querySelectorAll(':scope > .execution-package-options [data-package-target]')];
}

function packagesFor(selector) {
  const day = selector.closest('[data-semantic="execution-day"]');
  const groupKey = selector.dataset.packageSwitcher;
  if (!day || !groupKey) return [];
  const container = day.querySelector(`[data-package-group="${CSS.escape(groupKey)}"]`);
  if (!container) return [];
  return [...container.querySelectorAll(':scope > [data-semantic="execution-package"]')];
}

function activatePackage(selector, nextChoice, { focus = false } = {}) {
  const packageId = nextChoice.dataset.packageTarget;
  if (!packageId) return;

  const choices = choicesFor(selector);
  const packages = packagesFor(selector);
  const container = packages[0]?.parentElement || null;

  for (const choice of choices) {
    const selected = choice === nextChoice;
    choice.setAttribute('aria-pressed', selected ? 'true' : 'false');
    choice.tabIndex = selected ? 0 : -1;
  }

  for (const packageNode of packages) {
    const selected = packageNode.dataset.packageId === packageId;
    const wasHidden = packageNode.hidden;
    packageNode.hidden = !selected;
    if (selected && wasHidden) {
      packageNode.dispatchEvent(new Event('presentation:shown'));
    }
  }

  if (container) container.dataset.activePackage = packageId;
  if (focus) nextChoice.focus();
}

function hydratePackageSwitcher(selector) {
  if (selector.dataset.packageSwitcherReady === 'true') return;
  const choices = choicesFor(selector);
  if (choices.length <= 1) {
    selector.dataset.packageSwitcherReady = 'true';
    return;
  }

  selector.addEventListener('click', event => {
    const choice = event.target.closest('[data-package-target]');
    if (!choice || !selector.contains(choice)) return;
    activatePackage(selector, choice);
  });

  selector.addEventListener('keydown', event => {
    const current = event.target.closest('[data-package-target]');
    if (!current || !selector.contains(current)) return;

    const index = choices.indexOf(current);
    if (index < 0) return;

    let nextIndex = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % choices.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + choices.length) % choices.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = choices.length - 1;
    if (nextIndex == null) return;

    event.preventDefault();
    activatePackage(selector, choices[nextIndex], { focus: true });
  });

  selector.dataset.packageSwitcherReady = 'true';
}

export function hydrateExecutionPackageSwitchers(root) {
  root.querySelectorAll('[data-package-switcher]').forEach(hydratePackageSwitcher);
}
