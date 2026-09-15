# Leisure Viewer Baseline

## Baseline commit

Validated UI recovery baseline:

- commit: `43086bf4229b84b12df11a1141db75a2896ae367`
- message: `Restore final validated Plan decision fixture`
- date fixed: 2026-09-16 JST

This commit is the visual/behavioral regression baseline while the Viewer architecture is normalized.

## What is considered visually recovered at this baseline

- Home search/explorer flow is usable as the entry point to published Leisure entities.
- Route presentation is treated as recovered and should not be redesigned during Presentation normalization.
- Spot presentation is treated as recovered, including hero copy/image split, carousel/lightbox, editorial sections and related links.
- Plan presentation has the recovered trip-value hierarchy, primary-route cards, collapsible Day cards, semantic SVG flow, route alternatives and decision blocks.
- Execution presentation is sufficiently recovered to serve as the reference for the shared `Plan ⊂ Execution` Day structure.

## Baseline rule

Architecture cleanup may change file boundaries, module names, JSON locations and data-loading paths, but must not intentionally change the approved visible layout or interaction behavior.

Any visible difference from this baseline is a regression unless explicitly approved.

## Important temporary debt at baseline

The baseline still contains recovered validation-era implementation debt, including `demo` / `poc` module names, temporary fixture data and split ConcretePlan auxiliary JSON. These are not part of the target architecture. They exist only so the approved presentation can be preserved while responsibilities are separated.

The normalization goal is to remove those runtime dependencies without changing the approved presentation.
