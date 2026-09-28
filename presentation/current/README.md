# Current Presentation

Current Viewer is rebuilt directly from the published HTML Boundary JSON.

## Current development slices

Current technical validation now covers two Primary types:

```text
?type=concrete_plan&id=CP001
  → manifest.json
  → ConcretePlan Public JSON
  → source Plan / explicit Route refs
  → explicit Spot / TravelPoint labels
  → explicit Map Artifacts
  → semantic DOM

?type=plan&id=P001
  → manifest.json
  → Plan Public JSON
  → explicit Spot / TravelPoint labels
  → explicit Route Public Entity fetch
  → native Day disclosure
  → semantic DOM
```

The Current entry still defaults to `concrete_plan / CP001` while technical validation is in progress. Root production routing still points to `presentation/modern/`.

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
styles/layouts/timeline.css   ConcretePlan timeline composition
styles/layouts/grid.css       ConcretePlan grid/table-like composition
styles/layouts/plan.css       Plan conceptual sequence composition
ui/layout-mode.js             ConcretePlan presentation-only layout selection
```

ConcretePlan uses the same semantic DOM for timeline and grid modes. `?layout=grid` selects the grid composition; timeline is the default. The layout switcher only changes `html[data-layout]` and URL state. It does not rebuild or reinterpret Boundary data.

Plan intentionally uses native `<details>` for Day disclosure and keeps `place / movement / route` as explicit semantic sequence kinds. Route detail is loaded only through explicit `route_ref`.

Layout CSS may reposition semantic blocks, but source DOM order remains the reading/focus order. Responsive presentation must not reconstruct Domain meaning.

No generic UI/component library is introduced yet. Native controls remain sufficient for the current technical slices; a library should be added only where concrete interaction or rendering boilerplate justifies the dependency.
