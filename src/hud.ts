import { actAt } from './config'

const num = document.querySelector<HTMLElement>('#hud-num')
const name = document.querySelector<HTMLElement>('#hud-name')
const pct = document.querySelector<HTMLElement>('#hud-pct')
const bar = document.querySelector<HTMLElement>('#hud-bar')

export function updateHud(progress: number): void {
  if (!num || !name || !pct || !bar) return
  const act = actAt(progress)
  num.textContent = String(act.id)
  name.textContent = act.name
  const p = Math.round(progress * 100)
  pct.textContent = `${p}%`
  bar.style.width = `${p}%`
}
