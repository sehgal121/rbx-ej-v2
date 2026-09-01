/**
 * Mobile scroll stability. iOS/Android hide the URL bar by changing
 * `innerHeight`; a 100vh pin then remaps the film playhead and bottles jump.
 * Lock the stage to the height from boot (or orientation change) and skip
 * ScrollTrigger.refresh when only the height moved.
 */

export function isCoarsePointer(
  win: Pick<Window, 'matchMedia' | 'navigator'> = window,
): boolean {
  if (typeof win.matchMedia === 'function' && win.matchMedia('(pointer: coarse)').matches) {
    return true
  }
  if ((win.navigator.maxTouchPoints ?? 0) > 0) return true
  return 'ontouchstart' in win
}

/** Wheel can keep a short scrub lag; a touch flick must map 1:1 or the reel plays late. */
export function scrubAmount(coarse: boolean, desktopScrub: number): true | number {
  return coarse ? true : desktopScrub
}

export function shouldRefreshOnResize(prevWidth: number, nextWidth: number): boolean {
  return prevWidth !== nextWidth
}

let lockedW = 0
let lockedH = 0

export function lockViewport(
  win: Pick<Window, 'innerWidth' | 'innerHeight'> = window,
): { w: number; h: number } {
  lockedW = win.innerWidth
  lockedH = win.innerHeight
  document.documentElement.style.setProperty('--stage-h', `${lockedH}px`)
  return { w: lockedW, h: lockedH }
}

/** Width/height used by the film layout. Height stays put across URL-bar toggles. */
export function viewport(): { w: number; h: number } {
  return {
    w: lockedW || window.innerWidth,
    h: lockedH || window.innerHeight,
  }
}
