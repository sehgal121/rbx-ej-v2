/**
 * MASTER TIMING — the only file a reviewer needs to retime the reel.
 *
 * All act and beat positions are normalised 0–1 on the single
 * scroll-scrubbed GSAP timeline. Change numbers here; leave timeline.ts alone.
 *
 * `beats` are fractions WITHIN their parent act (0 = act start, 1 = act end).
 * For acts 4–7, local 1 is the start of `ctaHold` — the extra tail after the
 * last copy beat, so a collection link (or the Unity caption) sits at full
 * opacity before the next wipe. Act 7's tail is inserted before converge/monogram.
 *
 * Act 3's hold is *after* `acts[3].end` (still 1.0): `ctaHold[3]` of empty
 * master time before Act 4 enter. Content 0–1 and `buildSets` stay put.
 */

/**
 * Restore Act 7 (rings + caption + converge) by flipping this on.
 * When false, markup/CSS/tweens stay in the repo but the act occupies
 * zero master time — Inner Journey unpins straight into Ground.
 */
export const SHOW_UNITY = false

/** Act 6 Inner ends here. Act 7 starts here when `SHOW_UNITY` is true. */
const ACT6_END = 1.84
/** Act 7 span on the master clock when shown (content + `ctaHold[7]`). */
const UNITY_SPAN = 0.28

/** Master clock length. Acts 0–3 occupy 0–1 exactly as signed off.
 *  Acts 4–6 are short (~1–2 viewport scrolls each) so SKUs do not dwell.
 *  +0.05 Act 3 triptych hold after 1.0 (before Act 4 enter),
 *  +0.05 × 3 ctaHold tails on acts 4–6.
 *  Collapses to `ACT6_END` when `SHOW_UNITY` is false. */
export const FILM_END = SHOW_UNITY ? ACT6_END + UNITY_SPAN : ACT6_END

export const TIMING = {
  /** Total document scroll while the stage is pinned. 700vh remains acts 0–3. */
  scrollLengthVh: 100 + 700 * FILM_END,

  /** ScrollTrigger scrub lag in seconds. `true` = 1:1 with the bar. */
  scrub: 0.4,

  /**
   * Extra master time the Act 3 triptych, a collection CTA (acts 4–6), or the
   * Unity caption (act 7) stays at full opacity after fade-in. Not a
   * scroll-lock. Act 3's hold is the gap after `acts[3].end` (1.0) before
   * Act 4 enter. Act 7's hold sits before converge/monogram.
   */
  ctaHold: {
    /** After bottles settle and copy is in, before Flow Infinite transfers. */
    3: 0.05,
    4: 0.05,
    5: 0.05,
    6: 0.05,
    /** After the Unity caption lands, before the rings converge. */
    7: 0.06,
  },

  acts: {
    0: { id: 0, key: '1', name: 'THE MONOGRAM', start: 0.0, end: 0.02 },
    1: { id: 1, key: '2', name: 'THE DISSOLVE', start: 0.02, end: 0.45 },
    2: { id: 2, key: '3', name: 'THE INFINITY', start: 0.45, end: 0.68 },
    3: { id: 3, key: '4', name: 'THE TRIPTYCH', start: 0.68, end: 1.0 },
    4: { id: 4, key: '5', name: 'FLOW INFINITE', start: 1.05, end: 1.32, hash: 'flow-infinite' },
    5: { id: 5, key: '6', name: 'OUTER JOURNEY', start: 1.32, end: 1.58, hash: 'outer' },
    6: { id: 6, key: '7', name: 'INNER JOURNEY', start: 1.58, end: ACT6_END, hash: 'inner' },
    7: { id: 7, key: '8', name: 'BALANCE AND UNITY', start: ACT6_END, end: FILM_END, hash: 'unity' },
  },

  beats: {
    act0: {
      /** Full-bright chrome from frame 0; the act is only a one-tick hold. */
      chrome: { from: 0.0, to: 1.0 },
    },
    act1: {
      marksOut: { from: 0.04, to: 0.22 },
      ringToSphere: { from: 0.0, to: 0.18 },
      capHandoff: { from: 0.0, to: 0.14 },
      stardust: { from: 0.06, to: 0.32 },
      bodyReveal: { from: 0.12, to: 0.68 },
      pullBack: { from: 0.76, to: 1.0 },
    },
    act2: {
      pullBack: { from: 0.0, to: 0.5 },
      ribbon: { from: 0.12, to: 0.88 },
      splitBg: { from: 0.18, to: 0.72 },
    },
    act3: {
      bottlesIn: { from: 0.0, to: 0.66 },
      fiRise: { from: 0.08, to: 0.52 },
      settle: { from: 0.66, to: 0.88 },
      copy: { from: 0.62, to: 0.92 },
      vortex: { from: 0.3, to: 0.8 },
    },
    act4: {
      enter: { from: 0.0, to: 0.16 },
      water: { from: 0.08, to: 0.26 },
      pause: { from: 0.2, to: 0.42 },
      connection: { from: 0.4, to: 0.66 },
      movement: { from: 0.64, to: 0.88 },
      /** Fade `#act4-link` with the FI title; ctaHold is the short tail. */
      cta: { from: 0.1, to: 0.28 },
      hold: { from: 0.8, to: 1.0 },
    },
    act5: {
      enter: { from: 0.0, to: 0.14 },
      /** Flow Infinite leaves first; Outer bottles wait until it is gone. */
      fiOut: { from: 0.0, to: 0.26 },
      bottlesIn: { from: 0.26, to: 0.44 },
      orbit: { from: 0.08, to: 0.98 },
      /** SKU beats; overlap on handoff so one flick advances the set. */
      sunrise: { from: 0.3, to: 0.5 },
      sunset: { from: 0.42, to: 0.62 },
      midnight: { from: 0.54, to: 0.74 },
      /** Three Outer bottles settle as a set after Midnight. */
      collection: { from: 0.74, to: 1.0 },
      /** `#act5-link` when Outer first shows, held through the SKUs and ctaHold. */
      ctaShow: { from: 0.3, to: 0.44 },
      hold: { from: 0.82, to: 1.0 },
    },
    act6: {
      invert: { from: 0.0, to: 0.14 },
      heart: { from: 0.1, to: 0.34 },
      harmony: { from: 0.26, to: 0.5 },
      happiness: { from: 0.42, to: 0.66 },
      /** Three Inner bottles settle as a set after Happiness. */
      collection: { from: 0.66, to: 0.80 },
      /** Then they slide right as the Act 3 seven-bottle row returns. */
      reunion: { from: 0.86, to: 1.0 },
      /** `#act6-link` when Inner copy lands; short ctaHold tail. */
      cta: { from: 0.13, to: 0.27 },
      hold: { from: 0.82, to: 1.0 },
    },
    /**
     * Three rings are forged one after the other. Each owns ~22% of the act;
     * a 0.01 overlap is only the previous glint settling, so the draws still
     * read as sequential. Caption fades after Soul closes; `ctaHold[7]` then
     * dwells on the master clock before converge/monogram (see `contentEnd`).
     */
    act7: {
      enter: { from: 0.0, to: 0.08 },
      ringBody: { from: 0.06, to: 0.28 },
      ringHeart: { from: 0.27, to: 0.49 },
      ringSoul: { from: 0.48, to: 0.70 },
      caption: { from: 0.71, to: 0.84 },
      converge: { from: 0.86, to: 0.93 },
      monogram: { from: 0.90, to: 0.97 },
      mantra: { from: 0.93, to: 1.0 },
    },
  },

  layout: {
    /** Matches the `max-width: 720px` block in style.css. */
    narrowMaxPx: 720,

    /**
     * Act 7 trinity, in the 200×200 `.venn` viewBox. Ring centres sit on an
     * equilateral triangle of side `ringR × 1.32` — Soul (100,68), Body
     * (63,132), Heart (137,132). `#mind-bridge` sits under the rings.
     */
    unity: {
      ringR: 56,
      /** Arc length of the travelling specular glint, in path units. */
      glint: 10,
      stars: 54,
    },

    /** ∞ box is a square of this side, so the lemniscate never stretches. */
    ribbon: { vwFactor: 1.11, vhFactor: 2.5 },

    /** Half-width of the lemniscate in viewBox units; also its `d` amplitude. */
    lobeReach: 36,

    /** Width ÷ height of the product cutouts. */
    bottleAspect: 0.41,

    /** Act 3 scale of the Flow Infinite assembly. */
    fiScale: { wide: 0.48, narrow: 0.34 },

    /**
     * Act 4 hero pose. Cap is pinned to the stage centre, so the glass hangs
     * into the lower half — on narrow, a negative `y` lifts the whole bottle
     * into the middle of the viewport. Keep `scale` near 1 so Safari does not
     * rasterise the SVG photo at a tiny 3D layer.
     */
    act4Hero: {
      wide: { scale: 0.9, y: '7vh' },
      narrow: { scale: 0.8, y: '-6vh' },
    },
    act4MoveY: { wide: '5vh', narrow: '-7vh' },

    /**
     * Act 3 reads as three sets — Outer trio | Flow Infinite | Inner trio.
     * All four numbers are multiples of one trio-bottle width.
     *
     * `innerPad` is the clear gap between the Flow Infinite silhouette and the
     * nearest trio bottle, so the sets never merge into one pile. `setStep` is
     * the spacing inside a trio (under 1 = overlapping shoulders, matching
     * the campaign still).
     */
    group: { innerPad: 1.22, setStep: 0.78, minStep: 0.7, edgePad: 0.16 },

    travel: { stagger: 0.06, sweep: 0.62, startSpread: 1.34 },

    /**
     * Act 4 night-sky still (`#act4-sky-zoom`). Ken Burns scale on that
     * layer only, scrubbed across the whole act including ctaHold.
     */
    act4Sky: { scaleFrom: 1, scaleTo: 1.18 },

    /**
     * QR bottle-hero.png (copied to bottles/flow-infinite.png) is 533×1134 with
     * alpha. Least-squares fit of the chrome sphere: centre (261.44, 218.59)
     * r 202.68 px. `circle` is the Act 1 dissolve target in fi-svg viewBox units.
     * Do not retune `cap` / `circle` / `size` — `photoFit()` feeds Act 3 metrics.
     */
    photo: {
      size: { w: 533, h: 1134 },
      cap: { cx: 261.44, cy: 218.59, r: 202.68 },
      /** Alpha bbox bottom — the glass base, 33px above the canvas edge. */
      glassY: 1101,
      circle: { cx: 100, cy: 100, r: 56 },
      neckY: 152,
    },

    /**
     * QR logo-steel.png 389×464. Ring outer diameter from the horizontal
     * equator (x 11–378 at y 235–264): centre (194.5, 248.5) r 183.5.
     * Scale k = circle.r / ring.r = 56 / 183.5 so the chrome ring’s outer
     * edge coincides with the cap clip (and the photo-fitted sphere).
     * Placement lives on `#chrome-mono` in index.html:
     *   x = 100 − 194.5k = 40.638, y = 100 − 248.5k = 24.163,
     *   w = 389k = 118.714, h = 464k = 141.602.
     */
    logo: {
      size: { w: 389, h: 464 },
      ring: { cx: 194.5, cy: 248.5, r: 183.5 },
    },
  },
} as const

export type ActId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

export const HASH_ACT: Record<string, ActId> = SHOW_UNITY
  ? { 'flow-infinite': 4, outer: 5, inner: 6, unity: 7 }
  : { 'flow-infinite': 4, outer: 5, inner: 6 }

export function actAt(progress: number): (typeof TIMING.acts)[ActId] {
  const time = progress * FILM_END
  if (SHOW_UNITY && time >= TIMING.acts[7].start) return TIMING.acts[7]
  if (time >= TIMING.acts[6].start) return TIMING.acts[6]
  if (time >= TIMING.acts[5].start) return TIMING.acts[5]
  if (time >= TIMING.acts[4].start) return TIMING.acts[4]
  if (time >= TIMING.acts[3].start) return TIMING.acts[3]
  if (time >= TIMING.acts[2].start) return TIMING.acts[2]
  if (time >= TIMING.acts[1].start) return TIMING.acts[1]
  return TIMING.acts[0]
}

export function contentEnd(act: ActId): number {
  const a = TIMING.acts[act]
  if (act === 7 && !SHOW_UNITY) return a.end
  if (act === 4 || act === 5 || act === 6 || act === 7) return a.end - TIMING.ctaHold[act]
  return a.end
}

/** Map a 0–1 beat inside an act onto the master timeline.
 *  Acts 4–7: local 1 is the start of the ctaHold tail, not `acts[n].end`. */
export function t(act: ActId, local: number): number {
  const a = TIMING.acts[act]
  return a.start + (contentEnd(act) - a.start) * local
}

export function span(
  act: ActId,
  beat: { from: number; to: number },
): { start: number; duration: number } {
  const start = t(act, beat.from)
  return { start, duration: t(act, beat.to) - start }
}

export function isNarrow(): boolean {
  return window.innerWidth <= TIMING.layout.narrowMaxPx
}
