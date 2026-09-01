# Eternal Journey — Grey-box Animatic

Motion-choreography prototype for client review. **Not final design.** Acts 0–3 only: monogram → dissolve into Flow Infinite cap → infinity ribbon → triptych.

## Run

```bash
cd V2
npm install
npm run dev
```

Dev server: [http://localhost:5173](http://localhost:5173)

Live review: [https://sehgal121.github.io/rbx-ej-v2/](https://sehgal121.github.io/rbx-ej-v2/)

```bash
npm run build          # typecheck + production bundle
npm run preview        # serve dist/
```

### Docker

```bash
cd V2
docker build -t ej-v2-animatic .
docker run --rm -p 8080:80 ej-v2-animatic
```

Then open [http://localhost:8080](http://localhost:8080).

## How to retime acts

All timing lives in **one object**: `src/config.ts` → `TIMING`.

- `TIMING.acts[n].start` / `.end` — normalised 0–1 positions on the master timeline (the film reel).
- `TIMING.beats.actN.*` — fractions **inside** that act (`0` = act start, `1` = act end).
- `TIMING.scrollLengthVh` — total pinned scroll (default `800`).
- `TIMING.scrub` — ScrollTrigger catch-up in seconds.

Keyboard: `1` `2` `3` `4` jump to the start of each act. HUD shows act name and overall progress.

## How to relayout the triptych

`TIMING.layout` in the same file. Nothing about the seven-bottle composition is
hard-coded in CSS positions — `scene.ts` → `metrics()` derives every slot from
the live box sizes, so one set of numbers covers desktop, tablet and phone.

- `ribbon.vwFactor` / `vhFactor` — side of the square ∞ box, `min(vw·a, vh·b)`.
  The box stays square and the SVG uses `preserveAspectRatio="xMidYMid meet"`,
  so the lemniscate can never stretch.
- `group.*` — triptych spacing, expressed in bottle widths. `minStep` is the
  floor that keeps neighbours from touching on narrow viewports.
- `fiScale` — Act 3 size of Flow Infinite, per breakpoint.
- `travel.*` — how the bottles ride the lobe in: entry angle, arrival stagger,
  and where the arc starts easing onto the settled row.
- `photo.cap` — the measured cap circle in `flow-infinite.png`, which is what
  registers the photo to the Act 1 dissolve circle. Re-measure if the cutout
  is ever re-exported.

## Architecture

One pinned stage, one GSAP timeline scrubbed by scroll (Lenis + ScrollTrigger). Not stacked sections.

| Act | Name | Range |
| --- | --- | --- |
| 0 | THE MONOGRAM | 0.00–0.18 |
| 1 | THE DISSOLVE | 0.18–0.45 |
| 2 | THE INFINITY | 0.45–0.68 |
| 3 | THE TRIPTYCH | 0.68–1.00 |

`prefers-reduced-motion: reduce` skips the reel and shows the final triptych frame.

## Act 8 — Ground

Document flow **below** the pinned cinematic stage (not inside the pin). Pierre Ravan, store locator (Leaflet 1.9.4, 92 locations from `/assets/stores.json`), contact, closing monogram.

- Deep links: `#ground`, `#stores`, `#contact`
- Collection shells: `/flow-infinite.html`, `/outer.html`, `/inner.html`
- HUD is hidden unless `?debug=1`
- Fonts: Vogue Sans (`--font-display`) and Century Gothic (`--font-body`) from `/fonts/`

### Contact

The form posts JSON to `/backend/contact-us.php` (fields match V1, including `buisnessType`). SMTP is read from environment variables — **no credentials in the repo**.

| Variable | Role |
| --- | --- |
| `EJ_SMTP_HOST` | SMTP host |
| `EJ_SMTP_USER` | SMTP user |
| `EJ_SMTP_PASS` | SMTP password |
| `EJ_CONTACT_TO` | Destination address |
| `EJ_CONTACT_FROM` | From address |

Without those variables (Vite dev, or the Docker nginx stub), the UI still thanks the sender and notes that mail is not sent.
