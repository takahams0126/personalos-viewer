# RouteModel View PoC

この配下は `_prototype/poc/README.md` に従う **non-canonical / non-runtime / non-production** の表示検証です。

## Purpose

RouteModel Canonical をそのままHTMLへ流さず、Publication / ViewModel生成で表示用shapeへProjectionした後、汎用JS Rendererで ConcretePlan Day の「ルート詳細」を表示できるか検証する。

ConcretePlanから利用する場合は、RouteModelに実施日固有情報を混ぜず、表示用ViewModel生成時だけ RouteExecution の実時間軸を合成する。

```text
RouteModel Canonical
        +
ConcretePlan RouteExecution（optional）
        ↓ Publication / ViewModel generation
RouteModel ViewModel
        ↓
route-model renderer
        ↓
HTML
```

今回のfixtureは、正本 `RM001`（R005 縄文杉往復 / YAMAP公開モデルコース）の値に、**PoC用の仮開始時刻 08:00** をRouteExecution相当の表示コンテキストとして与えたもの。fixture自体は正本ではない。

## Responsibility boundary

RouteModel表示は ConcretePlan Day の3ビューのうち **「ルート詳細」だけ**を担当する。

```text
ConcretePlan Day
├─ 行動順      ← ConcretePlan execution flow
├─ ルート詳細  ← RouteModel ViewModel（このPoC）
└─ マップ      ← Day単位の実道路Map artifact / Google Maps
```

- ConcretePlan execution flow と RouteModel は疎結合を維持する。
- Flow側へRouteModel waypointを複製しない。
- RouteModel Canonicalは絶対時刻を持たない。
- ConcretePlan表示では RouteExecution timeline の実時刻を主時間軸にする。
- RouteExecution timelineが未確定なら、planned start + RouteModel relative time等をPublication側で表示時刻へ解決できる。
- それも無い場合はRouteModelの相対時間だけで表示できる。
- **Renderer自身は時刻計算・Canonical解釈をしない。** ViewModelの `time.primary / time.secondary` をそのまま表示する。
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
├─ time_axis
│  ├─ mode
│  ├─ label
│  ├─ start_at
│  ├─ primary
│  └─ secondary
├─ waypoints[]
│  ├─ id
│  ├─ phase_label?
│  ├─ label
│  ├─ time
│  │  ├─ primary
│  │  └─ secondary?
│  ├─ badges[]
│  └─ next_segment?
│     └─ duration
└─ notes[]
```

表示上のポイント:

- ConcretePlan連携時は `time.primary` に実時刻を置き、相対経過時間は補助表示にする。
- `next_segment.duration` はWaypoint自身の補足ではなく、**現在地点と次地点の間**に表示する。
- `badges[]` はWaypoint名の直後へinline表示する。
- `phase_label` はCanonical directionを表示用に「往路 / 折返し / 復路」へProjectionした値で、Rendererはdirectionを解釈しない。
- kind / facilities等もPublication側で人間向けbadgeへ変換し、RendererにDomain解釈を持たせない。

## Visual grammar

正式ViewerのCSSへ直接依存はしないが、PoCの見た目は現行 Plan / ConcretePlan のDay / Flow表現へ寄せる。

- Day card系のsurface / border / radius / shadow
- Flow系の縦軸とroute色
- compactなbadge
- モバイル時も時間軸・地点名・地点間所要を読み分けられる配置

正式化時はPoC CSSをそのまま持ち込まず、Modern ViewerのShared Day / Flow styleへ再実装する。

## Files

- `data/RM001.view.json` — RM001 + 仮RouteExecution時刻から手作業ProjectionしたRouteModel ViewModel
- `app.js` — route / provider / Day固有条件を持たない汎用Renderer
- `index.html` — 独立表示ページ
- `style.css` — PoC専用style

## Non-goals

- RouteModel Canonical / Schemaの変更
- ConcretePlan本体への組込み
- Publication generatorの実装
- 実際のP001 Day2開始時刻の確定
- Day実道路Mapの実装
- 山岳Route内部mapの描画
- 正式Viewer shared moduleへの昇格

## Promotion criteria

1. 27 waypoint程度の実データ密度でもモバイル/デスクトップで読みやすい。
2. 実時刻を主軸に見たとき、次地点までの所要時間が直感的に分かる。
3. major spot / facility / junction / turnaround の強弱が自然。
4. 標準所要・距離・標高差・provider sourceが過不足なく理解できる。
5. RendererがRoute / provider / Day固有条件なしで描画できる。
6. ConcretePlan側から `route_model_id` とRouteExecution表示コンテキストを使って補助ViewModelを生成できる。

正式化時はfixture shapeをそのまま正本化せず、Publication / ViewModel Contractのownerで再評価する。
