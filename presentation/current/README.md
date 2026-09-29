# Current Presentation

Current Viewer is rebuilt directly from the published HTML Boundary JSON.

## Status

Technical validation is **CLOSED**. Primary pages, graph drill-down, Plan ↔ ConcretePlan navigation, explicit Map Artifact rendering, and Viewer-wide Presentation Preset composition are implemented.

Current work is now **architecture stabilization + presentation convergence**, not another feasibility phase.

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

Shared renderer components are transient DOM helpers, not a new ViewModel layer. They may render already-resolved semantic input but must not fetch entities, inspect relations, infer Domain meaning, or choose the active Preset.

## Presentation Preset system

Current has one Viewer-wide Presentation Preset selection.

```text
config.js
  presentationPreset: 'default'
          ↓
presentation/registry.js
          ↓
active preset
  ├─ Theme
  ├─ Pattern Set
  └─ Layout Set
          ↓
TOP / Spot / Route / Plan / ConcretePlan
```

An explicitly unknown preset is an error; it does not silently fall back to `default`.
Theme / Pattern Set / Layout Set are independently reusable resources.

Default:

```text
theme      = default
patternSet = default
layoutSet  = default
```

### Ownership

```text
Foundation
→ preset-independent atomic scales only

Theme
→ color / typography / radius / shadow / surface roles

Pattern Set
→ reusable visual grammar / component treatment / component density

Layout Set
→ page measure / composition / placement / responsive reflow

Primitive
→ generic HTML / control baseline shared by presets
```

Do not move `page measure / control density / component gap / motion personality` into Foundation merely because Default currently shares a value. Those are allowed to differ materially between future presets.

CSS layer order is fixed:

```text
tokens → theme → primitives → patterns → layout → overrides
```

Current-authored CSS should belong to an explicit layer. Unlayered CSS is not the normal override mechanism.

## Default preset convergence

Technical-validation CSS still contains migration debt. Convergence classifies it into the formal ownership model instead of treating page CSS as a hidden second Theme.

The next reusable extraction boundary is not “all similar CSS”. It is:

```text
repeated semantic DOM grammar
→ shared renderer component, only when real repetition exists

same grammar visual treatment
→ Pattern

page placement / measure / reflow
→ Layout

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
1. architecture/documentation stabilization
2. Default Presentation convergence
3. shared semantic presentation grammar extraction where repetition proves it
4. Map modernization / interaction finalization
5. accessibility finishing
6. additional Preset such as design2 using Modern / Legacy as evidence
7. minimum usable Current review
8. explicit root promotion: modern → current
```
