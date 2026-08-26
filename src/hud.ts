import { actAt } from './config'

const hudDebug = new URLSearchParams(window.location.search).get('debug') === '1'
const hudRoot = document.querySelector<HTMLElement>('#hud')
if (hudRoot && !hudDebug) hudRoot.style.display = 'none'

const num = document.querySelector<HTMLElement>('#hud-num')
const name = document.querySelector<HTMLElement>('#hud-name')
const pct = document.querySelector<HTMLElement>('#hud-pct')
const bar = document.querySelector<HTMLElement>('#hud-bar')
const reviewPct = document.querySelector<HTMLElement>('#review-pct')

function formatReviewPct(progress: number): string {
  const p = Math.min(100, Math.max(0, progress * 100))
  return `${p.toFixed(1)}%`
}

export function updateHud(progress: number): void {
  if (reviewPct) reviewPct.textContent = formatReviewPct(progress)
  if (!hudDebug || !num || !name || !pct || !bar) return
  const act = actAt(progress)
  num.textContent = String(act.id)
  name.textContent = act.name
  const p = Math.round(progress * 100)
  pct.textContent = `${p}%`
  bar.style.width = `${p}%`
}
