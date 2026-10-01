# Smart Presentation Design Brief

Status: implementation-in-progress
Scope: Current Viewer Presentation only
Preset id: `smart`

## Current implementation status

Smart is the active Current Viewer product presentation on `main`. The current review branch `work/page-layout-route-grouping` is refining the product skeleton without changing Canonical or Public Boundary semantics.

Current composition:

```text
smart
├─ pageLayoutDefinition = leisure-page-layout-v1
├─ theme                = smart
├─ patternSet           = smart
└─ layoutSet            = smart
```

The Smart Pattern and Layout sets intentionally reuse proven Default baseline resources where the implementation is explicitly identical. This is registry composition, not runtime fallback.

Implemented so far:

- Smart Theme with product color / typography / surface / radius / shadow roles
- distinct page surface vs component surface roles
- Smart product Pattern treatment across navigation, entity surfaces, Day, route, timeline, Weather / Fuel attention, and controls
- Smart Layout CSS for page measure, readable content width, and responsive spacing
- deterministic Page Layout Definition between Semantic DOM and visual implementation
- ConcretePlan Day Workspace with `行動順 / ルート詳細 / マップ`
- explicit Route Action ranges represented as semantic Route Execution Groups

## Purpose

`smart` is the primary product-grade presentation for the Current Leisure Viewer.

It is not a restoration of Legacy and it is not Modern v2.

It combines:

- Current: authoritative Semantic DOM and meaning structure
- Legacy: proven travel-oriented visual scanability
- Modern: cleaner component treatment, responsive behavior, and interaction evidence

Legacy and Modern are visual / behavioral evidence only. They are not implementation authorities and their DOM, runtime, schema assumptions, or compatibility mechanisms must not be copied into Current.

## Product definition

Smart presents information-dense travel plans so that the user can understand, at a glance:

1. where they are in the trip,
2. what happens next,
3. when it happens,
4. what matters operationally,
5. what needs attention or action.

Design keywords:

`clean / structured / compact / visual / calm / actionable`

Smart should feel like a travel product, not a rendered document and not an administration dashboard.

## Product layout model

The product skeleton is not inferred by CSS or runtime heuristics.

```text
Semantic DOM
    ↓
Page Layout Definition
├─ Common Page Layout
└─ Content Layout Definition
   └─ Block Definitions
    ↓
Smart implementation
├─ Theme
├─ Pattern Set
├─ Layout Set / CSS
└─ Interaction
```

`Page Layout Definition` owns how semantic meaning is grouped and composed for a user. CSS `Layout Set` owns concrete spatial implementation. They are intentionally distinct.

## Design principles

### 1. Journey-first hierarchy

The trip flow is the primary reading axis.

Day, time, place, movement, action, Route execution, and next-step relationships must be visually stronger than explanatory metadata.

For execution pages, the user should be able to scan the day without reading every sentence or every Route-internal checkpoint.

### 2. High information density without visual noise

Use compact grouping, clear typographic hierarchy, and stable spacing instead of large empty areas or repeated borders.

Secondary facts remain available but do not compete with the primary journey flow.

### 3. Block strength follows meaning

Do not equate every semantic node with a raised card.

Use a small set of surface strengths:

- page canvas
- ordinary section / row
- independent or interactive Block
- attention Block

Nested card-on-card composition is exceptional, not the default.

### 4. Semantic color discipline

Color is reserved for meaning and state.

Examples:

- primary journey / navigation accent
- movement / route distinction
- positive / resolved state
- warning / attention state
- weather or contextual status where useful

Do not color every block or semantic type merely to make the screen more vivid.

### 5. Execution overview and Route detail have different density

ConcretePlan uses the same semantic execution structure at different display densities.

```text
行動順
→ normal Action sequence
→ Route internal Action range becomes one abstract Route Block

ルート詳細
→ the same Route Block expands
→ Route-internal Actions are visible

マップ
→ explicit Map Artifact
```

Route internal Actions are not duplicated into another persistent model.

### 6. Progressive disclosure for deep information

The first view exposes what is needed to understand the day or entity.

Supporting facts, constraints, Route internals, weather detail, Todo detail, and supplemental explanation remain easy to reach without making the default view excessively long.

### 7. Maps and imagery are contextual anchors

Maps and images should be visually significant when they improve orientation or destination understanding.

They are not decoration and should not displace the journey hierarchy.

Route / ConcretePlan maps and Spot imagery should feel integrated into the same product language.

### 8. Actions must look actionable

Links, selectors, map actions, Route choices, disclosure controls, view switchers, and navigation must be visually distinguishable from passive facts.

The user should not need to infer whether text is clickable.

### 9. Mobile reflow must preserve meaning

Mobile is not a reduced semantic version.

The same hierarchy survives narrow layouts by reflowing columns, reducing secondary density, and preserving journey continuity.

### 10. Presentation ownership must reach 100%

Smart completion includes full owner-correct separation.

- Semantic Renderer owns Semantic Structure.
- Page Layout Definition owns Common Page / Content Layout / Block composition and information density.
- Theme owns color, typography roles, radius, shadow, surface values.
- Pattern owns reusable visual grammar and component treatment.
- Layout Set / CSS owns concrete measure, placement, grid / flex composition, and responsive reflow.
- Primitive owns generic HTML / control presentation.
- Foundation owns only preset-independent atomic scales.
- Interaction owns local behavior and accessibility interaction state.

A Smart implementation is incomplete while responsibilities remain under the wrong owner merely because they existed in older page-local code.

## Evidence to retain from Legacy

Retain as design evidence, not code:

- strong Day identity
- vertical journey / flow scanability
- clear distinction between movement, route, place, and activity
- compact fact blocks
- large integrated map surface
- travel-oriented, destination-facing feel

Do not retain:

- Legacy DOM structure
- Legacy runtime or self-bootstrap behavior
- MutationObserver / sidecar merge patterns
- old schema or publication assumptions
- entity-specific compatibility logic

## Evidence to retain from Modern

Retain as design evidence, not authority:

- restrained reusable surfaces
- responsive fact grids
- collapsible sections
- clear focus / hover states
- cleaner spacing and typography hierarchy
- map popup and mobile interaction evidence

Do not copy Modern components mechanically when Current Semantic DOM already expresses the correct meaning.

## Current baseline relationship

`default` remains the semantic / structural baseline presentation.

`smart` is the primary product presentation.

Both consume the same Current Public Boundary and Domain semantics. The active Page Layout Definition may compose the Semantic DOM for presentation without creating new Domain facts or persistent ViewModels.

## Acceptance criteria

Smart is complete only when all of the following are true:

1. `config.js` can switch the whole Viewer with only `presentationPreset: 'smart'`.
2. TOP / Spot / Route / Plan / ConcretePlan all use the same Smart preset.
3. Runtime display composition is resolved from an explicit Page Layout Definition, not prose inference.
4. Semantic Renderer contains no Smart/Theme-specific branching.
5. Page Layout Definition creates no new Domain fact and uses only explicit semantic roles / relations.
6. Theme contains no page / Domain selectors.
7. Layout CSS contains no skin ownership such as design-specific color, font family, radius, or shadow values.
8. Pattern does not own page-level measure or global spatial composition.
9. Foundation contains no Smart- or Default-specific design decisions.
10. No Default-specific visual behavior leaks into Smart unintentionally, and vice versa.
11. Desktop and mobile preserve the same semantic hierarchy.
12. The primary journey can be scanned without reading Route-internal Actions or all supporting prose.
13. Major controls are visibly actionable and keyboard / focus behavior remains coherent.
14. No Legacy / Modern runtime or DOM dependency is introduced.

## Current implementation order

1. Validate Page Layout Definition with ConcretePlan as the reference page.
2. Converge Plan / Route / Spot Content Layouts and Block definitions.
3. Finish Smart Pattern / Layout implementation against the accepted skeleton.
4. Complete ownership audit to 100%.
5. Weather and Map rich presentation finishing.
6. Carousel / lightbox / keyboard / focus / touch finishing.
7. Final product review and, only after explicit approval, root promotion.

## Non-goals

- changing Canonical or Public Boundary merely to fit a visual style
- inventing Domain meaning in Page Layout or CSS
- creating a generic component for every visually similar block
- copying Legacy or Modern implementation structure
- adding a UI framework only for styling convenience
