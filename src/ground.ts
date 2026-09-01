import './ground.css'

type Store = {
  id: number
  country: string
  city: string
  name: string
  googleMapLink?: string
  lat: number | null
  lng: number | null
  address: string
  phone: string
  image?: string
}

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker
  bindPopup: (html: string, opts?: object) => LeafletMarker
  openPopup: () => LeafletMarker
  on: (event: string, fn: () => void) => LeafletMarker
}

type LeafletMap = {
  setView: (center: [number, number], zoom: number) => LeafletMap
  flyTo: (center: [number, number], zoom: number, opts?: object) => LeafletMap
  fitBounds: (bounds: unknown) => LeafletMap
  removeLayer: (layer: LeafletMarker) => LeafletMap
  invalidateSize: () => LeafletMap
}

type LeafletStatic = {
  map: (id: string, opts?: object) => LeafletMap
  tileLayer: (url: string, opts?: object) => { addTo: (map: LeafletMap) => void }
  marker: (latlng: [number, number], opts?: object) => LeafletMarker
  featureGroup: (layers: LeafletMarker[]) => { getBounds: () => unknown }
  divIcon: (opts: object) => unknown
}

function leaflet(): LeafletStatic | undefined {
  return (window as Window & { L?: LeafletStatic }).L
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return map[ch] ?? ch
  })
}

function formatAddress(address: string): string {
  if (/^https?:\/\//i.test(address)) {
    return `<a href="${escapeHtml(address)}" target="_blank" rel="noopener">${escapeHtml(address)}</a>`
  }
  return escapeHtml(address)
}

function imageSrc(image?: string): string {
  if (!image) return ''
  const trimmed = image.trim()
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('./')) return `/${trimmed.slice(2)}`
  return trimmed
}

function storePhotoHtml(store: Store, className?: string): string {
  const src = imageSrc(store.image)
  if (!src) return ''
  const cls = className ? ` class="${className}"` : ''
  return `<img${cls} src="${escapeHtml(src)}" alt="${escapeHtml(store.name)}" loading="lazy" />`
}

function hasCoords(store: Store): store is Store & { lat: number; lng: number } {
  return store.lat != null && store.lng != null
}

function pinIcon(L: LeafletStatic): unknown {
  return L.divIcon({
    className: 'ground-pin',
    html: '<span></span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -8],
  })
}

function popupHtml(store: Store): string {
  const dest = hasCoords(store) ? `${store.lat},${store.lng}` : ''
  const directions = dest
    ? `<p><a href="https://www.google.com/maps/dir/?api=1&destination=${dest}" target="_blank" rel="noopener">Directions</a></p>`
    : ''
  const city = store.country === 'Online Stores' ? `<p>${escapeHtml(store.city)}</p>` : ''
  const phone = store.phone
    ? `<p><a href="tel:${escapeHtml(store.phone)}">${escapeHtml(store.phone)}</a></p>`
    : ''
  return `<div>
    <h4>${escapeHtml(store.name)}</h4>
    ${storePhotoHtml(store)}
    ${city}
    <p>${formatAddress(store.address)}</p>
    ${phone}
    ${directions}
  </div>`
}

function storeRowHtml(store: Store): string {
  const city = store.country === 'Online Stores' ? `<p>${escapeHtml(store.city)}</p>` : ''
  const phone = store.phone ? `<p>${escapeHtml(store.phone)}</p>` : ''
  return `${storePhotoHtml(store, 'store-thumb')}<div>
    <div class="store-name">${escapeHtml(store.name)}</div>
    ${city}
    <p>${formatAddress(store.address)}</p>
    ${phone}
  </div>`
}

function mountLocator(): void {
  const list = document.querySelector('#store-items')
  const search = document.querySelector<HTMLInputElement>('#search-bar')
  const reset = document.querySelector('#reset-button')
  const modal = document.querySelector('#store-modal')
  const modalBody = document.querySelector('#modal-body')
  const closeBtn = document.querySelector('#store-modal .close-button')
  if (!list || !search || !reset) return

  let stores: Store[] = []
  let countryMap: Record<string, Store[]> = {}
  let map: LeafletMap | undefined
  let markers: LeafletMarker[] = []
  const markerByName = new Map<string, LeafletMarker>()
  const L = leaflet()

  function clearMarkers(): void {
    if (!map) return
    markers.forEach((m) => map?.removeLayer(m))
    markers = []
    markerByName.clear()
  }

  function fit(): void {
    if (!map || !L || markers.length === 0) return
    map.fitBounds(L.featureGroup(markers).getBounds())
  }

  function addMarker(store: Store): void {
    if (!map || !L || !hasCoords(store)) return
    const marker = L.marker([store.lat, store.lng], { icon: pinIcon(L) })
      .addTo(map)
      .bindPopup(popupHtml(store), { maxWidth: 280, minWidth: 220, className: 'ground-store-popup' })
    marker.on('click', () => {
      map.flyTo([store.lat, store.lng], 12)
    })
    markerByName.set(store.name, marker)
    markers.push(marker)
  }

  function openModal(store: Store): void {
    if (!modal || !modalBody) return
    modalBody.innerHTML = popupHtml(store)
    modal.classList.add('is-open')
    modal.setAttribute('aria-hidden', 'false')
  }

  function closeModal(): void {
    modal?.classList.remove('is-open')
    modal?.setAttribute('aria-hidden', 'true')
  }

  function onStoreClick(store: Store): void {
    if (window.innerWidth <= 768) {
      openModal(store)
      if (hasCoords(store) && map) {
        map.flyTo([store.lat, store.lng], 12)
        markerByName.get(store.name)?.openPopup()
      }
      return
    }
    if (hasCoords(store) && map) {
      map.flyTo([store.lat, store.lng], 12)
      markerByName.get(store.name)?.openPopup()
    } else {
      openModal(store)
    }
  }

  function renderCountries(): void {
    list.innerHTML = ''
    Object.keys(countryMap)
      .sort((a, b) => {
        if (a === 'Online Stores') return 1
        if (b === 'Online Stores') return -1
        return a.localeCompare(b)
      })
      .forEach((country) => {
        const li = document.createElement('li')
        li.className = 'country-card'
        li.innerHTML = `<div class="country">${escapeHtml(country)}</div>`
        li.addEventListener('click', () => showCountry(country))
        list.appendChild(li)
      })
  }

  function showCountry(country: string): void {
    clearMarkers()
    list.innerHTML = ''
    countryMap[country]?.forEach((store) => {
      const li = document.createElement('li')
      li.className = 'store-card'
      li.innerHTML = storeRowHtml(store)
      li.addEventListener('click', () => onStoreClick(store))
      list.appendChild(li)
      addMarker(store)
    })
    fit()
  }

  function showAll(): void {
    clearMarkers()
    stores.forEach(addMarker)
    fit()
  }

  function searchStores(term: string): void {
    const q = term.trim().toLowerCase()
    if (!q) {
      renderCountries()
      showAll()
      return
    }
    const filtered = stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q),
    )
    clearMarkers()
    list.innerHTML = ''
    filtered.forEach((store) => {
      const li = document.createElement('li')
      li.className = 'store-card'
      li.innerHTML = storeRowHtml(store)
      li.addEventListener('click', () => onStoreClick(store))
      list.appendChild(li)
      addMarker(store)
    })
    fit()
  }

  if (L) {
    map = L.map('map', { scrollWheelZoom: false, dragging: true }).setView([25.2, 20], 2)
    const cartoKey = import.meta.env.VITE_CARTO_KEY
    if (cartoKey) {
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoKey)}`, {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map)
    } else {
      // Carto raster tiles now watermark "API key required" without a key.
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri — Esri, HERE, Garmin',
          maxZoom: 16,
        },
      ).addTo(map)
    }
  }

  fetch(`${import.meta.env.BASE_URL}assets/stores.json`)
    .then((res) => {
      if (!res.ok) throw new Error('stores')
      return res.json() as Promise<Store[]>
    })
    .then((data) => {
      stores = data.slice().sort((a, b) => {
        if (a.country !== b.country) return a.country.localeCompare(b.country)
        return (a.city ?? '').localeCompare(b.city ?? '')
      })
      countryMap = stores.reduce<Record<string, Store[]>>((acc, store) => {
        ;(acc[store.country] ??= []).push(store)
        return acc
      }, {})
      renderCountries()
      showAll()
      map?.invalidateSize()
    })
    .catch(() => {
      list.innerHTML = '<li><p>Store list is unavailable.</p></li>'
    })

  search.addEventListener('input', () => searchStores(search.value))
  reset.addEventListener('click', () => {
    search.value = ''
    renderCountries()
    showAll()
  })
  closeBtn?.addEventListener('click', closeModal)
  closeBtn?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      closeModal()
    }
  })
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal()
  })

  const mapEl = document.querySelector('#map')
  if (mapEl && map) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        map?.invalidateSize()
        io.disconnect()
      }
    })
    io.observe(mapEl)
  }
}

type LenisControl = { stop: () => void; start: () => void }

function ejLenis(): LenisControl | undefined {
  return (window as Window & { __ejLenis?: LenisControl }).__ejLenis
}

const CONTACT_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let openContactModal: (() => void) | undefined

function mountContact(): void {
  const form = document.querySelector<HTMLFormElement>('#contactForm')
  const modal = document.querySelector<HTMLElement>('#contactModal')
  const panel = modal?.querySelector<HTMLElement>('.contact-modal-panel')
  const trigger = document.querySelector<HTMLButtonElement>('#contact')
  const closeBtn = modal?.querySelector<HTMLButtonElement>('.contact-modal-close')
  if (!form || !modal || !panel || !trigger || !closeBtn) return
  const name = form.querySelector<HTMLInputElement>('#name')
  const email = form.querySelector<HTMLInputElement>('#email')
  const phone = form.querySelector<HTMLInputElement>('#phone')
  const city = form.querySelector<HTMLInputElement>('#city')
  const nameError = form.querySelector('#nameError')
  const emailError = form.querySelector('#emailError')
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')
  const status = document.querySelector('#contact-status')
  if (!name || !email || !phone || !city || !nameError || !emailError || !submit || !status) return

  let lastFocus: HTMLElement | null = null

  function isOpen(): boolean {
    return modal.classList.contains('is-open')
  }

  function lockScroll(): void {
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    ejLenis()?.stop()
  }

  function unlockScroll(): void {
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    ejLenis()?.start()
  }

  function resetForm(): void {
    form.hidden = false
    form.reset()
    nameError.classList.remove('is-on')
    emailError.classList.remove('is-on')
    status.classList.remove('is-on')
    status.innerHTML = ''
    submit.disabled = false
  }

  function openModal(): void {
    if (isOpen()) return
    lastFocus = (document.activeElement as HTMLElement | null) ?? trigger
    modal.classList.add('is-open')
    modal.setAttribute('aria-hidden', 'false')
    trigger.setAttribute('aria-expanded', 'true')
    lockScroll()
    window.setTimeout(() => {
      name.focus()
    }, 0)
  }

  function closeModal(): void {
    if (!isOpen()) return
    modal.classList.remove('is-open')
    modal.setAttribute('aria-hidden', 'true')
    trigger.setAttribute('aria-expanded', 'false')
    unlockScroll()
    resetForm()
    lastFocus?.focus()
  }

  trigger.setAttribute('aria-expanded', 'false')
  trigger.addEventListener('click', openModal)
  closeBtn.addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return
    if (e.key === 'Escape') {
      e.preventDefault()
      closeModal()
      return
    }
    if (e.key !== 'Tab') return
    const nodes = [...panel.querySelectorAll<HTMLElement>(CONTACT_FOCUSABLE)].filter(
      (el) => !el.hasAttribute('hidden') && el.offsetParent !== null,
    )
    if (nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const type =
      form.querySelector<HTMLInputElement>('input[name="contact-type"]:checked')?.value ?? 'Personal'
    nameError.classList.toggle('is-on', !name.value.trim())
    emailError.classList.toggle('is-on', !email.value.trim())
    if (!name.value.trim() || !email.value.trim()) return

    submit.disabled = true
    const payload = {
      buisnessType: type,
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      city: city.value.trim(),
    }

    let delivered = false
    try {
      const res = await fetch('/backend/contact-us.php', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { status?: string; delivered?: boolean }
      delivered = data.status === 'success' && data.delivered !== false
    } catch {
      delivered = false
    }

    form.hidden = true
    status.classList.add('is-on')
    status.innerHTML = delivered
      ? `<strong>Received</strong>Thank you for reaching out. We will connect with you at the earliest.`
      : `<strong>Received</strong>Thank you for reaching out. We will connect with you at the earliest.
         <p class="ground-form-note">This environment is not sending mail. The live form posts to /backend/contact-us.php with SMTP from environment variables.</p>`
    submit.disabled = false
    closeBtn.focus()
  })

  openContactModal = openModal
}

const GROUND_HASH = new Set(['ground', 'stores', 'contact'])

function scrollToHash(): void {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  if (!GROUND_HASH.has(id)) return
  if (id === 'contact') {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    openContactModal?.()
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  window.setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      history.replaceState(null, '', `#${id}`)
    }, 900)
  }, 120)
}

mountLocator()
mountContact()
window.addEventListener('hashchange', scrollToHash)
if (GROUND_HASH.has(decodeURIComponent(window.location.hash.replace(/^#/, '')))) {
  window.addEventListener('load', scrollToHash, { once: true })
}
