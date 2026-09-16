from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONCRETE_DATA = ROOT / "data" / "concrete-plans"
PLAN_DATA = ROOT / "data" / "plans"
OUT_CONCRETE = ROOT / "_generated" / "data" / "concrete-plans"
OUT_PLANS = ROOT / "_generated" / "data" / "plans"


def load(path: Path, default=None):
    if not path.exists():
        return copy.deepcopy(default)
    return json.loads(path.read_text(encoding="utf-8"))


def ensure_variant(day: dict, variant_id: str, label: str | None = None, route_id: str | None = None):
    variants = day.setdefault("variants", [])
    for variant in variants:
        if variant.get("id") == variant_id or variant.get("variant_id") == variant_id:
            return variant
    variant = {"id": variant_id, "label": label or variant_id, "route_id": route_id, "summary": {}, "flow": []}
    variants.append(variant)
    return variant


def merge_detail(base: dict, detail: dict) -> dict:
    out = copy.deepcopy(base)
    days = out.setdefault("days", [])
    by_day = {int(day.get("day") or 0): day for day in days}
    for day_key, extra in (detail.get("days") or {}).items():
        day_no = int(day_key)
        day = by_day.get(day_no)
        proto = extra.get("prototype_variant")
        if day is None and proto:
            day = {"day": day_no, "date": extra.get("date"), "feasibility": "conditional", "variants": [copy.deepcopy(proto)]}
            days.append(day); by_day[day_no] = day
        if day is None: continue
        for key in ("date", "weekday", "wake_up_at", "purpose_override"):
            if extra.get(key) is not None: day[key] = copy.deepcopy(extra[key])
        day["day_of_checks"] = copy.deepcopy(extra.get("day_of_checks") or [])
        for variant_id, patch in (extra.get("variants") or {}).items():
            variant = next((v for v in day.get("variants") or [] if (v.get("id") or v.get("variant_id")) == variant_id), None)
            if variant is None and patch.get("prototype"):
                variant = ensure_variant(day, variant_id, patch.get("label"), patch.get("route_id"))
            if variant is None: continue
            if patch.get("label") is not None: variant["label"] = patch["label"]
            if patch.get("route_id") is not None: variant["route_id"] = patch["route_id"]
            variant["summary"] = {**(variant.get("summary") or {}), **copy.deepcopy(patch.get("summary_extra") or {})}
            if isinstance(patch.get("replace_flow"), list): variant["flow"] = copy.deepcopy(patch["replace_flow"])
            for idx, values in (patch.get("flow_details") or {}).items():
                try: item = variant.get("flow", [])[int(idx)]
                except (ValueError, IndexError): continue
                if isinstance(values, dict): item.update(copy.deepcopy(values))
    out["days"] = sorted(days, key=lambda d: int(d.get("day") or 0))
    return out


def merge_fuel_flow(base: dict, fuel: dict) -> dict:
    out = copy.deepcopy(base); patch = fuel.get("day5_flow_patch") or {}
    if not patch: return out
    day = next((d for d in out.get("days") or [] if int(d.get("day") or 0) == 5), None)
    if not day: return out
    variants = day.get("variants") or []
    variant = next((v for v in variants if (v.get("id") or v.get("variant_id")) == "standard"), variants[0] if variants else None)
    if not variant or not variant.get("flow"): return out
    flow = variant["flow"]
    free_time = patch.get("free_time")
    if free_time and not any(x.get("type") == "free_time" for x in flow):
        flow.insert(1, {"type":"free_time","time":free_time.get("time", ""),"label":free_time.get("label", "自由時間"),"note":free_time.get("note", "")})
    refuel = patch.get("refuel")
    if refuel and not any((x.get("ref") or {}).get("point_type") == "gas_station" for x in flow):
        station = next((s for s in fuel.get("travel_point_candidates") or [] if s.get("poc_id") == refuel.get("station_poc_id")), {})
        plan = next((p for p in fuel.get("planned_refuels") or [] if int(p.get("day") or 0) == 5 and p.get("kind") == "return_refuel"), {})
        return_index = next((i for i,x in enumerate(flow) if x.get("type") == "destination" and (x.get("ref") or {}).get("point_type") == "rental_car_office"), -1)
        if return_index >= 0:
            gas = {"type":"destination","time":refuel.get("time", ""),"ref":{"type":"travel_point","id":station.get("canonical_id") or station.get("poc_id"),"label":station.get("label", "給油候補"),"point_type":"gas_station"},"activities":[{"label":refuel.get("activity", "給油"),"duration":refuel.get("duration"),"required":refuel.get("required") is True}],"conditions":{"operating_hours":station.get("hours"),"refuel_reason":plan.get("reason"),"refuel_checks":" / ".join(plan.get("checks") or []) or None}}
            flow[return_index:return_index] = [gas, {"type":"transfer","mode":"rental_car","duration":"未算定"}]
    return out


def merge_feasibility_flow(base: dict, feasibility: dict) -> dict:
    out = copy.deepcopy(base); by_day = {int(d.get("day") or 0):d for d in out.get("days") or []}
    for day_key, spec in (feasibility.get("days") or {}).items():
        day = by_day.get(int(day_key))
        if not day: continue
        for variant_id, variant_spec in (spec.get("variants") or {}).items():
            replacement = variant_spec.get("replace_flow")
            if not isinstance(replacement, list): continue
            variant = next((v for v in day.get("variants") or [] if (v.get("id") or v.get("variant_id")) == variant_id), None)
            if variant is None: variant = ensure_variant(day, variant_id, variant_spec.get("label"), variant_spec.get("route_id"))
            variant["flow"] = copy.deepcopy(replacement)
    return out


def strip_source_meta(value: dict) -> dict:
    result = copy.deepcopy(value)
    for key in ("schema_version", "poc", "demo", "purpose", "source_policy", "notice", "source_plan_id"):
        result.pop(key, None)
    return result


def build_concrete(base_path: Path) -> dict:
    entity_id = base_path.stem; base = load(base_path, {})
    detail = load(CONCRETE_DATA / f"{entity_id}-detail-poc.json", {})
    feasibility = load(CONCRETE_DATA / f"{entity_id}-feasibility-poc.json", {})
    fuel = load(CONCRETE_DATA / f"{entity_id}-fuel-poc.json", {})
    weather = load(CONCRETE_DATA / f"{entity_id}-weather-poc.json", {})
    meta = load(CONCRETE_DATA / f"{entity_id}-meta-poc.json", {})
    concrete = merge_feasibility_flow(merge_fuel_flow(merge_detail(base, detail), fuel), feasibility)
    weather_by_day = weather.get("days") or {}; feasibility_by_day = feasibility.get("days") or {}
    for day in concrete.get("days") or []:
        key = str(int(day.get("day") or 0))
        if key in weather_by_day: day["weather_assessment"] = copy.deepcopy(weather_by_day[key].get("weather_assessment"))
        if key in feasibility_by_day: day["execution_checks"] = copy.deepcopy(feasibility_by_day[key].get("execution_checks") or [])
    return {"schema_version":0,"view_type":"concrete_plan","id":meta.get("concrete_plan_id") or entity_id,"source_plan_id":meta.get("source_plan_id") or base.get("source_plan_id") or entity_id,"title":meta.get("title") or base.get("title") or entity_id,"summary":meta.get("description") or base.get("notice"),"status":meta.get("status") or "conditional","last_verified_at":meta.get("last_verified_at"),"execution_window":copy.deepcopy(detail.get("execution_window") or {}),"booking_connections":copy.deepcopy(detail.get("booking_connections") or []),"shared_execution_info":copy.deepcopy(detail.get("shared_execution_info") or {}),"days":copy.deepcopy(concrete.get("days") or []),"fuel_plan":strip_source_meta(fuel),"cost_summary":copy.deepcopy(feasibility.get("trip_cost_summary") or {}),"display":copy.deepcopy(meta.get("display") or {})}


def build_plan(base_path: Path) -> dict:
    entity_id = base_path.stem
    out = copy.deepcopy(load(base_path, {}))
    decisions = load(PLAN_DATA / f"{entity_id}-decisions.json", {})
    by_day = decisions.get("day_decisions") or {}
    for day in (out.get("plan") or {}).get("days") or []:
        decision = by_day.get(str(int(day.get("day") or 0))) or {}
        if not decision: continue
        if decision.get("base_route") is not None: day["base_route"] = copy.deepcopy(decision["base_route"])
        if decision.get("overview_badges") is not None: day["overview_badges"] = copy.deepcopy(decision["overview_badges"])
        if decision.get("alternatives") is not None: day["alternatives"] = copy.deepcopy(decision["alternatives"])
    return out


def main():
    OUT_CONCRETE.mkdir(parents=True, exist_ok=True); OUT_PLANS.mkdir(parents=True, exist_ok=True)
    for base_path in sorted(CONCRETE_DATA.glob("*.json")):
        stem = base_path.stem
        if any(stem.endswith(s) for s in ("-detail-poc","-feasibility-poc","-fuel-poc","-meta-poc","-weather-poc")): continue
        target = OUT_CONCRETE / base_path.name
        target.write_text(json.dumps(build_concrete(base_path), ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        print(target.relative_to(ROOT))
    for base_path in sorted(PLAN_DATA.glob("*.json")):
        if base_path.stem.endswith("-decisions"): continue
        target = OUT_PLANS / base_path.name
        target.write_text(json.dumps(build_plan(base_path), ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
        print(target.relative_to(ROOT))


if __name__ == "__main__": main()
