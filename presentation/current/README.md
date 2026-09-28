# Current Presentation

Current Viewer is rebuilt from the published HTML Boundary JSON.

Principles:
- start from `/manifest.json`, `/data/**`, and `/maps/**`
- dynamic fetch/resolve from explicit refs
- render semantic DOM first
- keep layout/theme in CSS, separate from semantic rendering
- do not depend on `../modern/` or `../legacy/`
- do not create a persistent intermediate ViewModel/derived JSON layer

The root router will continue to point to `../modern/` until Current reaches a usable minimum surface. Switching default presentation is intentionally a one-line routing change.
