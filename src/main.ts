import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { HASH_ACT, actAt, type ActId } from './config'
import './ground'
import { updateHud } from './hud'
import { lockViewport, shouldRefreshOnResize } from './mobile-scroll'
import { buildScene } from './scene'
import { actScrollY, attachScroll, buildMasterTimeline } from './timeline'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

type EjWindow = Window & {
  __ejLenis?: Lenis
  __ejST?: ScrollTrigger
  __ejCleanup?: () => void
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function boot(): void {
  const ej = window as EjWindow
  ej.__ejCleanup?.()

  lockViewport()
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

  const lenis = new Lenis({ autoRaf: false, overscroll: false })
  ej.__ejLenis = lenis
  lenis.on('scroll', ScrollTrigger.update)
  const onTick = (time: number): void => {
    lenis.raf(time * 1000)
  }
  gsap.ticker.add(onTick)
  gsap.ticker.lagSmoothing(0)

  const st = attachScroll(master)
  if (import.meta.env.DEV) ej.__ejST = st
  updateHud(0)

  const hashAct = HASH_ACT[decodeURIComponent(location.hash.replace(/^#/, ''))]
  if (hashAct !== undefined) {
    lenis.scrollTo(actScrollY(hashAct, st), { immediate: true })
  }

  const onKey = (e: KeyboardEvent): void => {
    if (document.querySelector('#contactModal.is-open')) return
    const map: Record<string, ActId> = {
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
      '5': 4,
      '6': 5,
      '7': 6,
      '8': 7,
    }
    const act = map[e.key]
    if (act === undefined) return
    e.preventDefault()
    lenis.scrollTo(actScrollY(act, st), { duration: 1.1 })
  }
  window.addEventListener('keydown', onKey)

  let lastW = window.innerWidth
  const onLayoutChange = (): void => {
    const w = window.innerWidth
    if (!shouldRefreshOnResize(lastW, w)) return
    lastW = w
    lockViewport()
    ScrollTrigger.refresh()
  }
  window.addEventListener('resize', onLayoutChange)
  const onOrient = (): void => {
    window.setTimeout(() => {
      lastW = -1
      onLayoutChange()
    }, 120)
  }
  window.addEventListener('orientationchange', onOrient)

  ej.__ejCleanup = () => {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('resize', onLayoutChange)
    window.removeEventListener('orientationchange', onOrient)
    gsap.ticker.remove(onTick)
    st.kill()
    ScrollTrigger.getAll().forEach((t) => t.kill())
    lenis.destroy()
    master.kill()
    ej.__ejLenis = undefined
    ej.__ejST = undefined
    ej.__ejCleanup = undefined
  }
}

boot()
if (import.meta.hot) {
  import.meta.hot.dispose(() => (window as EjWindow).__ejCleanup?.())
}
