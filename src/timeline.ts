import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { FILM_END, TIMING, isNarrow, span, type ActId } from './config'
import { metrics, type Scene } from './scene'

/**
 * One master timeline. ScrollTrigger scrubs it like a film reel.
 * Act 0 = brand logo. Acts 1–3 = Outer, Inner, FLOW Infinite / poster lock.
 */
export function buildMasterTimeline(scene: Scene): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })

  gsap.set(scene.brandHero, { autoAlpha: 1 })
  gsap.set(scene.brandLogo, { scale: 0.22, transformOrigin: '50% 50%' })
  gsap.set([scene.brandLine, scene.brandMantra], { autoAlpha: 0, y: 8 })
  gsap.set(scene.infinity, { autoAlpha: 0 })
  gsap.set(scene.nebula, { autoAlpha: 0 })
  gsap.set(scene.split, { opacity: 0 })
  gsap.set(scene.vortex, { opacity: 0 })
  gsap.set(scene.headline, { opacity: 0 })
  gsap.set([scene.labelOuter, scene.labelInner, scene.labelFi], { opacity: 0, xPercent: -50 })
  gsap.set([...scene.outerBottles, ...scene.innerBottles], {
    opacity: 0,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
  })
  gsap.set(scene.fiSlot, { autoAlpha: 0, x: 0, y: 0, xPercent: -50, yPercent: -50 })
  gsap.set(scene.grade, { opacity: 0, backgroundColor: '#06101f' })
  gsap.set([scene.tempTeal, scene.tempEmber, scene.night], { opacity: 0 })
  gsap.set(
    [
      scene.actOuter,
      scene.actInner,
      scene.actCrossing,
      scene.actOuterSunrise,
      scene.actOuterSunset,
      scene.actOuterMidnight,
      scene.actOuterLink,
      scene.actInnerHeart,
      scene.actInnerHarmony,
      scene.actInnerHappiness,
      scene.actInnerLink,
      scene.actCrossingLink,
    ],
    { autoAlpha: 0, y: 0, pointerEvents: 'none' },
  )

  act0(tl, scene)
  act1(tl, scene)
  act2(tl, scene)
  act3(tl, scene)

  return tl
}

function act0(tl: gsap.core.Timeline, scene: Scene): void {
  const expand = span(0, TIMING.beats.act0.expand)
  const copy = span(0, TIMING.beats.act0.copy)

  tl.to(
    scene.brandLogo,
    { scale: 1, duration: expand.duration, ease: 'power2.out' },
    expand.start,
  )
  tl.to(
    scene.brandLine,
    { autoAlpha: 1, y: 0, duration: copy.duration * 0.55, ease: 'power2.out' },
    copy.start,
  )
  tl.to(
    scene.brandMantra,
    { autoAlpha: 1, y: 0, duration: copy.duration * 0.45, ease: 'power2.out' },
    copy.start + copy.duration * 0.28,
  )
}

type SkuBeat = { start: number; duration: number }

const SKU_COPY_EASE = 'power2.inOut'
const SKU_POSE_EASE = 'power3.inOut'
const SKU_HERO_SCALE = 1.28
const SKU_REST_SCALE = 0.86
const SKU_HERO_BRIGHT = 1
const SKU_REST_BRIGHT = 0.92
const INNER_GLOW = ['154,116,40', '180,176,170', '61,106,66'] as const

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function overlapWindow(outgoing: SkuBeat, incoming: SkuBeat): SkuBeat {
  const outEnd = outgoing.start + outgoing.duration
  const natural = outEnd - incoming.start
  if (natural > 1e-4) return { start: incoming.start, duration: natural }
  const duration = Math.min(outgoing.duration, incoming.duration) * 0.3
  return { start: incoming.start - duration, duration }
}

function fadeSku(
  tl: gsap.core.Timeline,
  outgoing: HTMLElement,
  incoming: HTMLElement,
  handoff: SkuBeat,
): void {
  const { start: at, duration } = handoff
  tl.to(outgoing, { autoAlpha: 0, y: -8, duration: duration * 0.88, ease: SKU_COPY_EASE }, at)
  tl.fromTo(
    incoming,
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration, ease: SKU_COPY_EASE },
    at + duration * 0.2,
  )
}

function crossfadePanels(
  tl: gsap.core.Timeline,
  panels: readonly [HTMLElement, HTMLElement, HTMLElement],
  beats: readonly [SkuBeat, SkuBeat, SkuBeat],
): void {
  const [a, b, c] = panels
  const [beatA, beatB, beatC] = beats
  tl.fromTo(
    a,
    { autoAlpha: 0, y: 14 },
    { autoAlpha: 1, y: 0, duration: beatA.duration * 0.36, ease: SKU_COPY_EASE },
    beatA.start + beatA.duration * 0.08,
  )
  fadeSku(tl, a, b, overlapWindow(beatA, beatB))
  fadeSku(tl, b, c, overlapWindow(beatB, beatC))
}

function revealCta(tl: gsap.core.Timeline, el: HTMLElement, fade: SkuBeat): void {
  tl.to(
    el,
    { autoAlpha: 1, pointerEvents: 'auto', duration: fade.duration, ease: SKU_COPY_EASE },
    fade.start,
  )
}

function dwellCta(tl: gsap.core.Timeline, el: HTMLElement, act: 1 | 2 | 3): void {
  const duration = TIMING.ctaHold[act]
  tl.to(
    el,
    { autoAlpha: 1, pointerEvents: 'auto', duration, ease: 'none' },
    TIMING.acts[act].end - duration,
  )
}

function placeInner(scene: Scene, focus: number): void {
  const w = window.innerWidth
  const narrow = isNarrow()
  const heroX = narrow ? Math.min(w * 0.08, 48) : Math.min(w * 0.17, 210)
  const gap = narrow ? Math.min(w * 0.1, 72) : Math.min(w * 0.125, 148)
  const slots = [
    { x: heroX, y: 40, scale: SKU_HERO_SCALE, z: 12, bright: SKU_HERO_BRIGHT, glow: 0.32 },
    { x: heroX + gap, y: 56, scale: 0.88, z: 5, bright: 0.94, glow: 0.14 },
    { x: heroX + gap * 1.55, y: 72, scale: SKU_REST_SCALE, z: 2, bright: SKU_REST_BRIGHT, glow: 0.08 },
  ]
  const f = Math.min(2, Math.max(0, focus))
  const fromInt = Math.floor(f)
  const toInt = Math.ceil(f)
  const u = f - fromInt

  scene.innerBottles.forEach((el, i) => {
    const fromSlot = slots[((i - fromInt) % 3 + 3) % 3]
    const toSlot = slots[((i - toInt) % 3 + 3) % 3]
    const glow = mix(fromSlot.glow, toSlot.glow, u)
    gsap.set(el, {
      x: mix(fromSlot.x, toSlot.x, u),
      y: mix(fromSlot.y, toSlot.y, u),
      scale: mix(fromSlot.scale, toSlot.scale, u),
      zIndex: Math.round(mix(fromSlot.z, toSlot.z, u)),
      filter: `brightness(${mix(fromSlot.bright, toSlot.bright, u)}) drop-shadow(0 18px 36px rgba(${INNER_GLOW[i]},${glow}))`,
    })
  })
}

function focusWeight(i: number, focus: number): number {
  const d = Math.abs(i - focus)
  return Math.max(0, 1 - Math.min(d, 3 - d))
}

function placeOuter(scene: Scene, focus: number): void {
  const rx = Math.min(window.innerWidth, 1400) * 0.22
  const ry = Math.min(window.innerHeight, 900) * 0.13
  const angle = Math.PI - focus * ((Math.PI * 2) / 3)
  scene.outerBottles.forEach((el, i) => {
    const a = angle + (i * Math.PI * 2) / 3 - Math.PI / 2
    const weight = focusWeight(i, focus)
    gsap.set(el, {
      x: Math.cos(a) * rx,
      y: Math.sin(a) * ry + 36,
      scale: mix(SKU_REST_SCALE, SKU_HERO_SCALE, weight),
      zIndex: Math.round(2 + weight * 10),
      filter: `brightness(${mix(SKU_REST_BRIGHT, SKU_HERO_BRIGHT, weight)}) drop-shadow(0 16px 28px rgba(0,0,0,0.32))`,
    })
  })
}

function driveSkuFocus(
  tl: gsap.core.Timeline,
  fromTime: number,
  toTime: number,
  beatA: SkuBeat,
  beatB: SkuBeat,
  beatC: SkuBeat,
  paint: (focus: number) => void,
): void {
  const focus = { i: 0 }
  const run = (): void => paint(focus.i)
  const aEnd = beatA.start + beatA.duration
  const bEnd = beatB.start + beatB.duration
  const handoff1 = overlapWindow(beatA, beatB)
  const handoff2 = overlapWindow(beatB, beatC)

  tl.to(
    focus,
    { i: 0, duration: handoff1.start - fromTime, ease: 'none', lazy: false, onStart: run, onUpdate: run },
    fromTime,
  )
  tl.to(focus, { i: 1, duration: handoff1.duration, ease: SKU_POSE_EASE, lazy: false, onUpdate: run }, handoff1.start)
  tl.to(focus, { i: 1, duration: handoff2.start - aEnd, ease: 'none', lazy: false, onUpdate: run }, aEnd)
  tl.to(focus, { i: 2, duration: handoff2.duration, ease: SKU_POSE_EASE, lazy: false, onUpdate: run }, handoff2.start)
  tl.to(focus, { i: 2, duration: toTime - bEnd, ease: 'none', lazy: false, onUpdate: run }, bEnd)
}

function act1(tl: gsap.core.Timeline, scene: Scene): void {
  const enter = span(1, TIMING.beats.act1.enter)
  const sunrise = span(1, TIMING.beats.act1.sunrise)
  const sunset = span(1, TIMING.beats.act1.sunset)
  const midnight = span(1, TIMING.beats.act1.midnight)
  const cta = span(1, TIMING.beats.act1.cta)
  const actEnd = TIMING.acts[1].end

  tl.to(scene.brandHero, { autoAlpha: 0, duration: enter.duration, ease: 'power2.inOut' }, enter.start)
  tl.to(scene.grade, { opacity: 1, backgroundColor: '#030303', duration: enter.duration }, enter.start)
  tl.to(scene.actOuter, { autoAlpha: 1, duration: enter.duration * 0.5, ease: 'power2.inOut' }, enter.start + enter.duration * 0.22)
  tl.to(scene.tempTeal, { opacity: 0.42, duration: enter.duration, ease: 'power2.inOut' }, enter.start)

  driveSkuFocus(tl, enter.start, actEnd, sunrise, sunset, midnight, (f) => placeOuter(scene, f))
  scene.outerBottles.forEach((el, i) => {
    tl.to(el, { opacity: 1, duration: enter.duration * 0.5, ease: 'power2.inOut' }, enter.start + i * 0.03)
  })

  crossfadePanels(
    tl,
    [scene.actOuterSunrise, scene.actOuterSunset, scene.actOuterMidnight],
    [sunrise, sunset, midnight],
  )
  tl.to(scene.tempTeal, { opacity: 0.12, duration: sunset.duration * 0.72, ease: 'power2.inOut' }, sunset.start)
  tl.to(scene.tempEmber, { opacity: 0.38, duration: sunset.duration * 0.72, ease: 'power2.inOut' }, sunset.start)
  tl.to(scene.tempEmber, { opacity: 0.08, duration: midnight.duration * 0.7, ease: 'power2.inOut' }, midnight.start)
  tl.to(scene.night, { opacity: 0.7, duration: midnight.duration * 0.7, ease: 'power2.inOut' }, midnight.start)
  revealCta(tl, scene.actOuterLink, cta)
  dwellCta(tl, scene.actOuterLink, 1)
}

function act2(tl: gsap.core.Timeline, scene: Scene): void {
  const invert = span(2, TIMING.beats.act2.invert)
  const heart = span(2, TIMING.beats.act2.heart)
  const harmony = span(2, TIMING.beats.act2.harmony)
  const happiness = span(2, TIMING.beats.act2.happiness)
  const cta = span(2, TIMING.beats.act2.cta)
  const actEnd = TIMING.acts[2].end

  tl.to(scene.actOuter, { autoAlpha: 0, duration: invert.duration * 0.45, ease: 'power2.inOut' }, invert.start)
  tl.to(scene.outerBottles, { opacity: 0, duration: invert.duration * 0.5, ease: 'power2.inOut' }, invert.start)
  tl.to(
    [scene.tempTeal, scene.tempEmber, scene.night],
    { opacity: 0, duration: invert.duration, ease: 'power2.inOut' },
    invert.start,
  )
  tl.to(scene.grade, { backgroundColor: '#f3ebe0', duration: invert.duration, ease: 'power2.inOut' }, invert.start)
  tl.to(
    scene.actInner,
    { autoAlpha: 1, duration: invert.duration * 0.5, ease: 'power2.inOut' },
    invert.start + invert.duration * 0.25,
  )

  driveSkuFocus(tl, invert.start, actEnd, heart, harmony, happiness, (f) => placeInner(scene, f))
  tl.to(
    scene.innerBottles,
    { opacity: 1, duration: invert.duration * 0.55, stagger: 0.04, ease: 'power2.inOut' },
    invert.start + invert.duration * 0.22,
  )

  crossfadePanels(
    tl,
    [scene.actInnerHeart, scene.actInnerHarmony, scene.actInnerHappiness],
    [heart, harmony, happiness],
  )
  revealCta(tl, scene.actInnerLink, cta)
  dwellCta(tl, scene.actInnerLink, 2)
}

const BOTTLE_SHADOW = 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.5))'
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

function act3(tl: gsap.core.Timeline, scene: Scene): void {
  const enter = span(3, TIMING.beats.act3.enter)
  const copy = span(3, TIMING.beats.act3.copy)
  const cta = span(3, TIMING.beats.act3.cta)

  tl.to(scene.actInner, { autoAlpha: 0, duration: enter.duration * 0.55, ease: SKU_COPY_EASE }, enter.start)
  tl.to(scene.grade, { backgroundColor: '#050506', duration: enter.duration, ease: SKU_COPY_EASE }, enter.start)
  tl.to(scene.nebula, { autoAlpha: 1, duration: enter.duration, ease: SKU_COPY_EASE }, enter.start)
  tl.to(scene.infinity, { autoAlpha: 0.72, duration: enter.duration * 1.15, ease: SKU_COPY_EASE }, enter.start)
  tl.to(scene.split, { opacity: 0.35, duration: enter.duration }, enter.start)
  tl.to(scene.vortex, { opacity: 0.4, duration: enter.duration }, enter.start)
  tl.to(scene.actCrossing, { autoAlpha: 1, duration: enter.duration * 0.6, ease: SKU_COPY_EASE }, enter.start + enter.duration * 0.2)
  tl.to(scene.fiSlot, { autoAlpha: 1, duration: enter.duration * 0.7, ease: SKU_COPY_EASE }, enter.start + enter.duration * 0.35)

  paintPoster(tl, scene)

  tl.to(scene.headline, { opacity: 1, duration: copy.duration * 0.7 }, copy.start)
  tl.to(
    [scene.labelOuter, scene.labelInner, scene.labelFi],
    { opacity: 1, duration: copy.duration * 0.5 },
    copy.start + copy.duration * 0.3,
  )
  revealCta(tl, scene.actCrossingLink, cta)
  dwellCta(tl, scene.actCrossingLink, 3)
  tl.set({}, {}, FILM_END)
}

/**
 * Drive every bottle (and the FI slot) onto the poster lock for the whole act
 * so reverse-scrub does not inherit Act 1–2 poses.
 */
function paintPoster(tl: gsap.core.Timeline, scene: Scene): void {
  const { stagger, sweep, startSpread } = TIMING.layout.travel
  const arrive = TIMING.beats.act3.bottlesIn
  const reach = arrive.to - arrive.from
  const leg = reach * sweep
  const lead = reach * stagger

  const sets: Array<{ row: HTMLImageElement[]; side: 1 | -1 }> = [
    { row: [...scene.outerBottles].reverse(), side: -1 },
    { row: scene.innerBottles, side: 1 },
  ]

  const drive = { p: 0 }
  const paint = (): void => {
    const m = metrics(scene)

    for (const { row, side } of sets) {
      row.forEach((el, i) => {
        const u = clamp01((drive.p - (arrive.from + i * lead)) / leg)
        const rest = m.slots[i]
        const from = Math.min(rest * startSpread, m.maxX)
        const glide = 1 - (1 - u) ** 2
        gsap.set(el, {
          x: side * (from + (rest - from) * glide),
          y: m.baseY,
          scale: 1,
          opacity: clamp01(u / 0.34),
          zIndex: 10 - i,
          filter: BOTTLE_SHADOW,
        })
      })
    }

    gsap.set(scene.fiSlot, { x: 0, y: m.baseY })
    gsap.set(scene.labelOuter, { x: -m.groupCentre, y: m.labelY })
    gsap.set(scene.labelInner, { x: m.groupCentre, y: m.labelY })
    gsap.set(scene.labelFi, { x: 0, y: m.labelY })
  }

  const act = TIMING.acts[3]
  tl.fromTo(
    drive,
    { p: 0 },
    {
      p: 1,
      duration: act.end - act.start,
      ease: 'none',
      lazy: false,
      onStart: paint,
      onUpdate: paint,
      onComplete: paint,
    },
    act.start,
  )
}

export function attachScroll(master: gsap.core.Timeline): ScrollTrigger {
  const extraVh = TIMING.scrollLengthVh - 100

  return ScrollTrigger.create({
    trigger: '#stage',
    start: 'top top',
    end: `+=${extraVh}%`,
    pin: true,
    pinSpacing: true,
    scrub: TIMING.scrub,
    invalidateOnRefresh: true,
    animation: master,
  })
}

export function actScrollY(act: ActId, st: ScrollTrigger): number {
  return st.start + (TIMING.acts[act].start / FILM_END) * (st.end - st.start)
}
