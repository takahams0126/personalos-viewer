from __future__ import annotations

import re
import sys
from pathlib import Path


HTML_ASSET = re.compile(r'(?P<prefix>(?:href|src)=["\'])(?P<path>\./[^"\']+\.(?:js|css))(?P<query>\?v=[^"\']*)?(?P<suffix>["\'])')
STATIC_JS_IMPORT = re.compile(r'(?P<prefix>(?:from\s+|import\s*)["\'])(?P<path>\.[^"\']+\.js)(?P<query>\?v=[^"\']*)?(?P<suffix>["\'])')
DYNAMIC_JS_IMPORT = re.compile(r'(?P<prefix>import\s*\(\s*["\'])(?P<path>\.[^"\']+\.js)(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\s*\))')
JS_URL_ASSET = re.compile(r'(?P<prefix>new\s+URL\(\s*["\'])(?P<path>\.[^"\']+\.(?:js|css))(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\s*,\s*import\.meta\.url\s*\))')
CSS_IMPORT = re.compile(r'(?P<prefix>@import\s+url\(["\'])(?P<path>\.[^"\']+\.css)(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\))')
MAIN_VERSION = re.compile(r"const\s+PRESENTATION_VERSION\s*=\s*['\"][^'\"]+['\"];")


def version_match(match: re.Match[str], version: str) -> str:
    return f"{match.group('prefix')}{match.group('path')}?v={version}{match.group('suffix')}"


def rewrite_patterns(path: Path, patterns: tuple[re.Pattern[str], ...], version: str) -> None:
    text = path.read_text(encoding='utf-8')
    updated = text
    for pattern in patterns:
        updated = pattern.sub(lambda match: version_match(match, version), updated)

    # Legacy presentation/main.js used this constant before Modern Viewer existed.
    # Keep supporting it while the legacy tree remains published for comparison.
    if path.name == 'main.js':
        updated = MAIN_VERSION.sub(f"const PRESENTATION_VERSION = '{version}';", updated)

    if updated != text:
        path.write_text(updated, encoding='utf-8')


def version_asset_tree(root: Path, version: str) -> None:
    if not root.is_dir():
        return

    for path in root.rglob('*.js'):
        rewrite_patterns(path, (STATIC_JS_IMPORT, DYNAMIC_JS_IMPORT, JS_URL_ASSET), version)
    for path in root.rglob('*.css'):
        rewrite_patterns(path, (CSS_IMPORT,), version)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit('usage: version_presentation_assets.py <site-root> <version>')

    root = Path(sys.argv[1])
    version = sys.argv[2].strip()
    if not root.is_dir() or not version:
        raise SystemExit('site root and version are required')

    index = root / 'index.html'
    if index.exists():
        rewrite_patterns(index, (HTML_ASSET,), version)

    # Legacy comparison assets.
    version_asset_tree(root / 'presentation', version)

    # Modern Viewer assets. Versioning must propagate from index.html through
    # module imports and page-local styles so mobile browsers cannot retain an
    # older child module after a new Pages deployment.
    version_asset_tree(root / 'viewer', version)

    print(f'viewer asset version: {version}')


if __name__ == '__main__':
    main()
