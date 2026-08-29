/** Wire T9 approved stills. Missing files become named placeholders — no invented pixels. */

const APPROVED = '/assets/img/approved'

export const APPROVED_SRC = {
  fiBottle: `${APPROVED}/FINAL-FI-BOTTLE-CUT-OUT.png`,
  fiStill: `${APPROVED}/FI-ETERNAL-LOVE.png`,
  logoChrome: `${APPROVED}/LOGO-CHROME.png`,
  sunrise: `${APPROVED}/SUNRISE-ETERNAL-LOVE.png`,
  sunset: `${APPROVED}/SUNSET-ETERNAL-LOVE.png`,
  midnight: `${APPROVED}/MIDNIGHT-ETERNAL-LOVE.png`,
  h1: `${APPROVED}/H1-ETERNAL-LOVE.png`,
  h2: `${APPROVED}/H2-ETERNAL-LOVE.png`,
  h3: `${APPROVED}/H3-ETERNAL-LOVE.png`,
} as const

export function filenameOf(src: string): string {
  return src.split('/').pop() ?? src
}

export function probeImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

/** Toggle `.is-missing` on a slot so the named HTML placeholder shows. */
export function bindApprovedSlot(root: HTMLElement): void {
  const img = root.querySelector('img')
  if (!img) {
    root.classList.add('is-missing')
    return
  }
  const miss = (): void => {
    root.classList.add('is-missing')
    root.classList.remove('is-ready')
  }
  const ready = (): void => {
    root.classList.add('is-ready')
    root.classList.remove('is-missing')
  }
  if (img.complete) {
    if (img.naturalWidth > 0) ready()
    else if (img.getAttribute('src')) miss()
  }
  img.addEventListener('error', miss)
  img.addEventListener('load', ready)
}

/** If the approved file 404s, replace the img with a named placeholder. */
export function placeholderOnError(img: HTMLImageElement): void {
  img.addEventListener('error', () => {
    const mark = document.createElement('div')
    mark.className = 'approved-missing'
    mark.setAttribute('data-file', filenameOf(img.getAttribute('src') ?? ''))
    mark.innerHTML = `<span>${filenameOf(img.getAttribute('src') ?? '')}</span><span>Approved file not in this checkout</span>`
    img.replaceWith(mark)
  })
}

/** Logo may fall back to the in-repo steel mark — not a generated bottle. */
export function logoWithSteelFallback(img: HTMLImageElement): void {
  img.addEventListener('error', () => {
    if (img.dataset.fallback === '1') return
    img.dataset.fallback = '1'
    img.src = '/assets/brand/ej-logo-steel.png'
  })
}
