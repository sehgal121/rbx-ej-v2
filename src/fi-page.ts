import gsap from 'gsap'
import './fi-page.css'
import './site'

const PHOTO_SRC = '/assets/bottles/flow-infinite.png'
const PHOTO = {
  size: { w: 533, h: 1134 },
  cap: { cx: 261.44, cy: 218.59, r: 202.68 },
  circle: { cx: 100, cy: 100, r: 56 },
  neckY: 152,
}

function photoFit(): { x: number; y: number; w: number; h: number } {
  const { size, cap, circle } = PHOTO
  const k = circle.r / cap.r
  return {
    x: circle.cx - cap.cx * k,
    y: circle.cy - cap.cy * k,
    w: size.w * k,
    h: size.h * k,
  }
}

function bodyRevealHeight(): number {
  const fit = photoFit()
  return fit.y + fit.h - PHOTO.neckY
}

function rng(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function registerPhoto(): {
  photoCap: SVGImageElement
  marks: SVGImageElement
  bodyClip: SVGRectElement
  innerStars: SVGGElement
  sparks: HTMLElement[]
} | null {
  const photoCap = document.querySelector<SVGImageElement>('#fi-photo-cap')
  const photoBody = document.querySelector<SVGImageElement>('#fi-photo-body')
  const bodyClip = document.querySelector<SVGRectElement>('#body-clip-rect')
  const marks = document.querySelector<SVGImageElement>('#chrome-mono')
  const innerStars = document.querySelector<SVGGElement>('#inner-stars')
  const stardust = document.querySelector<HTMLElement>('#stardust')
  if (!photoCap || !photoBody || !bodyClip || !marks || !innerStars || !stardust) return null

  const fit = photoFit()
  for (const img of [photoCap, photoBody]) {
    img.setAttribute('href', PHOTO_SRC)
    img.setAttribute('x', fit.x.toFixed(3))
    img.setAttribute('y', fit.y.toFixed(3))
    img.setAttribute('width', fit.w.toFixed(3))
    img.setAttribute('height', fit.h.toFixed(3))
  }
  bodyClip.setAttribute('y', String(PHOTO.neckY))
  bodyClip.setAttribute('height', '0')

  const starRand = rng(42)
  for (let i = 0; i < 28; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    const ang = starRand() * Math.PI * 2
    const rad = starRand() * 50
    c.setAttribute('cx', String(100 + Math.cos(ang) * rad))
    c.setAttribute('cy', String(100 + Math.sin(ang) * rad))
    c.setAttribute('r', String(0.5 + starRand() * 1.1))
    c.classList.add('star-dot')
    innerStars.append(c)
  }

  const sparkRand = rng(99)
  const sparks: HTMLElement[] = []
  for (let i = 0; i < 80; i++) {
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

  return { photoCap, marks, bodyClip, innerStars, sparks }
}

function playCap(): void {
  const scene = registerPhoto()
  const assembly = document.querySelector<HTMLElement>('#assembly')
  if (!scene || !assembly) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  gsap.set(scene.photoCap, { opacity: 0 })
  gsap.set(scene.marks, { opacity: 1 })
  gsap.set(scene.bodyClip, { attr: { height: 0 } })
  gsap.set(assembly, { scale: 1, transformOrigin: '0px 0px' })

  if (reduced) {
    gsap.set(scene.photoCap, { opacity: 1 })
    gsap.set(scene.marks, { opacity: 0 })
    gsap.set(scene.bodyClip, { attr: { height: bodyRevealHeight() } })
    gsap.set(assembly, { scale: 0.72 })
    return
  }

  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  tl.to(scene.innerStars, { opacity: 0, duration: 1.1 }, 0.15)
  tl.to(scene.photoCap, { opacity: 1, duration: 1.2, ease: 'power1.out' }, 0.1)
  tl.to(scene.marks, { opacity: 0, duration: 1.4 }, 0.35)

  const halfDust = 1.1
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
    0.4,
  )
  tl.to(scene.sparks, { opacity: 0, duration: 1.0, ease: 'power1.in' }, 0.4 + halfDust)
  tl.to(
    scene.bodyClip,
    { attr: { height: bodyRevealHeight() }, duration: 3.2, ease: 'power2.inOut' },
    0.8,
  )
  tl.to(assembly, { scale: 0.72, duration: 1.6, ease: 'power1.inOut' }, 4.4)
}

playCap()
