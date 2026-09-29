# Current Presentation Style Boundaries

This directory implements the visual resources composed by the Leisure HTML Viewer Presentation Preset system.

```text
styles/
├─ foundation/                 shared theme-independent scales and measures
├─ themes/
│  └─ <theme-id>.css           visual role values: color, typography, radius, shadow
├─ primitives/                 shared generic document/control presentation
├─ patterns/
│  └─ <pattern-set-id>/**      reusable presentation grammar bundle
└─ layouts/
   └─ <layout-set-id>/**       page/spatial composition and responsive reflow bundle
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

Rules:

- `foundation/**` must not contain Spot / Route / Plan / ConcretePlan-specific values.
- `themes/**` supplies role tokens and must not select Domain/page classes.
- `primitives/**` styles generic HTML/control behavior and must not depend on page identity.
- `patterns/<set>/**` styles reusable UI grammar and must not fetch, infer, or redefine Domain meaning.
- `layouts/<set>/**` owns placement, width, flow, grid/flex, sticky behavior, and responsive reflow. New theme-specific colors, font families, radius, and shadow values should not be introduced here.
- `render/**` remains the owner of Semantic Structure; styling must not compensate for missing Domain semantics.
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
→ shared measure / spacing / control size / border width / motion scale

Theme
→ color / surface / typography role / radius / shadow

Pattern
→ reusable card / chip / facts / hero / section / sequence grammar

Layout
→ page composition / placement / reflow
```

Default convergence is incremental, but the target classification is authoritative. Do not preserve old page-local declarations as a second visual system.

### Convergence status

First convergence batch completed:

- shared detail / explorer measures, `space-5`, control height, strong border width, and fast motion now live in `foundation/tokens.css`
- Default color/surface roles, typography roles, radius, shadow, and color-scheme now live in `themes/default.css`
- TOP / Spot / Route / Plan / ConcretePlan timeline / AppShell layouts consume shared Foundation / Theme roles instead of defining their own raw theme values for those concerns
- generic `visually-hidden` remains Primitive-owned; page layout must not redefine it

Remaining debt is primarily **Pattern extraction**, not a hidden Theme:

- repeated entity hero grammar across Spot / Route
- repeated chip / badge grammar
- repeated fact-card / related-card / strength-card grammar
- repeated section-divider / section-heading grammar
- component-specific typography that should be promoted only when a stable reusable role is demonstrated

Do not create speculative tokens for every numeric value. Promote a value to Foundation / Theme only when it represents a stable cross-page role; otherwise keep it in the owning Pattern or Layout.
