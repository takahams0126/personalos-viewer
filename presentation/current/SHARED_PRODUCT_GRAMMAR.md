# Shared Product Grammar

Status: active implementation guidance
Scope: Current Leisure Viewer / Smart
Updated: 2026-10-03

## Purpose

Product UI Foundationをpage-local fixesではなくshared semantic grammarとして適用する。

Every change answers two questions:

1. Which shared grammar owns this presentation decision?
2. Does the result move the whole Product toward the completed state rather than merely hide one symptom?

No `convergence-N.css`, review patch, or page-local override layer is allowed.

## Navigation

- Product catalog: Explorer / Plans / Routes / Spots.
- Spot / Route / Plan detail keeps the corresponding catalog item current.
- ConcretePlan is Execution context and does not invent a fourth discovery catalog.
- Source-context back navigation remains separate from catalog navigation.

## Journey

Plan and ConcretePlan share the reading order:

```text
context / time → main journey → move → support
```

Plan remains conceptual and ConcretePlan remains actual-world execution. The visual grammar is shared; the Domain semantics are not flattened.

Normal journey rows are not Cards. Explicit Route groups, hard boundaries, and material attention may receive stronger treatment.

Plan Route occurrence does not duplicate Route summary / full stop sequence. Route detail remains the Route page owner's responsibility.

### Execution Timeline

ConcretePlan execution is event-centered rather than card-centered.

```text
time  event
      │
      ├─ movement connector
      │
time  next event
```

- Action is the Event anchor.
- `next_move` is a Connector to the next Event, not an independent content card.
- Destination text is not repeated when the following Event already names the destination.
- Existing `travel_point.point_type` and `next_move.transport.code` may drive local semantic icons. Text remains authoritative.
- Todo / facility / stay / purpose / inclusion are compact supporting facts and must not dominate Event / Move / Constraint.
- Route occurrence is one compact Journey event in Actions view; full Route internals belong to Route detail view.

Operational timing is attached to the decision point:

```text
Event
  latest_safe / hard_limit / target?
Connector
  next service / connection margin / connection state
```

Viewer never derives new timetable times, safe-line times, margins, or margin-state thresholds. It renders published values only. State is communicated with label + value + visual emphasis, never color alone.

Route-internal Actions remain collapsed in Actions view except explicit operational-boundary Events that carry published time constraints.

## Primary Day Navigation

ConcretePlan is a one-day-at-a-time Execution Workspace.

```text
Trip context
→ Primary Day Navigator
→ Selected Day Workspace
```

Primary Day Navigator owns the only Day selection on ConcretePlan.

A Day tab may show only already-published or directly-presented facts:

```text
Day number
Date / weekday
Headline Weather?
Day title
Material time-constraint presence?
```

- Selecting a Day switches the complete Day context: Weather / Execution Package / Journey / Route detail / Map / Day support.
- Day selection is local presentation state and is never persisted as Canonical truth.
- Weather may decorate Day tabs but never owns or duplicates Day selection.
- Desktop and Mobile use the same Day navigation model. Mobile may horizontally scroll the Day rail; it does not fall back to vertically stacking every Day.
- Plan keeps its whole-trip multi-Day overview; Primary Day Navigation is ConcretePlan-specific because its purpose is execution rather than conceptual overview.

## Map

Route Map and ordered sequence are one workspace.

```text
sequence preview/select
↕
map point preview/select
```

Selection uses explicit artifact/sequence order only. Geometry never creates order or Domain meaning.
Route sequence is a compact journey index, not a collection of independent Cards. Normal rows are visually quiet; active/selected state is emphasized through the shared Map selection state.

ConcretePlan segment color uses explicit execution leg identity. Successful Maps rendering suppresses duplicated fallback lists.

ConcretePlan Timeline ↔ Map selection is added only when an explicit stable binding exists. Entity-title or geometry similarity is not sufficient to infer that relation.

## Weather

ConcretePlan Weather belongs to the selected Day, not to an independent trip-level Day selector.

```text
Primary Day Navigator
→ selected Day headline Weather
→ 3-hour icon timeline
→ one disclosure reveals temperature / precipitation / wind metrics
```

Meteocons are local Viewer assets. Runtime CDN dependency is not part of the Weather grammar.

The selected Day's hourly view may use only already-published Weather periods and Action time labels. The Viewer does not forecast, aggregate, or evaluate Weather.

Weather unavailable on one Day must not break Day Navigation. Day Navigation is the owner; Weather is optional decoration/content.

## Entity / Fact

- Entity links may be Cards when the entity itself is the navigation target.
- Metadata is inline.
- Comparable facts are rows/grids.
- Information volume grows naturally; the Viewer does not score content into arbitrary compact/standard/expanded classes.
- Route hero Spot references are compact context, not duplicate Spot cards.
- Fuel / Cost and other dense comparable support use structured rows/table-like presentation rather than Card collections.

## Media

Carousel and Lightbox controls use local inline SVG geometry, not external SVG assets or font glyph alignment. Keyboard navigation and focus return remain required.

## Control / Disclosure

Controls are intentionally weaker than Product content, except the Primary Day Navigator which establishes the current execution context.

```text
Primary Day Navigator
→ choose which execution Day is current

Tab / Switch rail
→ switch peer content panels at the same hierarchy

Select
→ choose an assignment/value from alternatives

Disclosure
→ reveal secondary detail without changing peer context

Link
→ navigate to another Entity
```

ConcretePlan switch hierarchy:

```text
Primary Day Navigator
→ Day 1 / Day 2 / ...

Execution Package
→ baseline / explicit Variant

Day Workspace
→ 行動順 / ルート詳細 / マップ
```

The visual language is related, while hierarchy and Domain meaning stay distinct.

Viewer-level whole-Day schedule adjustment is not part of the Current Product. Plan displays Canonical Day order; ConcretePlan displays fixed execution Day order. Reordering semantics in upstream data do not create a Viewer control by themselves.

Controls preserve native semantics (`button`, `select`, `details`, ARIA tabs where appropriate), keyboard access, focus visibility, and active state.

## Surface bindings

Shared grammarをPageへ適用する最終composition:

### TOP

```text
orientation
controls 3 | results 9
```

### Spot

```text
identity 5 | media 7
practical information in the identity rail
appeal/review after the complete hero workspace
facilities?
related spots
```

Desktop Media does not overlap later content. Mobile priority remains Media → Identity → Practical information.

### Route

```text
identity
appeal lead
journey index 4 | map 8
constraints?
```

### Plan

```text
identity
composition context
conceptual multi-Day journey
```

### ConcretePlan

```text
execution overview
primary Day navigator
selected Day
  context | 3-hour Weather
  execution package?
  event timeline / route detail / map
trip support: fuel | cost
```

Surface-specific grouping / orderingはPage Layout Definitionが所有する。Shared grammar自体へPage固有例外を埋め込まない。

## Responsive priority

Spot mobile:

```text
Media
Identity
Practical information
```

Route mobile:

```text
Map
horizontal ordered-stop selector
```

ConcretePlan mobile:

```text
horizontal Primary Day Navigator
Selected Day context
3-hour Weather
Time + Event
Move connector
Operational constraint
Supporting facts
```

Operational constraints remain visible on Mobile. Secondary supporting facts may reflow below the Event. Switch rails may horizontally scroll when all peer choices cannot fit without shrinking labels below useful readability.

## Ownership

```text
patterns/smart/navigation.css  → navigation / relation navigation
patterns/smart/journey.css     → journey / Primary Day navigation / controls / switch rails
patterns/smart/map.css         → map / map-linked selection
patterns/smart/weather.css     → weather
patterns/smart/entity.css      → entity hierarchy / appeal / review
patterns/smart/fact.css        → facts / cost / fuel
patterns/smart/media.css       → carousel / lightbox / footer

layouts/smart/*.css            → spatial composition only
```

Page-specific composition ownership:

```text
PAGE_LAYOUT_DEFINITION.md
presentation/layout-definition-registry.js
presentation/apply-layout-definition.js
```

If a correction does not fit an owner, re-evaluate the root cause before adding a new file.
