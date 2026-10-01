# Current Presentation

Current Viewer is rebuilt directly from the published HTML Boundary JSON.

## Status

Technical validation is **CLOSED**. Primary pages, graph drill-down, Plan ↔ ConcretePlan navigation, explicit Map Artifact rendering, and Viewer-wide Presentation Preset composition are implemented.

Current work is now **Page Layout Definition + product presentation convergence**, not another feasibility phase.

Root production routing still points to `presentation/modern/` until the Current promotion gate is explicitly closed.

## Implemented surfaces

```text
(no query)
  → manifest.json Explorer facet
  → TOP search / type / area / category filtering
  → Spot / Route / Plan navigation

?type=spot&id=S0014
  → Spot Public JSON
  → explicit related Spot refs
  → image carousel

?type=route&id=R011
  → Route Public JSON
  → explicit Spot refs
  → explicit Conceptual Map Artifact

?type=plan&id=P001
  → Plan Public JSON
  → explicit Spot / TravelPoint refs
  → explicit Route fetch / drill-down
  → ConcretePlan reverse relation from Manifest when published

?type=concrete_plan&id=CP001
  → ConcretePlan Public JSON
  → source Plan / explicit Route refs
  → explicit Spot / TravelPoint refs
  → explicit Execution Road Map Artifact
```

Main graph path:

```text
TOP → Plan → Route → Spot
      ↕
 ConcretePlan
```

## Runtime principles

- start from `/manifest.json`, `/data/**`, and `/maps/**`
- resolve `PublicEntityRef` through Manifest; never infer paths from IDs
- fetch only explicit referenced entities/artifacts
- cache same-runtime JSON/entity loads
- render semantic DOM; do not persist an intermediate ViewModel / derived JSON layer
- apply an explicit Page Layout Definition after Semantic DOM creation; do not infer display structure from prose
- do not depend on `../modern/` or `../legacy/`
- render Map Artifact coordinates/geometry directly; never call Places or Routes from Viewer
- do not repair missing Domain semantics in presentation code

## Current structure

```text
presentation/current/
├─ core/**
│  └─ runtime resolution / routing / navigation context
├─ render/**
│  ├─ Page semantic assembly
│  └─ components/**?            # only after real cross-page grammar appears
├─ structure/**
│  └─ Viewer-level shell structure
├─ presentation/**
│  ├─ registry.js
│  ├─ layout-definition-registry.js
│  ├─ apply-layout-definition.js
│  └─ bootstrap.js
├─ interaction/**
│  └─ local UI behavior
├─ map/**
│  └─ explicit Map Artifact presentation adapter
└─ styles/
   ├─ foundation/**
   ├─ themes/<theme-id>.css
   ├─ primitives/**
   ├─ patterns/<pattern-set-id>/**
   └─ layouts/<layout-set-id>/**
```

Shared renderer components are transient DOM helpers, not a new ViewModel layer. They may render already-resolved semantic input but must not fetch arbitrary entities, inspect unrelated relations, infer Domain meaning, or choose the active Preset.

## Page Layout Definition

`PAGE_LAYOUT_DEFINITION.md` defines the deterministic layer between Semantic DOM and concrete visual implementation.

```text
Semantic DOM
    ↓
Page Layout Definition
├─ Common Page Layout
└─ Content Layout Definition
   └─ Block Definitions
    ↓
Presentation Implementation
├─ Theme
├─ Pattern Set
├─ Layout Set / CSS
└─ Interaction
```

### Common Page Layout

Defines the Viewer-wide page frame and common slots, such as App / navigation shell, title area, and content area.

### Content Layout Definition

Defines the content area per surface (`top`, `spot`, `route`, `plan`, `concrete_plan`). It determines Block grouping, order, information density, view grammar, responsive reflow, and local presentation interaction using explicit semantic roles only.

### Block Definition

Binds known Semantic DOM roles into user-facing presentation units. Block membership is not inferred from prose or visual similarity.

ConcretePlan is the first reference implementation: an explicit Route Action range becomes one `route-execution-group` in Semantic DOM; `行動順` shows that group abstractly while `ルート詳細` expands the same group and shows its internal Actions.

## Presentation Preset system

Current has one Viewer-wide Presentation Preset selection.

```text
config.js
  presentationPreset: 'default'
          ↓
presentation/registry.js
          ↓
active preset
  ├─ Page Layout Definition
  ├─ Theme
  ├─ Pattern Set
  └─ Layout Set
          ↓
TOP / Spot / Route / Plan / ConcretePlan
```

An explicitly unknown preset or Page Layout Definition is an error; neither silently falls back to another definition.
Theme / Pattern Set / Layout Set are independently reusable implementation resources.

Default:

```text
pageLayoutDefinition = semantic-baseline-page-v1
theme                = default
patternSet           = default
layoutSet            = default
```

Smart:

```text
pageLayoutDefinition = leisure-page-layout-v1
theme                = smart
patternSet           = smart
layoutSet            = smart
```

### Ownership

```text
Page Layout Definition
→ common page frame + surface Content Layout + Block composition + information density / view grammar

Foundation
→ preset-independent atomic scales only

Theme
→ color / typography / radius / shadow / surface roles

Pattern Set
→ reusable visual grammar / component treatment / component density

Layout Set
→ concrete CSS measure / placement / grid / flex / responsive reflow

Primitive
→ generic HTML / control baseline shared by presets

Interaction
→ local UI state and accessible behavior declared by the layout
```

`Page Layout Definition` and CSS `Layout Set` are intentionally different: the former defines how meaning is composed for a page; the latter implements spatial styling.

Do not move `page measure / control density / component gap / motion personality` into Foundation merely because Default currently shares a value. Those are allowed to differ materially between future presets.

CSS layer order is fixed:

```text
tokens → theme → primitives → patterns → layout → overrides
```

Current-authored CSS should belong to an explicit layer. Unlayered CSS is not the normal override mechanism.

## Default preset convergence

Current Default mapping includes:

```text
styles/foundation/tokens.css           atomic shared scale
styles/themes/default.css              Default Theme roles
styles/primitives/document.css         shared document baseline
styles/patterns/default/content.css    Default component/content grammar + density roles
styles/patterns/default/map.css        Default Map pattern
styles/patterns/default/carousel.css   Default Carousel pattern
styles/layouts/default/settings.css    Default page/detail/explorer measures
styles/layouts/default/*.css           Default spatial compositions / reflow
```

Technical-validation CSS still contains migration debt. Convergence classifies it into the formal ownership model instead of treating page CSS as a hidden second Theme.

The next reusable extraction boundary is not “all similar CSS”. It is:

```text
repeated semantic DOM grammar
→ shared renderer component, only when real repetition exists

same user-facing semantic grouping
→ Block Definition

same grammar visual treatment
→ Pattern

page placement / measure / reflow
→ Layout Set / CSS

skin role
→ Theme
```

Avoid speculative generic components and speculative tokens.

## Navigation

Current navigation separates:

```text
Global navigation
→ Leisure TOP

Context navigation
→ actual previous Entity in the current browsing path

Domain relation navigation
→ explicit PublicEntityRef / Manifest relation
```

No fixed breadcrumb hierarchy is treated as Domain truth.
TravelPoint and route-local targets remain inline because they do not have independent detail pages.

## Map direction

Current consumes only explicit Map Artifacts.

```text
Route Conceptual Map
→ ordered points
→ no Viewer-inferred road geometry

ConcretePlan Execution Map
→ ordered points
→ ordered segments[].path
→ no geometry-to-segment reconstruction
```

The current Google Maps marker / `InfoWindow` implementation is a technical-validation implementation, not the final Current presentation requirement.
Before Current promotion, close one Map modernization scope covering:

```text
current Google Maps marker API
marker accessibility
popup composition
mobile behavior
Execution segment presentation
```

Modern / `_prototype/poc/**` are evidence only. Do not import their data path or fetch convention.

## Accessibility / interaction

Native semantic HTML and small adapters remain the default. Add a third-party component library only when a concrete interaction/accessibility cost justifies the dependency.

Before Current promotion, finish at least:
- content-switcher semantics / keyboard / focus behavior
- carousel semantics / keyboard / focus behavior
- touch/responsive behavior
- Map marker/popup accessibility
- source DOM reading/focus order across responsive layouts

## Development contract

See `DEVELOPMENT.md` for code/comment/CSS ownership rules.
See `styles/README.md` for style-boundary details.
Repository-level physical architecture is in `../../VIEWER_ARCHITECTURE.md`.

## Next phase

```text
1. validate Page Layout Definition with ConcretePlan reference implementation
2. converge Plan / Route / Spot Content Layouts and Blocks
3. finish Smart implementation against the accepted layout skeleton
4. Map / Weather rich presentation finishing
5. accessibility / carousel / interaction finishing
6. cross-surface minimum usable Current review
7. explicit root promotion: modern → current
```
