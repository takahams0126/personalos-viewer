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
- Foundation must not freeze values such as page/detail/explorer measure, component density, control-height role, or component gap merely because Default pages share them.
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

The page layout files originated during technical validation and still contain provisional visual declarations such as raw color mixing, radius, font sizing, surface treatment, and repeated component grammar. Those declarations are not the definition of the `default` Theme. They are migration debt inside the current Default presentation.

Convergence order:

```text
stable atomic scale
→ Foundation

skin role
→ Theme

reusable component grammar / component density
→ Pattern

page measure / composition / reflow
→ Layout

repeated Semantic DOM grammar
→ shared renderer component, only when proven by repetition
```

Do not preserve the debt as a second theme system and do not create speculative tokens/components just to make files look uniform.
