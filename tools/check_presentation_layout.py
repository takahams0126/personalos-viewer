#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_LEGACY_TREE = '3038b0331aadb8925fac5641b78c1745dac21e4c'
REQUIRED_PRESENTATIONS = ('current', 'modern', 'legacy')
FORBIDDEN_ROOT_PRESENTATION_PATHS = ('viewer', 'legacy', 'app.js', 'config.js')


def fail(message: str) -> None:
    print(f'Viewer Distribution Guard: FAILED\n{message}')
    raise SystemExit(1)


def git_tree(path: str) -> str:
    result = subprocess.run(
        ['git', 'rev-parse', f'HEAD:{path}'],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        fail(f'Unable to resolve tree for {path}: {result.stderr.strip()}')
    return result.stdout.strip()


def main() -> int:
    presentation = ROOT / 'presentation'
    if not presentation.is_dir():
        fail('presentation/ parent directory is missing.')

    for name in REQUIRED_PRESENTATIONS:
        if not (presentation / name).is_dir():
            fail(f'presentation/{name}/ is missing.')

    for path in FORBIDDEN_ROOT_PRESENTATION_PATHS:
        if (ROOT / path).exists():
            fail(f'Presentation implementation must not live at repository root: {path}')

    for path in ('manifest.json', 'data', 'maps'):
        if not (ROOT / path).exists():
            fail(f'Shared published Boundary path is missing: {path}')

    legacy_tree = git_tree('presentation/legacy')
    if legacy_tree != EXPECTED_LEGACY_TREE:
        fail(
            'Frozen Legacy tree changed. '
            f'expected={EXPECTED_LEGACY_TREE} actual={legacy_tree}'
        )

    workflow = (ROOT / '.github/workflows/pages.yml').read_text(encoding='utf-8')
    forbidden_build_tokens = ('build_presentation_input.py', '_generated/data')
    for token in forbidden_build_tokens:
        if token in workflow:
            fail(f'Pages workflow must not rebuild/overlay published Boundary data: {token}')

    print('Viewer Distribution Guard: PASS')
    print('Presentation generations are isolated; frozen Legacy tree is unchanged.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
