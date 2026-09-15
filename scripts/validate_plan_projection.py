#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN_DIR = ROOT / "data" / "plans"
APP = ROOT / "app.js"
DAY_VM = ROOT / "data" / "day-viewmodel.js"

ALLOWED_FLOW_TYPES = {"transfer", "destination", "route", "free_time"}
LEGACY_TOKENS = ("route_endpoint",)


def fail(errors, path, where, message):
    errors.append(f"{path} :: {where} :: {message}")


def validate_plan(path: Path, errors: list[str]):
    rel = path.relative_to(ROOT)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(errors, rel, "$", f"invalid JSON: {exc}")
        return

    if data.get("view_type") != "plan":
        fail(errors, rel, "$.view_type", "must be 'plan'")
    if "map" in data:
        fail(errors, rel, "$.map", "Plan-wide map is not part of the standard public projection")

    plan = data.get("plan")
    if not isinstance(plan, dict):
        fail(errors, rel, "$.plan", "must be an object")
        return
    if "strategies" in plan or "design_info" in plan:
        fail(errors, rel, "$.plan", "Plan design information must not be projected by default")

    for di, day in enumerate(plan.get("days") or []):
        base = f"$.plan.days[{di}]"
        if "appeal" in day:
            fail(errors, rel, base + ".appeal", "legacy day.appeal is not allowed; use summary")
        if "summary" not in day:
            fail(errors, rel, base + ".summary", "summary is required in the current Plan projection")
        for fi, item in enumerate(day.get("flow") or []):
            where = f"{base}.flow[{fi}]"
            kind = item.get("type")
            if kind not in ALLOWED_FLOW_TYPES:
                fail(errors, rel, where + ".type", f"unsupported flow type: {kind!r}")
            if kind == "transfer" and ("from" in item or "to" in item):
                fail(errors, rel, where, "transfer.from/to must not be projected")
            if kind == "destination":
                ref = item.get("destination_ref")
                if not isinstance(ref, dict) or ref.get("type") not in {"spot", "travel_point"} or not ref.get("id"):
                    fail(errors, rel, where + ".destination_ref", "must be a Spot or TravelPoint ref")
            if kind == "route":
                ref = item.get("route_ref")
                if not isinstance(ref, dict) or ref.get("type") != "route" or not ref.get("id"):
                    fail(errors, rel, where + ".route_ref", "must be a Route ref")
            if kind == "free_time" and any(k in item for k in ("destination_ref", "spot_ref", "route_ref")):
                fail(errors, rel, where, "free_time must not carry a location/entity ref")

    raw = path.read_text(encoding="utf-8")
    for token in LEGACY_TOKENS:
        if token in raw:
            fail(errors, rel, "$legacy", f"legacy token remains: {token}")


def validate_base_renderer(errors: list[str]):
    rel = APP.relative_to(ROOT)
    text = APP.read_text(encoding="utf-8")
    legacy = (
        "endpoint.type === 'route_endpoint'",
        "item.type === 'spot'",
        "item.type === 'activity'",
        "item.from), to = endpointInline(item.to)",
        "旅全体の地図",
        "旅を成立させる設計",
        "変動要素・リスク",
    )
    for token in legacy:
        if token in text:
            fail(errors, rel, "$renderer", f"legacy Plan renderer behavior remains: {token}")


def validate_day_viewmodel(errors: list[str]):
    rel = DAY_VM.relative_to(ROOT)
    text = DAY_VM.read_text(encoding="utf-8")
    legacy = (
        "planDay.summary||planDay.appeal",
        "v.id===variantId",
        "{id:'standard'",
    )
    for token in legacy:
        if token in text:
            fail(errors, rel, "$viewmodel", f"legacy Day ViewModel behavior remains: {token}")
    if "v.variant_id===variantId" not in text:
        fail(errors, rel, "$viewmodel", "Concrete variant selection must use variant_id")


def main() -> int:
    errors: list[str] = []
    files = sorted(PLAN_DIR.glob("*.json")) if PLAN_DIR.exists() else []
    for path in files:
        validate_plan(path, errors)
    validate_base_renderer(errors)
    validate_day_viewmodel(errors)
    print(f"Plan public projection validation: plans={len(files)}")
    if errors:
        print(f"FAILED: {len(errors)} error(s)")
        for error in errors:
            print("-", error)
        return 1
    print("OK: Plan public JSON, base renderer, and shared Day ViewModel use current projection semantics")
    return 0


if __name__ == "__main__":
    sys.exit(main())
