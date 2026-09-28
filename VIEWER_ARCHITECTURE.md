# Viewer Repository Architecture

This repository contains the published Leisure HTML Boundary plus isolated presentation generations.

Authoritative Viewer contracts live in Obsidian under `01_chatgpt/03_Data/Leisure/04_HTMLViewer/**`. This file owns only repository/runtime layout.

## Physical layout

```text
/
├─ index.html                  # default presentation router only
├─ manifest.json               # shared published directory
├─ data/**                     # shared published Public Entity JSON
├─ maps/**                     # shared published artifacts
└─ presentation/
   ├─ current/                 # current Viewer implementation
   ├─ modern/                  # previous Modern reference presentation
   └─ legacy/                  # frozen Legacy comparison snapshot
```

Presentation generations do not own the shared published Boundary.

## Current Viewer direction

`presentation/current/` is rebuilt from the current HTML Boundary JSON. Previous Modern and Legacy code are reference only and must not be imported by Current.

Normal flow:

```text
manifest.json
+ data/**
+ maps/**
    ↓
Current runtime
  ManifestStore
  EntityResolver
  EntityCache
  ArtifactLoader
  Router
    ↓
semantic DOM
    ↓
layout CSS + theme/design tokens + generic UI components
```

Current rules:

- JSON is the Viewer input boundary; do not create a persistent intermediate ViewModel/derived JSON layer.
- JS resolves/fetches published data and emits semantic DOM.
- HTML classes/attributes describe meaning, not visual placement.
- CSS owns layout, responsive behavior, density, and theme as far as possible.
- Generic interaction/accessibility may be delegated to mature component libraries.
- Domain meaning must not be reconstructed from CSS or presentation code.
- If semantic meaning is missing, fix the upstream HTML Boundary rather than inventing it in Viewer.

## Generation roles

### current

Only active development target. It may consume `/manifest.json`, `/data/**`, and `/maps/**`.

### modern

Reference snapshot of the previous Modern Viewer. It may read the shared current Boundary on a best-effort basis, but compatibility is not guaranteed and it is not an implementation source for Current.

### legacy

Frozen comparison snapshot. Its source tree is mechanically guarded. Normal build/deploy must not regenerate or overlay Legacy data/presentation. Only deployment-time environment binding such as its historical Maps key config is allowed.

## Default routing

Root `index.html` owns only the default presentation selection. While Current is not yet minimally usable, default routing remains `presentation/modern/`. Promotion to Current is a one-line router change after Current reaches the agreed minimum surface.

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
