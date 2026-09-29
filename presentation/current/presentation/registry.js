export const DEFAULT_PRESENTATION_PRESET = 'default';

function stylesheet(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

export const PRESENTATION_PRESETS = Object.freeze({
  default: Object.freeze({
    id: 'default',
    theme: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([
        stylesheet('../styles/themes/default.css')
      ])
    }),
    patternSet: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([
        stylesheet('../styles/patterns/default/content.css'),
        stylesheet('../styles/patterns/default/map.css'),
        stylesheet('../styles/patterns/default/carousel.css')
      ])
    }),
    layoutSet: Object.freeze({
      id: 'default',
      stylesheets: Object.freeze([
        stylesheet('../styles/layouts/default/timeline.css'),
        stylesheet('../styles/layouts/default/grid.css'),
        stylesheet('../styles/layouts/default/plan.css'),
        stylesheet('../styles/layouts/default/spot.css'),
        stylesheet('../styles/layouts/default/route.css'),
        stylesheet('../styles/layouts/default/top.css'),
        stylesheet('../styles/layouts/default/shell.css')
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
