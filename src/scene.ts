/** Homepage scene. No Flow Infinite bottle photo — that render stays off this page. */

import { TIMING, isNarrow } from './config'

export interface Scene {
  stage: HTMLElement
  brandHero: HTMLElement
  brandLogo: HTMLElement
  brandLine: HTMLElement
  brandMantra: HTMLElement
  infinity: HTMLElement
  nebula: HTMLElement
  split: HTMLElement
  vortex: HTMLElement
  grade: HTMLElement
  tempTeal: HTMLElement
  tempEmber: HTMLElement
  night: HTMLElement
  headline: HTMLElement
  labelOuter: HTMLElement
  labelInner: HTMLElement
  labelFi: HTMLElement
  outerBottles: HTMLImageElement[]
  innerBottles: HTMLImageElement[]
  fiSlot: HTMLElement
  actOuter: HTMLElement
  actOuterSunrise: HTMLElement
  actOuterSunset: HTMLElement
  actOuterMidnight: HTMLElement
  actOuterLink: HTMLElement
  actInner: HTMLElement
  actInnerHeart: HTMLElement
  actInnerHarmony: HTMLElement
  actInnerHappiness: HTMLElement
  actInnerLink: HTMLElement
  actCrossing: HTMLElement
  actCrossingLink: HTMLElement
}

export interface Metrics {
  bottleW: number
  /** |x| of each trio slot from centre, innermost first. */
  slots: number[]
  groupCentre: number
  maxX: number
  baseY: number
  labelY: number
}

export function buildScene(): Scene {
  const pick = <T extends Element>(sel: string): T => {
    const el = document.querySelector<T>(sel)
    if (!el) throw new Error(`Missing ${sel}`)
    return el
  }

  return {
    stage: pick('#stage'),
    brandHero: pick('#brand-hero'),
    brandLogo: pick('#brand-logo'),
    brandLine: pick('#brand-line'),
    brandMantra: pick('#brand-mantra'),
    infinity: pick('#flow-bg'),
    nebula: pick('#nebula'),
    split: pick('#split'),
    vortex: pick('#vortex'),
    grade: pick('#grade'),
    tempTeal: pick('#temp-teal'),
    tempEmber: pick('#temp-ember'),
    night: pick('#night'),
    headline: pick('#headline'),
    labelOuter: pick('#label-outer'),
    labelInner: pick('#label-inner'),
    labelFi: pick('#label-fi'),
    outerBottles: [...document.querySelectorAll<HTMLImageElement>('.line-bottle.outer')],
    innerBottles: [...document.querySelectorAll<HTMLImageElement>('.line-bottle.inner')],
    fiSlot: pick('#fi-slot'),
    actOuter: pick('#act-outer'),
    actOuterSunrise: pick('#act-outer-sunrise'),
    actOuterSunset: pick('#act-outer-sunset'),
    actOuterMidnight: pick('#act-outer-midnight'),
    actOuterLink: pick('#act-outer-link'),
    actInner: pick('#act-inner'),
    actInnerHeart: pick('#act-inner-heart'),
    actInnerHarmony: pick('#act-inner-harmony'),
    actInnerHappiness: pick('#act-inner-happiness'),
    actInnerLink: pick('#act-inner-link'),
    actCrossing: pick('#act-crossing'),
    actCrossingLink: pick('#act-crossing-link'),
  }
}

let memo: { w: number; h: number; value: Metrics } | null = null

/**
 * Poster lock slots. Centre width is a reserved FLOW Infinite gap — not a
 * measured bottle, because the approved cutout is not in the repo.
 */
export function metrics(scene: Scene): Metrics {
  const w = window.innerWidth
  const h = window.innerHeight
  if (memo && memo.w === w && memo.h === h) return memo.value

  const g = TIMING.layout.group
  const bottleH = scene.outerBottles[0]?.offsetHeight ?? h * 0.22
  const bottleW = bottleH * TIMING.layout.bottleAspect
  const fiHalf = bottleW * 0.72
  const maxX = w * 0.5 - bottleW * (0.5 + g.edgePad)
  const minStep = bottleW * g.minStep
  const clear = fiHalf + bottleW * 0.56
  const inner = Math.min(
    fiHalf + bottleW * (0.5 + g.innerPad),
    Math.max(clear, maxX - 2 * minStep),
  )
  const step = Math.max(minStep, Math.min(bottleW * g.setStep, (maxX - inner) / 2))
  const slots = [0, 1, 2].map((i) => inner + i * step)

  const value: Metrics = {
    bottleW,
    slots,
    groupCentre: slots[1],
    maxX,
    baseY: isNarrow() ? 28 : 36,
    labelY: bottleH * 0.58 + (isNarrow() ? 20 : 28),
  }
  if (bottleH > 0) memo = { w, h, value }
  return value
}
