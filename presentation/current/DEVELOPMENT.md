# Current Viewer Development Contract

This file is an implementation-facing contract for `presentation/current/**`.
Authoritative Domain / Viewer semantics remain in the Obsidian Leisure Viewer contracts.

Its purpose is to make Current changes predictable for a later Chat / developer without requiring conversation history.

## 1. Dependency direction

```text
Published Boundary
→ Runtime Core
→ Page Renderer
→ optional Shared Semantic Renderer Component
→ Semantic DOM
→ Presentation Preset resources
→ Interaction / Browser
```

Do not reverse this dependency to make a local UI task easier.

## 2. JavaScript conventions

- Use native ES modules.
- Keep modules small around one responsibility.
- Prefer explicit imports/exports over global mutable state.
- Use `const` by default; use `let` only for local mutation.
- Keep existing single-quote + semicolon style.
- Use `async/await` for asynchronous control flow.
- Reject/throw when an invariant or explicit dependency is missing; do not guess a fallback.
- Catch errors only at a boundary that can add a meaningful fail-soft behavior or diagnostic.
- If a cached Promise rejects, remove it when retry on a later independent attempt is valid.

## 3. DOM / rendering rules

- Build user content with `textContent`, `createTextNode`, or the local `h()` helper.
- Do not use `innerHTML` for Boundary/user-facing text in the Normal Path.
- Page renderers own Page semantic assembly.
- A shared renderer component may only render semantic input already provided by its caller.
- Shared components must not fetch entities, read the Manifest, discover relations, or infer Domain meaning.
- Do not create a persistent Viewer-specific ViewModel / Derived JSON.
- DOM class/data names describe semantic roles, not visual placement or colors.
  - good: `route-sequence`, `entity-kind`, `action-times`
  - avoid: `blue-card`, `left-column`, `large-box`

## 4. Runtime resolution rules

- Resolve entities only through explicit `PublicEntityRef` / explicit Manifest relation.
- Never derive an entity path from its ID.
- Never search for a similar entity as a fallback.
- Never read Canonical from Current Viewer runtime.
- Fetch only explicit dependencies needed by the current surface.
- Resolver/cache logic belongs in `core/**`, not duplicated in page renderers.

## 5. Presentation ownership

```text
foundation/**
→ preset-independent atomic scales only

themes/**
→ skin roles: color / typography / radius / shadow / surfaces

primitives/**
→ generic document/control baseline

patterns/<set>/**
→ reusable visual grammar / component treatment / component density

layouts/<set>/**
→ page measure / composition / placement / responsive reflow
```

Do not move a value into Foundation just because several Default pages currently share it.
If a future design set may reasonably change the value materially, assign it to the relevant Theme / Pattern / Layout role.

## 6. CSS rules

- Current-authored CSS must normally be inside an explicit cascade layer.
- Layer order is:

```text
tokens → theme → primitives → patterns → layout → overrides
```

- Do not use unlayered CSS as a convenient high-priority override.
- Theme files must not own `.spot-*`, `.route-*`, `.plan-*`, or other Domain/Page selectors.
- Primitive files must not depend on Page identity.
- Pattern files must not fetch or reconstruct semantics through JS assumptions.
- Layout files may change placement/reflow but must not hide required information to simulate a different Domain meaning.
- Preserve source DOM reading/focus order when responsive layout changes visual placement.
- Avoid speculative tokens. Promote a token when it represents a stable role, not merely a repeated number.

## 7. Presentation Preset rules

- One active Preset applies to the whole Viewer document.
- A Preset explicitly composes `theme + patternSet + layoutSet`.
- Page renderers do not choose their own Preset.
- Unknown explicit Preset IDs fail; do not silently fall back to `default`.
- A new Preset must cover all Current surfaces or explicitly reuse complete registered resources.
- Preset changes must not fork Boundary data, Renderer semantics, Navigation relations, or Domain wording.

## 8. Map rules

- Load only explicit Map Artifact bindings.
- Render `points[].position` directly.
- Render Execution `segments[].path` directly.
- Do not call Places / Routes from Viewer.
- Do not reconstruct segment identity from geometry.
- Conceptual Map must not invent road geometry between points.
- Marker/popup styling is Presentation; geographic resolution is not.

## 9. Interaction rules

- Interaction owns local UI state only.
- Preserve native browser navigation/history behavior unless an explicit Current requirement says otherwise.
- Do not infer Domain severity, relation, or candidate sets in interaction code.
- Prefer native semantic HTML when it satisfies behavior/accessibility.
- Add a library only for a demonstrated implementation/accessibility need; library adoption must not change Boundary semantics.

## 10. Comments

Comments should explain **why, invariant, ownership, or non-obvious consequence**.

Useful comment examples:
- why `sessionStorage` is only short-lived navigation transport
- why Map hydration waits for an opened disclosure
- why a fallback is intentionally forbidden
- why a value belongs to a specific responsibility boundary

Avoid comments that only restate obvious code behavior.
If a rule is cross-module and durable, document it here or in the authoritative Contract instead of scattering identical comments through files.

## 11. Failure behavior

Use explicit failure at authority/invariant boundaries and local fail-soft presentation at optional component boundaries.

Examples:

```text
unknown Preset
→ explicit Viewer bootstrap failure

missing Manifest target for required page
→ page unavailable

optional Map runtime failure
→ Map component unavailable, Page remains usable
```

Do not hide deterministic defects with silent fallback to Legacy, Modern, Canonical, inferred paths, or guessed entities.

## 12. Reference generations

- `presentation/current/**` is the active development target.
- `presentation/modern/**` is evidence/reference only.
- `presentation/legacy/**` is frozen historical comparison.
- Current must not import JS/CSS/data from Modern or Legacy.
- Visual ideas may be reimplemented through Current boundaries after evaluation.

## 13. Change checklist

Before committing a Current change, ask:

```text
Does this change Domain meaning?
→ wrong layer unless upstream contract changed

Is this repeated semantic DOM grammar?
→ shared renderer component may be appropriate

Is this reusable visual grammar?
→ Pattern

Is this page placement / responsive composition?
→ Layout

Is this skin?
→ Theme

Is this preset-independent atomic scale?
→ Foundation

Is this local behavior?
→ Interaction
```

Prefer the smallest owner-correct change. Do not add compatibility paths for retired architecture unless explicitly required.
