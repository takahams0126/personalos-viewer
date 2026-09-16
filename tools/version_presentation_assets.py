from __future__ import annotations

import re
import sys
from pathlib import Path


HTML_ASSET = re.compile(r'(?P<prefix>(?:href|src)=["\'])(?P<path>\./[^"\']+\.(?:js|css))(?P<query>\?v=[^"\']*)?(?P<suffix>["\'])')
JS_IMPORT = re.compile(r'(?P<prefix>(?:from\s+|import\s*)["\'])(?P<path>\.[^"\']+\.js)(?P<query>\?v=[^"\']*)?(?P<suffix>["\'])')
CSS_IMPORT = re.compile(r'(?P<prefix>@import\s+url\(["\'])(?P<path>\.[^"\']+\.css)(?P<query>\?v=[^"\']*)?(?P<suffix>["\']\))')
MAIN_VERSION = re.compile(r"const\s+PRESENTATION_VERSION\s*=\s*['\"][^'\"]+['\"];")


def version_match(match: re.Match[str], version: str) -> str:
    return f"{match.group('prefix')}{match.group('path')}?v={version}{match.group('suffix')}"


def rewrite(path: Path, pattern: re.Pattern[str], version: str) -> None:
    text = path.read_text(encoding='utf-8')
    updated = pattern.sub(lambda m: version_match(m, version), text)
    if path.name == 'main.js':
        updated = MAIN_VERSION.sub(f"const PRESENTATION_VERSION = '{version}';", updated)
    if updated != text:
        path.write_text(updated, encoding='utf-8')


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit('usage: version_presentation_assets.py <site-root> <version>')

    root = Path(sys.argv[1])
    version = sys.argv[2].strip()
    if not root.is_dir() or not version:
        raise SystemExit('site root and version are required')

    index = root / 'index.html'
    if index.exists():
        rewrite(index, HTML_ASSET, version)

    presentation = root / 'presentation'
    if presentation.is_dir():
        for path in presentation.rglob('*.js'):
            rewrite(path, JS_IMPORT, version)
        for path in presentation.rglob('*.css'):
            rewrite(path, CSS_IMPORT, version)

    print(f'presentation asset version: {version}')


if __name__ == '__main__':
    main()
