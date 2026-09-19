#!/usr/bin/env python3
"""Architecture guard for the Modern Viewer zone.

Validates index.html + viewer/** while the frozen legacy implementation
coexists under legacy/ with its legacy app/presentation assets.
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWER = ROOT / "viewer"
MIGRATION = ROOT / "viewer-migration.json"
PAGE_DIRS = {"top", "spot", "route", "plan", "concrete-plan"}
PRIMARY_DATA_SEGMENTS = {
    "spot": "data/spots/",
    "route": "data/routes/",
    "plan": "data/plans/",
    "concrete-plan": "data/concrete-plans/",
}


@dataclass(frozen=True)
class Violation:
    rule: str
    path: Path
    reason: str
    fix: str


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def iter_modern_files() -> list[Path]:
    files: list[Path] = []
    entry = ROOT / "index.html"
    if entry.exists():
        files.append(entry)
    if VIEWER.exists():
        files.extend(sorted(p for p in VIEWER.rglob("*") if p.is_file()))
    return files


def js_files() -> list[Path]:
    return [p for p in iter_modern_files() if p.suffix == ".js"]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def check_migration_registry() -> list[Violation]:
    violations: list[Violation] = []
    if not MIGRATION.exists():
        return [Violation("MIGRATION-001", MIGRATION, "viewer-migration.json is missing.", "Restore the migration registry at repository root.")]

    try:
        data = json.loads(read(MIGRATION))
    except Exception as exc:  # noqa: BLE001
        return [Violation("MIGRATION-002", MIGRATION, f"Migration registry is not valid JSON: {exc}", "Fix viewer-migration.json so it parses as JSON.")]

    pages = data.get("pages", {})
    for page in PAGE_DIRS:
        state = pages.get(page)
        if not isinstance(state, dict) or "modern" not in state or "legacy_retained" not in state:
            violations.append(Violation("MIGRATION-003", MIGRATION, f"Missing migration state for page '{page}'.", f"Add pages.{page}.modern and pages.{page}.legacy_retained."))
            continue
        if state.get("modern"):
            module = VIEWER / page / f"{page}.js"
            if not module.exists():
                violations.append(Violation("MIGRATION-004", MIGRATION, f"'{page}' is marked modern but {rel(module)} does not exist.", "Create the modern page module or set modern=false until migration is complete."))
    return violations


def check_entrypoint_integrity() -> list[Violation]:
    entry = ROOT / "index.html"
    if not entry.exists():
        return [Violation("MODERN-009", entry, "Modern Viewer entrypoint index.html is missing.", "Restore index.html as the Modern Viewer entrypoint.")]

    text = read(entry)
    script_tags = re.findall(r"<script\b[^>]*>", text, flags=re.IGNORECASE)
    main_tags = [tag for tag in script_tags if re.search(r"\bsrc=['\"](?:\./)?viewer/main\.js['\"]", tag, flags=re.IGNORECASE)]
    violations: list[Violation] = []

    if len(main_tags) != 1:
        violations.append(Violation("MODERN-009", entry, f"index.html must load viewer/main.js exactly once; found {len(main_tags)} references.", "Keep exactly one <script type=\"module\" src=\"./viewer/main.js\"></script> entrypoint."))
    elif not re.search(r"\btype=['\"]module['\"]", main_tags[0], flags=re.IGNORECASE):
        violations.append(Violation("MODERN-009", entry, "viewer/main.js is not loaded as an ES module.", "Load viewer/main.js with <script type=\"module\">."))

    forbidden: list[str] = []
    for tag in script_tags:
        match = re.search(r"\bsrc=['\"]([^'\"]+)['\"]", tag, flags=re.IGNORECASE)
        if not match:
            continue
        src = match.group(1).split("?", 1)[0].split("#", 1)[0].lstrip("./")
        if src in {"app.js", "config.js"} or src.startswith("presentation/"):
            forbidden.append(match.group(1))

    if forbidden:
        violations.append(Violation("MODERN-009", entry, f"Modern entrypoint loads legacy scripts: {', '.join(forbidden)}", "Keep legacy scripts on legacy/index.html only; index.html must enter through viewer/main.js."))
    return violations


def check_page_url_parsing(path: Path, text: str) -> list[Violation]:
    parts = path.relative_to(VIEWER).parts
    if not parts or parts[0] not in PAGE_DIRS:
        return []
    if re.search(r"\blocation\.search\b|new\s+URLSearchParams\s*\(", text):
        return [Violation("MODERN-001", path, "Page module parses Viewer URL state directly.", "Use request passed by viewer/main.js; keep URL parsing in viewer/core/request.js.")]
    return []


def check_primary_entity_fetch(path: Path, text: str) -> list[Violation]:
    parts = path.relative_to(VIEWER).parts
    if not parts or parts[0] not in PRIMARY_DATA_SEGMENTS:
        return []
    page = parts[0]
    segment = PRIMARY_DATA_SEGMENTS[page]
    compact = text.replace("\\", "/")
    patterns = [
        rf"fetch\s*\([^\n;]*{re.escape(segment)}",
        rf"loadJson\s*\([^\n;]*{re.escape(segment)}",
        rf"loadEntity\s*\(\s*['\"]{re.escape(page)}['\"]",
    ]
    if any(re.search(pattern, compact) for pattern in patterns):
        return [Violation("MODERN-002", path, f"Page '{page}' appears to load its own primary entity.", "Primary entity data must be loaded once by viewer/main.js and passed to page.render({ request, data }).")]
    return []


def check_primary_loader_ownership() -> list[Violation]:
    main_path = VIEWER / "main.js"
    data_path = VIEWER / "core" / "data.js"
    if not main_path.exists():
        return [Violation("MODERN-010", main_path, "viewer/main.js is missing.", "Restore viewer/main.js as the composition root and primary entity loader owner.")]

    text = read(main_path)
    violations: list[Violation] = []
    import_pattern = r"import\s*\{[^}]*\bloadEntity\b[^}]*\}\s*from\s*['\"]\./core/data\.js['\"]"
    if not re.search(import_pattern, text, flags=re.DOTALL):
        violations.append(Violation("MODERN-010", main_path, "viewer/main.js does not import loadEntity from viewer/core/data.js.", "Import loadEntity from ./core/data.js and keep primary entity loading in viewer/main.js."))

    call_count = len(re.findall(r"\bloadEntity\s*\(", text))
    if call_count != 1:
        violations.append(Violation("MODERN-010", main_path, f"viewer/main.js must call loadEntity exactly once in the normal path; found {call_count} calls.", "Keep one primary load in viewer/main.js and pass the result to page.render({ request, data })."))

    for path in js_files():
        if path in {main_path, data_path}:
            continue
        module_text = read(path)
        if re.search(r"\b(?:loadEntity|entityPath)\s*\(", module_text):
            violations.append(Violation("MODERN-010", path, "Primary entity/path infrastructure is called outside viewer/main.js or viewer/core/data.js.", "Use page.render({ request, data }) for primary data. Use loadJson() only for supplemental artifacts."))
    return violations


def check_page_raw_fetch(path: Path, text: str) -> list[Violation]:
    parts = path.relative_to(VIEWER).parts
    if not parts or parts[0] not in PAGE_DIRS:
        return []
    if re.search(r"\bfetch\s*\(", text):
        return [Violation("MODERN-011", path, "Page module performs raw fetch().", "Use viewer/core/data.js loadJson() for supplemental artifacts; primary entity data comes from viewer/main.js.")]
    return []


def import_targets(text: str) -> list[str]:
    patterns = [
        r"\bfrom\s+['\"]([^'\"]+)['\"]",
        r"\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
        r"\bimport\s+['\"]([^'\"]+)['\"]",
    ]
    result: list[str] = []
    for pattern in patterns:
        result.extend(re.findall(pattern, text))
    return result


def check_dependency_direction(path: Path, text: str) -> list[Violation]:
    violations: list[Violation] = []
    relative = path.relative_to(VIEWER)
    top = relative.parts[0]
    targets = import_targets(text)

    if top == "shared":
        for target in targets:
            normalized = target.replace("\\", "/")
            if any(f"../{page}/" in normalized or f"/{page}/" in normalized for page in PAGE_DIRS):
                violations.append(Violation("MODERN-003", path, f"Shared code imports page code: {target}", "Move page-specific behavior back to the page and pass generic data into Shared."))

    if top == "core":
        for target in targets:
            normalized = target.replace("\\", "/")
            if "../shared/" in normalized or any(f"../{page}/" in normalized for page in PAGE_DIRS):
                violations.append(Violation("MODERN-004", path, f"Core imports presentation/page code: {target}", "Keep core infrastructure independent of page and shared presentation modules."))

    for target in targets:
        normalized = target.replace("\\", "/")
        if "presentation/" in normalized or normalized.endswith("app.js") or "/app.js" in normalized:
            violations.append(Violation("MODERN-008", path, f"Modern code imports legacy code: {target}", "Do not cross-import the legacy path; migrate/copy the needed responsibility into the Modern Zone."))
    return violations


def check_private_google_dom(path: Path, text: str) -> list[Violation]:
    if ".gm-style-" in text or "gm-style-iw" in text:
        return [Violation("MODERN-005", path, "Modern code depends on Google Maps private DOM selectors.", "Use supported Google Maps APIs / OverlayView and PersonalOS-owned DOM instead.")]
    return []


def check_bootstrap_patterns(path: Path, text: str) -> list[Violation]:
    violations: list[Violation] = []
    if "MutationObserver" in text:
        violations.append(Violation("MODERN-006", path, "MutationObserver found in Modern Viewer code.", "Do not wait for another renderer. Render deterministically from the page entry path or use an explicit observer only after adding a documented exception to this guard."))
    if path.name != "main.js" and re.search(r"DOMContentLoaded|window\.onload|addEventListener\(\s*['\"]load['\"]", text):
        violations.append(Violation("MODERN-007", path, "Module contains self-bootstrap/load-event startup behavior.", "Initialize from viewer/main.js or from the page's explicit render() lifecycle."))
    return violations


def main() -> int:
    violations = check_migration_registry()
    violations.extend(check_entrypoint_integrity())
    violations.extend(check_primary_loader_ownership())

    for path in js_files():
        text = read(path)
        violations.extend(check_page_url_parsing(path, text))
        violations.extend(check_primary_entity_fetch(path, text))
        violations.extend(check_page_raw_fetch(path, text))
        violations.extend(check_dependency_direction(path, text))
        violations.extend(check_private_google_dom(path, text))
        violations.extend(check_bootstrap_patterns(path, text))

    if violations:
        print("Viewer Architecture Guard: FAILED\n")
        for violation in violations:
            print(f"FAIL {violation.rule}")
            print(f"File: {rel(violation.path) if violation.path.exists() else violation.path.relative_to(ROOT).as_posix()}")
            print(f"Violation: {violation.reason}")
            print(f"Fix: {violation.fix}")
            print("Architecture: viewer/ARCHITECTURE.md\n")
        print(f"{len(violations)} violation(s) detected. Build/deploy must not continue.")
        return 1

    print("Viewer Architecture Guard: PASS")
    print("Modern Zone checked: index.html + viewer/**")
    return 0


if __name__ == "__main__":
    sys.exit(main())
