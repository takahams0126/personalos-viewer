# Modern Viewer

`viewer/**` はPersonalOS Viewerの正規Modern実装です。root `index.html` からのみ起動します。

Modern ViewerはLegacy Viewerの移植先ではありません。**現在のDisplay契約から新規に作り直す実装**です。

Legacy比較実装は `legacy/index.html` + root `app.js` + `presentation/**` + `legacy/**` に凍結されています。Modern実装でLegacyのコードやDOM上書きパターンを再利用しません。

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the architecture contract and repository-root [`viewer-build-status.json`](../viewer-build-status.json) for machine-readable build state.

## Current build state

```text
Top             implemented
Spot            implemented
Route           implemented
Plan            skeleton
ConcretePlan    skeleton
```

`implemented` は「旧実装から移行済み」ではなく、Modern側で新規実装が成立していることを示します。

Plan / ConcretePlanが未完成でもModern rootを取り下げません。root `index.html` は常にModernの正規入口とし、`viewer/plan/` / `viewer/concrete-plan/` をModern設計で完成させます。

現在の次工程はDisplay Pipeline Phase 2です。Obsidian `80_Memo/Leisure-Display-Pipeline/` のHTML Boundaryを固定入力として、fixture JSON → Modern Renderer → 合意済みFinal Displayの再現を先に実証します。Canonical Schema / Builder都合やLegacy DOMから画面を逆設計しません。

```text
viewer/
├─ main.js                 # composition root: request → primary entity → one page
├─ core/
│  ├─ request.js           # URL/request parsing
│  └─ data.js              # Viewer JSON data access / entity paths
├─ shared/                 # cross-page presentation + provider adapters
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
  ↓ load primary entity exactly once
page.render({ request, data })
  ↓
page-specific render
  └─ optional supplemental JSON via core/data.js::loadJson()
```

## Entry invariants

- Modern production entrypoint is root `index.html` only.
- `index2.html` 等の別Modern entrypointを増やさない。
- `index.html` にLegacyの `app.js`, `config.js`, `presentation/**` を読み込ませない。
- Modern codeは `legacy/**`, root `app.js`, `presentation/**` に依存しない。
- Plan / ConcretePlan未完成を理由にLegacyをrootへ戻さない。
- Legacyは表示比較・回帰確認のための凍結baselineであり、Normal Pathでもfallbackでもない。
- New implementation is derived from current Display contracts, not by porting Legacy implementation.

`viewer-build-status.json` がページ単位のModern実装状況を、`viewer/ARCHITECTURE.md` がModern Zoneの責務と依存方向を定義します。
