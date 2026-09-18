# RouteModel View PoC

この配下は `_prototype/poc/README.md` に従う **non-canonical / non-runtime / non-production** の表示検証です。

## Purpose

RouteModel Canonical をそのままHTMLへ流さず、Publicationで表示用ViewModelへProjectionした後、汎用JS Rendererで「ルート詳細」を表示できるか検証する。

```text
RouteModel Canonical
  ↓ Publication（将来実装）
RouteModel ViewModel
  ↓
route-model renderer
  ↓
HTML
```

今回のfixtureは、正本 `RM001`（R005 縄文杉往復 / YAMAP公開モデルコース）の値を表示都合へ手作業でProjectionしたもの。fixture自体は正本ではない。

## Responsibility boundary

RouteModel表示は ConcretePlan Day の3ビューのうち **「ルート詳細」だけ**を担当する。

```text
ConcretePlan Day
├─ 行動順      ← ConcretePlan execution flow
├─ ルート詳細  ← RouteModel ViewModel（このPoC）
└─ マップ      ← Day単位の実道路Map artifact / Google Maps
```

- ConcretePlan execution flow と RouteModel は疎結合を維持する。
- Flow側は route element / route execution から `route_model_id` を参照できればよく、RouteModel waypointをFlowへ複製しない。
- RouteModelは絶対時刻を持たない。表示する時間はRoute開始からの相対経過時間・segment時間。
- Day実道路Mapは、宿・駐車場・バス停・trailhead等の現実世界の移動とRoute結節点までをGoogle Mapsで扱う。
- 山岳Route内部はGoogle Mapsへ展開しない。
- Route内部はYAMAP等の外部provider由来RouteModelのwaypoint・標準時間を「ルート詳細」で扱う。
- YAMAPのmap geometry取得・再描画は対象外。

## ViewModel contract under test

fixtureの主要shape:

```text
RouteModelViewModel
├─ route_model_id
├─ route_id
├─ title
├─ source
│  ├─ label
│  └─ url
├─ metrics[]
├─ endpoints
├─ sections[]
│  ├─ key / label
│  └─ waypoints[]
│     ├─ id
│     ├─ label
│     ├─ elapsed
│     ├─ segment_from_previous
│     └─ badges[]
└─ notes[]
```

`sections[]` はCanonicalの `direction` を表示向けに往路 / 折返し / 復路へまとめたProjection。`badges[]` もCanonicalの kind / facilities を人間向け表示へ変換済みで、RendererにCanonical解釈を持たせない。

## Files

- `data/RM001.view.json` — RM001から手作業Projectionした仮想RouteModel ViewModel
- `app.js` — route固有条件を持たない汎用Renderer
- `index.html` — 独立表示ページ
- `style.css` — PoC専用style

## Non-goals

- RouteModel Canonical / Schemaの変更
- ConcretePlan本体への組込み
- Publication generatorの実装
- ConcretePlanの絶対時刻・pace・breakの表示
- Day実道路Mapの実装
- 山岳Route内部mapの描画
- 正式Viewer shared moduleへの昇格

## Promotion criteria

以下を確認してから正式化を判断する。

1. 27 waypoint程度の実データ密度でもモバイル/デスクトップで読みやすい。
2. major spot / facility / junction / turnaround の強弱が自然。
3. 標準所要・距離・標高差・provider sourceが過不足なく理解できる。
4. RendererがRoute / provider / Day固有条件なしで描画できる。
5. ConcretePlan側から `route_model_id` だけで補助ViewModelを読み込める設計へ接続できる。

正式化時はfixture shapeをそのまま正本化せず、Publication / ViewModel Contractのownerで再評価する。
