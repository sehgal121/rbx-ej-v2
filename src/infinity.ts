/**
 * Hard-off for the infinity still. Timeline `set`s this so later acts cannot
 * interpolate opacity back up; reverse scrub restores the crossing.
 */
export const INFINITY_GONE = {
  opacity: 0,
  visibility: 'hidden' as const,
  pointerEvents: 'none' as const,
}
