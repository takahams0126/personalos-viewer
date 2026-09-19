# Viewer Architecture

## Purpose

This document is the architecture contract for the Modern Viewer.

Modern Viewer is a **clean rebuild from the current Display contracts**. The frozen Legacy implementation exists only as comparison evidence; it is not the source implementation to port.

```text
Frozen comparison only
  legacy/index.html
  app.js
  presentation/**
  legacy/**

Modern production
  index.html
  viewer/**
```

## Coexistence invariants

These rules define the boundary between the clean Modern rebuild and the frozen Legacy comparison path.

1. Root `index.html` is the single Modern production entrypoint.
2. Legacy remains under `legacy/index.html`; it must not be promoted back to root because a Modern page is incomplete.
3. Do not create a second Modern entrypoint such as `index2.html`.
4. Page implementation is incremental. `Top / Spot / Route` can be implemented while `Plan / ConcretePlan` remain skeletons.
5. Incomplete pages are built inside `viewer/**` from current Display contracts; do not port or revive Legacy implementation patterns.
6. Root `app.js`, `presentation/**`, and `legacy/**` are frozen comparison assets only and are forbidden dependencies for Modern code.
7. Current Modern page build state is owned by `/viewer-build-status.json`.
8. Display semantics and HTML Boundary are defined upstream. Modern Renderer consumes that boundary rather than inferring Domain meaning from Legacy DOM or old PoC code.
9. Legacy visual behavior may be used as comparison evidence, but it does not override current contracts or explicit user review.

## Modern Viewer normal path

```text
index.html
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

The CI Architecture Guard protects root `index.html` and `viewer/**`.

The following patterns are prohibited in the Modern Zone:

1. Page modules must not parse `location.search` / `URLSearchParams` directly. URL request interpretation belongs to `viewer/core/request.js`.
2. Page modules must not directly fetch their primary entity JSON under `data/spots`, `data/routes`, `data/plans`, or `data/concrete-plans`. Primary entity loading belongs to `viewer/main.js` through `loadEntity()`.
3. `viewer/shared/**` must not import page modules from `viewer/top`, `viewer/spot`, `viewer/route`, `viewer/plan`, or `viewer/concrete-plan`.
4. `viewer/core/**` must not import page modules or presentation code from `viewer/shared/**`.
5. Modern code must not depend on Google Maps private DOM selectors such as `.gm-style-*`.
6. Modern code must not use `MutationObserver` as a bootstrap/wait-for-render mechanism.
7. Modern modules must not self-bootstrap by registering page startup through `DOMContentLoaded` or `window.onload`; startup belongs to `viewer/main.js` / `index.html`.
8. Modern code must not import from legacy root `app.js`, `presentation/**`, or `legacy/**`.
9. `index.html` must load `viewer/main.js` exactly once as an ES module and must not load legacy `app.js`, `config.js`, or `presentation/**` scripts.
10. `loadEntity()` has exactly one runtime owner in the Modern Zone: `viewer/main.js`. `entityPath()` remains inside `viewer/core/data.js`.
11. Page modules must not call raw `fetch()`. Supplemental JSON access goes through `viewer/core/data.js::loadJson()`.

The guard is intentionally scoped to the Modern Zone while the frozen Legacy comparison implementation still exists. Existing Legacy patterns are not CI failures because Legacy is not part of the Modern implementation.

## Modern build state

Machine-readable build state lives in `/viewer-build-status.json`.

Current state:

```text
Top             implemented
Spot            implemented
Route           implemented
Plan            skeleton
ConcretePlan    skeleton
```

This is **not an old-to-new transition percentage**. It records which Modern pages have been newly implemented.

Current policy:

- `implemented` page types use `viewer/**` as the authoritative implementation;
- `skeleton` page types are completed next inside the Modern Zone from current Display contracts;
- Legacy remains frozen for comparison only;
- current Display Pipeline Phase 2 proves HTML Boundary → fixture JSON → Modern Renderer before upstream Canonical/Builder reconciliation;
- once Modern no longer needs Legacy comparison, Legacy can be retired by an explicit decision.

## Failure behavior

On push to `main`, CI runs the Architecture Guard before the Pages build.

```text
push
  ↓
Architecture Guard
  ├─ PASS → build → deploy
  └─ FAIL → build/deploy do not run
```

A failed guard does not prevent the commit or push itself. It prevents publication and emits a rule ID, file, reason, and remediation hint so a human or AI can make a corrective commit.
