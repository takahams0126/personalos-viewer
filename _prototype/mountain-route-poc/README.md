# Mountain Route PoC — YAMAP → Concrete execution

この配下は `_prototype/README.md` に従う **non-canonical / non-runtime / non-production** の独立検証です。
正式な Plan / Concrete Plan / Schema / Skill / Viewer runtime は変更しません。

## Purpose

Leisure Route は魅力・主要Spot・体験順序を表すCanonicalとして維持し、`go-plan / leisure-concretize` 実行時に山岳Routeを現実世界の実行ルートへ解決できるか検証する。

今回の入力は P001 Day2 の `R005 縄文杉ルート・縄文杉往復`。

検証する流れ:

```text
R005 (conceptual Route)
  ↓
YAMAP 公開モデルコース検索
  ↓
主要Spot / 往復方向 / route intent の一致確認
  ↓
Mountain execution data
  - trailhead
  - timed waypoints
  - total duration
  - distance
  - ascent / descent
  - source evidence
  ↓
Concrete Day 風の表示
```

## Current sample

- YAMAP公開モデルコース: `荒川登山口-ウィルソン株-縄文杉 往復コース`
- model course id: `25891`
- standard time: `10:28`
- distance: `19.8 km`
- ascent/descent: `1,171 m / 1,171 m`
- PoC仮開始時刻: `08:00`
- PoC仮終了見込み: `18:28`

PoCではYAMAP公開モデルコースの標準タイムをそのまま相対時間として使い、開始時刻だけ08:00へシフトする。休憩・実際の出発時刻・当日条件はまだ反映しない。

## Files

- `data/jomonsugi-yamap-model.json` — YAMAP公開モデルコース由来のPoC中間データ
- `index.html` — 独立表示ページ
- `app.js` — timeline描画
- `style.css` — PoC専用style

## Non-goals

- Canonical Route / Plan / Concrete Plan の変更
- `leisure-concretize` Skill定義の変更
- 本番Viewerの `app.js` / `data/plans/P001.json` の変更
- YAMAP map geometryの取得・再描画
- 8:00開始を実計画として確定すること

## What this PoC should answer

1. R005のような魅力中心Routeから、意図したYAMAPモデルコースを解決できるか。
2. 公開モデルコースのcheckpoint列から `route_execution.timed_waypoints` 相当を生成できるか。
3. 山岳区間をConcrete Dayの時間軸へ入れる価値があるか。
4. Google移動区間と山岳executionを責務分離したまま接続できるか。
