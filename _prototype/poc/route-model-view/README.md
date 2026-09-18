# RouteModel View PoC

この配下は `_prototype/poc/README.md` に従う **non-canonical / non-runtime / non-production** の表示検証です。

## Purpose

RouteModel CanonicalをそのままHTMLへ流さず、ConcretePlanのRouteExecutionを必要に応じて重ねたうえで、Publication / ViewModel生成が表示用shapeへProjectionし、汎用JS RendererでConcretePlan Dayの「ルート詳細」を表示できるか検証する。

```text
RouteModel Canonical
        +
ConcretePlan RouteExecution
        ↓ Publication / ViewModel generation
RouteModel ViewModel
        ↓
route-model renderer
        ↓
HTML
```

RouteModelは日付・絶対時刻・当日の休憩を所有しない。RouteExecutionが実施開始時刻・pace・breakを所有し、ViewModel生成時に到着時刻・出発時刻・累積経過時間へ解決する。

## Canonical semantics already available

現行 `Schemas/concrete-plan.schema.json` の `routeExecutionBreak` には、すでに以下が定義されている。

```text
break_id
after_waypoint_id
before_waypoint_id
duration_min
reason
required
```

したがって今回Schema fieldは追加しない。

特定Waypointでの休憩は、RouteModel waypoint列上の境界として表現する。このPoCでは縄文杉 `W014` 到着後、復路最初の大王杉 `W015` へ進む前に30分休憩する。

```text
W014 縄文杉 到着 13:30
      ↓
RouteExecution break
  after_waypoint_id: W014
  before_waypoint_id: W015
  duration_min: 30
      ↓
14:00 出発
      ↓ 40分
W015 大王杉 到着 14:40
```

`data/RM001.execution.json` はこの意味を試すPoC wrapperであり、正式ConcretePlan recordではない。`route_execution` 配下だけを現行Concrete Plan Schemaのshapeに合わせている。

## Responsibility boundary

```text
ConcretePlan Day
├─ 行動順      ← ConcretePlan execution flow
├─ ルート詳細  ← RouteModel + RouteExecution → ViewModel（このPoC）
└─ マップ      ← Day単位の実道路Map artifact / Google Maps
```

- ConcretePlan execution flow と RouteModel は疎結合を維持する。
- Flow側へRouteModel waypointを複製しない。
- RouteModel Canonicalは絶対時刻・当日休憩を持たない。
- RouteExecutionが開始時刻・pace・break等の実施条件を持つ。
- ViewModel生成がRouteModel + RouteExecutionを解決し、HTMLが必要な完成表示入力を作る。
- **Renderer自身は時刻計算・break加算・Canonical解釈をしない。**
- Day実道路Mapは、宿・駐車場・バス停・trailhead等の現実世界の移動とRoute結節点までをGoogle Mapsで扱う。
- 山岳Route内部はGoogle Mapsへ展開しない。
- Route内部map geometryはこのPoCでは扱わない。

## ViewModel contract under test

```text
RouteModelViewModel
├─ route_model_id
├─ route_id
├─ title
├─ source
├─ metrics[]
├─ endpoints
├─ time_axis
│  ├─ start_at
│  └─ end_at
├─ waypoints[]
│  ├─ id
│  ├─ phase
│  ├─ phase_marker?
│  ├─ emphasis?
│  ├─ label
│  ├─ time
│  │  ├─ primary          # 実時刻
│  │  └─ secondary?      # 休憩込み実施経過時間
│  ├─ badges[]
│  ├─ break?
│  │  ├─ duration
│  │  ├─ reason
│  │  └─ departure_at
│  └─ next_segment?
│     └─ duration         # 次Waypointまでの移動時間
└─ notes[]
```

## Display rules under test

- タイムラインの点は必ずWaypointを表す。区間時間や往路/復路ラベルに点を割り当てない。
- 往路は実線、復路は破線で区別する。
- 往路 / 復路は各Waypointへ繰り返し表示せず、セクションmarkerとして表示する。
- 折り返し地点は独立marker + 強調card + 四角いtimeline pointで明示する。
- badgeはWaypoint名の直後へinline表示する。
- 黄色の時間は現在Waypointから**次Waypointまで**の区間時間としてtimeline軸中央に置く。
- `time.secondary` は「経過 6:40」のように、Route開始からの**休憩込み実施経過時間**であることを明示する。
- 休憩はWaypoint到着後の滞在として表示し、休憩時間・理由・出発時刻をまとめて表示する。

## Sample execution

今回の仮入力:

```text
08:00 Route開始
13:30 縄文杉 到着
13:30–14:00 昼食・休憩 30分
14:00 復路へ出発
18:58 Route終了見込
```

RouteModel標準所要は10時間28分、RouteExecutionの休憩30分を加えた実施見込は10時間58分。

## Files

- `data/RM001.execution.json` — Canonical-compatible `route_execution` fragmentを含む仮入力
- `data/RM001.view.json` — RM001 + 仮RouteExecutionから手作業Projectionした表示用ViewModel
- `app.js` — route / provider / Day固有条件を持たないRenderer
- `index.html` — 独立表示ページ
- `style.css` — PoC専用style

## Non-goals

- RouteModel Canonical / Concrete Plan Schemaの変更
- 正式ConcretePlan recordの新規登録
- ConcretePlan本体への組込み
- Publication generatorの実装
- 実際のP001 Day2開始時刻・休憩時間の確定
- Day実道路Mapの実装
- 山岳Route内部mapの描画
- 正式Viewer shared moduleへの昇格

## Promotion criteria

1. 27 waypoint程度でもモバイル/デスクトップで読みやすい。
2. 往路 / 折返し / 復路を一目で区別できる。
3. 到着 → 休憩 → 出発 → 次区間という時間構造が自然に読める。
4. 実時刻、累積経過、次地点までの区間時間が混同されない。
5. RendererがRoute / provider / Day固有条件なしで描画できる。
6. ConcretePlan RouteExecutionから同じViewModel shapeをPublication側で生成できる。

正式化時はfixture shapeをそのままCanonical化せず、Publication / ViewModel Contractのownerで再評価する。
