# Smart Presentation Design Brief

Status: review-ready
Scope: Current Viewer Presentation only
Preset id: `smart`

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

## Design principles

### 1. Journey-first hierarchy

The trip flow is the primary reading axis.

Day, time, place, movement, action, and next-step relationships must be visually stronger than explanatory metadata.

For execution pages, the user should be able to scan the timeline without reading every sentence.

### 2. High information density without visual noise

Use compact grouping, clear typographic hierarchy, and stable spacing instead of large empty areas or repeated borders.

Secondary facts should remain available but should not compete with the primary journey flow.

### 3. Calm surfaces with explicit hierarchy

Use a small number of surface levels:

- page background
- primary section / Day surface
- nested action / fact surface
- attention surface

Borders and shadows should be subtle and communicate hierarchy, not decoration.

### 4. Semantic color discipline

Color is reserved for meaning and state.

Examples:

- primary journey / navigation accent
- movement / route distinction
- positive / resolved state
- warning / attention state
- weather or contextual status where useful

Do not color every card or semantic type merely to make the screen more vivid.

### 5. Timeline is the primary execution grammar

ConcretePlan execution must read as a continuous vertical journey with time, node, connector, body, and next movement clearly associated.

Legacy's strong scanability is useful evidence, but Smart must implement this through Current's existing Semantic DOM and Pattern / Layout layers.

### 6. Progressive disclosure for deep information

The first view should expose what is needed to understand the day or entity.

Details such as supporting facts, constraints, route internals, weather detail, Todo detail, and supplemental explanation should remain easy to reach without making the default view visually flat or excessively long.

### 7. Maps and imagery are contextual anchors

Maps and images should be visually significant when they improve orientation or destination understanding.

They are not decoration and should not displace the journey hierarchy.

Route / ConcretePlan maps and Spot imagery should feel integrated into the same product language.

### 8. Actions must look actionable

Links, selectors, map actions, route choices, disclosure controls, and navigation must be visually distinguishable from passive facts.

The user should not need to infer whether text is clickable.

### 9. Mobile reflow must preserve meaning

Mobile is not a reduced semantic version.

The same information hierarchy must survive narrow layouts by reflowing columns, collapsing secondary detail, and preserving timeline continuity.

### 10. Presentation ownership must reach 100%

Smart completion includes full owner-correct separation.

- Theme owns color, typography roles, radius, shadow, surface values.
- Pattern owns reusable presentation grammar and component treatment.
- Layout owns measure, placement, grid / flex composition, and responsive reflow.
- Primitive owns generic HTML / control presentation.
- Foundation owns only preset-independent atomic scales.
- Renderer owns Semantic Structure.
- Interaction owns behavior.

A Smart implementation is incomplete while visual declarations remain under the wrong owner merely because they existed in older page-local CSS.

## Evidence to retain from Legacy

Retain as design evidence, not code:

- strong Day-card identity
- vertical journey / flow scanability
- clear visual distinction between movement, route, place, and activity
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

- restrained reusable card surface
- responsive fact grids
- collapsible sections
- clear focus / hover states
- cleaner spacing and typography hierarchy
- map popup and mobile interaction evidence

Do not copy Modern components mechanically when Current Semantic DOM already expresses the correct grammar.

## Current baseline relationship

`default` remains the semantic / structural baseline presentation.

`smart` is the primary product presentation.

Both must consume the same Current Semantic DOM.

Expected registry composition:

```text
smart
├─ theme      = smart
├─ patternSet = smart
└─ layoutSet  = smart
```

Reuse of a Default resource is allowed only when it is intentionally presentation-neutral or explicitly demonstrated to be identical. It must not be used as silent fallback.

## Acceptance criteria

Smart is complete only when all of the following are true:

1. `config.js` can switch the whole Viewer with only `presentationPreset: 'smart'`.
2. TOP / Spot / Route / Plan / ConcretePlan all use the same Smart preset.
3. Semantic Renderer code contains no `smart`, Theme, or design-specific branching.
4. Smart and Default consume the same Semantic DOM and Public Boundary.
5. Theme contains no page / Domain selectors.
6. Layout contains no skin ownership such as design-specific color, font family, radius, or shadow values.
7. Pattern does not own page-level measure or global spatial composition.
8. Foundation contains no Smart- or Default-specific design decisions.
9. No Default-specific visual behavior leaks into Smart unintentionally, and vice versa.
10. Desktop and mobile both preserve the same semantic hierarchy.
11. The primary journey can be scanned without reading all supporting prose.
12. Major controls are visibly actionable and keyboard / focus behavior remains coherent.
13. No Legacy / Modern runtime or DOM dependency is introduced.

## Initial implementation order

1. Smart Theme: color / typography / surface / radius / shadow language.
2. Smart Pattern Set: section, fact, Day, flow, action, control, map, image presentation grammar.
3. Smart Layout Set: page measure, Day composition, timeline geometry, responsive reflow.
4. Cross-surface review: TOP → Plan → ConcretePlan → Route → Spot.
5. Ownership audit: move every discovered visual declaration to the correct owner until the 100% criteria are satisfied.
6. Interaction finishing: map popup, carousel / lightbox, keyboard / focus / touch.
7. Final product review and, only after explicit approval, active-preset / root promotion.

## Non-goals

- changing Canonical or Public Boundary
- changing the meaning or information order solely to fit a visual style
- creating a generic component for every visually similar block
- copying Legacy or Modern implementation structure
- adding a UI framework only for styling convenience
