# Viewer Architecture

## Purpose

Modern Viewerは、**確定済みHTML Boundaryを描画・操作へ変換する④ HTML Viewer層の実装**です。
Legacy Viewerの移植ではありません。

```text
Obsidian正式契約
01_chatgpt/03_Data/Leisure/04_HTMLViewer/00_UserAgreement.md
01_chatgpt/03_Data/Leisure/01_Canonical/00_DisplayArchitecture.md
01_chatgpt/03_Data/Leisure/04_HTMLViewer/01_InputContract.md
01_chatgpt/03_Data/Leisure/04_HTMLViewer/02_Presentation.md
01_chatgpt/03_Data/Leisure/04_HTMLViewer/Schemas/**
        ↓
Boundary JSON / explicit artifact
        ↓
Modern Viewer
        ↓
HTML / CSS / interaction
```

## Upstream authority

```text
ユーザ最終合意
→ 01_chatgpt/03_Data/Leisure/04_HTMLViewer/00_UserAgreement.md

表示系4領域責務
→ 01_chatgpt/03_Data/Leisure/01_Canonical/00_DisplayArchitecture.md

HTML Viewer入力意味
→ 01_chatgpt/03_Data/Leisure/04_HTMLViewer/01_InputContract.md

Presentation / interaction grammar
→ 01_chatgpt/03_Data/Leisure/04_HTMLViewer/02_Presentation.md

物理JSON
→ 01_chatgpt/03_Data/Leisure/04_HTMLViewer/Schemas/**

最新進捗
→ 01_chatgpt/01_Context/03_Active/Leisure/00_Current.md
→ 01_chatgpt/01_Context/03_Active/Leisure/Work/04_HTML-Viewer-Progress.md
```

`80_Memo/**`、History、old Closure / Amendment / Audit / PlanからViewer仕様を復元しません。

## Core responsibility

Viewerが行う:
- DOM / CSS / responsive layout
- accordion / selector / tab / carousel / map interaction
- Viewer内navigation
- semantic codeからpresentation mapping
- Boundaryが明示したsupplemental artifactのload
- local interaction state

Viewerが行わない:
- Canonical / related Entityを意味補完目的でruntime fetch
- label / summary / Day title / warning / reorder option生成
- Domain / Display semantic推測
- time / distance / cost / weather等の再計算
- old JSON shapeやLegacy DOMから意味を復元

## Coexistence invariants

1. root `index.html` がModern productionの単一entrypoint。
2. Legacyは `legacy/index.html` 等に凍結しcomparison evidenceに限定。
3. `index2.html` 等の別Modern entrypointを増やさない。
4. Modern codeはroot `app.js`, `presentation/**`, `legacy/**` に依存しない。
5. Incomplete pageを理由にLegacyへfallbackしない。
6. current page build stateは `/viewer-build-status.json` が所有する。

## Normal path

```text
index.html
  ↓
viewer/main.js
  ├─ request identity解決
  ├─ primary Boundary JSON load
  ├─ PageContext生成
  ├─ common navigation
  └─ page.render(PageContext)
       ├─ presentation / interaction
       └─ explicit artifact load
```

## PageContext

```js
{
  request: { type: string, id: string | null },
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

`data` はそのページのprimary HTML Boundary input。
`resources` はBoundaryが明示したsupplemental artifactだけを読む。

## Responsibilities

- `viewer/main.js`: composition root / request解決 / primary input load / PageContext / page dispatch
- `viewer/core/request.js`: URLのtype / id解析
- `viewer/core/navigation.js`: Viewer navigation / history context
- `viewer/core/data.js`: JSON resource access
- `viewer/<page>/`: page-specific presentation / interaction
- `viewer/shared/`: cross-page presentation component。Domain meaningを所有しない

## Data rule

```text
Primary input
= pageのHTML Boundary JSON

Supplemental input
= Boundaryで明示されたRouteDetail / Map等のartifact
```

Manifestやrelated Entityを汎用semantic lookupに使いません。

## Current build state

```text
Top             implemented
Spot            implemented
Route           implemented
Plan            skeleton
ConcretePlan    skeleton
```

詳細な最新進捗はObsidian Active Contextをauthorityとし、本Architectureへ進捗履歴を蓄積しません。

## Plan / ConcretePlan whole-Day reorder

Boundary側で完成済みにする:

```text
Plan
- fixed display position
- available Day content options
- completed option labels
- displayed option / local initial state

ConcretePlan
- fixed execution ordinal / date / weekday
- date-bound Weather等
- movable Day content
- completed reorder options
```

Viewerが所有する:

```text
select / dropdown等のpresentation
local interaction state
completed contentの切替
accessibility / responsive behavior
```

Viewerが禁止されるもの:

```text
source Plan runtime fetch
reorder group推論
pairwise relationからoption生成
slot/source_day mapping生成
Day title生成
Weather/date-bound Factの付替え
local stateのCanonical化
```

ConcretePlanのDay切替時にどのExecution packageまで切り替えるかは、`04_HTMLViewer/00_UserAgreement.md` / `04_HTMLViewer/01_InputContract.md` で未確定のまま保持し、Viewer側で独自決定しません。

## Testing / CI

新しいTest / Guard / CI追加・拡張はデフォルト作業に含めません。必要な場合はユーザ承認を得ます。
