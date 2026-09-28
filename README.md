# PersonalOS Viewer

Public Leisure Viewer repository.

Current responsibility is deliberately split into two parts:

```text
Published Boundary
manifest.json + data/** + maps/**

Presentation generations
presentation/current/**
presentation/modern/**
presentation/legacy/**
```

## Current state

`presentation/current/` is the only active development target. It is being rebuilt from the current HTML Boundary JSON with a thin runtime, semantic DOM, and presentation separated into CSS/layout/theme layers.

Previous generations are references only:

- `presentation/modern/` — previous Modern Viewer reference
- `presentation/legacy/` — frozen Legacy comparison snapshot

Root `index.html` is only the default-presentation router. While Current is not yet minimally usable, it routes to Modern. Promotion to Current is a one-line routing change.

## Published Boundary

The repository-level shared data layer is:

- `manifest.json`
- `data/**`
- `maps/**`

These files are delivered by the upstream Publish flow. GitHub Pages does not rebuild or overlay them.

## Presentation isolation

Presentation code must live under `presentation/<generation>/`.

Current must not import code/CSS from Modern or Legacy. Modern is best-effort reference only. Legacy is mechanically frozen and its source tree must not change in the normal path.

## Cache/versioning

Mutable local JS/CSS under `presentation/current/**` and `presentation/modern/**` receive deploy-SHA query versioning during Pages deployment.

`presentation/legacy/**` is excluded from version rewriting so deployment cannot mutate the frozen presentation snapshot.

Third-party UI libraries should use explicit pinned versions. Shared JSON/Map data is not presentation-versioned.

## Source of truth

- Repository/runtime layout: [`VIEWER_ARCHITECTURE.md`](VIEWER_ARCHITECTURE.md)
- Current Viewer policy and HTML Boundary authority: Obsidian `01_chatgpt/03_Data/Leisure/04_HTMLViewer/**`
- Current development notes: [`presentation/current/README.md`](presentation/current/README.md)
- Modern reference: [`presentation/modern/README.md`](presentation/modern/README.md)
- Frozen Legacy: [`presentation/legacy/README.md`](presentation/legacy/README.md)

Historical prototypes and test fixtures are not Current implementation authority.
