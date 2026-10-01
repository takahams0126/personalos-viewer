# Third-party notices

## Meteocons

Current Viewer uses static weather condition SVG images from Meteocons via the version-pinned public CDN.

- Project: Meteocons
- Author: Bas Milius
- Source: https://github.com/basmilius/meteocons
- CDN: https://cdn.meteocons.com/
- Package family: `@meteocons/svg-static`
- Current pinned release: `1.0.0`
- Style: `fill`
- License: MIT

The Viewer loads only the weather icons required by the current condition-code mapping. It does not load the Lottie runtime or the full icon package.
