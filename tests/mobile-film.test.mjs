/**
 * V2.5 film ends on the Act 3 triptych. Ground (collection links, then stores)
 * follows the pin. SKU acts are not on this reel.
 */
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const MOBILE = {
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
}

const DESKTOP = { viewport: { width: 1440, height: 900 } }

let server
let origin
let browser

async function scrollFilm(page, pct) {
  await page.evaluate((target) => {
    const st = window.__ejST
    if (!st) throw new Error('missing __ejST')
    const y = st.start + (target / 100) * (st.end - st.start)
    const lenis = window.__ejLenis
    if (lenis?.scrollTo) lenis.scrollTo(y, { immediate: true })
    else window.scrollTo(0, y)
  }, pct)
  await page.waitForFunction(
    (target) => {
      const p = parseFloat(document.querySelector('#review-pct')?.textContent ?? 'NaN')
      return Number.isFinite(p) && Math.abs(p - target) < 1.6
    },
    pct,
    { timeout: 2500 },
  )
}

async function readFilm(page) {
  return page.evaluate(() => {
    const bg = document.querySelector('#flow-bg')
    const stage = document.querySelector('#stage')
    const cs = bg ? getComputedStyle(bg) : null
    const stageBox = stage?.getBoundingClientRect()
    return {
      pct: parseFloat(document.querySelector('#review-pct')?.textContent ?? 'NaN'),
      opacity: Number(cs?.opacity ?? 1),
      visibility: cs?.visibility ?? '',
      stageTop: stageBox?.top ?? 0,
      innerH: window.innerHeight,
      scrollY: window.scrollY,
    }
  })
}

async function filmCast(page) {
  return page.evaluate(() => {
    const card = (el) => {
      const r = el.getBoundingClientRect()
      return {
        opacity: Number(getComputedStyle(el).opacity),
        height: r.height,
        left: r.left,
        right: r.right,
        bottom: r.bottom,
        midX: (r.left + r.right) / 2,
      }
    }
    const label = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return { opacity: 0, text: '', top: 0 }
      const r = el.getBoundingClientRect()
      return {
        opacity: Number(getComputedStyle(el).opacity),
        text: (el.textContent ?? '').trim(),
        top: r.top,
      }
    }
    const assembly = document.querySelector('#assembly')
    const photo = document.querySelector('#fi-photo-body')
    const still = document.querySelector('#journey-still')
    const headline = document.querySelector('#headline')
    const headlineBox = headline?.getBoundingClientRect()
    const headlineCs = headline ? getComputedStyle(headline) : null
    return {
      pct: parseFloat(document.querySelector('#review-pct')?.textContent ?? 'NaN'),
      assemblyOpacity: assembly ? Number(getComputedStyle(assembly).opacity) : 0,
      assemblyHeight: photo?.getBoundingClientRect().height ?? 0,
      stillOpacity: still ? Number(getComputedStyle(still).opacity) : 0,
      headline: {
        opacity: headlineCs ? Number(headlineCs.opacity) : 0,
        nowrap: headlineCs?.whiteSpace === 'nowrap',
        width: headlineBox?.width ?? 0,
        height: headlineBox?.height ?? 0,
        vw: window.innerWidth,
      },
      outers: [...document.querySelectorAll('.line-bottle.outer')].map(card),
      inners: [...document.querySelectorAll('.line-bottle.inner')].map(card),
      labels: {
        outer: label('#label-outer'),
        flow: label('#label-flow'),
        inner: label('#label-inner'),
      },
    }
  })
}

before(async () => {
  server = await createServer({
    server: { port: 5176, strictPort: true, host: '127.0.0.1' },
  })
  await server.listen()
  origin = 'http://127.0.0.1:5176'
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  await server?.close()
})

test('fast mobile flick to the triptych does not leave the infinity still on screen', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#flow-bg', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 54)
  await page.waitForTimeout(80)
  const atInfinity = await readFilm(page)
  assert.ok(
    atInfinity.opacity > 0.05,
    `expected infinity visible mid-film, got opacity ${atInfinity.opacity} pct ${atInfinity.pct}`,
  )

  await scrollFilm(page, 96)
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )

  const afterFlick = await readFilm(page)
  await context.close()

  assert.ok(afterFlick.pct > 90, `playhead still lagging at ${afterFlick.pct}% after flick to triptych`)
  assert.ok(
    afterFlick.opacity < 0.02 && afterFlick.visibility === 'hidden',
    `infinity still painted after flick: opacity ${afterFlick.opacity} visibility ${afterFlick.visibility}`,
  )
})

test('height-only resize on the triptych does not unpin into Ground', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#flow-bg', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 96)
  await page.waitForTimeout(200)

  const before = await readFilm(page)
  assert.ok(before.pct > 90, `expected triptych, got ${before.pct}%`)
  assert.ok(Math.abs(before.stageTop) < 8, `stage should stay pinned, top ${before.stageTop}`)

  await page.setViewportSize({ width: 390, height: 720 })
  await page.waitForTimeout(400)

  const after = await readFilm(page)
  await context.close()

  assert.ok(
    Math.abs(after.pct - before.pct) < 8,
    `playhead jumped ${before.pct}% → ${after.pct}% on height-only resize`,
  )
  assert.ok(
    Math.abs(after.stageTop) < 24,
    `stage unpinned into Ground on height-only resize (top ${after.stageTop})`,
  )
})

test('at 96% the seven bottles and three collection labels are up', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 96)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const outers = m.outers.filter((b) => b.opacity > 0.5)
  const inners = m.inners.filter((b) => b.opacity > 0.5)
  assert.equal(outers.length, 3, `outer trio missing at ${m.pct}%`)
  assert.equal(inners.length, 3, `inner trio missing at ${m.pct}%`)
  assert.ok(m.assemblyOpacity > 0.7, `Flow Infinite missing at ${m.pct}%: ${m.assemblyOpacity}`)
  assert.ok(m.stillOpacity > 0.8, `campaign nebula missing at ${m.pct}%: ${m.stillOpacity}`)
  assert.equal(m.labels.outer.text, 'Outer Journey')
  assert.equal(m.labels.flow.text, 'Flow Infinite')
  assert.equal(m.labels.inner.text, 'Inner Journey')
  assert.ok(m.labels.outer.opacity > 0.9, `Outer Journey label faded at ${m.pct}%`)
  assert.ok(m.labels.flow.opacity > 0.9, `Flow Infinite label faded at ${m.pct}%`)
  assert.ok(m.labels.inner.opacity > 0.9, `Inner Journey label faded at ${m.pct}%`)
  const lowest = Math.max(...[...outers, ...inners].map((b) => b.bottom))
  const heights = [...outers, ...inners].map((b) => b.height)
  assert.ok(
    heights.every((h) => h > 330),
    `Act 3 bottles too small vs the still at ${m.pct}%: ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
  assert.ok(
    [m.labels.outer, m.labels.flow, m.labels.inner].every((l) => l.top > lowest + 8),
    `labels sit under the bottles at ${m.pct}%`,
  )
  assert.ok(m.headline.opacity > 0.8, `headline faded at ${m.pct}%`)
  assert.ok(m.headline.nowrap, 'headline should stay on one line')
  assert.ok(
    m.headline.width <= m.headline.vw,
    `headline overflows the viewport: ${m.headline.width} / ${m.headline.vw}`,
  )
  assert.ok(m.headline.height < 42, `headline wrapped or too tall: ${m.headline.height}`)
})

test('opening logo shrinks onto the printed bottle mark', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#logo-fly', { state: 'attached' })
  await page.waitForTimeout(250)

  const shot = async () =>
    page.evaluate(() => {
      const fly = document.querySelector('#logo-fly')
      const m = fly?.getCTM()
      const chrome = document.querySelector('#chrome-mono')?.getBoundingClientRect()
      return {
        pin: Number(
          getComputedStyle(document.querySelector('#assembly-layout')).getPropertyValue('--fi-pin-y'),
        ),
        scale: m ? Math.hypot(m.a, m.b) : 0,
        chromeW: chrome?.width ?? 0,
        body: Number(getComputedStyle(document.querySelector('#fi-photo-body')).opacity),
        flyOpacity: Number(getComputedStyle(fly).opacity),
      }
    })

  await scrollFilm(page, 1)
  await page.waitForTimeout(120)
  const open = await shot()

  await scrollFilm(page, 38)
  await page.waitForTimeout(120)
  const landed = await shot()
  await context.close()

  assert.ok(open.pin > 190, `opening should pin the glass logo, --fi-pin-y ${open.pin}`)
  assert.ok(open.chromeW > 280, `opening logo should fill the frame, width ${open.chromeW}`)
  assert.ok(open.scale > 4, `opening lockup should be large, scale ${open.scale}`)
  assert.ok(open.body < 0.15, `bottle should wait until the dissolve, body ${open.body}`)
  assert.ok(landed.pin > 190, `landed pin --fi-pin-y ${landed.pin}`)
  assert.ok(
    landed.chromeW < open.chromeW * 0.35,
    `logo should shrink onto the bottle: ${open.chromeW.toFixed(0)} → ${landed.chromeW.toFixed(0)}`,
  )
  assert.ok(landed.body > 0.7, `bottle should be visible after the dissolve, body ${landed.body}`)
  assert.ok(landed.flyOpacity < 0.35, `lockup should have dissolved by 38%, opacity ${landed.flyOpacity}`)
})

test('mobile document ends at the footer with a single pin spacer', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#flow-bg', { state: 'attached' })
  await page.waitForTimeout(250)

  const m = await page.evaluate(() => {
    const footer = document.querySelector('.ground-close')
    const spacer = document.querySelector('.pin-spacer')
    const maxY = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, maxY)
    const fr = footer?.getBoundingClientRect()
    return {
      pinCount: document.querySelectorAll('.pin-spacer').length,
      gapBelowFooter: fr ? window.innerHeight - fr.bottom : NaN,
      footerBottom: fr?.bottom ?? null,
      innerH: window.innerHeight,
      spacerH: spacer?.getBoundingClientRect().height ?? 0,
      spacerPad: spacer ? parseFloat(getComputedStyle(spacer).paddingBottom) : 0,
      stEnd: window.__ejST?.end,
    }
  })
  await context.close()

  assert.equal(m.pinCount, 1, `expected one pin spacer, got ${m.pinCount}`)
  assert.ok(
    m.gapBelowFooter < 8,
    `empty space below footer at max scroll: ${m.gapBelowFooter}px (footerBottom ${m.footerBottom}, innerH ${m.innerH}, spacer ${m.spacerH}, pad ${m.spacerPad}, stEnd ${m.stEnd})`,
  )
})

test('collection pages live above the store locator, not on the film', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#stores', { state: 'attached' })

  const m = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.act-link')]
    const nav = document.querySelector('.ground-lines')
    const stores = document.querySelector('#stores')
    const footer = document.querySelector('.ground-close')
    const beforeStores =
      nav && stores ? Boolean(nav.compareDocumentPosition(stores) & Node.DOCUMENT_POSITION_FOLLOWING) : false
    const storesBeforeFooter =
      stores && footer ? Boolean(stores.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING) : false
    return {
      actLinks: links.length,
      beforeStores,
      storesBeforeFooter,
      hrefs: [...(nav?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href')),
      titles: [...(nav?.querySelectorAll('h2') ?? [])].map((h) => (h.textContent ?? '').trim()),
      footerSrc: document.querySelector('.ground-mono')?.getAttribute('src'),
    }
  })
  await context.close()

  assert.equal(m.actLinks, 0, `film still has ${m.actLinks} act hyperlinks`)
  assert.ok(m.beforeStores, 'collection nav is not above the store locator')
  assert.ok(m.storesBeforeFooter, 'store locator is not before the footer')
  assert.deepEqual(m.hrefs, ['outer.html', 'flow-infinite.html', 'inner.html'])
  assert.deepEqual(m.titles, [
    'Explore Outer Journey',
    'Explore Flow Infinite',
    'Explore Inner Journey',
  ])
  assert.ok(
    m.footerSrc?.includes('ej-logo-lockup.png'),
    `footer still uses ${m.footerSrc}`,
  )
})

test('store map tiles do not ask for a Carto API key', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.querySelector('#stores')?.scrollIntoView())
  await page.waitForTimeout(800)

  const tiles = await page.evaluate(() =>
    [...document.querySelectorAll('.leaflet-tile')].map((img) => img.currentSrc || img.src),
  )
  await context.close()

  assert.ok(tiles.length > 0, 'map never loaded any tiles')
  const keylessCarto = tiles.filter((src) => src.includes('cartocdn.com') && !/[?&]key=/.test(src))
  assert.equal(
    keylessCarto.length,
    0,
    `Carto tiles without an API key (watermark): ${keylessCarto[0] ?? ''}`,
  )
})

test('inner, outer, privacy, and Flow Infinite pages resolve from the homepage links', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  const pages = [
    { path: '/outer.html', title: /Outer Journey/i, asset: './assets/css/style.css' },
    { path: '/inner.html', title: /Inner Journey/i, asset: './assets/css/style.css' },
    { path: '/privacy-policy.html', title: /Privacy Policy/i, asset: './assets/css/style.css' },
    { path: '/flow-infinite.html', title: /Flow Infinite/i, asset: './assets/brand/ej-logo-lockup.png' },
  ]
  for (const spec of pages) {
    const res = await page.goto(origin + spec.path, { waitUntil: 'domcontentloaded' })
    assert.equal(res?.ok(), true, `${spec.path} did not load`)
    const title = await page.title()
    assert.match(title, spec.title, `${spec.path} title is ${title}`)
    const assetRes = await page.request.get(new URL(spec.asset, origin + spec.path).href)
    assert.equal(assetRes.ok(), true, `${spec.path} missing ${spec.asset}`)
  }
  await context.close()
})
