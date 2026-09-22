import {
  escapeHtml,
  makeCollapsible,
  renderEntityRefCard
} from '../shared/component-contracts.js';
import { renderGoogleMap } from '../shared/google-map.js';
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

function renderBadges(badges = []) {
  if (!badges.length) return '';
  return `<span class="route-stop-badges">${badges.map(badge => `<small class="route-role-badge tone-${escapeHtml(badge.tone || 'neutral')}">${escapeHtml(badge.label)}</small>`).join('')}</span>`;
}

function buildFallbackMap(sequence = []) {
  const fallbackMap = new Map();
  sequence.forEach(item => {
    const targetId = item?.fallback_for?.id;
    if (!targetId || !item?.spot?.id) return;
    const current = fallbackMap.get(targetId) || [];
    current.push(item.spot);
    fallbackMap.set(targetId, current);
  });
  return fallbackMap;
}

function renderFallbackRefs(fallbacks = [], navigation) {
  if (!fallbacks.length) return '';
  return `<div class="route-stop-detail route-stop-fallback">
    <b>代替</b>
    <span>${fallbacks.map(ref => routeRefLink(ref, navigation)).join(' / ')}</span>
  </div>`;
}

function renderRouteStop(item, navigation, fallbacks = []) {
  const spot = item.spot || {};
  const title = routeRefLink(spot, navigation);

  return `<article class="route-stop">
    <span class="stop-no">${escapeHtml(String(item.order ?? ''))}</span>
    <div class="route-stop-content">
      <div class="route-stop-title-row">
        ${title}
        ${renderBadges(item.badges || [])}
      </div>
      ${item.summary ? `<p class="route-stop-summary">${escapeHtml(item.summary)}</p>` : ''}
      ${item.condition_text ? `<div class="route-stop-detail route-stop-condition"><b>条件</b><span>${escapeHtml(item.condition_text)}</span></div>` : ''}
      ${renderFallbackRefs(fallbacks, navigation)}
    </div>
  </article>`;
}

function buildPopupData(point, navigation) {
  const target = point.entityId ? { type: point.entityType || 'spot', id: point.entityId } : null;
  const personalHref = target ? navigation.href(target) : '';

  return {
    title: point.name,
    summary: point.summary,
    actions: personalHref
      ? [{
          kind: 'primary',
          label: 'PersonalOSで詳しく見る',
          href: personalHref,
          external: false
        }]
      : []
  };
}

function joinRouteMapPoints(mapArtifact, sequence = []) {
  const byId = new Map(sequence
    .filter(item => item?.spot?.id)
    .map(item => [item.spot.id, item]));

  return (mapArtifact?.points || []).map(point => {
    const entityId = point.entity_ref?.id || '';
    const routeItem = byId.get(entityId) || {};
    return {
      entityId,
      entityType: point.entity_ref?.entity_type || 'spot',
      name: routeItem.spot?.label || entityId || 'Point',
      summary: routeItem.summary || '',
      order: point.order,
      lat: point.position?.lat,
      lon: point.position?.lon
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
  const fallbackMap = buildFallbackMap(sequence);
  const sequenceSection = `<section class="section" data-route-section="sequence">
    <h2>立ち寄り順</h2>
    <div class="route-stops vertical">${sequence.map(item => renderRouteStop(item, navigation, fallbackMap.get(item?.spot?.id) || [])).join('')}</div>
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
