# Modern Viewer

`viewer/**` はレジャーHTML Viewerの正規Modern実装です。root `index.html` から起動します。

Modern ViewerはLegacy Viewerの移植先ではなく、**現在のHTML Boundaryから新規に作る実装**です。

## Current authority

Obsidian側の現在の入力契約:

```text
80_Memo/Leisure-Display-Pipeline/Final-Display/Leisure-Final-Display-HTML-Boundary-Contract.md
80_Memo/Leisure-Layer-State/04_HTML-Viewer/Implementation-Plan.md
```

History / old Closure / Amendment / Auditは参照しません。

## Current build state

```text
Top             implemented
Spot            implemented
Route           implemented
Plan            skeleton
ConcretePlan    skeleton
```

現在の最優先はPlan / ConcretePlanを完成させ、④ HTML Viewerを単独でCLOSEDすることです。

進行順:

```text
HTML Boundary semantic
→ physical Public Schema
→ fixture JSON
→ Plan Renderer
→ ConcretePlan Renderer
→ user review
→ HTML Viewer CLOSED
```

②表示変換の正式実装を先行させません。

## Structure

```text
viewer/
├─ main.js
├─ core/
├─ shared/
├─ top/
├─ spot/
├─ route/
├─ plan/
└─ concrete-plan/
```

## Normal path

```text
index.html
  ↓
viewer/main.js
  ↓ primary HTML Boundary JSON
page.render(PageContext)
  ↓
page-specific presentation / interaction
  └─ optional explicit artifact via resource manager
```

## Invariants

- production entrypointはroot `index.html` のみ。
- Legacy code / old published shapeをModern実装のsourceにしない。
- ViewerはCanonicalやrelated Entityを意味補完fetchしない。
- Viewerはtitle / summary / warning / reorder option等を生成しない。
- explicit artifact以外を探索しない。
- `viewer-build-status.json` がページ実装状態を所有する。

詳細は [`ARCHITECTURE.md`](./ARCHITECTURE.md) を参照します。
