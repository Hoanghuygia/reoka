# Reoka design

All design assets used by the Reoka app (logos, banners, and future UI assets).

## Brand colors

| Name | Hex | Usage |
|---|---|---|
| Teal | `#087F8C` | Primary: modern, clean, trustworthy; care & health |
| Navy | `#17324D` | Secondary: professional, tech, safe and systematic |
| Mint | `#DDF4EF` | Secondary background: soft, friendly, pet-oriented |
| White | `#FFFFFF` | Background: airy, minimal, easy to recognize |

## Structure

```
design/
├── src/generate.mjs       # Source of truth: generates every SVG/PNG below
└── brand/concepts/
    └── <nn-concept>/
        ├── logo.svg / logo-512x512.png          # Mini App logo
        └── banner.svg / banner-1920x1080.png    # Mini App banner
```

## Logo & banner concepts (pending review)

| # | Concept | Idea |
|---|---|---|
| 01 | Pet Card | Pet ID card with dog profile and QR (closest to the reference) |
| 02 | Health Shield | Shield + paw + check: protection, verified health records |
| 03 | Scan Paw | Paw inside QR scan corners on a navy tile (app-icon style) |
| 04 | Reminder Bubble | Chat bubble + paw + bell: Zalo reminders for pet care |
| 05 | Vaccine Calendar | Calendar + paw + check: vaccination schedule tracking |

## Regenerating

Requires Node.js and Google Chrome (used headless to rasterize SVG → PNG):

```bash
node design/src/generate.mjs
```

Notes:
- Edit `design/src/generate.mjs` rather than the generated SVG files.
- Text uses system fonts (Avenir Next for the wordmark, SF/system-ui for Vietnamese copy), so the SVGs render best on macOS. Use the PNGs for uploads.
- The QR codes in the artwork are decorative and not scannable.
