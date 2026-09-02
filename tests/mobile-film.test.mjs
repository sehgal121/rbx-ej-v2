/**
 * Mobile film: infinity still must not linger after a fast flick,
 * and a height-only resize (URL bar) must not remap the playhead.
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

before(async () => {
  server = await createServer({
    server: { port: 5175, strictPort: true, host: '127.0.0.1' },
  })
  await server.listen()
  origin = 'http://127.0.0.1:5175'
  browser = await chromium.launch({ headless: true })
})

after(async () => {
  await browser?.close()
  await server?.close()
})

test('fast mobile flick past Act 3 does not leave the infinity still on screen', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#flow-bg', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 31)
  await page.waitForTimeout(80)
  const atInfinity = await readFilm(page)
  assert.ok(
    atInfinity.opacity > 0.05,
    `expected infinity visible at ~31% film, got opacity ${atInfinity.opacity} pct ${atInfinity.pct}`,
  )

  await scrollFilm(page, 89)
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  )

  const afterFlick = await readFilm(page)
  await context.close()

  assert.ok(
    afterFlick.pct > 70,
    `playhead still lagging at ${afterFlick.pct}% after flick to Inner Journey`,
  )
  assert.ok(
    afterFlick.opacity < 0.02 && afterFlick.visibility === 'hidden',
    `infinity still painted after flick: opacity ${afterFlick.opacity} visibility ${afterFlick.visibility}`,
  )
})

test('height-only resize at Inner Journey does not unpin into Ground', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#flow-bg', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 89)
  await page.waitForTimeout(200)

  const before = await readFilm(page)
  assert.ok(before.pct > 70 && before.pct < 99, `expected Inner Journey, got ${before.pct}%`)
  assert.ok(Math.abs(before.stageTop) < 8, `stage should stay pinned, top ${before.stageTop}`)

  await page.setViewportSize({ width: 390, height: 720 })
  await page.waitForTimeout(400)

  const after = await readFilm(page)
  await context.close()

  assert.ok(
    after.opacity < 0.02,
    `infinity flashed after URL-bar resize: opacity ${after.opacity}`,
  )
  assert.ok(
    Math.abs(after.pct - before.pct) < 8,
    `playhead jumped ${before.pct}% → ${after.pct}% on height-only resize`,
  )
  assert.ok(
    Math.abs(after.stageTop) < 24,
    `stage unpinned into Ground on height-only resize (top ${after.stageTop})`,
  )
})

async function bottleLayout(page) {
  return page.evaluate(() => {
    const assembly = document.querySelector('#assembly-layout')
    const a = assembly?.getBoundingClientRect()
    const inners = [...document.querySelectorAll('.line-bottle.inner')].map((el) => {
      const r = el.getBoundingClientRect()
      return {
        opacity: Number(getComputedStyle(el).opacity),
        filter: getComputedStyle(el).filter,
        height: r.height,
        midX: (r.left + r.right) / 2,
        midY: (r.top + r.bottom) / 2,
        bottom: r.bottom,
        top: r.top,
      }
    })
    const hero = inners.reduce((best, b) => (b.height > (best?.height ?? 0) ? b : best), null)
    return {
      innerH: window.innerHeight,
      innerW: window.innerWidth,
      assembly: a
        ? {
            height: a.height,
            midX: (a.left + a.right) / 2,
            midY: (a.top + a.bottom) / 2,
            top: a.top,
            bottom: a.bottom,
          }
        : null,
      hero,
    }
  })
}

test('Flow Infinite bottle is large and sits mid-screen on mobile, not on the bottom', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#assembly', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 64)
  await page.waitForTimeout(200)

  const m = await bottleLayout(page)
  await context.close()

  assert.ok(m.assembly, 'missing Flow Infinite assembly')
  assert.ok(
    m.assembly.height > 260,
    `FI bottle too small on mobile: height ${m.assembly.height}`,
  )
  assert.ok(
    m.assembly.midY > m.innerH * 0.4 && m.assembly.midY < m.innerH * 0.58,
    `FI bottle not mid-screen: midY ${m.assembly.midY} / ${m.innerH}`,
  )
  assert.ok(
    m.assembly.bottom < m.innerH - 64,
    `FI bottle sitting on the CTA: bottom ${m.assembly.bottom} innerH ${m.innerH}`,
  )
})

test('Inner Journey bottles are large, centred, and mid-high on mobile', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 89)
  await page.waitForTimeout(200)

  const m = await bottleLayout(page)
  await context.close()

  assert.ok(m.hero && m.hero.opacity > 0.5, 'Inner Journey bottles not visible')
  assert.ok(
    m.hero.height > 100,
    `inner bottle too small on mobile: height ${m.hero.height}`,
  )
  assert.ok(
    Math.abs(m.hero.midX - m.innerW / 2) < 56,
    `inner bottles not centred: midX ${m.hero.midX} / ${m.innerW}`,
  )
  assert.ok(
    m.hero.top > m.innerH * 0.32,
    `inner bottles covering the copy: top ${m.hero.top} / ${m.innerH}`,
  )
  assert.ok(
    m.hero.midY > m.innerH * 0.42 && m.hero.midY < m.innerH * 0.62,
    `inner bottles not in the mid well: midY ${m.hero.midY} / ${m.innerH}`,
  )
  assert.ok(
    m.hero.bottom < m.innerH - 72,
    `inner bottles sitting on the CTA: bottom ${m.hero.bottom} innerH ${m.innerH}`,
  )
  assert.equal(
    m.hero.filter,
    'none',
    `animated filter on mobile ghosts the bottles: ${m.hero.filter}`,
  )
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
    const assembly = document.querySelector('#assembly')
    const photo = document.querySelector('#fi-photo-body')
    const still = document.querySelector('#journey-still')
    return {
      pct: parseFloat(document.querySelector('#review-pct')?.textContent ?? 'NaN'),
      assemblyOpacity: assembly ? Number(getComputedStyle(assembly).opacity) : 0,
      assemblyHeight: photo?.getBoundingClientRect().height ?? 0,
      assemblyBottom: photo?.getBoundingClientRect().bottom ?? 0,
      stillOpacity: still ? Number(getComputedStyle(still).opacity) : 0,
      outers: [...document.querySelectorAll('.line-bottle.outer')].map(card),
      inners: [...document.querySelectorAll('.line-bottle.inner')].map(card),
      labelTops: ['#label-outer', '#label-inner'].map((sel) => {
        const el = document.querySelector(sel)
        return el ? el.getBoundingClientRect().top : 0
      }),
    }
  })
}

function lineGaps(bottles) {
  const row = bottles.filter((b) => b.opacity > 0.5).sort((a, b) => a.midX - b.midX)
  const gaps = []
  for (let i = 1; i < row.length; i++) gaps.push(row[i].left - row[i - 1].right)
  return { row, gaps }
}

test('mobile collection lines leave a clear gap between the three bottles', async () => {
  const context = await browser.newContext(MOBILE)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 84)
  await page.waitForTimeout(200)
  const outer = lineGaps((await filmCast(page)).outers)
  await context.close()

  assert.equal(outer.row.length, 3, 'outer collection missing bottles on mobile')
  assert.ok(
    outer.gaps.every((g) => g > 18),
    `outer bottles overlapping on mobile: gaps ${outer.gaps.map((n) => n.toFixed(1)).join(', ')}`,
  )
})

test('triptych bottles stay in two rows after reversing from the reunion', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 97)
  await page.waitForTimeout(200)
  await scrollFilm(page, 56)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  assert.ok(
    m.stillOpacity > 0.8,
    `campaign nebula missing at ${m.pct}% after reverse: ${m.stillOpacity}`,
  )
  const outers = m.outers.filter((b) => b.opacity > 0.5)
  const inners = m.inners.filter((b) => b.opacity > 0.5)
  assert.equal(outers.length, 3, `outer trio missing at ${m.pct}% after reverse`)
  assert.equal(inners.length, 3, `inner trio missing at ${m.pct}% after reverse`)
  const outerXs = outers.map((b) => b.midX).sort((a, b) => a - b)
  const innerXs = inners.map((b) => b.midX).sort((a, b) => a - b)
  assert.ok(
    Math.max(...outerXs) < Math.min(...innerXs) - 80,
    `trios stacked after reverse from reunion at ${m.pct}%: outer ${outerXs.map((n) => n.toFixed(0)).join(', ')} inner ${innerXs.map((n) => n.toFixed(0)).join(', ')}`,
  )
  for (const [label, xs] of [
    ['outer', outerXs],
    ['inner', innerXs],
  ]) {
    const gap1 = xs[1] - xs[0]
    const gap2 = xs[2] - xs[1]
    assert.ok(
      gap1 > 40 && gap2 > 40,
      `${label} bottles overlapping after reverse at ${m.pct}%: midX ${xs.map((n) => n.toFixed(0)).join(', ')}`,
    )
  }
})

test('at 54% the six triptych bottles are larger than the default line cutouts', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 54)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const six = [...m.outers, ...m.inners].filter((b) => b.opacity > 0.5)
  assert.equal(six.length, 6, `six bottles missing at ${m.pct}%`)
  const heights = six.map((b) => b.height)
  assert.ok(
    heights.every((h) => h > 240),
    `Act 3 six bottles too small at ${m.pct}%: ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
  const ratio = Math.max(...heights) / Math.min(...heights)
  assert.ok(
    ratio < 1.12,
    `Act 3 six bottles not the same height at ${m.pct}%: ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
  const lineH = heights.reduce((s, n) => s + n, 0) / heights.length
  assert.ok(
    m.assemblyHeight > lineH * 1.02 && m.assemblyHeight < lineH * 1.4,
    `Flow Infinite should read as large as the six at ${m.pct}%: FI ${m.assemblyHeight.toFixed(0)} line ${lineH.toFixed(0)}`,
  )
})

test('at 58% the six triptych bottles dissolve together', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 58)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const six = [...m.outers, ...m.inners]
  assert.equal(six.length, 6, 'expected six line bottles')
  const opacities = six.map((b) => b.opacity)
  const spread = Math.max(...opacities) - Math.min(...opacities)
  assert.ok(
    spread < 0.12,
    `six bottles not dissolving together at ${m.pct}%: opacities ${opacities.map((n) => n.toFixed(2)).join(', ')}`,
  )
  assert.ok(
    opacities.every((n) => n < 0.85),
    `bottles still fully up at ${m.pct}%: ${opacities.map((n) => n.toFixed(2)).join(', ')}`,
  )
  assert.ok(m.assemblyOpacity > 0.7, `Flow Infinite should still be the hero at 58%, opacity ${m.assemblyOpacity}`)
})

test('at 72% Flow Infinite dissolves before the Outer Journey bottles arrive', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#assembly', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 72)
  await page.waitForTimeout(200)
  const atDissolve = await filmCast(page)

  await scrollFilm(page, 74)
  await page.waitForTimeout(120)
  const midDissolve = await filmCast(page)

  await scrollFilm(page, 77)
  await page.waitForTimeout(200)
  const afterGone = await filmCast(page)
  await context.close()

  const outerAt72 = Math.max(...atDissolve.outers.map((b) => b.opacity))
  assert.ok(
    outerAt72 < 0.12,
    `Outer bottles arrived before Flow Infinite dissolved at ${atDissolve.pct}%: outer ${outerAt72.toFixed(2)} FI ${atDissolve.assemblyOpacity.toFixed(2)}`,
  )
  assert.ok(
    midDissolve.assemblyOpacity < 0.72,
    `Flow Infinite has not dissolved by ${midDissolve.pct}%: ${midDissolve.assemblyOpacity}`,
  )
  assert.ok(
    Math.max(...midDissolve.outers.map((b) => b.opacity)) < 0.15,
    `Outer bottles arrived while Flow Infinite was still leaving at ${midDissolve.pct}%`,
  )

  assert.ok(
    afterGone.assemblyOpacity < 0.08,
    `Flow Infinite still on screen at ${afterGone.pct}%: ${afterGone.assemblyOpacity}`,
  )
  assert.ok(
    afterGone.outers.some((b) => b.opacity > 0.25),
    `Outer bottles never arrived after Flow Infinite dissolved at ${afterGone.pct}%`,
  )
})

test('Outer Journey focus bottle is at least twice the supporting bottles', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.outer', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 79)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const visible = m.outers.filter((b) => b.opacity > 0.4)
  assert.ok(visible.length === 3, `expected three outer bottles, got ${visible.length} at ${m.pct}%`)
  const heights = visible.map((b) => b.height).sort((a, b) => b - a)
  const ratio = heights[0] / heights[heights.length - 1]
  assert.ok(
    ratio >= 2,
    `outer focus bottle only ${ratio.toFixed(2)}× the smallest at ${m.pct}% (${heights.map((n) => n.toFixed(0)).join(', ')}px)`,
  )
})

test('outer collection stays centred after reversing from the seven-bottle reunion', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.outer', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 97)
  await page.waitForTimeout(200)
  await scrollFilm(page, 84.4)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const visible = m.outers.filter((b) => b.opacity > 0.5)
  assert.equal(visible.length, 3, `outer collection missing bottles at ${m.pct}% after reverse`)
  const xs = visible.map((b) => b.midX).sort((a, b) => a - b)
  const mid = (xs[0] + xs[2]) / 2
  assert.ok(
    Math.abs(mid - 720) < 160,
    `outer bottles still parked left after reverse from reunion: mid ${mid.toFixed(0)} xs ${xs.map((n) => n.toFixed(0)).join(', ')}`,
  )
  const gap1 = xs[1] - xs[0]
  const gap2 = xs[2] - xs[1]
  assert.ok(
    Math.abs(gap1 - gap2) < 40,
    `outer collection is not a line after reverse: midX ${xs.map((n) => n.toFixed(0)).join(', ')}`,
  )
})

test('after Midnight the Outer Journey shows the three-bottle collection', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.outer', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 84)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const visible = m.outers.filter((b) => b.opacity > 0.5)
  assert.equal(visible.length, 3, `outer collection missing bottles at ${m.pct}%`)
  const heights = visible.map((b) => b.height)
  const xs = visible.map((b) => b.midX).sort((a, b) => a - b)
  const ratio = Math.max(...heights) / Math.min(...heights)
  assert.ok(
    ratio < 1.25,
    `outer collection is still a hero stack at ${m.pct}%: heights ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
  const gap1 = xs[1] - xs[0]
  const gap2 = xs[2] - xs[1]
  assert.ok(
    Math.abs(gap1 - gap2) < 40,
    `outer collection is not a line at ${m.pct}%: midX ${xs.map((n) => n.toFixed(0)).join(', ')}`,
  )
  assert.ok(
    heights[0] > 230,
    `outer collection bottles too small at ${m.pct}%: ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
})

test('Inner Journey focus bottle is at least twice the supporting bottles', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 89)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const visible = m.inners.filter((b) => b.opacity > 0.4)
  assert.ok(visible.length === 3, `expected three inner bottles, got ${visible.length} at ${m.pct}%`)
  const heights = visible.map((b) => b.height).sort((a, b) => b - a)
  const ratio = heights[0] / heights[heights.length - 1]
  assert.ok(
    ratio >= 2,
    `focus bottle only ${ratio.toFixed(2)}× the smallest at ${m.pct}% (${heights.map((n) => n.toFixed(0)).join(', ')}px)`,
  )
})

test('after Happiness the Inner Journey shows the three-bottle collection', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 95)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const visible = m.inners.filter((b) => b.opacity > 0.5)
  assert.equal(visible.length, 3, `inner collection missing bottles at ${m.pct}%`)
  const heights = visible.map((b) => b.height)
  const xs = visible.map((b) => b.midX).sort((a, b) => a - b)
  const ratio = Math.max(...heights) / Math.min(...heights)
  assert.ok(
    ratio < 1.25,
    `inner collection is still a hero stack at ${m.pct}%: heights ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
  assert.ok(
    heights[0] > 270,
    `inner collection bottles too small at ${m.pct}%: ${heights.map((n) => n.toFixed(0)).join(', ')}`,
  )
  assert.ok(
    m.assemblyOpacity < 0.2,
    `Flow Infinite arrived before the Inner trio finished at ${m.pct}%: ${m.assemblyOpacity}`,
  )
  assert.ok(
    m.outers.every((b) => b.opacity < 0.15),
    `Outer bottles arrived before the Inner trio finished at ${m.pct}%`,
  )
  const mid = (xs[0] + xs[2]) / 2
  assert.ok(
    Math.abs(mid - 720) < 160,
    `inner collection not centred before the reunion: mid ${mid.toFixed(0)}`,
  )
})

test('after Inner Journey the seven bottles gather like the Act 3 triptych', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('.line-bottle.inner', { state: 'attached' })
  await page.waitForTimeout(250)

  await scrollFilm(page, 98)
  await page.waitForTimeout(200)

  const m = await filmCast(page)
  await context.close()

  const inners = m.inners.filter((b) => b.opacity > 0.5)
  const outers = m.outers.filter((b) => b.opacity > 0.5)
  assert.equal(inners.length, 3, `inner trio missing at ${m.pct}%`)
  assert.equal(outers.length, 3, `outer trio missing at ${m.pct}%`)
  assert.ok(
    m.assemblyOpacity > 0.55,
    `Flow Infinite not back for the reunion at ${m.pct}%: ${m.assemblyOpacity}`,
  )
  const innerRatio = Math.max(...inners.map((b) => b.height)) / Math.min(...inners.map((b) => b.height))
  const outerRatio = Math.max(...outers.map((b) => b.height)) / Math.min(...outers.map((b) => b.height))
  assert.ok(innerRatio < 1.25, `inner trio still a hero stack at ${m.pct}%`)
  assert.ok(outerRatio < 1.25, `outer trio still a hero stack at ${m.pct}%`)
  const innerXs = inners.map((b) => b.midX)
  const outerXs = outers.map((b) => b.midX)
  assert.ok(Math.max(...outerXs) < Math.min(...innerXs), 'trios are not on opposite sides of Flow Infinite')
  const lineH = [...inners, ...outers].reduce((s, b) => s + b.height, 0) / 6
  assert.ok(
    lineH > 270,
    `reunion bottles not enlarged at ${m.pct}%: line ${lineH.toFixed(0)}`,
  )
  assert.ok(
    Math.abs(m.assemblyHeight - lineH) / lineH < 0.16,
    `seven bottles not the same height at ${m.pct}%: FI ${m.assemblyHeight.toFixed(0)} line ${lineH.toFixed(0)}`,
  )
  const bottoms = [...inners, ...outers].map((b) => b.bottom)
  assert.ok(
    Math.max(...bottoms) - Math.min(...bottoms) < 36,
    `reunion bottles not on one line at ${m.pct}%: bottoms ${bottoms.map((n) => n.toFixed(0)).join(', ')}`,
  )
  const lineBottom = bottoms.reduce((s, n) => s + n, 0) / bottoms.length
  assert.ok(
    Math.abs(m.assemblyBottom - lineBottom) < 28,
    `Flow Infinite is not on the same line at ${m.pct}%: FI ${m.assemblyBottom.toFixed(0)} line ${lineBottom.toFixed(0)}`,
  )
  const lowest = Math.max(...bottoms)
  assert.ok(
    m.labelTops.every((top) => top > lowest + 8),
    `labels sit under the bottles at ${m.pct}%: bottle ${lowest.toFixed(0)} labels ${m.labelTops.map((n) => n.toFixed(0)).join(', ')}`,
  )
})

test('collection pages live after the map, not on the film', async () => {
  const context = await browser.newContext(DESKTOP)
  const page = await context.newPage()
  await page.goto(origin, { waitUntil: 'networkidle' })
  await page.waitForSelector('#stores', { state: 'attached' })

  const m = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.act-link')]
    const nav = document.querySelector('.ground-lines')
    const stores = document.querySelector('#stores')
    const footer = document.querySelector('.ground-close')
    const afterMap =
      stores && nav ? Boolean(stores.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING) : false
    const beforeFooter =
      nav && footer ? Boolean(nav.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING) : false
    return { actLinks: links.length, afterMap, beforeFooter, hrefs: [...(nav?.querySelectorAll('a') ?? [])].map((a) => a.getAttribute('href')) }
  })
  await context.close()

  assert.equal(m.actLinks, 0, `film still has ${m.actLinks} act hyperlinks`)
  assert.ok(m.afterMap, 'collection nav is not after the store map')
  assert.ok(m.beforeFooter, 'collection nav is not before the footer')
  assert.deepEqual(m.hrefs, ['flow-infinite.html', 'outer.html', 'inner.html'])
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
