export function renderNavigation(context, root = document.querySelector('#breadcrumb')) {
  if (!root) return;

  root.replaceChildren();
  const { request, data, navigation } = context || {};
  if (!request || request.type === 'top') return;

  if (navigation?.source) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'breadcrumb-back';
    back.textContent = `← ${navigation.source.title || navigation.source.id || '戻る'}`;
    back.addEventListener('click', () => history.back());
    root.appendChild(back);

    const separator = document.createElement('span');
    separator.textContent = '›';
    separator.setAttribute('aria-hidden', 'true');
    root.appendChild(separator);
  }

  const current = document.createElement('span');
  current.textContent = data?.title || request.id || '';
  current.setAttribute('aria-current', 'page');
  root.appendChild(current);
}
