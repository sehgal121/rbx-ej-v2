# Eternal Journey — v2 - Aug 2026

Motion-choreography prototype for client review. **Not final design.** Homepage reel: brand logo expand → Outer Journey → Inner Journey → FLOW Infinite poster lock. Cap-expansion lives on `/flow-infinite.html` only.

## Run

```bash
cd V2
npm install
npm run dev
```

Dev server: [http://localhost:5173](http://localhost:5173)

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

Keyboard: `1` `2` `3` `4` jump to the start of each act. HUD shows act name and overall progress (`?debug=1`).

## How to relayout the triptych

`TIMING.layout` in the same file. Poster-lock slots come from `scene.ts` →
`metrics()`. The centre FLOW Infinite slot is a marked placeholder until the
approved cutout is in the repo. Cap-expansion photo fit lives on the Flow
Infinite page (`src/fi-page.ts`), not the homepage.

## Architecture

One pinned stage, one GSAP timeline scrubbed by scroll (Lenis + ScrollTrigger). Not stacked sections.

| Act | Name | Range |
| --- | --- | --- |
| 0 | THE MONOGRAM | brand logo expand |
| 1 | OUTER JOURNEY | first collection |
| 2 | INNER JOURNEY | 3H collection |
| 3 | FLOW INFINITE | poster lock (Outer \| FI slot \| Inner) |

`prefers-reduced-motion: reduce` skips the reel and shows the final triptych frame.

## Act 8 — Ground

Document flow **below** the pinned cinematic stage (not inside the pin). Store locator (Leaflet 1.9.4, 92 locations from `/assets/stores.json`), collection links, contact, short footer.

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
