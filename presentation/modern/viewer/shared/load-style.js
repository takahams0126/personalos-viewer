const loadedStyles = new Set();

export function loadStyle(href) {
  const url = String(href);
  if (loadedStyles.has(url)) return;

  const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .some(link => link.href === url);
  if (existing) {
    loadedStyles.add(url);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  document.head.append(link);
  loadedStyles.add(url);
}
