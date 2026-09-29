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

The page layout files originated during technical validation and still contain provisional visual declarations such as raw color mixing, radius, font sizing, and surface treatment. Those declarations are not the definition of the `default` Theme. They are migration debt inside the current default Layout Set.

As design work proceeds, classify each visual declaration and move reusable skin values into Theme / Primitive / Pattern while keeping Layout focused on spatial composition. Do not preserve the debt as a second theme system.
