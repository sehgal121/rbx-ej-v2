import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TIMING, span, FILM_END, SHOW_UNITY, isNarrow, type ActId } from './config'
import { INFINITY_GONE } from './infinity'
import {
  bodyReveal,
  fiScale,
  metrics,
  type Scene,
} from './scene'

/**
 * One master timeline. ScrollTrigger scrubs it like a film reel.
 * `span()` times are playhead positions; acts 0–3 still occupy 0–1.
 */
export function buildMasterTimeline(scene: Scene): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } })

  gsap.set(scene.capGroup, { opacity: 1 })
  gsap.set(scene.assembly, { scale: 1, y: 0, transformOrigin: '0px 0px' })
  gsap.set(scene.marks, { opacity: 1 })
  gsap.set(scene.photoCap, { opacity: 0 })
  gsap.set(scene.bodyClip, { attr: { height: 0 } })
  gsap.set(scene.infinity, { opacity: 0 })
  gsap.set(scene.act4Sky, { opacity: 0 })
  gsap.set(scene.act4SkyZoom, {
    scale: TIMING.layout.act4Sky.scaleFrom,
    transformOrigin: '50% 70%',
  })
  gsap.set(scene.split, { opacity: 0 })
  gsap.set(scene.vortex, { opacity: 0 })
  gsap.set(scene.headline, { opacity: 0 })
  gsap.set([scene.labelOuter, scene.labelInner], { opacity: 0, xPercent: -50 })
  gsap.set([...scene.outerBottles, ...scene.innerBottles], {
    opacity: 0,
    x: 0,
    y: 0,
    xPercent: -50,
    yPercent: -50,
  })
  gsap.set(scene.grade, { opacity: 0, backgroundColor: '#06101f' })
  gsap.set([scene.water, scene.tempTeal, scene.tempEmber, scene.night], { opacity: 0 })
  gsap.set(
    [
      scene.act4,
      scene.act5,
      scene.act6,
      scene.act7,
      scene.beatPause,
      scene.beatConn,
      scene.beatMove,
      scene.act4Link,
      scene.act5Sunrise,
      scene.act5Sunset,
      scene.act5Midnight,
      scene.act5Link,
      scene.act6Heart,
      scene.act6Harmony,
      scene.act6Happiness,
      scene.act6Link,
      ...scene.rings.map((r) => r.label),
      ...scene.rings.map((r) => r.icon),
      scene.mindBridge,
      scene.unityMono,
      scene.mantra,
    ],
    { autoAlpha: 0, y: 0, pointerEvents: 'none' },
  )
  gsap.set([scene.act4Link, scene.act5Link, scene.act6Link], { pointerEvents: 'none' })
  gsap.set(scene.unityField, { opacity: 0 })
  gsap.set(scene.unityStars, { opacity: 0 })
  gsap.set(scene.trinity, { scale: 1, transformOrigin: '50% 50%' })
  gsap.set(scene.unityMono, { scale: 0.78, transformOrigin: '50% 50%' })

  act0(tl, scene)
  act1(tl, scene)
  act2(tl, scene)
  act3(tl, scene)
  act4(tl, scene)
  act5(tl, scene)
  act6(tl, scene)
  act7(tl, scene)

  return tl
}

function act0(tl: gsap.core.Timeline, scene: Scene): void {
  // Full-bright logo from frame 0 — no dim / 0.62 fade-in.
  // Act 0 is a one-tick hold; capHandoff starts at act 1 local 0.
  tl.set(scene.capGroup, { opacity: 1 }, 0)
  tl.set(scene.marks, { opacity: 1 }, 0)
  tl.set(scene.photoCap, { opacity: 0 }, 0)
}

function act1(tl: gsap.core.Timeline, scene: Scene): void {
  const marks = span(1, TIMING.beats.act1.marksOut)
  const sphere = span(1, TIMING.beats.act1.ringToSphere)
  const handoff = span(1, TIMING.beats.act1.capHandoff)
  const dust = span(1, TIMING.beats.act1.stardust)
  const body = span(1, TIMING.beats.act1.bodyReveal)
  const pull = span(1, TIMING.beats.act1.pullBack)

  tl.to(scene.innerStars, { opacity: 0, duration: sphere.duration * 0.55 }, sphere.start)

  // power1.out: first wheel ticks already show the spherical cap.
  tl.to(
    scene.photoCap,
    { opacity: 1, duration: handoff.duration, ease: 'power1.out' },
    handoff.start,
  )

  tl.to(scene.marks, { opacity: 0, duration: marks.duration }, marks.start)

  const halfDust = dust.duration * 0.55
  tl.fromTo(
    scene.sparks,
    { x: 0, y: 0, opacity: 0, scale: 0.2 },
    {
      x: (_i, t: HTMLElement) => Number(t.dataset.x),
      y: (_i, t: HTMLElement) => Number(t.dataset.y),
      opacity: 0.9,
      scale: 1,
      duration: halfDust,
      stagger: halfDust / 90,
      ease: 'power1.out',
    },
    dust.start,
  )
  tl.to(
    scene.sparks,
    { opacity: 0, duration: dust.duration - halfDust, ease: 'power1.in' },
    dust.start + halfDust,
  )

  tl.to(
    scene.bodyClip,
    { attr: { height: bodyReveal().height }, duration: body.duration, ease: 'power2.inOut' },
    body.start,
  )

  tl.to(
    scene.assembly,
    { scale: 0.72, duration: pull.duration, ease: 'power1.inOut' },
    pull.start,
  )
}

function act2(tl: gsap.core.Timeline, scene: Scene): void {
  const pull = span(2, TIMING.beats.act2.pullBack)
  const ribbon = span(2, TIMING.beats.act2.ribbon)
  const split = span(2, TIMING.beats.act2.splitBg)

  tl.to(
    scene.assembly,
    { scale: () => fiScale(), y: '0vh', duration: pull.duration, ease: 'power1.inOut' },
    pull.start,
  )

  tl.to(
    scene.infinity,
    { opacity: 1, visibility: 'visible', duration: ribbon.duration, ease: 'power1.inOut' },
    ribbon.start,
  )

  tl.to(scene.split, { opacity: 1, duration: split.duration }, split.start)
}

function act3(tl: gsap.core.Timeline, scene: Scene): void {
  const rise = span(3, TIMING.beats.act3.fiRise)
  const settle = span(3, TIMING.beats.act3.settle)
  const copy = span(3, TIMING.beats.act3.copy)
  const vortex = span(3, TIMING.beats.act3.vortex)

  buildSets(tl, scene)

  tl.to(
    scene.assembly,
    { scale: () => fiScale(), duration: rise.duration, ease: 'power2.out' },
    rise.start,
  )

  tl.to(scene.infinity, { opacity: 0, duration: settle.duration }, settle.start)
  tl.set(scene.infinity, INFINITY_GONE, TIMING.acts[3].end)
  tl.to(scene.split, { opacity: 0.45, duration: vortex.duration }, vortex.start)

  tl.to(scene.headline, { opacity: 1, duration: copy.duration * 0.7 }, copy.start)
  tl.to(
    [scene.labelOuter, scene.labelInner],
    { opacity: 1, duration: copy.duration * 0.5 },
    copy.start + copy.duration * 0.35,
  )

  tl.to(scene.vortex, { opacity: 0.85, duration: vortex.duration }, vortex.start)

  dwellTriptych(tl, scene)
}

function act4(tl: gsap.core.Timeline, scene: Scene): void {
  const enter = span(4, TIMING.beats.act4.enter)
  const pause = span(4, TIMING.beats.act4.pause)
  const conn = span(4, TIMING.beats.act4.connection)
  const move = span(4, TIMING.beats.act4.movement)
  const cta = span(4, TIMING.beats.act4.cta)
  const act = TIMING.acts[4]
  const { scaleFrom, scaleTo } = TIMING.layout.act4Sky

  tl.to(
    [scene.headline, scene.labelOuter, scene.labelInner],
    { opacity: 0, duration: enter.duration * 0.45 },
    enter.start,
  )
  tl.to(
    [...scene.outerBottles, ...scene.innerBottles],
    { opacity: 0, duration: enter.duration * 0.65, stagger: 0.015 },
    enter.start,
  )
  tl.to(
    [scene.split, scene.vortex],
    { opacity: 0, duration: enter.duration },
    enter.start,
  )
  tl.to(scene.grade, { opacity: 1, duration: enter.duration }, enter.start)
  // Night sky replaces the navy grade + ripple water. `#flow-bg` stays
  // INFINITY_GONE from acts[3].end — do not fade it back here.
  tl.to(scene.act4Sky, { opacity: 1, duration: enter.duration }, enter.start)
  tl.fromTo(
    scene.act4SkyZoom,
    { scale: scaleFrom },
    { scale: scaleTo, duration: act.end - act.start, ease: 'none' },
    act.start,
  )
  tl.to(
    scene.assembly,
    { scale: 0.9, y: '7vh', duration: enter.duration, ease: 'power2.inOut' },
    enter.start,
  )
  tl.to(scene.act4, { autoAlpha: 1, duration: enter.duration * 0.55 }, enter.start + enter.duration * 0.28)

  tl.to(scene.beatPause, { autoAlpha: 1, color: '#f0ead8', duration: pause.duration * 0.22 }, pause.start)
  tl.to(
    scene.beatPause,
    { autoAlpha: 0.28, color: 'rgba(232,228,216,0.22)', duration: pause.duration * 0.18 },
    pause.start + pause.duration * 0.82,
  )

  tl.to(scene.beatConn, { autoAlpha: 1, color: '#f0ead8', duration: conn.duration * 0.22 }, conn.start)
  tl.to(
    scene.beatConn,
    { autoAlpha: 0.28, color: 'rgba(232,228,216,0.22)', duration: conn.duration * 0.18 },
    conn.start + conn.duration * 0.82,
  )

  tl.to(scene.beatMove, { autoAlpha: 1, color: '#f0ead8', duration: move.duration * 0.22 }, move.start)
  tl.to(
    scene.assembly,
    { y: '5vh', duration: move.duration, ease: 'sine.inOut' },
    move.start,
  )
  revealCta(tl, scene.act4Link, cta)
  dwellCta(tl, scene.act4Link, 4)
}

type SkuBeat = { start: number; duration: number }

const SKU_COPY_EASE = 'power2.inOut'

function revealCta(tl: gsap.core.Timeline, el: HTMLElement, fade: SkuBeat): void {
  tl.to(
    el,
    { autoAlpha: 1, pointerEvents: 'auto', duration: fade.duration, ease: SKU_COPY_EASE },
    fade.start,
  )
}

function dwellCta(tl: gsap.core.Timeline, el: HTMLElement, act: 4 | 5 | 6): void {
  const duration = TIMING.ctaHold[act]
  tl.to(
    el,
    { autoAlpha: 1, pointerEvents: 'auto', duration, ease: 'none' },
    TIMING.acts[act].end - duration,
  )
}

/** Hold the settled triptych after `acts[3].end` (1.0) until Act 4 enter. */
function dwellTriptych(tl: gsap.core.Timeline, scene: Scene): void {
  const duration = TIMING.ctaHold[3]
  tl.to(
    [scene.headline, scene.labelOuter, scene.labelInner],
    { opacity: 1, duration, ease: 'none' },
    TIMING.acts[3].end,
  )
}

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

/** Outgoing copy fades while incoming is already arriving; copy lags the bottles. */
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

/**
 * Inner Journey constellation: one hero slot (centre-right), two quieter
 * supports to its right. `focus` is a float 0–2 so Heart → Harmony → Happiness
 * lerps pose instead of snapping integer slots.
 */
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

/** Outer trio on a shallow ellipse; hero is the bottle at the front of the loop. */
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

function act5(tl: gsap.core.Timeline, scene: Scene): void {
  const enter = span(5, TIMING.beats.act5.enter)
  const sunrise = span(5, TIMING.beats.act5.sunrise)
  const sunset = span(5, TIMING.beats.act5.sunset)
  const midnight = span(5, TIMING.beats.act5.midnight)
  const ctaShow = span(5, TIMING.beats.act5.ctaShow)
  const actEnd = TIMING.acts[5].end

  tl.to(scene.act4, { autoAlpha: 0, duration: enter.duration * 0.45 }, enter.start)
  tl.to(scene.act4Sky, { opacity: 0, duration: enter.duration }, enter.start)
  tl.to(
    scene.assembly,
    { opacity: 0, scale: 0.38, duration: enter.duration, ease: 'power2.in' },
    enter.start,
  )
  tl.to(scene.grade, { backgroundColor: '#030303', duration: enter.duration, ease: 'power2.inOut' }, enter.start)
  tl.to(scene.act5, { autoAlpha: 1, duration: enter.duration * 0.5, ease: 'power2.inOut' }, enter.start + enter.duration * 0.22)
  tl.to(scene.tempTeal, { opacity: 0.42, duration: enter.duration, ease: 'power2.inOut' }, enter.start)

  driveSkuFocus(tl, enter.start, actEnd, sunrise, sunset, midnight, (f) => placeOuter(scene, f))
  scene.outerBottles.forEach((el, i) => {
    tl.to(el, { opacity: 1, duration: enter.duration * 0.5, ease: 'power2.inOut' }, enter.start + i * 0.03)
  })

  crossfadePanels(tl, [scene.act5Sunrise, scene.act5Sunset, scene.act5Midnight], [sunrise, sunset, midnight])
  tl.to(scene.tempTeal, { opacity: 0.12, duration: sunset.duration * 0.72, ease: 'power2.inOut' }, sunset.start)
  tl.to(scene.tempEmber, { opacity: 0.38, duration: sunset.duration * 0.72, ease: 'power2.inOut' }, sunset.start)
  tl.to(scene.tempEmber, { opacity: 0.08, duration: midnight.duration * 0.7, ease: 'power2.inOut' }, midnight.start)
  tl.to(scene.night, { opacity: 0.7, duration: midnight.duration * 0.7, ease: 'power2.inOut' }, midnight.start)
  revealCta(tl, scene.act5Link, ctaShow)
  dwellCta(tl, scene.act5Link, 5)
}

function act6(tl: gsap.core.Timeline, scene: Scene): void {
  const invert = span(6, TIMING.beats.act6.invert)
  const heart = span(6, TIMING.beats.act6.heart)
  const harmony = span(6, TIMING.beats.act6.harmony)
  const happiness = span(6, TIMING.beats.act6.happiness)
  const cta = span(6, TIMING.beats.act6.cta)
  const actEnd = TIMING.acts[6].end

  tl.to(scene.act5, { autoAlpha: 0, duration: invert.duration * 0.45, ease: 'power2.inOut' }, invert.start)
  tl.to(scene.outerBottles, { opacity: 0, duration: invert.duration * 0.5, ease: 'power2.inOut' }, invert.start)
  tl.to(
    [scene.tempTeal, scene.tempEmber, scene.night],
    { opacity: 0, duration: invert.duration, ease: 'power2.inOut' },
    invert.start,
  )
  tl.to(
    scene.grade,
    { backgroundColor: '#f3ebe0', duration: invert.duration, ease: 'power2.inOut' },
    invert.start,
  )
  tl.to(scene.act6, { autoAlpha: 1, duration: invert.duration * 0.5, ease: 'power2.inOut' }, invert.start + invert.duration * 0.25)

  driveSkuFocus(tl, invert.start, actEnd, heart, harmony, happiness, (f) => placeInner(scene, f))
  tl.to(
    scene.innerBottles,
    { opacity: 1, duration: invert.duration * 0.55, stagger: 0.04, ease: 'power2.inOut' },
    invert.start + invert.duration * 0.22,
  )

  crossfadePanels(tl, [scene.act6Heart, scene.act6Harmony, scene.act6Happiness], [heart, harmony, happiness])
  revealCta(tl, scene.act6Link, cta)
  dwellCta(tl, scene.act6Link, 6)
}

/**
 * Balance and Unity. The diagram is forged, not faded in: three metal rings
 * are traced one at a time, each led by a specular glint that travels the
 * circumference and stays where it stops. After Soul closes, the caption
 * under the rings fades in; `ctaHold[7]` dwells before converge/monogram.
 */
function act7(tl: gsap.core.Timeline, scene: Scene): void {
  if (!SHOW_UNITY) {
    tl.set({}, {}, FILM_END)
    return
  }

  const enter = span(7, TIMING.beats.act7.enter)
  const builds = [
    span(7, TIMING.beats.act7.ringBody),
    span(7, TIMING.beats.act7.ringHeart),
    span(7, TIMING.beats.act7.ringSoul),
  ]
  const caption = span(7, TIMING.beats.act7.caption)
  const dwell = TIMING.ctaHold[7]
  const converge = span(7, TIMING.beats.act7.converge)
  const mono = span(7, TIMING.beats.act7.monogram)
  const mantra = span(7, TIMING.beats.act7.mantra)
  const afterHold = (beat: { start: number; duration: number }) => beat.start + dwell

  tl.to(scene.act6, { autoAlpha: 0, duration: enter.duration * 0.7, ease: SKU_COPY_EASE }, enter.start)
  tl.to(scene.innerBottles, { opacity: 0, duration: enter.duration * 0.8, ease: SKU_COPY_EASE }, enter.start)
  tl.to(
    scene.grade,
    { backgroundColor: '#050506', duration: enter.duration, ease: SKU_COPY_EASE },
    enter.start,
  )
  tl.to(scene.act7, { autoAlpha: 1, duration: enter.duration * 0.6, ease: SKU_COPY_EASE }, enter.start)
  tl.to(scene.unityField, { opacity: 1, duration: enter.duration * 1.8, ease: SKU_COPY_EASE }, enter.start)
  tl.to(
    scene.unityStars,
    {
      opacity: (_i: number, el: HTMLElement) => Number(el.dataset.o),
      duration: enter.duration * 2,
      stagger: { amount: enter.duration * 1.4, from: 'random' },
      ease: SKU_COPY_EASE,
    },
    enter.start,
  )

  const { ringR, glint } = TIMING.layout.unity
  const len = 2 * Math.PI * ringR

  scene.rings.forEach((ring, i) => {
    const b = builds[i]
    // The core is drawn by walking its dash offset from full to nothing. The
    // glint rides the same clock one dash-length behind the leading edge, so
    // it reads as the point where the metal is being laid down.
    gsap.set(ring.draw, {
      attr: { 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len },
    })
    gsap.set(ring.spec, {
      attr: { 'stroke-dasharray': `${glint} ${len}`, 'stroke-dashoffset': glint },
      opacity: 0,
    })

    // Trace, then a short settle: the ring is closed well before its
    // neighbour starts, which is what keeps the three builds legible as three.
    const trace = b.duration * 0.88
    tl.to(
      ring.draw,
      { attr: { 'stroke-dashoffset': 0 }, duration: trace, ease: SKU_POSE_EASE },
      b.start,
    )
    tl.to(ring.spec, { opacity: 1, duration: trace * 0.12, ease: SKU_COPY_EASE }, b.start)
    tl.to(
      ring.spec,
      { attr: { 'stroke-dashoffset': glint - len }, duration: trace, ease: SKU_POSE_EASE },
      b.start,
    )
    tl.to(
      ring.spec,
      { opacity: 0.5, duration: b.duration - trace, ease: SKU_COPY_EASE },
      b.start + trace,
    )

    tl.fromTo(
      ring.icon,
      { autoAlpha: 0, scale: 0.9 },
      {
        autoAlpha: 1,
        scale: 1,
        transformOrigin: '50% 50%',
        duration: trace * 0.34,
        ease: SKU_COPY_EASE,
      },
      b.start + trace * 0.66,
    )
    tl.fromTo(
      ring.label,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: trace * 0.34, ease: SKU_COPY_EASE },
      b.start + trace * 0.82,
    )
  })

  // Caption under the rings. `ctaHold[7]` keeps it readable before converge.
  const captionIn = caption.duration * 0.4
  const captionAt = caption.start + caption.duration * 0.46
  tl.fromTo(
    scene.mindBridge,
    { autoAlpha: 0, y: 8 },
    { autoAlpha: 1, y: 0, duration: captionIn, ease: SKU_COPY_EASE },
    captionAt,
  )
  const captionLanded = captionAt + captionIn
  const convergeAt = afterHold(converge)
  tl.to(
    scene.mindBridge,
    { autoAlpha: 1, duration: convergeAt - captionLanded, ease: 'none' },
    captionLanded,
  )

  tl.to(
    scene.trinity,
    { scale: 0.3, autoAlpha: 0, duration: converge.duration, ease: 'power2.in' },
    convergeAt,
  )
  tl.to(
    scene.unityField,
    { opacity: 0.4, duration: converge.duration, ease: SKU_COPY_EASE },
    convergeAt,
  )
  tl.to(
    scene.unityMono,
    { autoAlpha: 1, scale: 1, duration: mono.duration * 0.7, ease: 'power2.out' },
    afterHold(mono),
  )
  tl.to(
    scene.mantra,
    { autoAlpha: 1, duration: mantra.duration * 0.55, ease: SKU_COPY_EASE },
    afterHold(mantra),
  )
  tl.set({}, {}, FILM_END)
}

const BOTTLE_SHADOW = 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.5))'

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Act 3 is three sets: Outer trio | Flow Infinite | Inner trio.
 *
 * Each trio arrives from its own side of the frame and comes to rest on the
 * layout slots from `metrics()`, never on lemniscate coordinates — the ∞ stays
 * a backdrop rather than a rail that funnels seven bottles onto the crossing.
 *
 * One driver spanning the whole act repaints the complete pose (x, y, scale,
 * filter, stacking) instead of only x/y during the arrival beat. Acts 5 and 6
 * repose these same elements, so a driver scoped to the arrival would leave
 * their scales and brightness behind when the reel is scrubbed backwards.
 */
function buildSets(tl: gsap.core.Timeline, scene: Scene): void {
  const { stagger, sweep, startSpread } = TIMING.layout.travel
  const arrive = TIMING.beats.act3.bottlesIn
  const reach = arrive.to - arrive.from
  const leg = reach * sweep
  const lead = reach * stagger

  // Outer reads sunrise → sunset → midnight left-to-right, so the innermost
  // slot on the left is the last of the three.
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

    gsap.set(scene.labelOuter, { x: -m.groupCentre, y: m.labelY })
    gsap.set(scene.labelInner, { x: m.groupCentre, y: m.labelY })
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
