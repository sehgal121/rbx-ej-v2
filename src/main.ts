import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { HASH_ACT, actAt, type ActId } from './config'
import './ground'
import { updateHud } from './hud'
import { buildScene } from './scene'
import { actScrollY, attachScroll, buildMasterTimeline } from './timeline'

gsap.registerPlugin(ScrollTrigger)

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function boot(): void {
  const scene = buildScene()
  const master = buildMasterTimeline(scene)

  let hashSig = location.hash
  const syncHash = (progress: number): void => {
    const act = actAt(progress)
    const next = 'hash' in act && act.hash ? `#${act.hash}` : ''
    if (next === hashSig) return
    hashSig = next
    history.replaceState(null, '', next || `${location.pathname}${location.search}`)
  }

  master.eventCallback('onUpdate', () => {
    const p = master.progress()
    updateHud(p)
    syncHash(p)
  })

  if (prefersReducedMotion()) {
    document.documentElement.classList.add('is-reduced')
    master.progress(1)
    updateHud(1)
    return
  }

  const lenis = new Lenis({ autoRaf: false })
  ;(window as Window & { __ejLenis?: Lenis }).__ejLenis = lenis
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  const st = attachScroll(master)
  updateHud(0)

  const hashAct = HASH_ACT[decodeURIComponent(location.hash.replace(/^#/, ''))]
  if (hashAct !== undefined) {
    lenis.scrollTo(actScrollY(hashAct, st), { immediate: true })
  }

  window.addEventListener('keydown', (e) => {
    if (document.querySelector('#contactModal.is-open')) return
    const map: Record<string, ActId> = {
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
    }
    const act = map[e.key]
    if (act === undefined) return
    e.preventDefault()
    lenis.scrollTo(actScrollY(act, st), { duration: 1.1 })
  })

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh()
  })
}

boot()
