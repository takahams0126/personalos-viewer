# Current Presentation

Current Viewer is rebuilt directly from the published HTML Boundary JSON.

## Status

Technical validation is **CLOSED**. Normal implementation/design is in progress.

Implemented surfaces:

```text
(no query)
  → manifest.json Explorer facet
  → TOP search / type / area / category filtering
  → Spot / Route / Plan navigation

?type=spot&id=S0014
  → manifest.json
  → Spot Public JSON
  → explicit related Spot refs
  → image carousel
  → semantic DOM

?type=route&id=R011
  → manifest.json
  → Route Public JSON
  → explicit Spot refs
  → explicit Conceptual Map Artifact
  → Google Maps marker presentation
  → semantic DOM

?type=plan&id=P001
  → manifest.json
  → Plan Public JSON
  → explicit Spot / TravelPoint labels
  → explicit Route Public Entity fetch
  → native Day disclosure
  → semantic DOM

?type=concrete_plan&id=CP001
  → manifest.json
  → ConcretePlan Public JSON
  → source Plan / explicit Route refs
  → explicit Spot / TravelPoint labels
  → explicit Execution Road Map Artifact
  → Google Maps marker / polyline presentation
  → semantic DOM
```

The Current entry now opens TOP when no entity query is supplied. Root production routing still points to `presentation/modern/` until Current reaches the minimum usable surface and is explicitly promoted.

## Runtime principles

- start from `/manifest.json`, `/data/**`, and `/maps/**`
- resolve PublicEntityRef through Manifest; never infer paths from IDs
- fetch only explicit referenced entities/artifacts
- cache same-runtime JSON loads and entity loads
- render semantic DOM before design work
- do not create a persistent intermediate ViewModel / derived JSON layer
- do not depend on `../modern/` or `../legacy/`
- render Map Artifact coordinates/geometry directly; never call Places or Routes from Viewer

## Presentation separation

```text
styles/tokens.css             design tokens only
styles/base.css               document-level baseline
styles/semantic.css           semantic component readability
styles/layouts/timeline.css   ConcretePlan timeline composition
styles/layouts/grid.css       ConcretePlan grid/table-like composition
styles/layouts/plan.css       Plan conceptual sequence composition
styles/layouts/spot.css       Spot detail composition
styles/layouts/route.css      Route detail composition
styles/layouts/top.css        TOP Explorer composition
styles/components/map.css     generic Map surface sizing/readability
styles/components/carousel.css generic carousel presentation
ui/layout-mode.js             ConcretePlan presentation-only layout selection
ui/carousel.js                generic carousel interaction
ui/explorer.js                TOP local filtering interaction
map/google-map.js             Map Artifact → Google Maps presentation adapter
config.js                     deploy-time browser configuration binding
```

ConcretePlan uses the same semantic DOM for timeline and grid modes. `?layout=grid` selects the grid composition; timeline is the default. The layout switcher only changes `html[data-layout]` and URL state. It does not rebuild or reinterpret Boundary data.

Plan intentionally uses native `<details>` for Day disclosure and keeps `place / movement / route` as explicit semantic sequence kinds. Route detail is loaded only through explicit `route_ref`.

TOP consumes only the Manifest Explorer facet. ConcretePlan / TravelPoint remain Directory-only and are not promoted into the discovery catalog. Category options are built only from the currently selected Spot or Route explorer category set; switching entity type clears category state, and Plan disables category filtering.

Map hydration happens after semantic DOM insertion. Baseline maps load immediately; maps inside closed native disclosures wait until opened so Google Maps is not initialized in a hidden zero-size container. The adapter consumes only published `points[].position` and `segments[].path`; the Viewer does not perform geographic resolution.

Layout CSS may reposition semantic blocks, but source DOM order remains the reading/focus order. Responsive presentation must not reconstruct Domain meaning.

## Map interaction direction

Modern and `_prototype/poc/**` are **Evidence**, not Current implementation authority.

Current direction after technical validation:

```text
Adopt
- Map popup as Viewer presentation interaction
- Google Maps OverlayView-style custom popup is valid implementation evidence
- desktop anchored popup / mobile touch-friendly presentation
- popup content is presentation data assembled from explicit owner/boundary information

Re-evaluate during design
- segment color differentiation
- legend ↔ map segment hover/focus emphasis
- one-color vs multi-color route presentation

Do not carry forward
- Legacy map data paths
- geometry-to-waypoint re-segmentation used only by old PoC
- Modern/PoC-specific fetch conventions
```

Current Execution Road Map Artifact already owns ordered `segments[]`, so future segment styling must bind directly to those published segments instead of reconstructing segment identity from geometry.

The current `InfoWindow` in the validation slice is not a final popup design requirement. Final popup composition belongs to the normal implementation/design phase.

## Generic UI library policy

No generic UI/component library is required by the validated architecture.

Use native semantic HTML and small presentation adapters by default. Introduce a third-party interaction component only when a concrete Current interaction shows enough implementation/accessibility cost to justify the dependency. Library adoption must not change Domain meaning, Boundary shape, or semantic DOM ownership.

## Next phase

Primary Current pages are now implemented. Next work is cross-page presentation/design convergence:

```text
shared semantic presentation primitives
Map popup and map interaction design
cross-page responsive visual design / theme
minimum usable Current surface review
root default promotion: modern → current
```
