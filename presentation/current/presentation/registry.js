export const DEFAULT_PRESENTATION_PRESET = 'default';

export const PRESENTATION_PRESETS = Object.freeze({
  default: Object.freeze({
    id: 'default',
    theme: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([
        new URL('../styles/themes/default.css', import.meta.url).href
      ])
    }),
    patternSet: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([
        new URL('../styles/patterns/default/content.css', import.meta.url).href,
        new URL('../styles/patterns/default/entity-content.css', import.meta.url).href,
        new URL('../styles/patterns/default/facts.css', import.meta.url).href,
        new URL('../styles/patterns/default/day.css', import.meta.url).href,
        new URL('../styles/patterns/default/flow.css', import.meta.url).href,
        new URL('../styles/patterns/default/plan-content.css', import.meta.url).href,
        new URL('../styles/patterns/default/map.css', import.meta.url).href,
        new URL('../styles/patterns/default/carousel.css', import.meta.url).href
      ])
    }),
    layoutSet: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([
        new URL('../styles/layouts/default/settings.css', import.meta.url).href,
        new URL('../styles/layouts/default/timeline.css', import.meta.url).href,
        new URL('../styles/layouts/default/plan.css', import.meta.url).href,
        new URL('../styles/layouts/default/spot.css', import.meta.url).href,
        new URL('../styles/layouts/default/route.css', import.meta.url).href,
        new URL('../styles/layouts/default/top.css', import.meta.url).href,
        new URL('../styles/layouts/default/shell.css', import.meta.url).href
      ])
    })
  })
});

export function resolvePresentationPreset(requestedId) {
  const id = requestedId == null
    ? DEFAULT_PRESENTATION_PRESET
    : String(requestedId).trim();

  if (!id) {
    throw new Error('Presentation preset id must not be empty.');
  }

  const preset = PRESENTATION_PRESETS[id];
  if (!preset) {
    throw new Error(`Unknown presentation preset: ${id}`);
  }

  return preset;
}
