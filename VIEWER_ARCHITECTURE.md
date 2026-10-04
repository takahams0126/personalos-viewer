# Viewer Repository Architecture

This repository contains the published Leisure HTML Boundary plus isolated presentation generations.

Authoritative Viewer contracts live in Obsidian under `01_chatgpt/03_Data/Leisure/04_HTMLViewer/**`.
The non-authoritative North Star / orientation entry is `04_HTMLViewer/README.md`.
This file owns only repository/runtime layout and implementation-facing boundaries.

## Physical layout

```text
/
├─ index.html                  # default presentation router only
├─ manifest.json               # shared published directory
├─ data/**                     # shared published Public Entity JSON
├─ maps/**                     # shared published artifacts
└─ presentation/
   ├─ current/                 # official Viewer implementation
   ├─ modern/                  # previous Modern reference presentation
   └─ legacy/                  # frozen Legacy comparison snapshot
```

Presentation generations do not own the shared published Boundary.

## Current Viewer direction

`presentation/current/` is the official Viewer presentation rebuilt from the current HTML Boundary JSON. Previous Modern and Legacy code are evidence/reference only and must not be imported by Current.

Normal flow:

```text
manifest.json
+ data/**
+ maps/**
    ↓
Current Runtime Core
  ManifestStore
  ResourceStore
  EntityResolver
  ArtifactLoader
  Router
  NavigationContext
    ↓
Page Semantic Assembly
    ↓
optional shared semantic presentation components
    ↓
semantic DOM
    ↓
Presentation Preset
  Theme + Pattern Set + Layout Set
    ↓
Interaction / Map Presentation
```

Shared semantic presentation components are transient DOM helpers only. They may remove repeated HTML grammar but must not fetch entities, inspect Manifest relations, infer Domain meaning, or become a persistent ViewModel.

Current rules:

- JSON is the Viewer input boundary; do not create a persistent intermediate ViewModel/derived JSON layer.
- JS resolves/fetches published data and emits semantic DOM.
- Page renderers own Page semantic assembly; shared renderer components may only render already-resolved semantic input.
- HTML classes/attributes describe meaning, not visual placement.
- Presentation is selected Viewer-wide through an explicit Presentation Preset.
- Theme owns skin roles; Pattern owns reusable visual grammar; Layout owns page composition/measure/reflow.
- Foundation contains preset-independent atomic scales only; it must not silently freeze Default page width/density/personality for every future preset.
- Current-authored CSS belongs to an explicit cascade layer; unlayered CSS is not the normal override mechanism.
- Generic interaction/accessibility may be delegated to mature component libraries when a concrete bottleneck justifies it.
- Domain meaning must not be reconstructed from CSS or presentation code.
- If semantic meaning is missing, fix the upstream HTML Boundary rather than inventing it in Viewer.

## Current physical boundaries

```text
presentation/current/
├─ core/**
│  └─ runtime resolution / routing / navigation context
├─ render/**
│  ├─ page semantic renderers
│  └─ components/**             # only when real cross-page DOM grammar exists
├─ structure/**
│  └─ Viewer-level shell structure
├─ presentation/**
│  ├─ registry.js               # explicit Viewer-wide Preset composition
│  └─ bootstrap.js              # active resource activation
├─ interaction/**
│  └─ local UI behavior
├─ map/**
│  └─ explicit Map Artifact presentation adapter
└─ styles/
   ├─ foundation/**             # preset-independent atomic scales
   ├─ themes/<theme-id>.css
   ├─ primitives/**
   ├─ patterns/<pattern-set-id>/**
   └─ layouts/<layout-set-id>/**
```

A `render/components/**` boundary is optional until a real repeated semantic grammar is extracted. Do not create speculative components just to satisfy the directory shape.

## Presentation Presets

One active Preset applies to the whole Current Viewer.

```text
config.presentationPreset
        ↓
presentation/registry.js
        ↓
Preset
├─ Theme
├─ Pattern Set
└─ Layout Set
        ↓
TOP / Spot / Route / Plan / ConcretePlan
```

Unknown explicit Preset IDs fail; they do not silently fall back to `default`.
A new design can explicitly reuse an existing Theme / Pattern Set / Layout Set, but page-specific partial fallback is not a Preset model.

## Map boundary

Current consumes explicit Map Artifacts only.

```text
Route Conceptual Map
→ ordered points
→ no inferred road geometry

ConcretePlan Execution Map
→ ordered points
→ ordered segments[].path
→ no geometry-to-segment reconstruction
```

Google Places / Routes resolution stays upstream. The browser adapter only renders published positions/paths and presentation interaction.
Map presentation maintenance must stay within this boundary and must not move geographic resolution into Current.

## Generation roles

### current

Official production presentation and active development target. It may consume `/manifest.json`, `/data/**`, and `/maps/**`.

### modern

Reference snapshot of the previous Modern Viewer. It may read the shared current Boundary on a best-effort basis, but compatibility is not guaranteed and it is not an implementation source for Current.

### legacy

Frozen comparison snapshot. Its source tree is mechanically guarded. Normal build/deploy must not regenerate or overlay Legacy data/presentation. Only deployment-time environment binding such as its historical Maps key config is allowed.

## Default routing

Root `index.html` owns only the default presentation selection and routes to `presentation/current/`.
Modern and Legacy are not fallback production routes.

## Publishing

Public Entity publish delivers `manifest.json`, `data/**`, and `maps/**` into this repository before Pages deployment.

Pages deployment must copy those delivered artifacts as-is. It must not rebuild, transform, or overlay published Boundary data.

## Cache busting

Deploy-SHA query versioning applies only to mutable presentation assets under:

```text
presentation/current/**
presentation/modern/**
```

`presentation/legacy/**` is excluded so the frozen snapshot is not rewritten during deploy.

Shared JSON/Map data is not presentation-versioned. Runtime data fetching/caching is owned by Current runtime and HTTP semantics, not by CSS/JS asset versioning.

Third-party libraries should use explicit pinned versions. The deploy versioner only rewrites local relative JS/CSS references.
