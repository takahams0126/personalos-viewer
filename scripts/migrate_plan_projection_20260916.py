#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN_PATH = ROOT / "data" / "plans" / "P001.json"
APP_PATH = ROOT / "app.js"


def ref(type_, id_, label, **extra):
    value = {"type": type_, "id": id_, "label": label}
    value.update(extra)
    return value


def replace_function(text: str, start_name: str, next_name: str, replacement: str) -> str:
    start = text.index(f"function {start_name}")
    end = text.index(f"function {next_name}", start)
    return text[:start] + replacement.rstrip() + "\n\n" + text[end:]


def route_data(old: dict):
    by_id = {}
    for day in old.get("plan", {}).get("days", []):
        for flow in day.get("flow", []):
            if flow.get("type") == "route" and flow.get("route_ref", {}).get("id"):
                by_id[flow["route_ref"]["id"]] = flow
    return by_id


def migrate_plan():
    old = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
    routes = route_data(old)

    home = ref("travel_point", "T0001", "自宅", point_type="home")
    haneda = ref("travel_point", "T0002", "羽田空港", point_type="airport")
    yakushima_airport = ref("travel_point", "T0003", "屋久島空港", point_type="airport")
    rental_office = ref("travel_point", "T0005", "屋久島空港周辺レンタカー営業所", point_type="rental_car_office")
    friend = ref("spot", "S0025", "素泊民宿 ふれんど")
    itsuki = ref("spot", "S0050", "お食事処 樹")
    kusugawa = ref("spot", "S0030", "楠川温泉")
    panorama = ref("spot", "S0046", "PANORAMA")

    def route_flow(fid, route_id, label, traversal, role="primary", alternatives=None, adjustments=None):
        old_flow = routes.get(route_id, {})
        value = {
            "flow_id": fid,
            "type": "route",
            "route_ref": ref("route", route_id, label, role=role),
            "traversal_id": traversal,
            "ordered_spot_refs": old_flow.get("ordered_spot_refs", []),
            "alternative_route_refs": alternatives or [],
            "adjustments": adjustments or [],
        }
        if old_flow.get("direction"):
            value["direction"] = old_flow["direction"]
        return value

    days = [
        {
            "day": 1,
            "purpose": "屋久島へ移動し、宮之浦に4泊の生活拠点を作る",
            "summary": "到着日に予定を詰め込まず、夕食・チェックイン・買い出し・登山準備までを整えて、翌日の長い山行を気持ちよく始められる状態にする",
            "start": home,
            "end": friend,
            "time_budget": {"expected_total": "1day", "preferred_start": "morning", "constraints": ["翌日の早朝登山準備を優先"]},
            "flow": [
                {"flow_id": "F1-01", "type": "transfer", "mode": "train"},
                {"flow_id": "F1-02", "type": "destination", "destination_ref": haneda, "role": "transfer", "activities": [], "notes": []},
                {"flow_id": "F1-03", "type": "transfer", "mode": "air"},
                {"flow_id": "F1-04", "type": "destination", "destination_ref": yakushima_airport, "role": "transfer", "activities": [], "notes": []},
                {"flow_id": "F1-05", "type": "transfer", "mode": "walk"},
                {"flow_id": "F1-06", "type": "destination", "destination_ref": rental_office, "role": "transfer", "activities": [{"activity": "rental_car_pickup", "label": "レンタカー受取", "duration_estimate": None}], "notes": []},
                {"flow_id": "F1-07", "type": "transfer", "mode": "rental_car"},
                {"flow_id": "F1-08", "type": "destination", "destination_ref": itsuki, "role": "dinner", "priority": "optional", "activities": [], "notes": ["移動で疲れていれば外食にこだわらず、自炊・軽食へ切り替えて翌日に備える"]},
                {"flow_id": "F1-09", "type": "transfer", "mode": "rental_car"},
                {"flow_id": "F1-10", "type": "destination", "destination_ref": friend, "role": "lodging", "priority": "primary", "activities": [{"activity": "check_in", "label": "チェックイン", "duration_estimate": None}, {"activity": "shopping_and_hiking_preparation", "label": "買い出し・登山準備", "duration_estimate": None}], "notes": []},
            ],
        },
        {
            "day": 2,
            "purpose": "屋久島旅行最大の山場として、長い一日を歩き切って【縄文杉】へ到達する",
            "summary": "トロッコ道、小杉谷の林業史、巨木の森を順にたどり、最後に【縄文杉】へ着くまでの全行程を一つの達成体験にする",
            "start": friend,
            "end": friend,
            "time_budget": {"expected_total": "long_day", "preferred_start": "early_morning", "constraints": ["日没前に山行を終える", "下山後は回復優先"]},
            "flow": [
                {"flow_id": "F2-01", "type": "transfer", "mode": "rental_car_and_mountain_access"},
                route_flow("F2-02", "R005", "縄文杉ルート・縄文杉往復", "canonical", alternatives=[ref("route", "R007", "縄文杉ルート・ウィルソン株往復")], adjustments=["天候・体調・進行遅れで縄文杉までの完遂が厳しい場合は、R007へ切り替えて森と巨木の体験を残す"]),
                {"flow_id": "F2-03", "type": "transfer", "mode": "rental_car_and_mountain_access"},
                {"flow_id": "F2-04", "type": "destination", "destination_ref": friend, "role": "lodging", "activities": [], "notes": []},
            ],
        },
        {
            "day": 3,
            "purpose": "前日の長い登山から身体を切り替え、海・滝・西部林道をつないで「山だけではない屋久島」を楽しむ。同時に山行日の天候調整にも使える一日にする",
            "summary": "車で島を巡りながら、【永田いなか浜】の海、【西部林道】の深い森、【大川の滝】の迫力へ景色を大きく変えていく。登山とは違う屋久島の振れ幅を楽しみつつ、山の天候が悪い日はDay2・Day4との入替余地を残す",
            "start": friend,
            "end": friend,
            "time_budget": {"expected_total": "8-10h", "preferred_start": "morning", "constraints": ["西部林道を遅い時間へ追いやらない"]},
            "flow": [
                route_flow("F3-01", "R011", "屋久島一周ドライブ", "miyanoura_counterclockwise", alternatives=[ref("route", "R010", "屋久島南部雨天ドライブ")], adjustments=["宮之浦泊では西部林道を明るい時間帯に通りやすい反時計回りを基本とする", "山行日の天候が悪い場合はDay2またはDay4と入替可能", "豪雨・強風時はR010へ切り替える"]),
                {"flow_id": "F3-02", "type": "destination", "destination_ref": friend, "role": "lodging", "activities": [], "notes": []},
            ],
        },
        {
            "day": 4,
            "purpose": "旅行後半のもう一つの主役として、白谷の水と苔の森から太鼓岩の大展望まで、景観が大きく変わるハイクを楽しむ",
            "summary": "縄文杉の長距離山行とは違い、半日程度で【白谷雲水峡】の清流、【苔むす森】の深い緑、【太鼓岩】の大展望を一続きで味わう。下山後は【楠川温泉】で回復し、【PANORAMA】で旅行最後の夜を楽しむ",
            "start": friend,
            "end": friend,
            "time_budget": {"expected_total": "full_day", "preferred_start": "morning", "constraints": ["増水時は山行を見直す"]},
            "flow": [
                {"flow_id": "F4-01", "type": "transfer", "mode": "rental_car"},
                route_flow("F4-02", "R004", "白谷雲水峡ルート・太鼓岩往復", "canonical"),
                {"flow_id": "F4-03", "type": "transfer", "mode": "rental_car"},
                {"flow_id": "F4-04", "type": "destination", "destination_ref": kusugawa, "role": "onsen", "priority": "primary", "activities": [], "notes": []},
                {"flow_id": "F4-05", "type": "transfer", "mode": "rental_car"},
                {"flow_id": "F4-06", "type": "destination", "destination_ref": panorama, "role": "dinner", "priority": "primary", "activities": [], "notes": []},
                {"flow_id": "F4-07", "type": "transfer", "mode": "rental_car"},
                {"flow_id": "F4-08", "type": "destination", "destination_ref": friend, "role": "lodging", "activities": [], "notes": []},
            ],
        },
        {
            "day": 5,
            "purpose": "最終日は観光量を稼がず、旅の疲労や買い忘れを吸収する余白を残して、安全に帰宅する",
            "summary": "最後まで予定を詰め込まないことで、4日間の疲れや天候変化を吸収し、レンタカー返却と空港移動を慌てず終える。余裕があれば近場の散策や買い物を楽しむ程度にとどめる",
            "start": friend,
            "end": home,
            "time_budget": {"expected_total": "1day", "preferred_start": "morning", "constraints": ["空港移動とレンタカー返却の余白を確保"]},
            "flow": [
                {"flow_id": "F5-01", "type": "free_time", "label": "自由時間・予備枠", "duration_estimate": None, "preferred_window": None, "notes": ["大きなRouteは置かず、帰路の余裕を優先する"]},
                {"flow_id": "F5-02", "type": "transfer", "mode": "rental_car"},
                {"flow_id": "F5-03", "type": "destination", "destination_ref": rental_office, "role": "transfer", "activities": [{"activity": "rental_car_return", "label": "レンタカー返却", "duration_estimate": None}], "notes": []},
                {"flow_id": "F5-04", "type": "transfer", "mode": "walk"},
                {"flow_id": "F5-05", "type": "destination", "destination_ref": yakushima_airport, "role": "transfer", "activities": [], "notes": []},
                {"flow_id": "F5-06", "type": "transfer", "mode": "air"},
                {"flow_id": "F5-07", "type": "destination", "destination_ref": haneda, "role": "transfer", "activities": [], "notes": []},
                {"flow_id": "F5-08", "type": "transfer", "mode": "train"},
                {"flow_id": "F5-09", "type": "destination", "destination_ref": home, "role": "end", "activities": [], "notes": []},
            ],
        },
    ]

    old_plan = old.get("plan", {})
    new = {
        "schema_version": old.get("schema_version", 3),
        "view_type": "plan",
        "id": "P001",
        "title": "屋久島 4泊5日基本Plan",
        "summary": "縄文杉、白谷雲水峡、島一周の海・滝・西部林道・温泉を4泊5日で重複少なく組み合わせる",
        "hero_refs": old.get("hero_refs", []),
        "parent_refs": old.get("parent_refs", []),
        "plan": {
            "transport": {"primary": "air_and_rental_car", "alternatives": []},
            "days": days,
            "trip_value": old_plan.get("trip_value", {}),
            "estimated_cost": old_plan.get("estimated_cost", {}),
            "risks": old_plan.get("risks", []),
        },
    }
    PLAN_PATH.write_text(json.dumps(new, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def migrate_app():
    text = APP_PATH.read_text(encoding="utf-8")

    endpoint = '''function endpointInline(endpoint) {
  if (!endpoint) return '';
  if (endpoint.type === 'travel_point') {
    const kind = endpoint.point_type ? `<span class="badge subtle">${esc(pointTypeLabel(endpoint.point_type))}</span>` : '';
    return `${esc(endpoint.label || endpoint.id || '')}${kind}`;
  }
  if (endpoint.type && endpoint.id) return refInline(endpoint);
  return esc(endpoint.label || endpoint.name || endpoint.id || '');
}'''
    text = replace_function(text, "endpointInline(endpoint)", "routeStops(item)", endpoint)

    flow = '''function flowItemHtml(item) {
  if (!item) return '';
  if (item.type === 'transfer') {
    const details = [item.duration_estimate, item.preferred_window].filter(Boolean).map(esc).join(' · ');
    return `<li class="flow-item transfer"><div class="flow-icon">↔</div><div><div class="flow-title">移動 <span class="badge">${esc(modeLabel(item.mode||''))}</span></div>${details?`<div class="flow-detail">${details}</div>`:''}</div></li>`;
  }
  if (item.type === 'route') {
    const traversalValue = item.direction || item.traversal_id;
    const traversal = item.traversal_id && item.traversal_id !== 'canonical' ? `<span class="badge">${esc(directionLabel(traversalValue))}</span>` : '';
    const alt = (item.alternative_route_refs||[]).length ? `<div class="flow-note">代替: ${(item.alternative_route_refs||[]).map(refInline).join(' / ')}</div>` : '';
    const adjust = (item.adjustments||[]).length ? `<div class="flow-note">${item.adjustments.map(esc).join(' / ')}</div>` : '';
    return `<li class="flow-item route"><div class="flow-icon">★</div><div><div class="flow-title">${refInline(item.route_ref||{})} ${traversal}</div>${routeStops(item)}${alt}${adjust}</div></li>`;
  }
  if (item.type === 'destination') {
    const ref = item.destination_ref || {};
    const role = item.role ? `<span class="badge">${esc(roleLabel(item.role))}</span>` : '';
    const priority = item.priority ? `<span class="badge">${esc(priorityLabel(item.priority))}</span>` : '';
    const activities = (item.activities||[]).length ? `<div class="flow-note">${item.activities.map(x=>esc(x.label || activityLabel(x.activity||''))).join(' / ')}</div>` : '';
    const fallback = (item.fallback_spot_refs||[]).length ? `<div class="flow-note">代替: ${item.fallback_spot_refs.map(refInline).join(' / ')}</div>` : '';
    return `<li class="flow-item destination"><div class="flow-icon">●</div><div><div class="flow-title">${endpointInline(ref)} ${role}${priority}</div>${activities}${fallback}${(item.notes||[]).map(x=>`<div class="flow-note">${esc(x)}</div>`).join('')}</div></li>`;
  }
  if (item.type === 'free_time') {
    return `<li class="flow-item free-time"><div class="flow-icon">○</div><div><div class="flow-title">${esc(item.label || '自由時間')}</div>${(item.notes||[]).map(x=>`<div class="flow-note">${esc(x)}</div>`).join('')}</div></li>`;
  }
  return '';
}'''
    text = replace_function(text, "flowItemHtml(item)", "timeBudgetHtml(tb)", flow)

    day = '''function dayHtml(day) {
  const flow = day.flow || [];
  const endpoints = day.start || day.end ? `<div class="day-endpoints">${endpointInline(day.start)}<span>→</span>${endpointInline(day.end)}</div>` : '';
  return `<article class="day-card">
    <header class="day-head"><div class="day-number">${esc(day.day)}日目</div><div><h3>${esc(day.purpose||'')}</h3>${day.summary?`<p>${esc(day.summary)}</p>`:''}</div></header>
    ${timeBudgetHtml(day.time_budget)}${endpoints}
    ${flow.length?`<ol class="flow-list">${flow.map(flowItemHtml).join('')}</ol>`:''}
  </article>`;
}'''
    text = replace_function(text, "dayHtml(day)", "tripValueHtml(v={})", day)

    render = '''function renderPlan(data) {
  const p=data.plan||{}; breadcrumb.innerHTML=`<a href="./">Home</a><span>›</span><span>${esc(data.id)}</span>`;
  const transport=p.transport?.primary ? `<span class="badge">${esc(modeLabel(p.transport.primary))}</span>` : '';
  app.innerHTML=`<section class="hero"><div class="kicker">旅のプラン · ${esc(data.id)}</div><h1>${esc(data.title)}</h1><p class="summary">${esc(data.summary||'')}</p>${transport?`<div class="hero-meta">${transport}</div>`:''}</section>
    ${tripValueHtml(p.trip_value||{})}
    ${(data.hero_refs||[]).length?`<section class="section"><h2>この旅の主役</h2><div class="cards">${data.hero_refs.map(refCard).join('')}</div></section>`:''}
    <section class="section itinerary"><div class="section-heading"><div><h2>日ごとの旅程</h2><p>その日の魅力と、旅を成立させる移動・宿泊・準備を順番に見られます。</p></div></div>${(p.days||[]).map(dayHtml).join('')}</section>`;
}'''
    text = replace_function(text, "renderPlan(data)", "renderRoute(data)", render)

    APP_PATH.write_text(text, encoding="utf-8")


if __name__ == "__main__":
    migrate_plan()
    migrate_app()
