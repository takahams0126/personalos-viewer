#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROUTE_DIR = ROOT / "data" / "routes"
APP = ROOT / "app.js"
ROUTE_VIEW = ROOT / "data" / "route-demo.js"

FORBIDDEN_MAP_KEYS = {"route_json", "actual_distance_m", "actual_time_s", "actual_duration_s", "road_geometry"}


def fail(errors, path, where, message):
    errors.append(f"{path} :: {where} :: {message}")


def validate_route(path: Path, errors: list[str]):
    rel = path.relative_to(ROOT)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(errors, rel, "$", f"invalid JSON: {exc}")
        return

    if data.get("view_type") != "route":
        fail(errors, rel, "$.view_type", "must be 'route'")
    route = data.get("route")
    if not isinstance(route, dict):
        fail(errors, rel, "$.route", "must be an object")
        return
    if "design_info" in route or "traversals" in route:
        fail(errors, rel, "$.route", "Route design information must not be projected by default")

    map_data = data.get("map")
    if map_data is not None:
        if not isinstance(map_data, dict):
            fail(errors, rel, "$.map", "must be an object")
        else:
            if map_data.get("path_mode") not in (None, "conceptual"):
                fail(errors, rel, "$.map.path_mode", "Public Route map must be conceptual")
            for key in FORBIDDEN_MAP_KEYS:
                if key in map_data:
                    fail(errors, rel, f"$.map.{key}", "real-road execution data is not part of Public Route projection")


def validate_renderers(errors: list[str]):
    app_text = APP.read_text(encoding="utf-8")
    app_rel = APP.relative_to(ROOT)
    forbidden = (
        "m?.route_json",
        "actual_time_s",
        "actual_distance_m",
        "実際の道路",
        "id=\"map-actual\"",
        "id=\"route-summary\"",
    )
    for token in forbidden:
        if token in app_text:
            fail(errors, app_rel, "$renderer.route", f"legacy real-road Route renderer behavior remains: {token}")

    route_text = ROUTE_VIEW.read_text(encoding="utf-8")
    route_rel = ROUTE_VIEW.relative_to(ROOT)
    if "routeId === 'R011'" in route_text:
        fail(errors, route_rel, "$renderer.route", "Route enhancement must not be hard-coded to R011")


def main() -> int:
    errors: list[str] = []
    files = sorted(ROUTE_DIR.glob("*.json")) if ROUTE_DIR.exists() else []
    for path in files:
        validate_route(path, errors)
    validate_renderers(errors)
    print(f"Route public projection validation: routes={len(files)}")
    if errors:
        print(f"FAILED: {len(errors)} error(s)")
        for error in errors:
            print("-", error)
        return 1
    print("OK: Route public JSON and renderer use conceptual Route semantics only")
    return 0


if __name__ == "__main__":
    sys.exit(main())
