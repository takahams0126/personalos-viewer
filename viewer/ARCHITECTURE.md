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
        ↓
      explicit shared helpers / supplemental artifacts
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
  - generic data access and entity path resolution
- `viewer/<page>/`
  - page-specific presentation and interaction
  - decide which supplemental artifacts are needed
  - must not refetch its primary entity
- `viewer/shared/`
  - cross-page presentation components, navigation, provider adapters, and reusable UI behavior
  - must not contain Spot/Route/Plan/ConcretePlan domain branching

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
