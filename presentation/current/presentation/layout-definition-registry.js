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

const COMMON_PAGE_LAYOUT_V1 = Object.freeze({
  id: 'leisure-common-page-v1',
  frame: Object.freeze({
    shell: 'viewer-shell',
    contentSlot: 'content'
  }),
  regions: Object.freeze([
    Object.freeze({ id: 'global-navigation', owner: 'app-shell', optional: true }),
    Object.freeze({ id: 'context-navigation', owner: 'app-shell', optional: true }),
    Object.freeze({ id: 'page-title', owner: 'content-layout' }),
    Object.freeze({ id: 'content', owner: 'content-layout' })
  ])
});

const SEMANTIC_BASELINE_PAGE_V1 = Object.freeze({
  id: 'semantic-baseline-page-v1',
  commonPage: COMMON_PAGE_LAYOUT_V1,
  contentLayouts: Object.freeze({
    top: Object.freeze({ id: 'top-baseline', blocks: Object.freeze([]) }),
    spot: Object.freeze({ id: 'spot-baseline', blocks: Object.freeze([]) }),
    route: Object.freeze({ id: 'route-baseline', blocks: Object.freeze([]) }),
    plan: Object.freeze({ id: 'plan-baseline', blocks: Object.freeze([]) }),
    concrete_plan: Object.freeze({ id: 'concrete-plan-baseline', blocks: Object.freeze([]) })
  })
});

const LEISURE_PAGE_LAYOUT_V1 = Object.freeze({
  id: 'leisure-page-layout-v1',
  commonPage: COMMON_PAGE_LAYOUT_V1,
  contentLayouts: Object.freeze({
    top: Object.freeze({
      id: 'top-content-v1',
      blocks: Object.freeze([
        Object.freeze({
          id: 'orientation',
          sourceSelector: ':scope > .top-hero',
          view: VIEW.STACK
        }),
        Object.freeze({
          id: 'explorer-controls',
          sourceSelector: ':scope > .top-explorer-layout > .top-filter-panel',
          view: VIEW.STACK
        }),
        Object.freeze({
          id: 'results',
          sourceSelector: ':scope > .top-explorer-layout > .top-results-panel',
          view: VIEW.GRID
        })
      ])
    }),
    spot: Object.freeze({
      id: 'spot-content-v1',
      blocks: Object.freeze([
        Object.freeze({
          id: 'hero',
          sourceSelector: ':scope > .spot-hero',
          view: VIEW.SPLIT,
          slots: Object.freeze({
            primary: Object.freeze(['spot-hero-copy']),
            secondary: Object.freeze(['image-carousel'])
          }),
          narrowView: VIEW.STACK
        }),
        Object.freeze({
          id: 'appeal-review',
          sourceSemantic: 'appeal',
          view: VIEW.STACK
        }),
        Object.freeze({
          id: 'supporting-information',
          view: VIEW.GRID,
          semantics: Object.freeze(['facilities', 'references'])
        }),
        Object.freeze({
          id: 'related-spots',
          sourceSemantic: 'related-spots',
          view: VIEW.GRID
        })
      ])
    }),
    route: Object.freeze({
      id: 'route-content-v1',
      blocks: Object.freeze([
        Object.freeze({
          id: 'identity',
          sourceSelector: ':scope > .route-hero',
          view: VIEW.STACK
        }),
        Object.freeze({
          id: 'appeal',
          sourceSemantic: 'appeal',
          view: VIEW.STACK
        }),
        Object.freeze({
          id: 'route-workspace',
          view: VIEW.SPLIT,
          slots: Object.freeze({
            primary: Object.freeze(['conceptual-map']),
            secondary: Object.freeze(['sequence'])
          }),
          narrowView: VIEW.STACK
        }),
        Object.freeze({
          id: 'supporting-conditions',
          sourceSemantic: 'constraints',
          view: VIEW.STACK,
          optional: true
        })
      ])
    }),
    plan: Object.freeze({
      id: 'plan-content-v1',
      blocks: Object.freeze([
        Object.freeze({ id: 'identity', view: VIEW.STACK }),
        Object.freeze({ id: 'day-reorder', view: VIEW.STACK, optional: true }),
        Object.freeze({
          id: 'days',
          view: VIEW.DISCLOSURE,
          day: Object.freeze({
            context: VIEW.STACK,
            sequence: VIEW.ORDERED_FLOW,
            routeDetail: Object.freeze({
              id: 'route-detail',
              view: VIEW.DISCLOSURE,
              sourceSemantic: 'route-occurrence',
              detailSemantic: 'selected-route-detail',
              defaultOpen: false
            })
          })
        })
      ])
    }),
    concrete_plan: Object.freeze({
      id: 'concrete-plan-content-v1',
      blocks: Object.freeze([
        Object.freeze({ id: 'execution-overview', view: VIEW.STACK }),
        Object.freeze({ id: 'decision-summary', view: VIEW.STACK }),
        Object.freeze({ id: 'day-reorder', view: VIEW.STACK, optional: true }),
        Object.freeze({
          id: 'execution-days',
          view: VIEW.DISCLOSURE,
          day: Object.freeze({
            context: VIEW.STACK,
            executionPackages: Object.freeze({
              id: 'execution-package-selector',
              view: VIEW.CONTENT_SWITCHER,
              sourceSemantic: 'execution-packages',
              packageSemantic: 'execution-package',
              defaultPackage: 'baseline',
              baselineLabel: '標準',
              variantLabelPrefix: '代替案'
            }),
            workspace: Object.freeze({
              id: 'day-workspace',
              view: VIEW.CONTENT_SWITCHER,
              defaultView: 'actions',
              singleViewMode: 'direct',
              views: Object.freeze([
                Object.freeze({
                  id: 'actions',
                  label: '行動順',
                  sourceSemantic: 'execution-sequence',
                  view: VIEW.TIMELINE,
                  mode: 'overview',
                  required: true
                }),
                Object.freeze({
                  id: 'route',
                  label: 'ルート詳細',
                  sourceSemantic: 'execution-sequence',
                  availabilitySemantic: 'route-execution-group',
                  view: VIEW.TIMELINE,
                  mode: 'route-detail',
                  optional: true
                }),
                Object.freeze({
                  id: 'map',
                  label: 'マップ',
                  sourceSemantic: 'map',
                  view: VIEW.MAP,
                  mode: 'map',
                  optional: true
                })
              ])
            }),
            supporting: Object.freeze({
              view: VIEW.STACK,
              semantics: Object.freeze(['fuel-suggestions'])
            })
          })
        }),
        Object.freeze({ id: 'fuel', view: VIEW.STRUCTURED_LIST, optional: true }),
        Object.freeze({ id: 'cost', view: VIEW.STRUCTURED_LIST, optional: true })
      ])
    })
  })
});

export const PAGE_LAYOUT_DEFINITIONS = Object.freeze({
  [SEMANTIC_BASELINE_PAGE_V1.id]: SEMANTIC_BASELINE_PAGE_V1,
  [LEISURE_PAGE_LAYOUT_V1.id]: LEISURE_PAGE_LAYOUT_V1
});

export function resolvePageLayoutDefinition(id) {
  const key = String(id || '').trim();
  if (!key) throw new Error('Page Layout Definition id must not be empty.');
  const definition = PAGE_LAYOUT_DEFINITIONS[key];
  if (!definition) throw new Error(`Unknown Page Layout Definition: ${key}`);
  return definition;
}

export { VIEW as LAYOUT_VIEW_GRAMMAR };
