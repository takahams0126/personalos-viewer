# Modern Viewer

`viewer/**` はレジャーHTML Viewerの正規Modern実装です。root `index.html` から起動します。

Modern ViewerはLegacy Viewerの移植先ではなく、**現在のHTML Boundaryから新規に作る実装**です。

## Current authority

Obsidian側の正式契約:

```text
ユーザ合意
01_chatgpt/03_Data/Leisure/00_UserAgreement.md

4領域責務
01_chatgpt/03_Data/Leisure/00_ViewArchitecture.md

HTML Boundary
01_chatgpt/03_Data/Leisure/00_PublicProjection.md
01_chatgpt/03_Data/Leisure/PublicSchemas/**
```

最新の状態・作業計画:

```text
01_chatgpt/01_Context/03_Active/Leisure/00_Current.md
01_chatgpt/01_Context/03_Active/Leisure/Work/04_HTML-Viewer-Progress.md
```

`80_Memo/**` / History / old Closure / Amendment / Audit / Planは参照しません。

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
