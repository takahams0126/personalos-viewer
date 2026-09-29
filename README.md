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

`presentation/current/` is the only active development target.
Technical validation is closed; Current is now in architecture stabilization + presentation convergence before final promotion.

Current is built from the published Boundary with:

```text
thin runtime core
→ page semantic assembly
→ optional shared semantic renderer components
→ semantic DOM
→ Viewer-wide Presentation Preset
   ├─ Theme
   ├─ Pattern Set
   └─ Layout Set
→ interaction / Map presentation
```

Previous generations are evidence/reference only:

- `presentation/modern/` — previous Modern Viewer reference
- `presentation/legacy/` — frozen Legacy comparison snapshot

Root `index.html` is only the default-presentation router. It still routes to Modern until the explicit Current promotion gate is closed.

## Published Boundary

The repository-level shared data layer is:

- `manifest.json`
- `data/**`
- `maps/**`

These files are delivered by the upstream Publish flow. GitHub Pages does not rebuild or overlay them.

## Presentation isolation

Presentation code must live under `presentation/<generation>/`.

Current must not import code/CSS/data from Modern or Legacy. Visual ideas may be reimplemented through Current boundaries after evaluation.
Legacy remains mechanically frozen in the normal path.

## Current implementation policy

- no persistent Viewer-specific ViewModel / Derived JSON
- explicit PublicEntityRef / Manifest relation only
- no Canonical fallback or ID/path inference
- one active Presentation Preset for the whole Current Viewer
- Foundation contains preset-independent atomic scales only
- Theme / Pattern / Layout own separate presentation responsibilities
- Current-authored CSS belongs to an explicit cascade layer
- Map renders explicit published points/segments and never calls Places / Routes

See `presentation/current/DEVELOPMENT.md` for the implementation contract.

## Cache/versioning

Mutable local JS/CSS under `presentation/current/**` and `presentation/modern/**` receive deploy-SHA query versioning during Pages deployment.

`presentation/legacy/**` is excluded from version rewriting so deployment cannot mutate the frozen presentation snapshot.

Third-party UI libraries should use explicit pinned versions. Shared JSON/Map data is not presentation-versioned.

## Source of truth / orientation

- Viewer Domain / Presentation / Runtime authority: Obsidian `01_chatgpt/03_Data/Leisure/04_HTMLViewer/**`
- Viewer North Star / orientation: Obsidian `01_chatgpt/03_Data/Leisure/04_HTMLViewer/README.md`
- Repository/runtime layout: [`VIEWER_ARCHITECTURE.md`](VIEWER_ARCHITECTURE.md)
- Current implementation state: [`presentation/current/README.md`](presentation/current/README.md)
- Current coding/ownership rules: [`presentation/current/DEVELOPMENT.md`](presentation/current/DEVELOPMENT.md)
- Historical recovered UI baseline: [`BASELINE.md`](BASELINE.md) — evidence only, superseded as Current authority
- Modern reference: [`presentation/modern/README.md`](presentation/modern/README.md)
- Frozen Legacy: [`presentation/legacy/README.md`](presentation/legacy/README.md)

Historical prototypes, the old baseline, Modern, and Legacy do not fill gaps in Current authority.
