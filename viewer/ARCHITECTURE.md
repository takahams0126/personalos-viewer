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

1. Root `index.html` is the single Modern production entrypoint.
2. Legacy remains under `legacy/index.html`; it must not be promoted back to root because a Modern page is incomplete.
3. Do not create a second Modern entrypoint such as `index2.html`.
4. Page implementation is incremental. `Top / Spot / Route` can be implemented while `Plan / ConcretePlan` remain skeletons.
5. Incomplete pages are built inside `viewer/**` from current Display contracts; do not port or revive Legacy implementation patterns.
6. Root `app.js`, `presentation/**`, and `legacy/**` are frozen comparison assets only and are forbidden dependencies for Modern code.
7. Current Modern page build state is owned by `/viewer-build-status.json`.
8. Display semantics and HTML Boundary are defined upstream. Modern Renderer consumes that boundary rather than inferring Domain meaning from Legacy DOM or old PoC code.
9. Legacy visual behavior may be used as comparison evidence, but it does not override current contracts or explicit user review.

## System-level optimization principles

The goal of Modern Viewer is not to minimize a single local metric such as JSON request count. The goal is to deliver the user-agreed Final Display with high overall software quality while preserving upstream meaning and layer responsibility.

Design decisions must balance semantic correctness, runtime performance, maintainability, extensibility, change locality, testability/diagnosability, cacheability/reuse, and generation/rebuild cost.

`1 page = 1 application-data read` is **not** a Viewer invariant. Unnecessary I/O should be avoided, but unrelated resources must not be coupled merely to reduce request count.

### Semantic completion vs resource composition

```text
Semantic completion
= deciding or filling in display meaning
= must be complete upstream

Resource composition
= loading and rendering resources already selected by the boundary
= allowed in Viewer from explicit references
```

Viewer must not fetch Manifest, related Entity JSON, Canonical data, or other sources merely to discover missing labels, relationships, summaries, warnings, or other display meaning.

Explicitly referenced artifacts may be loaded independently when separation improves change locality, reuse, cache behavior, failure isolation, or rebuild cost.

### Testing / Guard / CI principle

Testing, Architecture Guards, and CI checks are quality tools, not goals. In incomplete, experimental, or actively changing areas they are **not default implementation work**.

New tests, Guard expansion, CI validation, test-framework introduction, or substantial test-maintenance work require **explicit user approval before implementation**, even if an AI judges them useful. Do not freeze exploratory behavior just to make tests pass, and do not prioritize test maintenance over current user-agreed product/design goals.

## Modern Viewer normal path

```text
index.html
  ↓
viewer/main.js
  ├─ resolveRequest()              # identity only: type + id
  ├─ loadPageData()               # TOP=Manifest, Entity=Boundary JSON
  ├─ createNavigationContext()    # history entry state
  ├─ create PageContext
  ├─ render common navigation
  └─ page.render(PageContext)
        ├─ presentation / interaction
        └─ resources.loadJson() for explicit supplemental artifacts
```

Normal navigation remains document navigation rather than SPA replacement. Internal links are query-relative (`?type=...&id=...`) and do not encode the physical entry filename or deployment path.

## PageContext

Every page receives the same composition contract:

```js
{
  request: {
    type: string,
    id: string | null
  },
  data: Object,
  navigation: {
    source: { type, id, title } | null,
    href(target): string
  },
  resources: {
    loadJson(path, options?): Promise<Object>
  }
}
```

- `request` identifies the current Viewer page only.
- `data` is the page's primary accepted input. TOP receives `manifest.json`; Entity pages receive their Boundary JSON.
- `navigation` is runtime/UI context, not Canonical relation state.
- `resources` provides access to explicitly referenced supplemental resources without giving page modules ownership of raw fetch.

## Responsibilities

- `viewer/main.js`
  - composition root
  - resolve request identity
  - load primary page data
  - create PageContext
  - render common navigation
  - dispatch to exactly one page module
  - install document-navigation behavior
- `viewer/core/request.js`
  - parse only `type` / `id` from URL
  - never own browser-history context
- `viewer/core/navigation.js`
  - build physical-entry-independent Viewer hrefs
  - read/write entry-scoped navigation context through `history.state`
  - preserve normal document reload semantics for internal navigation
- `viewer/core/data.js`
  - own HTTP/JSON access and entity path resolution
  - own shared Resource Manager
  - deduplicate repeated loads of the same JSON resource within a document lifecycle
- `viewer/<page>/`
  - page-specific presentation and interaction
  - consume PageContext
  - load only explicitly referenced supplemental artifacts through `context.resources`
- `viewer/shared/`
  - cross-page presentation components/provider adapters/common UI
  - must not contain Spot/Route/Plan/ConcretePlan domain branching

## Data and resource ownership

```text
Primary page input
  main.js
    ↓ loadPageData(type, id)
  Resource Manager
    ↓
  PageContext.data

Explicit supplemental artifact
  accepted page data contains artifact reference
    ↓
  page chooses load timing
    ↓ context.resources.loadJson(ref)
  Resource Manager
```

Primary data ownership is centralized without imposing a one-read-per-page rule. Supplemental resources remain independent when their lifecycle warrants it.

## Navigation ownership

```text
URL query
= current Entity identity
= type + id

history.state
= history-entry-specific navigation context
= source label/type/id

Manifest
= TOP/search directory primary data
= not a generic Entity label lookup service

Canonical / Boundary relationships
= Domain/display meaning
= not browser history
```

N:N Entity relationships are not represented as a fixed parent/child breadcrumb hierarchy. `trail[]` is no longer part of ViewerRequest.

Internal links never encode `index.html`, `index2.html`, repository path, or hosting path. The current document owns the physical entrypoint; Viewer navigation owns query state only.

## Resource Manager

The current Resource Manager intentionally stays small:

- one shared JSON loading boundary;
- in-document deduplication of identical resource loads;
- explicit cache option passed to fetch;
- failed loads are removed from the in-memory load map so a later request can retry.

This is infrastructure, not a requirement to introduce broader caching, prefetch, Service Workers, or SPA state management.

## Dependency rules

```text
main → core
main → page
main → shared

page → shared
page ↛ core data/navigation implementation

shared ↛ page
core   ↛ page
core   ↛ shared presentation
```

Pages receive runtime services through PageContext rather than importing data/navigation infrastructure directly.

## Modern build state

Machine-readable build state lives in `/viewer-build-status.json`.

```text
Top             implemented
Spot            implemented
Route           implemented
Plan            skeleton
ConcretePlan    skeleton
```

This foundation change does not implement Plan or ConcretePlan display.

## Failure behavior

Primary input failure still fails page bootstrap and is rendered through the shared error view. Supplemental artifacts should remain failure-isolated by their owning page/component when practical.

No test, Guard, workflow, or CI expansion is implied by this architecture change; those require separate explicit user approval.
