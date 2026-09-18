import {
  escapeHtml,
  makeCollapsible,
  renderEntityRefCard,
  renderHeroFacts,
  renderSeasonIcons
} from '../shared/component-contracts.js';
import { buildEntityHref } from '../shared/navigation.js';
import {
  buildGoogleMapsSearchUrl,
  renderGoogleMap
} from '../shared/google-map.js';
import { loadStyle } from '../shared/load-style.js';

const roleLabel = value => ({
  core: '主役',
  main: '主役',
  optional: '任意',
  main_lunch: '昼食',
  high_priority: '高優先',
  condition_high: '条件付き',
  fallback_onsen: '代替温泉',
  onsen: '温泉',
  fallback: '代替'
}[value] || String(value || '').replaceAll('_', ' '));

const difficultyLabel = value => ({
  easy: 'やさしい',
  easy_to_medium: 'やさしい〜中程度',
  medium: '中程度',
  medium_to_hard: '中程度〜難しい',
  hard: '難しい'
}[value] || value || '');

const variantLabel = value => ({
  standard: '標準',
  full: 'フル',
  short: '短縮'
}[value] || String(value || '').replaceAll('_', ' '));

function renderChips(items = []) {
  if (!items.length) return '';
  return `<div class="route-demo-chips">${items.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div>`;
}

function renderStrengthCards(items = []) {
  if (!items.length) return '';
  return `<div class="route-demo-cards primary">${items.map(item => `<article>${escapeHtml(item)}</article>`).join('')}</div>`;
}

function renderHeroRef(ref, request) {
  const href = ref?.type && ref?.id ? buildEntityHref({ type: ref.type, id: ref.id }, request) : '';
  return renderEntityRefCard({
    kind: '主役Spot',
    title: ref?.label || ref?.id || '',
    href
  });
}

function renderRouteStop(item, index, request) {
  const href = item?.type && item?.id ? buildEntityHref({ type: item.type, id: item.id }, request) : '';
  const title = escapeHtml(item?.label || item?.id || '');
  const label = href ? `<a href="${escapeHtml(href)}">${title}</a>` : title;
  const role = item?.role
    ? `<small class="route-role-badge role-${escapeHtml(item.role)}">${escapeHtml(roleLabel(item.role))}</small>`
    : '';

  return `<span class="route-stop"><span class="stop-no">${index + 1}</span>${label}${role}</span>`;
}

function buildPopupData(point, request) {
  const target = point.entityId ? { type: point.entityType || 'spot', id: point.entityId } : null;
  const personalHref = target ? buildEntityHref(target, request) : '';
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
  const byId = new Map(sequence.filter(item => item?.id).map(item => [item.id, item]));

  return (mapArtifact?.points || []).map(point => {
    const entityId = point.entity_id || point.spot_id || '';
    const routeItem = byId.get(entityId) || {};
    return {
      ...point,
      entityId,
      entityType: point.entity_type || routeItem.type || 'spot',
      name: routeItem.label || point.name || entityId || 'Point',
      summary: routeItem.summary || '',
      role: routeItem.role || point.role || '',
      order: point.order || '',
      placeId: point.place_id || ''
    };
  });
}

async function loadMapArtifact(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

async function initRouteMap(data, request) {
  const mapSpec = data?.map;
  if (!mapSpec?.points_json) return;

  const element = document.querySelector('#route-map');
  const messageElement = document.querySelector('#route-map-message');
  if (!element) return;

  try {
    const artifact = await loadMapArtifact(mapSpec.points_json);
    const points = joinRouteMapPoints(artifact, data.route?.sequence || []);

    await renderGoogleMap({
      element,
      messageElement,
      points,
      getPosition: point => ({ lat: Number(point.lat), lng: Number(point.lon) }),
      getTitle: point => point.name,
      getLabel: point => point.order ? String(point.order) : '',
      getPopupData: point => buildPopupData(point, request)
    });
  } catch (error) {
    element.style.display = 'none';
    if (messageElement) {
      messageElement.textContent = `地図の読み込みに失敗しました: ${error.message}`;
    }
  }
}

function renderRouteHtml(data, request) {
  const route = data.route || {};
  const appeal = route.appeal || {};
  const strengths = appeal.strengths || route.highlights || [];

  const facts = [
    { label: '所要時間', value: route.duration || '' },
    { label: '難易度', value: difficultyLabel(route.difficulty) },
    { label: '移動', value: route.route_type === 'driving' ? '車' : (route.route_type || '') }
  ].filter(item => item.value);

  if ((route.season || []).length) {
    facts.push({ label: '季節', valueHtml: renderSeasonIcons(route.season) });
  }

  const heroMeta = route.family || route.variant
    ? `<div class="route-hero-meta">
        ${route.family ? `<span><small>系統</small><strong>${escapeHtml(route.family)}</strong></span>` : ''}
        ${route.variant ? `<span><small>バリエーション</small><strong>${escapeHtml(variantLabel(route.variant))}</strong></span>` : ''}
      </div>`
    : '';

  const heroRefs = (data.hero_refs || []).length
    ? `<div class="route-hero-refs">${data.hero_refs.map(ref => renderHeroRef(ref, request)).join('')}</div>`
    : '';

  const mapSection = data.map?.points_json
    ? `<section class="section" data-route-section="map">
        <h2>ルートの地図</h2>
        <div class="map-wrap">
          <div id="route-map" class="route-map"></div>
          <div id="route-map-message" class="map-message"></div>
        </div>
      </section>`
    : '';

  const sequence = route.sequence || route.sequence_refs || [];
  const sequenceSection = `<section class="section" data-route-section="sequence">
    <h2>立ち寄り順</h2>
    <div class="route-stops vertical">${sequence.map((item, index) => renderRouteStop(item, index, request)).join('')}</div>
  </section>`;

  const constraints = (route.constraints || []).length
    ? `<section class="section" data-route-section="constraints">
        <h2>重要な条件</h2>
        <ul class="list">${route.constraints.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </section>`
    : '';

  return `<section class="hero route-demo-hero">
      <div class="kicker">ルート · ${escapeHtml(data.id)}</div>
      <h1>${escapeHtml(data.title || data.id)}</h1>
      ${data.summary ? `<p class="summary ui-hero-copy">${escapeHtml(data.summary)}</p>` : ''}
      ${route.purpose ? `<p class="ui-hero-copy">${escapeHtml(route.purpose)}</p>` : ''}
      ${renderChips(appeal.themes || [])}
      ${heroMeta}
      ${heroRefs}
      ${renderHeroFacts(facts)}
    </section>
    <section class="section route-demo-section route-demo-value" data-route-section="appeal">
      <h2>このルートの魅力</h2>
      ${appeal.summary ? `<p class="route-appeal-summary">${escapeHtml(appeal.summary)}</p>` : ''}
      ${renderStrengthCards(strengths)}
    </section>
    ${mapSection}
    ${sequenceSection}
    ${constraints}`;
}

export async function render({ request, data }) {
  loadStyle(new URL('./route.css', import.meta.url).href);
  const app = document.querySelector('#app');
  if (!app) return;

  app.innerHTML = renderRouteHtml(data, request);

  makeCollapsible(app.querySelector('[data-route-section="appeal"]'), { open: false });
  makeCollapsible(app.querySelector('[data-route-section="map"]'), { open: true });
  makeCollapsible(app.querySelector('[data-route-section="sequence"]'), { open: true });
  makeCollapsible(app.querySelector('[data-route-section="constraints"]'), { open: true });

  await initRouteMap(data, request);
}
