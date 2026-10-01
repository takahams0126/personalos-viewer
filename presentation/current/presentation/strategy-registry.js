const VIEW = Object.freeze({
  STACK: 'stack',
  SPLIT: 'split',
  GRID: 'grid',
  STRUCTURED_LIST: 'structured-list',
  TIMELINE: 'timeline',
  ORDERED_FLOW: 'ordered-flow',
  CONTENT_SWITCHER: 'content-switcher',
  MAP: 'map',
  MEDIA: 'media',
  DISCLOSURE: 'disclosure'
});

const SEMANTIC_BASELINE_V1 = Object.freeze({
  id: 'semantic-baseline-v1',
  surfaces: Object.freeze({
    top: Object.freeze({ primary: VIEW.STACK }),
    spot: Object.freeze({ primary: VIEW.STACK }),
    route: Object.freeze({ primary: VIEW.STACK }),
    plan: Object.freeze({ primary: VIEW.STACK }),
    concrete_plan: Object.freeze({ primary: VIEW.STACK })
  })
});

const LEISURE_PRODUCT_V1 = Object.freeze({
  id: 'leisure-product-v1',
  surfaces: Object.freeze({
    top: Object.freeze({
      regions: Object.freeze([
        Object.freeze({ id: 'orientation', view: VIEW.STACK }),
        Object.freeze({ id: 'explorer-controls', view: VIEW.STACK }),
        Object.freeze({ id: 'results', view: VIEW.GRID })
      ])
    }),
    spot: Object.freeze({
      regions: Object.freeze([
        Object.freeze({
          id: 'hero',
          view: VIEW.SPLIT,
          slots: Object.freeze({
            primary: Object.freeze(['identity', 'summary', 'theme', 'decision-facts']),
            secondary: Object.freeze(['media'])
          }),
          narrowView: VIEW.STACK
        }),
        Object.freeze({ id: 'appeal-review', view: VIEW.STACK }),
        Object.freeze({ id: 'supporting-information', view: VIEW.STACK }),
        Object.freeze({ id: 'related-spots', view: VIEW.GRID })
      ])
    }),
    route: Object.freeze({
      regions: Object.freeze([
        Object.freeze({ id: 'identity', view: VIEW.STACK }),
        Object.freeze({ id: 'appeal', view: VIEW.STACK }),
        Object.freeze({
          id: 'route-workspace',
          view: VIEW.SPLIT,
          slots: Object.freeze({
            primary: Object.freeze(['map']),
            secondary: Object.freeze(['ordered-stops'])
          }),
          narrowView: VIEW.STACK
        }),
        Object.freeze({ id: 'supporting-conditions', view: VIEW.STACK, optional: true })
      ])
    }),
    plan: Object.freeze({
      regions: Object.freeze([
        Object.freeze({ id: 'identity', view: VIEW.STACK }),
        Object.freeze({ id: 'day-reorder', view: VIEW.STACK, optional: true }),
        Object.freeze({
          id: 'days',
          view: VIEW.DISCLOSURE,
          day: Object.freeze({
            context: VIEW.STACK,
            sequence: VIEW.ORDERED_FLOW,
            routeDetail: VIEW.DISCLOSURE
          })
        })
      ])
    }),
    concrete_plan: Object.freeze({
      regions: Object.freeze([
        Object.freeze({ id: 'execution-overview', view: VIEW.STACK }),
        Object.freeze({ id: 'decision-summary', view: VIEW.STACK }),
        Object.freeze({ id: 'day-reorder', view: VIEW.STACK, optional: true }),
        Object.freeze({
          id: 'execution-days',
          view: VIEW.DISCLOSURE,
          day: Object.freeze({
            context: VIEW.STACK,
            workspace: Object.freeze({
              view: VIEW.CONTENT_SWITCHER,
              defaultView: 'actions',
              views: Object.freeze([
                Object.freeze({ id: 'actions', label: '行動順', semantic: 'actions', view: VIEW.TIMELINE, required: true }),
                Object.freeze({ id: 'route', label: 'ルート詳細', semantic: 'route-relations', view: VIEW.STACK, optional: true }),
                Object.freeze({ id: 'map', label: 'マップ', semantic: 'map', view: VIEW.MAP, optional: true })
              ])
            }),
            supporting: VIEW.STACK
          })
        }),
        Object.freeze({ id: 'fuel', view: VIEW.STRUCTURED_LIST, optional: true }),
        Object.freeze({ id: 'cost', view: VIEW.STRUCTURED_LIST, optional: true })
      ])
    })
  })
});

export const PRESENTATION_STRATEGIES = Object.freeze({
  [SEMANTIC_BASELINE_V1.id]: SEMANTIC_BASELINE_V1,
  [LEISURE_PRODUCT_V1.id]: LEISURE_PRODUCT_V1
});

export function resolvePresentationStrategy(id) {
  const key = String(id || '').trim();
  if (!key) throw new Error('Presentation strategy id must not be empty.');
  const strategy = PRESENTATION_STRATEGIES[key];
  if (!strategy) throw new Error(`Unknown presentation strategy: ${key}`);
  return strategy;
}

export { VIEW as PRESENTATION_VIEW_STRATEGY };
