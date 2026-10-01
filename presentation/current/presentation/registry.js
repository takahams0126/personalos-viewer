export const DEFAULT_PRESENTATION_PRESET = 'default';

const DEFAULT_PATTERN_STYLESHEETS = Object.freeze([
  new URL('../styles/patterns/default/content.css', import.meta.url).href,
  new URL('../styles/patterns/default/entity-content.css', import.meta.url).href,
  new URL('../styles/patterns/default/facts.css', import.meta.url).href,
  new URL('../styles/patterns/default/top-content.css', import.meta.url).href,
  new URL('../styles/patterns/default/spot-content.css', import.meta.url).href,
  new URL('../styles/patterns/default/route-content.css', import.meta.url).href,
  new URL('../styles/patterns/default/day.css', import.meta.url).href,
  new URL('../styles/patterns/default/flow.css', import.meta.url).href,
  new URL('../styles/patterns/default/plan-content.css', import.meta.url).href,
  new URL('../styles/patterns/default/map.css', import.meta.url).href,
  new URL('../styles/patterns/default/carousel.css', import.meta.url).href
]);

const DEFAULT_PATTERN_SET = Object.freeze({ id: 'default', stylesheets: DEFAULT_PATTERN_STYLESHEETS });

const SMART_PATTERN_STYLESHEETS = Object.freeze([
  ...DEFAULT_PATTERN_STYLESHEETS,
  new URL('../styles/patterns/smart/product.css', import.meta.url).href,
  new URL('../styles/patterns/smart/workspace.css', import.meta.url).href,
  new URL('../styles/patterns/smart/convergence.css', import.meta.url).href,
  new URL('../styles/patterns/smart/convergence-2.css', import.meta.url).href,
  new URL('../styles/patterns/smart/review.css', import.meta.url).href,
  new URL('../styles/patterns/smart/convergence-3.css', import.meta.url).href
]);

const SMART_PATTERN_SET = Object.freeze({ id: 'smart', stylesheets: SMART_PATTERN_STYLESHEETS });

const COMPACT_PATTERN_SET = Object.freeze({
  id: 'compact',
  stylesheets: Object.freeze([
    ...SMART_PATTERN_STYLESHEETS,
    new URL('../styles/patterns/compact/product.css', import.meta.url).href
  ])
});

const ATLAS_PATTERN_SET = Object.freeze({
  id: 'atlas',
  stylesheets: Object.freeze([
    ...SMART_PATTERN_STYLESHEETS,
    new URL('../styles/patterns/atlas/product.css', import.meta.url).href
  ])
});

const DEFAULT_LAYOUT_STYLESHEETS = Object.freeze([
  new URL('../styles/layouts/default/settings.css', import.meta.url).href,
  new URL('../styles/layouts/default/timeline.css', import.meta.url).href,
  new URL('../styles/layouts/default/plan.css', import.meta.url).href,
  new URL('../styles/layouts/default/spot.css', import.meta.url).href,
  new URL('../styles/layouts/default/route.css', import.meta.url).href,
  new URL('../styles/layouts/default/top.css', import.meta.url).href,
  new URL('../styles/layouts/default/shell.css', import.meta.url).href
]);

const DEFAULT_LAYOUT_SET = Object.freeze({ id: 'default', stylesheets: DEFAULT_LAYOUT_STYLESHEETS });

const SMART_LAYOUT_STYLESHEETS = Object.freeze([
  ...DEFAULT_LAYOUT_STYLESHEETS,
  new URL('../styles/layouts/smart/product.css', import.meta.url).href,
  new URL('../styles/layouts/smart/convergence.css', import.meta.url).href,
  new URL('../styles/layouts/smart/convergence-2.css', import.meta.url).href,
  new URL('../styles/layouts/smart/review.css', import.meta.url).href,
  new URL('../styles/layouts/smart/convergence-3.css', import.meta.url).href
]);

const SMART_LAYOUT_SET = Object.freeze({ id: 'smart', stylesheets: SMART_LAYOUT_STYLESHEETS });

const COMPACT_LAYOUT_SET = Object.freeze({
  id: 'compact',
  stylesheets: Object.freeze([
    ...SMART_LAYOUT_STYLESHEETS,
    new URL('../styles/layouts/compact/product.css', import.meta.url).href
  ])
});

const ATLAS_LAYOUT_SET = Object.freeze({
  id: 'atlas',
  stylesheets: Object.freeze([
    ...SMART_LAYOUT_STYLESHEETS,
    new URL('../styles/layouts/atlas/product.css', import.meta.url).href
  ])
});

const SMART_THEME = Object.freeze({
  id: 'smart',
  stylesheets: Object.freeze([new URL('../styles/themes/smart.css', import.meta.url).href])
});

export const PRESENTATION_PRESETS = Object.freeze({
  default: Object.freeze({
    id: 'default',
    pageLayoutDefinitionId: 'semantic-baseline-page-v1',
    theme: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([new URL('../styles/themes/default.css', import.meta.url).href])
    }),
    patternSet: DEFAULT_PATTERN_SET,
    layoutSet: DEFAULT_LAYOUT_SET
  }),
  smart: Object.freeze({
    id: 'smart',
    pageLayoutDefinitionId: 'leisure-page-layout-v1',
    theme: SMART_THEME,
    patternSet: SMART_PATTERN_SET,
    layoutSet: SMART_LAYOUT_SET
  }),
  compact: Object.freeze({
    id: 'compact',
    pageLayoutDefinitionId: 'leisure-page-layout-v1',
    theme: SMART_THEME,
    patternSet: COMPACT_PATTERN_SET,
    layoutSet: COMPACT_LAYOUT_SET
  }),
  atlas: Object.freeze({
    id: 'atlas',
    pageLayoutDefinitionId: 'leisure-page-layout-v1',
    theme: SMART_THEME,
    patternSet: ATLAS_PATTERN_SET,
    layoutSet: ATLAS_LAYOUT_SET
  })
});

export function resolvePresentationPreset(requestedId) {
  const id = requestedId == null ? DEFAULT_PRESENTATION_PRESET : String(requestedId).trim();
  if (!id) throw new Error('Presentation preset id must not be empty.');
  const preset = PRESENTATION_PRESETS[id];
  if (!preset) throw new Error(`Unknown presentation preset: ${id}`);
  return preset;
}
