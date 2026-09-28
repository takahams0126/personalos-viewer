function append(parent, child) {
  if (child == null || child === false) return;
  if (Array.isArray(child)) {
    child.forEach(item => append(parent, item));
    return;
  }
  if (child instanceof Node) {
    parent.append(child);
    return;
  }
  parent.append(document.createTextNode(String(child)));
}

export function h(tag, options = {}, ...children) {
  const element = document.createElement(tag);
  const {
    className,
    text,
    attrs = {},
    dataset = {}
  } = options;

  if (className) element.className = className;
  if (text != null) element.textContent = String(text);

  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (value === true) element.setAttribute(name, '');
    else element.setAttribute(name, String(value));
  }

  for (const [name, value] of Object.entries(dataset)) {
    if (value != null) element.dataset[name] = String(value);
  }

  children.forEach(child => append(element, child));
  return element;
}

export function textRow(label, value, className = 'semantic-row') {
  if (value == null || value === '') return null;
  return h('p', { className },
    h('span', { className: 'semantic-label', text: label }),
    h('span', { className: 'semantic-value', text: value })
  );
}
