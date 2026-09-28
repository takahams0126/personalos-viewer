# Spot Presentation

Spot uses the validated 2026-09-14 presentation renderer as the authoritative UI implementation.

- Hero: text left / image carousel right
- Image carousel with thumbnails
- Click/tap image lightbox
- Editorial sections and related Spot cards
- Presentation only; Public JSON remains the data source

The production entrypoint is `presentation/main.js`. Spot is started immediately from that entrypoint and owns the complete Spot DOM instead of enhancing the generic base renderer.
