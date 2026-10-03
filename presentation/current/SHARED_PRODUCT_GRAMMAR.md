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

## Product visibility principle

Primary content is visible by default. Peer selection uses a content switcher / Tab. Disclosure is reserved for secondary detail.

Desktop unused space is not a reason to push primary decision information below the fold. When two concurrent primary roles fit the shared Product Grid, use horizontal composition rather than hiding one role or creating unnecessary vertical depth.

This principle does not mean "put everything in the hero". Secondary facilities, long notes, provenance, and optional detail remain subordinate.

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
Selected Route identity / family / variant that explains the Plan occurrence is Primary content and remains visible without an extra Disclosure action.

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

## Day / Primary Workspace Navigation

Plan and ConcretePlan share the peer-selection interaction grammar while preserving different Domain semantics.

```text
Plan
Trip design context
→ Primary Day Navigator
→ Selected conceptual Day

ConcretePlan
Trip execution context
→ compact itinerary overview
→ Primary Workspace [DAY1..DAYN | 給油 | 費用]
→ selected execution content
```

Plan Day tab:

```text
Day number
Day title
```

ConcretePlan itinerary overview may show already-published execution facts:

```text
Day number
Date / weekday
Headline Weather?
Day title
Material time-constraint presence?
```

- Selecting a Plan Day switches only the conceptual Day Journey.
- ConcretePlan Primary Workspace switches complete peer content: one execution Day, Fuel, or Cost.
- Selecting a ConcretePlan Day switches the complete execution Day context: Weather / Execution Package / Journey / Route detail / Map / Day support.
- Selection is local presentation state and is never persisted as Canonical truth.
- Weather decorates the compact itinerary overview / selected Day context but never owns Day selection.
- Desktop and Mobile use the same navigation model. Mobile may horizontally scroll peer tabs; it does not vertically stack every Day.
- Plan and ConcretePlan may share interaction primitives; page-specific semantics remain separate.

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
compact itinerary overview
→ selected Day headline Weather
→ 3-hour icon timeline
→ one disclosure reveals temperature / precipitation / wind metrics
```

Meteocons are local Viewer assets. Runtime CDN dependency is not part of the Weather grammar.

The selected Day's hourly view may use only already-published Weather periods and Action time labels. The Viewer does not forecast, aggregate, or evaluate Weather.

Weather unavailable on one Day must not break Primary Workspace navigation. Weather is optional decoration/content.

## Entity / Fact

- Entity links may be Cards when the entity itself is the navigation target.
- Metadata is inline.
- Comparable facts are rows/grids.
- Information volume grows naturally; the Viewer does not score content into arbitrary compact/standard/expanded classes.
- Route hero Spot references are compact context, not duplicate Spot cards.
- Fuel / Cost and other dense comparable support use structured rows/table-like presentation rather than Card collections.
- Spot Quick Practical uses existing access / usage decision / pricing / reference semantics and is part of the desktop Hero identity rail when it materially helps the immediate use decision.
- Facilities and longer optional detail remain supporting content; the same fact is not duplicated above and below the Hero.

## Media

Carousel and Lightbox controls use local inline SVG geometry, not external SVG assets or font glyph alignment. Keyboard navigation and focus return remain required.

## Control / Disclosure

Controls are intentionally weaker than Product content, except Primary peer navigation which establishes the current workspace context.

```text
Primary Day / Workspace Navigator
→ choose which conceptual Day or execution peer content is current

Tab / Switch rail
→ switch peer content panels at the same hierarchy

Select
→ choose an assignment/value from alternatives

Disclosure
→ reveal genuinely secondary detail without changing peer context

Link
→ navigate to another Entity
```

Primary content is not placed behind a Disclosure merely to shorten the page. In particular, selected Plan Route identity/detail is initially visible; only optional secondary detail belongs behind Disclosure.

ConcretePlan switch hierarchy:

```text
Primary Workspace
→ DAY1 / DAY2 / ... / 給油 / 費用

Selected Day only:
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
identity + quick practical 5 | media 7
appeal 5 | review 7        # reviewが存在する場合
facilities?
related spots
```

Desktop Media does not overlap later content. Quick Practical uses the left Hero rail instead of leaving unused space while pushing decision facts below the fold. Mobile priority remains Media → Identity / Summary → Quick Practical → Appeal / Review.

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
primary Day navigator
selected conceptual Day journey
  selected Route identity/detail inline
```

### ConcretePlan

```text
execution overview
compact itinerary overview
primary workspace [DAY1..DAYN | 給油 | 費用]
selected Day:
  context | 3-hour Weather
  execution package?
  event timeline / route detail / map
selected Fuel:
  structured operational rows
selected Cost:
  trip/day structured rows + annotations
```

Surface-specific grouping / orderingはPage Layout Definitionが所有する。Shared grammar自体へPage固有例外を埋め込まない。

## Responsive priority

Spot mobile:

```text
Media
Identity / Summary
Quick Practical
Appeal
Review?
Support
```

Route mobile:

```text
Map
vertical ordered sequence
supporting condition
```

Plan mobile:

```text
horizontal Primary Day Navigator
Selected conceptual Day
Journey
```

ConcretePlan mobile:

```text
compact itinerary overview
horizontal Primary Workspace
Selected Day context / Fuel / Cost
3-hour Weather when Day selected
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
