# Current Presentation

Current Viewer is rebuilt directly from the published HTML Boundary JSON.

## Current development slice

The first vertical slice is deliberately narrow:

```text
?type=concrete_plan&id=CP001
  → manifest.json
  → ConcretePlan Public JSON
  → source Plan / explicit Route refs
  → explicit Spot / TravelPoint labels
  → explicit Map Artifacts
  → semantic DOM
```

The Current entry defaults to `concrete_plan / CP001` while this slice is under development. Root production routing still points to `presentation/modern/`.

## Runtime principles

- start from `/manifest.json`, `/data/**`, and `/maps/**`
- resolve PublicEntityRef through Manifest; never infer paths from IDs
- fetch only explicit referenced entities/artifacts
- cache same-runtime JSON loads and entity loads
- render semantic DOM before design work
- do not create a persistent intermediate ViewModel / derived JSON layer
- do not depend on `../modern/` or `../legacy/`

## Presentation separation

```text
styles/tokens.css             design tokens only
styles/base.css               document-level baseline
styles/semantic.css           semantic component readability
styles/layouts/timeline.css   timeline composition
styles/layouts/grid.css       grid/table-like composition
ui/layout-mode.js             presentation-only layout selection
```

The same ConcretePlan semantic DOM is used for both layout modes. `?layout=grid` selects the grid composition; timeline is the default. The layout switcher only changes `html[data-layout]` and URL state. It does not rebuild or reinterpret Boundary data.

Layout CSS may reposition semantic blocks, but source DOM order remains the reading/focus order. On narrow containers the grid layout collapses back to normal block flow.

No generic UI/component library is introduced yet. Native controls remain sufficient for the current slice; a library should be added only where concrete interaction or rendering boilerplate justifies the dependency.
