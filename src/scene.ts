/** Build dynamic scene bits: inner starfield, stardust burst, infinity still. */

import { TIMING, isNarrow } from './config'
import { viewport } from './mobile-scroll'

const INNER_STAR_COUNT = 28
const STARDUST_COUNT = 80
const PHOTO_SRC = `${import.meta.env.BASE_URL}assets/bottles/flow-infinite.png` // QR bottle-hero.png

function rng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function lemniscateD(steps = 240): string {
  const r = TIMING.layout.lobeReach
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const x = 50 + r * Math.sin(a)
    const y = 50 + r * Math.sin(a) * Math.cos(a)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(3)} ${y.toFixed(3)}`)
  }
  return pts.join(' ')
}

/** Point on the ∞ curve, in viewBox units from the stage centre. */
export function lobePoint(a: number): { x: number; y: number } {
  const r = TIMING.layout.lobeReach
  return {
    x: r * Math.sin(a),
    y: r * Math.sin(a) * Math.cos(a),
  }
}

/** Angle on the lower arm of the right lobe whose |x| is `units` from centre. */
export function lobeAngle(units: number): number {
  return Math.asin(Math.min(Math.max(units / TIMING.layout.lobeReach, 0), 1))
}

/** Side of the square ∞ box, so 100 viewBox units map to it uniformly. */
export function ribbonSide(): number {
  const { vwFactor, vhFactor } = TIMING.layout.ribbon
  const { w, h } = viewport()
  return Math.min(w * vwFactor, h * vhFactor)
}

export function fiScale(): number {
  const { wide, narrow } = TIMING.layout.fiScale
  return isNarrow() ? narrow : wide
}

/** Scale that makes the Flow Infinite glass the same height as a trio cutout. */
export function reunionFiScale(scene: Scene): number {
  const fit = photoFit()
  const { size, glassY } = TIMING.layout.photo
  const vmin = Math.min(viewport().w, viewport().h)
  const bottleH = vmin * (isNarrow() ? 0.2 : 0.22)
  const vb = scene.layoutBox.offsetWidth / 200
  const glass = fit.y + fit.h * (glassY / size.h)
  const fiH = Math.max(0, glass - fit.y) * vb
  if (bottleH < 1 || fiH < 1) return fiScale()
  return bottleH / fiH
}

function photoFit(): { k: number; x: number; y: number; w: number; h: number } {
  const { size, cap, circle } = TIMING.layout.photo
  const k = circle.r / cap.r
  return {
    k,
    x: circle.cx - cap.cx * k,
    y: circle.cy - cap.cy * k,
    w: size.w * k,
    h: size.h * k,
  }
}

/** Clip rect that walks the photo's body down from the neck. */
export function bodyReveal(): { y: number; height: number } {
  const fit = photoFit()
  const { neckY } = TIMING.layout.photo
  return { y: neckY, height: fit.y + fit.h - neckY }
}

/** One Act 7 ring: the strokes that draw, the glint that leads, its glyph and word. */
export interface UnityRing {
  /** Halo + core + inner ridge, animated together on one dash offset. */
  draw: SVGCircleElement[]
  spec: SVGCircleElement
  icon: SVGGElement
  label: HTMLElement
}

export interface Scene {
  stage: HTMLElement
  assembly: HTMLElement
  layoutBox: HTMLElement
  capGroup: SVGGElement
  photoCap: SVGImageElement
  photoBody: SVGImageElement
  marks: SVGImageElement
  bodyClip: SVGRectElement
  infinity: HTMLElement
  /** Act 4 night-sky wrapper — opacity only; zoom lives on `act4SkyZoom`. */
  act4Sky: HTMLElement
  act4SkyZoom: HTMLElement
  split: HTMLElement
  vortex: HTMLElement
  headline: HTMLElement
  labelOuter: HTMLElement
  labelInner: HTMLElement
  sparks: HTMLElement[]
  innerStars: SVGCircleElement[]
  outerBottles: HTMLImageElement[]
  innerBottles: HTMLImageElement[]
  grade: HTMLElement
  water: HTMLElement
  tempTeal: HTMLElement
  tempEmber: HTMLElement
  night: HTMLElement
  act4: HTMLElement
  beatPause: HTMLElement
  beatConn: HTMLElement
  beatMove: HTMLElement
  act5: HTMLElement
  act5Sunrise: HTMLElement
  act5Sunset: HTMLElement
  act5Midnight: HTMLElement
  act6: HTMLElement
  act6Heart: HTMLElement
  act6Harmony: HTMLElement
  act6Happiness: HTMLElement
  act7: HTMLElement
  unityField: HTMLElement
  unityStars: HTMLElement[]
  /** Build order: Body (silver), Heart (gold), Soul (silver). */
  rings: UnityRing[]
  /** Caption under the rings. */
  mindBridge: HTMLElement
  unityMono: HTMLElement
  mantra: HTMLElement
  trinity: HTMLElement
}

export interface Metrics {
  /** Rendered width of one trio bottle, px. */
  bottleW: number
  /** |x| of each trio slot in px from the stage centre, innermost first. */
  slots: number[]
  /** |x| of a trio's middle bottle — where that set's label centres. */
  groupCentre: number
  /** Largest |x| a bottle centre may take and stay fully in the viewport. */
  maxX: number
  /** y of the settled bottle row, in px below the stage centre. */
  baseY: number
  /** y of the set labels, in px below the stage centre. */
  labelY: number
}

export function buildScene(): Scene {
  const pick = <T extends Element>(sel: string): T => {
    const el = document.querySelector<T>(sel)
    if (!el) throw new Error(`Missing ${sel}`)
    return el
  }

  const innerStarsG = pick<SVGGElement>('#inner-stars')
  const rand = rng(42)
  const innerStars: SVGCircleElement[] = []
  for (let i = 0; i < INNER_STAR_COUNT; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    const ang = rand() * Math.PI * 2
    const rad = rand() * 50
    c.setAttribute('cx', String(100 + Math.cos(ang) * rad))
    c.setAttribute('cy', String(100 + Math.sin(ang) * rad))
    c.setAttribute('r', String(0.5 + rand() * 1.1))
    c.classList.add('star-dot')
    innerStarsG.append(c)
    innerStars.push(c)
  }

  const stardust = pick<HTMLElement>('#stardust')
  const sparks: HTMLElement[] = []
  const sparkRand = rng(99)
  for (let i = 0; i < STARDUST_COUNT; i++) {
    const el = document.createElement('span')
    el.className = 'spark'
    const ang = sparkRand() * Math.PI * 2
    const dist = 70 + sparkRand() * 240
    el.dataset.x = String(Math.cos(ang) * dist)
    el.dataset.y = String(Math.sin(ang) * dist)
    const size = 1.4 + sparkRand() * 2.4
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    stardust.append(el)
    sparks.push(el)
  }

  const infinity = pick<HTMLElement>('#flow-bg')

  const photoCap = pick<SVGImageElement>('#fi-photo-cap')
  const photoBody = pick<SVGImageElement>('#fi-photo-body')
  const bodyClip = pick<SVGRectElement>('#body-clip-rect')
  registerPhoto(photoCap, photoBody, bodyClip)

  const starField = pick<HTMLElement>('#unity-stars')
  const starRand = rng(1337)
  const unityStars: HTMLElement[] = []
  for (let i = 0; i < TIMING.layout.unity.stars; i++) {
    const el = document.createElement('span')
    el.className = 'unity-star'
    const size = 0.8 + starRand() * 1.7
    el.style.width = `${size.toFixed(2)}px`
    el.style.height = `${size.toFixed(2)}px`
    el.style.left = `${(starRand() * 100).toFixed(2)}%`
    el.style.top = `${(starRand() * 100).toFixed(2)}%`
    // Held on the element so the timeline can fade each star to its own
    // resting brightness rather than a flat value.
    el.dataset.o = (0.18 + starRand() * 0.6).toFixed(3)
    starField.append(el)
    unityStars.push(el)
  }

  const ring = (id: string, iconId: string, labelId: string): UnityRing => {
    const g = pick<SVGGElement>(`#${id}`)
    const at = (cls: string): SVGCircleElement => {
      const c = g.querySelector<SVGCircleElement>(`.${cls}`)
      if (!c) throw new Error(`Missing .${cls} in #${id}`)
      return c
    }
    return {
      draw: [at('ring-halo'), at('ring-core'), at('ring-inner')],
      spec: at('ring-spec'),
      icon: pick<SVGGElement>(`#${iconId}`),
      label: pick<HTMLElement>(`#${labelId}`),
    }
  }

  return {
    stage: pick('#stage'),
    assembly: pick('#assembly'),
    layoutBox: pick('#assembly-layout'),
    capGroup: pick('#cap-group'),
    photoCap,
    photoBody,
    marks: pick('#chrome-mono'),
    bodyClip,
    infinity,
    act4Sky: pick('#act4-sky'),
    act4SkyZoom: pick('#act4-sky-zoom'),
    split: pick('#split'),
    vortex: pick('#vortex'),
    headline: pick('#headline'),
    labelOuter: pick('#label-outer'),
    labelInner: pick('#label-inner'),
    sparks,
    innerStars,
    outerBottles: [...document.querySelectorAll<HTMLImageElement>('.line-bottle.outer')],
    innerBottles: [...document.querySelectorAll<HTMLImageElement>('.line-bottle.inner')],
    grade: pick('#grade'),
    water: pick('#water'),
    tempTeal: pick('#temp-teal'),
    tempEmber: pick('#temp-ember'),
    night: pick('#night'),
    act4: pick('#act4'),
    beatPause: pick('#beat-pause'),
    beatConn: pick('#beat-connection'),
    beatMove: pick('#beat-movement'),
    act5: pick('#act5'),
    act5Sunrise: pick('#act5-sunrise'),
    act5Sunset: pick('#act5-sunset'),
    act5Midnight: pick('#act5-midnight'),
    act6: pick('#act6'),
    act6Heart: pick('#act6-heart'),
    act6Harmony: pick('#act6-harmony'),
    act6Happiness: pick('#act6-happiness'),
    act7: pick('#act7'),
    unityField: pick('#unity-field'),
    unityStars,
    rings: [
      ring('ring-body', 'icon-body', 'label-body'),
      ring('ring-heart', 'icon-heart', 'label-heart'),
      ring('ring-soul', 'icon-soul', 'label-soul'),
    ],
    mindBridge: pick('#mind-bridge'),
    unityMono: pick('#unity-mono'),
    mantra: pick('#mantra'),
    trinity: pick('#trinity'),
  }
}

export function sizeRibbon(svg: SVGSVGElement): void {
  const side = ribbonSide()
  svg.style.width = `${side}px`
  svg.style.height = `${side}px`
}

function registerPhoto(
  cap: SVGImageElement,
  body: SVGImageElement,
  clip: SVGRectElement,
): void {
  const fit = photoFit()
  const reveal = bodyReveal()
  for (const img of [cap, body]) {
    img.setAttribute('href', PHOTO_SRC)
    img.setAttribute('x', fit.x.toFixed(3))
    img.setAttribute('y', fit.y.toFixed(3))
    img.setAttribute('width', fit.w.toFixed(3))
    img.setAttribute('height', fit.h.toFixed(3))
  }
  clip.setAttribute('y', String(reveal.y))
}

let memo: { w: number; h: number; scale: number; value: Metrics } | null = null

/**
 * Single source of truth for where the seven bottles sit once settled.
 * Derived from the live box sizes, so it survives resize and breakpoints.
 *
 * The rest state is three layout groups — trio | Flow Infinite | trio — not
 * points sampled off the lemniscate. Slots are measured outward from the edge
 * of the Flow Infinite silhouette, so the gap either side of the centre bottle
 * is guaranteed no matter how the ∞ box or the breakpoint scales.
 */
export function metrics(scene: Scene, scale = fiScale()): Metrics {
  const { w, h } = viewport()
  if (memo && memo.w === w && memo.h === h && memo.scale === scale) return memo.value

  const l = TIMING.layout
  const g = l.group
  const fit = photoFit()
  const bottleH = scene.outerBottles[0].offsetHeight
  const bottleW = bottleH * l.bottleAspect
  const vb = scene.layoutBox.offsetWidth / 200
  const fiHalf = (fit.w * vb * scale) / 2
  // The trios are cropped tight, the hero photo is not: measure to its glass
  // base so all seven bottles stand on one line.
  const glass = fit.y + fit.h * (l.photo.glassY / l.photo.size.h)
  const fiBase = (glass - l.photo.circle.cy) * vb * scale

  const maxX = w * 0.5 - bottleW * (0.5 + g.edgePad)
  const minStep = bottleW * g.minStep
  // Never let the trio touch the Flow Infinite, even on the narrowest phone.
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
    baseY: fiBase - bottleH * 0.5,
    labelY: fiBase + Math.max(bottleH * 0.16, 16),
  }
  if (bottleH > 0 && vb > 0) memo = { w, h, scale, value }
  return value
}
