// Canonical DOM contracts for shared Leisure Presentation components.
// Same semantic component => same tag structure and ui-* classes across Plan/Route/Spot.

export function escapeHtml(value='') {
  return String(value).replace(/[&<>'\"]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'
  }[c]));
}

export function entityRefChevron() {
  return `<svg class="ui-entity-ref-icon" viewBox="0 0 54 24" fill="none" aria-hidden="true" focusable="false"><path d="M2 4l8 8-8 8"/><path d="M18 4l8 8-8 8"/><path d="M34 4l8 8-8 8"/></svg>`;
}

export function renderEntityRefCard({kind='', title='', href='', disabled=false}={}) {
  const content = `<span class="ui-entity-ref-kind">${escapeHtml(kind)}</span><strong class="ui-entity-ref-title">${escapeHtml(title)}</strong>${entityRefChevron()}`;
  if (disabled || !href) return `<span class="ui-entity-ref-card is-disabled">${content}</span>`;
  return `<a class="ui-entity-ref-card" href="${escapeHtml(href)}">${content}</a>`;
}

export function renderSeasonIcons(seasons=[]) {
  if (!seasons.length) return '';
  return `<span class="ui-season-icons">${seasons.map(value => `<i class="ui-season-icon" title="${escapeHtml(value)}" aria-label="${escapeHtml(value)}">${escapeHtml(String(value).slice(0,1))}</i>`).join('')}</span>`;
}

export function renderHeroFacts(items=[]) {
  if (!items.length) return '';
  return `<div class="ui-hero-facts">${items.map(item => {
    const value = item.valueHtml != null ? item.valueHtml : escapeHtml(item.value ?? '');
    return `<div class="ui-hero-fact"><span class="ui-hero-fact-label">${escapeHtml(item.label ?? '')}</span><strong class="ui-hero-fact-value">${value}</strong></div>`;
  }).join('')}</div>`;
}

export function makeCollapsible(section, {open=true}={}) {
  if (!section || section.dataset.uiCollapsible === '1') return section;

  const directTitle = section.querySelector(':scope > h2');
  const legacyHeading = section.querySelector(':scope > .section-heading');
  const title = directTitle || legacyHeading?.querySelector('h2');
  if (!title) return section;

  const descriptions = legacyHeading
    ? [...legacyHeading.querySelectorAll('p')]
    : [];

  const heading = document.createElement('div');
  heading.className = 'ui-collapsible-heading';
  heading.setAttribute('role','button');
  heading.setAttribute('tabindex','0');
  title.classList.add('ui-collapsible-title');
  heading.appendChild(title);

  const body = document.createElement('div');
  body.className = 'ui-collapsible-body';
  descriptions.forEach(description => {
    description.classList.add('ui-collapsible-description');
    body.appendChild(description);
  });

  [...section.children].forEach(child => {
    if (child === directTitle || child === legacyHeading) return;
    body.appendChild(child);
  });

  legacyHeading?.remove();
  section.replaceChildren(heading, body);
  section.classList.add('ui-collapsible');
  section.dataset.uiCollapsible = '1';

  const apply = nextOpen => {
    section.classList.toggle('is-collapsed', !nextOpen);
    body.hidden = !nextOpen;
    heading.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  };
  const toggle = () => apply(heading.getAttribute('aria-expanded') !== 'true');
  heading.addEventListener('click', toggle);
  heading.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
  apply(open);
  return section;
}
