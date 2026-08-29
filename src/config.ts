/**
 * MASTER TIMING — homepage reel after the 26 Aug 2026 notes.
 *
 * Act 0 is brand-first (logo expand). Collections walk Outer → Inner →
 * FLOW Infinite. The reel ends on the campaign-poster lock (Outer left,
 * FLOW Infinite centre, Inner right). Cap-expansion does not play here.
 */

export const FILM_END = 1

export const TIMING = {
  /** Pinned scroll while the stage is held. */
  scrollLengthVh: 800,

  scrub: 0.4,

  /** Extra master time a collection CTA / poster lock stays fully on. */
  ctaHold: {
    1: 0.04,
    2: 0.04,
    3: 0.06,
  },

  acts: {
    0: { id: 0, key: '1', name: 'THE MONOGRAM', start: 0.0, end: 0.14 },
    1: { id: 1, key: '2', name: 'OUTER JOURNEY', start: 0.14, end: 0.42, hash: 'outer' },
    2: { id: 2, key: '3', name: 'INNER JOURNEY', start: 0.42, end: 0.7, hash: 'inner' },
    3: { id: 3, key: '4', name: 'FLOW INFINITE', start: 0.7, end: 1.0, hash: 'flow-infinite' },
  },

  beats: {
    act0: {
      expand: { from: 0.0, to: 0.55 },
      copy: { from: 0.38, to: 0.82 },
    },
    act1: {
      enter: { from: 0.0, to: 0.14 },
      sunrise: { from: 0.1, to: 0.46 },
      sunset: { from: 0.36, to: 0.72 },
      midnight: { from: 0.62, to: 0.96 },
      cta: { from: 0.13, to: 0.27 },
    },
    act2: {
      invert: { from: 0.0, to: 0.16 },
      heart: { from: 0.1, to: 0.46 },
      harmony: { from: 0.36, to: 0.72 },
      happiness: { from: 0.62, to: 0.96 },
      cta: { from: 0.13, to: 0.27 },
    },
    act3: {
      enter: { from: 0.0, to: 0.22 },
      bottlesIn: { from: 0.08, to: 0.72 },
      copy: { from: 0.42, to: 0.78 },
      cta: { from: 0.48, to: 0.72 },
    },
  },

  layout: {
    narrowMaxPx: 720,

    bottleAspect: 0.41,

    /**
     * Poster lock: Outer trio | FLOW Infinite slot | Inner trio.
     * Multiples of one trio-bottle width. Centre slot is a marked
     * placeholder — the approved FI cutout is not in this repo.
     */
    group: { innerPad: 1.15, setStep: 0.96, minStep: 0.82, edgePad: 0.18 },

    travel: { stagger: 0.06, sweep: 0.62, startSpread: 1.34 },
  },
} as const

export type ActId = 0 | 1 | 2 | 3

export const HASH_ACT: Record<string, ActId> = {
  outer: 1,
  inner: 2,
  'flow-infinite': 3,
}

export function actAt(progress: number): (typeof TIMING.acts)[ActId] {
  const time = progress * FILM_END
  if (time >= TIMING.acts[3].start) return TIMING.acts[3]
  if (time >= TIMING.acts[2].start) return TIMING.acts[2]
  if (time >= TIMING.acts[1].start) return TIMING.acts[1]
  return TIMING.acts[0]
}

export function contentEnd(act: ActId): number {
  const a = TIMING.acts[act]
  if (act === 1 || act === 2 || act === 3) return a.end - TIMING.ctaHold[act]
  return a.end
}

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
