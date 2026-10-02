# Shared Product Grammar

Status: active implementation guidance
Scope: Current Leisure Viewer / Smart
Updated: 2026-10-02

## Purpose

Batch 2 applies the Product UI Foundation by semantic grammar rather than by page-local fixes.

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

## Map

Route Map and ordered sequence are one workspace.

```text
sequence preview/select
↕
map point preview/select
```

Selection uses explicit artifact/sequence order only. Geometry never creates order or Domain meaning.

ConcretePlan segment color uses explicit execution leg identity. Successful Maps rendering suppresses duplicated fallback lists.

## Weather

Weather uses icon-first daily state and a horizontal 3-hour comparison matrix. One disclosure reveals all metrics across the same time axis.

The Day view may show an explicit baseline execution window derived only from already-published Action time labels. The Viewer does not forecast, aggregate, or evaluate Weather.

## Entity / Fact

- Entity links may be Cards when the entity itself is the navigation target.
- Metadata is inline.
- Comparable facts are rows/grids.
- Information volume grows naturally; the Viewer does not score content into arbitrary compact/standard/expanded classes.
- Route hero Spot references are compact context, not duplicate Spot cards.

## Media

Carousel and Lightbox controls use local inline SVG geometry, not external SVG assets or font glyph alignment. Keyboard navigation and focus return remain required.

## Control / Disclosure

Schedule adjustment, execution package selection, Day workspace switching, Variants, and secondary details are controls—not primary content blocks.

Controls use low-emphasis surfaces and preserve native semantics (`button`, `select`, `details`, tabs where appropriate).

## Ownership

```text
patterns/smart/navigation.css  → navigation / relation navigation
patterns/smart/journey.css     → journey / controls
patterns/smart/map.css         → map / map-linked selection
patterns/smart/weather.css     → weather
patterns/smart/entity.css      → entity hierarchy / appeal / review
patterns/smart/fact.css        → facts / cost / fuel
patterns/smart/media.css       → carousel / lightbox / footer

layouts/smart/*.css            → spatial composition only
```

If a correction does not fit an owner, re-evaluate the root cause before adding a new file.