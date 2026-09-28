import {
  escapeHtml,
  makeCollapsible,
  renderEntityRefCard
} from '../shared/component-contracts.js';
import {
  buildGoogleMapsSearchUrl,
  renderGoogleMap
} from '../shared/google-map.js';
import { loadStyle } from '../shared/load-style.js';

function renderChips(items = []) {
  if (!items.length) return '';
  return `<div class="route-demo-chips">${items.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
}

function renderStrengthCards(items = []) {
  if (!items.length) return '';
  return `<div class="route-demo-cards primary">${items.map(item => `<article>${escapeHtml(item)}</article>`).join('')}</div>`;
}

function renderHeroMeta(data) {
  const items = [`ルート · ${data.id}`];
  if (data.family_label) items.push(`系統：${data.family_label}`);
  if (data.variant?.label) items.push(`バリエーション：${data.variant.label}`);
  return `<div class="route-entity-meta">${items.map(item => `<span>${escapeHtml(item)}</span>`).join('<i aria-hidden="true">｜</i>')}</div>`;
}

function renderInlineFacts(facts = []) {
  if (!facts.length) return '';
  return `<div class="route-inline-facts">${facts.map(fact => `<span class="route-inline-fact"><b>${escapeHtml(fact.label)}</b><span>${escapeHtml(fact.value)}</span></span>`).join('')}</div>`;
}

function routeRefLink(ref, navigation) {
  if (!ref?.id) return '';
  const href = navigation.href({ type: ref.entity_type || 'spot', id: ref.id });
  const label = escapeHtml(ref.label || ref.id);
  return href ? `<a href="${escapeHtml(href)}">${label}</a>` : `<span>${label}</span>`;
}

function renderHeroSpots(spots = [], navigation) {
  if (!spots.length) return '';
  return `<div class="route-hero-refs">${spots.map(spot => renderEntityRefCard({
    kind: '主役Spot',
    title: spot.label || spot.id || '',
    href: navigation.href({ type: spot.entity_type || 'spot', id: spot.id })
  })).join('')}</div>`;
}

function renderSemanticBadge(value, semantic) {
  if (!value?.label) return '';
  return `<small class="route-role-badge semantic-${escapeHtml(semantic)}" data-code="${escapeHtml(value.code || '')}">${escapeHtml(value.label)}</small>`;
}

function renderSequenceBadges(item) {
  const badges = [
    renderSemanticBadge(item.visit_purpose, 'visit-purpose'),
    renderSemanticBadge(item.inclusion_requirement, 'inclusion')
  ].filter(Boolean);
  if (!badges.length) return '';
  return `<span class="route-stop-badges">${badges.join('')}</span>`;
}

function renderCondition(condition) {
  if (!condition?.text) return '';
  return `<div class="route-stop-detail route-stop-condition">
    <b>条件</b>
    <span>${escapeHtml(condition.text)}</span>
  </div>`;
}

function renderAlternatives(alternatives = [], navigation) {
  if (!alternatives.length) return '';
  return `<div class="route-stop-detail route-stop-alternative">
    <b>代替</b>
    <div class="route-stop-alternative-body">
      ${alternatives.map(item => `<div class="route-stop-alternative-item">
        <div class="route-stop-alternative-title">${routeRefLink(item.spot, navigation)}</div>
        ${item.selection_condition?.text ? `<div class="route-stop-alternative-condition">条件 ${escapeHtml(item.selection_condition.text)}</div>` : ''}
      </div>`).join('')}
    </div>
  </div>`;
}

function renderRouteStop(item, navigation) {
  const spot = item.spot || {};
  const title = routeRefLink(spot, navigation);

  return `<article class="route-stop">
    <span class="stop-no">${escapeHtml(String(item.order ?? ''))}</span>
    <div class="route-stop-content">
      <div class="route-stop-title-row">
        ${title}
        ${renderSequenceBadges(item)}
      </div>
      ${renderCondition(item.condition)}
      ${renderAlternatives(item.alternatives || [], navigation)}
    </div>
  </article>`;
}

function buildPopupData(point, navigation) {
  const target = point.entityId ? { type: point.entityType || 'spot', id: point.entityId } : null;
  const personalHref = target ? navigation.href(target) : '';
  const googleHref = buildGoogleMapsSearchUrl({
    name: point.name,
    placeId: point.placeId
  });

  const actions = [
    personalHref
      ? {
          kind: 'primary',
          label: 'PersonalOSで詳しく見る',
          href: personalHref,
          external: false
        }
      : null,
    googleHref
      ? {
          kind: 'secondary',
          label: 'Google Mapsで開く',
          href: googleHref,
          external: true
        }
      : null
  ].filter(Boolean);

  return {
    title: point.name,
    summary: point.summary,
    actions
  };
}

function joinRouteMapPoints(mapArtifact, sequence = []) {
  const byId = new Map(sequence
    .filter(item => item?.spot?.id)
    .map(item => [item.spot.id, item]));

  return (mapArtifact?.points || []).map(point => {
    const entityId = point.entity_ref?.id || '';
    const routeItem = byId.get(entityId) || {};
    const externalRef = point.external_ref || {};
    return {
      entityId,
      entityType: point.entity_ref?.entity_type || 'spot',
      name: routeItem.spot?.label || entityId || 'Point',
      summary: routeItem.map_popup_summary || '',
      order: point.order,
      lat: point.position?.lat,
      lon: point.position?.lon,
      placeId: externalRef.provider_code === 'google_place' ? externalRef.id || '' : ''
    };
  });
}

async function initRouteMap(data, navigation, resources) {
  const artifactRef = data?.map?.artifact_ref;
  if (!artifactRef) return;

  const element = document.querySelector('#route-map');
  const messageElement = document.querySelector('#route-map-message');
  if (!element) return;

  try {
    const artifact = await resources.loadJson(artifactRef);
    const points = joinRouteMapPoints(artifact, data.sequence || []);

    await renderGoogleMap({
      element,
      messageElement,
      points,
      getPosition: point => ({ lat: Number(point.lat), lng: Number(point.lon) }),
      getTitle: point => point.name,
      getLabel: point => String(point.order || ''),
      getPopupData: point => buildPopupData(point, navigation)
    });
  } catch (error) {
    element.style.display = 'none';
    if (messageElement) {
      messageElement.textContent = `地図の読み込みに失敗しました: ${error.message}`;
    }
  }
}

function renderRouteHtml(data, navigation) {
  const mapSection = data.map?.artifact_ref
    ? `<section class="section" data-route-section="map">
        <h2>ルートの概念地図</h2>
        <div class="map-wrap">
          <div id="route-map" class="route-map"></div>
          <div id="route-map-message" class="map-message"></div>
        </div>
      </section>`
    : '';

  const sequence = data.sequence || [];
  const sequenceSection = `<section class="section" data-route-section="sequence">
    <h2>立ち寄り順</h2>
    <div class="route-stops vertical">${sequence.map(item => renderRouteStop(item, navigation)).join('')}</div>
  </section>`;

  const constraints = (data.constraints || []).length
    ? `<section class="section" data-route-section="constraints">
        <h2>重要な条件</h2>
        <ul class="list route-constraint-list">${data.constraints.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>`
    : '';

  return `<section class="hero route-demo-hero">
      ${renderHeroMeta(data)}
      <h1>${escapeHtml(data.title || data.id)}</h1>
      ${data.summary ? `<p class="summary ui-hero-copy">${escapeHtml(data.summary)}</p>` : ''}
      ${renderChips(data.theme_chips || [])}
      ${renderInlineFacts(data.hero_facts || [])}
      ${renderHeroSpots(data.hero_spots || [], navigation)}
    </section>
    <section class="section route-demo-section route-demo-value" data-route-section="appeal">
      <h2>このルートの魅力</h2>
      ${data.appeal?.summary ? `<p class="route-appeal-summary">${escapeHtml(data.appeal.summary)}</p>` : ''}
      ${renderStrengthCards(data.appeal?.strengths || [])}
    </section>
    ${mapSection}
    ${sequenceSection}
    ${constraints}`;
}

export async function render({ data, navigation, resources }) {
  loadStyle(new URL('./route.css', import.meta.url).href);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = renderRouteHtml(data, navigation);

  makeCollapsible(app.querySelector('[data-route-section="appeal"]'), { open: false });
  makeCollapsible(app.querySelector('[data-route-section="map"]'), { open: true });
  makeCollapsible(app.querySelector('[data-route-section="sequence"]'), { open: true });
  makeCollapsible(app.querySelector('[data-route-section="constraints"]'), { open: true });

  await initRouteMap(data, navigation, resources);
}
