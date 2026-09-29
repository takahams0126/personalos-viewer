# Current Presentation Style Boundaries

This directory implements the visual resources composed by the Leisure HTML Viewer Presentation Preset system.

```text
styles/
├─ foundation/                 preset-independent atomic scales only
├─ themes/
│  └─ <theme-id>.css           visual role values: color, typography, radius, shadow
├─ primitives/                 shared generic document/control presentation
├─ patterns/
│  └─ <pattern-set-id>/**      reusable presentation grammar / component treatment
└─ layouts/
   └─ <layout-set-id>/**       page measure / composition / responsive reflow
```

The Viewer-level composition authority is outside this directory:

```text
presentation/registry.js
  └─ preset id
      ├─ theme id/resources
      ├─ pattern set id/resources
      └─ layout set id/resources
```

`config.js` selects one active `presentationPreset` for the whole Current Viewer. TOP / Spot / Route / Plan / ConcretePlan do not select independent presets.

## Shared vs selectable resources

Shared across presets by default:

```text
foundation/**
primitives/**
Semantic renderers
interaction/**
```

Selected by the active preset:

```text
themes/<theme-id>.css
patterns/<pattern-set-id>/**
layouts/<layout-set-id>/**
```

A future preset may explicitly reuse an existing Theme / Pattern Set / Layout Set. That is registry composition, not fallback.

Unknown preset IDs must fail explicitly. Do not silently load `default` for an explicitly invalid preset.

## Dependency direction

```text
foundation
  ↓
theme + primitives
  ↓
selected patterns
  ↓
selected layouts
```

CSS layer order is fixed as:

```text
tokens → theme → primitives → patterns → layout → overrides
```

Current-authored CSS should normally belong to one of these explicit layers. Do not use unlayered CSS as a convenient high-priority override path.

## Ownership rules

- `foundation/**` owns atomic, preset-independent scales only. It is not the shared-value bucket for the Default design.
- Foundation must not contain Spot / Route / Plan / ConcretePlan-specific values.
- Foundation must not freeze page/detail/explorer measure, component density, control-height role, or component gap merely because Default pages share them.
- `themes/**` supplies skin role tokens and must not select Domain/page classes.
- `primitives/**` styles generic HTML/control behavior and must not depend on page identity.
- `patterns/<set>/**` styles reusable UI grammar and may own component treatment/density roles; it must not fetch, infer, or redefine Domain meaning.
- `layouts/<set>/**` owns page measure, placement, flow, grid/flex, sticky behavior, and responsive reflow. Theme-specific colors, font families, radius, and shadow values should not be introduced here.
- `render/**` remains the owner of Semantic Structure; styling must not compensate for missing Domain semantics.
- repeated Semantic DOM grammar may move to a thin `render/components/**` helper only after actual repetition is demonstrated; such helpers do not fetch or infer Domain meaning.
- a Presentation Preset must form a usable Viewer-wide set; do not create page-only presets.

## Default preset and migration debt

`default` is the first formal Presentation Preset and currently composes:

```text
theme      = default
patternSet = default
layoutSet  = default
```

The technical-validation CSS originally mixed four kinds of responsibility inside page-local layout files:

```text
Foundation
→ atomic spacing / border / primitive duration scales

Theme
→ color / surface / typography role / radius / shadow

Pattern
→ reusable card / chip / facts / hero / section / sequence grammar and component density

Layout
→ page measure / composition / placement / reflow
```

Default convergence is incremental, but the target classification is authoritative. Do not preserve old page-local declarations as a second visual system.

### Convergence status

First visual-role convergence batch:

- `space-5`, border-width scales, and primitive duration now live in `foundation/tokens.css`
- Default color/surface roles, typography roles, radius, shadow, and color-scheme live in `themes/default.css`
- Default control-height role lives with the Default Pattern Set rather than shared Foundation
- Default page/detail/explorer measures live in `layouts/default/settings.css` rather than shared Foundation
- TOP / Spot / Route / Plan / ConcretePlan timeline / AppShell layouts consume shared Foundation / Theme / Pattern / Layout roles instead of defining their own copies for those concerns
- generic `visually-hidden` remains Primitive-owned; page layout does not redefine it

First Pattern convergence batch:

- `patterns/default/entity-content.css` owns the proven reusable grammar for chip lists, content-section dividers/headings, emphasis text cards, and the baseline Entity link-card surface
- TOP / Spot / Route reuse the same chip grammar; TOP uses the compact variant rather than redefining a second tag-pill style
- Spot highlights and Route strengths share one `EmphasisList` Semantic DOM helper and one Pattern treatment; only their page-specific grid width remains in Layout
- Spot related links, Route hero Spot links, and TOP result rows share the baseline `entity-link-card` treatment while retaining page-specific spatial layout and interaction behavior
- `render/components/presentation.js` contains only demonstrated identical DOM grammar (`ChipList`, `EmphasisList`); it does not fetch entities, resolve refs, or infer Domain meaning
- section divider/heading treatment is Pattern-owned through `content-section`; page renderers opt in explicitly

Remaining debt should be evaluated from actual repetition rather than assumed abstraction. Current candidates include:

- repeated entity hero grammar across Spot / Route
- fact / identity presentation grammar
- related / hero Entity card content grammar if the DOM shape converges further
- occurrence badge vs generic chip semantics, which should stay separate unless their meaning and interaction truly align
- component-specific typography that should be promoted only when a stable reusable role is demonstrated

Do not create speculative tokens or components for every numeric value or similar-looking block. Promote a value or DOM helper only when it represents a stable owner-correct role.
