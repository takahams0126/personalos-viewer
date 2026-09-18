# Viewer Architecture

## Purpose

This document is the architecture contract for the new Viewer path during migration from the legacy implementation.

Two implementations intentionally coexist during the transition.

```text
Legacy Zone
  index.html
  app.js
  presentation/**

Modern Zone
  index2.html
  viewer/**
```

The legacy path remains available for comparison and fallback while migration is in progress. New architecture rules apply only to the Modern Zone unless explicitly stated otherwise.

## Modern Viewer normal path

```text
index2.html
  ↓
viewer/main.js
  ├─ resolveRequest()
  ├─ renderBreadcrumb()
  ├─ loadEntity()       # exactly once for the primary entity
  └─ page.render({ request, data })
        ↓
      page module
        ├─ presentation / interaction
        └─ optional loadJson() for supplemental artifacts
              ↓
            shared helpers / provider adapters
              ↓
            complete render
```

### Responsibilities

- `viewer/main.js`
  - composition root
  - resolve the request
  - render common navigation
  - load the primary entity exactly once for non-TOP pages
  - dispatch to exactly one page module
- `viewer/core/request.js`
  - parse Viewer request state from the URL
- `viewer/core/data.js`
  - own HTTP/JSON data access and entity path resolution
  - expose `loadEntity()` for the composition root
  - expose `loadJson()` for supplemental artifacts
- `viewer/<page>/`
  - page-specific presentation and interaction
  - decide which supplemental artifacts are needed
  - consume primary data passed through `page.render({ request, data })`
  - use `loadJson()` rather than raw `fetch()` for supplemental JSON
- `viewer/shared/`
  - cross-page presentation components, navigation, provider adapters, and reusable UI behavior
  - must not contain Spot/Route/Plan/ConcretePlan domain branching

## Data access ownership

```text
Primary entity
  viewer/main.js
    ↓ loadEntity(type, id)
  viewer/core/data.js
    ↓
  page.render({ request, data })

Supplemental artifact
  page module decides what it needs
    ↓ loadJson(path)
  viewer/core/data.js
```

`loadEntity()` has one runtime owner: `viewer/main.js`. `entityPath()` remains infrastructure owned by `viewer/core/data.js`. Page modules do not call either function and do not use raw `fetch()`.

## Dependency rules

Allowed dependency direction:

```text
main → core
main → page
main → shared

page → core        # supplemental data only
page → shared

shared ↛ page
core   ↛ page
core   ↛ shared presentation
```

## Public contracts

### ViewerRequest

Resolved once by `viewer/core/request.js` and passed down from the composition root.

```js
{
  type: string,
  id: string | null,
  trail: Array<{ type: string, id: string }>
}
```

Page modules consume this object and do not reinterpret the URL.

### Page module

Every page module exposes the same entry contract:

```js
render({ request, data })
```

- `request`: resolved `ViewerRequest`
- `data`: primary entity loaded by `viewer/main.js`, or `null` for TOP
- page-specific supplemental artifacts may be loaded explicitly through `viewer/core/data.js::loadJson()`

### MapPopupData

Map callers decide what content/actions exist. Shared map presentation decides only how they are rendered.

```js
{
  title?: string,
  summary?: string,
  meta?: Array<{ label: string, value: string }>,
  actions?: Array<{
    kind?: 'primary' | 'secondary',
    label: string,
    href: string,
    external?: boolean
  }>
}
```

This contract is intentionally Route-independent so conceptual maps and actual-road maps can share the same popup presentation.

## Modern Zone guard rules

The CI Architecture Guard currently protects `viewer/**` and `index2.html` only.

The following patterns are prohibited in the Modern Zone:

1. Page modules must not parse `location.search` / `URLSearchParams` directly. URL request interpretation belongs to `viewer/core/request.js`.
2. Page modules must not directly fetch their primary entity JSON under `data/spots`, `data/routes`, `data/plans`, or `data/concrete-plans`. Primary entity loading belongs to `viewer/main.js` through `loadEntity()`.
3. `viewer/shared/**` must not import page modules from `viewer/top`, `viewer/spot`, `viewer/route`, `viewer/plan`, or `viewer/concrete-plan`.
4. `viewer/core/**` must not import page modules or presentation code from `viewer/shared/**`.
5. Modern code must not depend on Google Maps private DOM selectors such as `.gm-style-*`.
6. Modern code must not use `MutationObserver` as a bootstrap/wait-for-render mechanism.
7. Modern modules must not self-bootstrap by registering page startup through `DOMContentLoaded` or `window.onload`; startup belongs to `viewer/main.js` / `index2.html`.
8. Modern code must not import from legacy `app.js` or `presentation/**`.
9. `index2.html` must load `viewer/main.js` exactly once as an ES module and must not load legacy `app.js`, `config.js`, or `presentation/**` scripts.
10. `loadEntity()` has exactly one runtime owner in the Modern Zone: `viewer/main.js`. `entityPath()` remains inside `viewer/core/data.js`.
11. Page modules must not call raw `fetch()`. Supplemental JSON access goes through `viewer/core/data.js::loadJson()`.

The guard is intentionally scoped to the Modern Zone during migration. Existing legacy patterns are not CI failures yet.

## Migration state

Machine-readable migration state lives in `/viewer-migration.json`.

Current policy:

- migrated page types use `viewer/**` as the authoritative modern implementation;
- legacy implementations remain retained until the migration is complete;
- non-migrated page types stay outside strict page-specific migration assumptions;
- once all page types are migrated, the legacy path can be retired and the guard can be widened repository-wide.

## Failure behavior

On push to `main`, CI runs the Architecture Guard before the Pages build.

```text
push
  ↓
Architecture Guard
  ├─ PASS → build → deploy
  └─ FAIL → build/deploy do not run
```

A failed guard does not prevent the commit or push itself in Phase 1. It prevents publication and emits a rule ID, file, reason, and remediation hint so a human or AI can make a corrective commit.
