/**
 * Hard-off after Act 3. Timeline `set`s this at `TIMING.acts[3].end` so
 * later acts cannot interpolate opacity back up; reverse scrub past that
 * playhead restores the Act 2–3 still.
 */
export const INFINITY_GONE = {
  opacity: 0,
  visibility: 'hidden' as const,
  pointerEvents: 'none' as const,
}
