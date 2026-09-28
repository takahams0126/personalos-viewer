from __future__ import annotations

import re
import sys
from pathlib import Path


HTML_ASSET = re.compile(r'(?P<prefix>(?:href|src)=["\'])(?P<path>\./[^"\']+\.(?:js|css))(?P<query>\?v=[^"\']*)?(?P<suffix>["\'])')
STATIC_JS_IMPORT = re.compile(r'(?P<prefix>(?:from\s+|import\s*)["\'])(?P<path>\.[^"\']+\.js)(?P<query>\?v=[^"\']*)?(?P<suffix>["\'])')
DYNAMIC_JS_IMPORT = re.compile(r'(?P<prefix>import\s*\(\s*["\'])(?P<path>\.[^"\']+\.js)(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\s*\))')
JS_URL_ASSET = re.compile(r'(?P<prefix>new\s+URL\(\s*["\'])(?P<path>\.[^"\']+\.(?:js|css))(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\s*,\s*import\.meta\.url\s*\))')
CSS_IMPORT = re.compile(r'(?P<prefix>@import\s+url\(["\'])(?P<path>\.[^"\']+\.css)(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\))')


def version_match(match: re.Match[str], version: str) -> str:
    return f"{match.group('prefix')}{match.group('path')}?v={version}{match.group('suffix')}"


def rewrite_patterns(path: Path, patterns: tuple[re.Pattern[str], ...], version: str) -> None:
    text = path.read_text(encoding='utf-8')
    updated = text
    for pattern in patterns:
        updated = pattern.sub(lambda match: version_match(match, version), updated)
    if updated != text:
        path.write_text(updated, encoding='utf-8')


def version_presentation(root: Path, version: str) -> None:
    if not root.is_dir():
        return

    for path in root.rglob('*.html'):
        rewrite_patterns(path, (HTML_ASSET,), version)
    for path in root.rglob('*.js'):
        rewrite_patterns(path, (STATIC_JS_IMPORT, DYNAMIC_JS_IMPORT, JS_URL_ASSET), version)
    for path in root.rglob('*.css'):
        rewrite_patterns(path, (CSS_IMPORT,), version)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit('usage: version_presentation_assets.py <site-root> <version>')

    site_root = Path(sys.argv[1])
    version = sys.argv[2].strip()
    if not site_root.is_dir() or not version:
        raise SystemExit('site root and version are required')

    presentation_root = site_root / 'presentation'

    # Mutable presentation generations get deploy-SHA cache busting.
    # Frozen Legacy is intentionally excluded: its presentation files are never
    # rewritten during deployment. Shared JSON/Map data is also outside this tool.
    version_presentation(presentation_root / 'current', version)
    version_presentation(presentation_root / 'modern', version)

    print(f'presentation asset version: {version}')


if __name__ == '__main__':
    main()
