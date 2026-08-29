type LenisControl = { stop: () => void; start: () => void }

function ejLenis(): LenisControl | undefined {
  return (window as Window & { __ejLenis?: LenisControl }).__ejLenis
}

const CONTACT_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

let openContactModal: (() => void) | undefined

export function mountContact(): void {
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

  const formEl = form
  const modalEl = modal
  const triggerEl = trigger
  const nameEl = name
  const nameErrorEl = nameError
  const emailErrorEl = emailError
  const submitEl = submit
  const statusEl = status

  let lastFocus: HTMLElement | null = null

  function isOpen(): boolean {
    return modalEl.classList.contains('is-open')
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
    formEl.hidden = false
    formEl.reset()
    nameErrorEl.classList.remove('is-on')
    emailErrorEl.classList.remove('is-on')
    statusEl.classList.remove('is-on')
    statusEl.innerHTML = ''
    submitEl.disabled = false
  }

  function openModal(): void {
    if (isOpen()) return
    lastFocus = (document.activeElement as HTMLElement | null) ?? triggerEl
    modalEl.classList.add('is-open')
    modalEl.setAttribute('aria-hidden', 'false')
    triggerEl.setAttribute('aria-expanded', 'true')
    lockScroll()
    window.setTimeout(() => {
      nameEl.focus()
    }, 0)
  }

  function closeModal(): void {
    if (!isOpen()) return
    modalEl.classList.remove('is-open')
    modalEl.setAttribute('aria-hidden', 'true')
    triggerEl.setAttribute('aria-expanded', 'false')
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

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault()
    const type =
      formEl.querySelector<HTMLInputElement>('input[name="contact-type"]:checked')?.value ?? 'Personal'
    nameErrorEl.classList.toggle('is-on', !nameEl.value.trim())
    emailErrorEl.classList.toggle('is-on', !email.value.trim())
    if (!nameEl.value.trim() || !email.value.trim()) return

    submitEl.disabled = true
    const payload = {
      buisnessType: type,
      name: nameEl.value.trim(),
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

    formEl.hidden = true
    statusEl.classList.add('is-on')
    statusEl.innerHTML = delivered
      ? `<strong>Received</strong>Thank you for reaching out. We will connect with you at the earliest.`
      : `<strong>Received</strong>Thank you for reaching out. We will connect with you at the earliest.
         <p class="ground-form-note">This environment is not sending mail. The live form posts to /backend/contact-us.php with SMTP from environment variables.</p>`
    submitEl.disabled = false
    closeBtn.focus()
  })

  openContactModal = openModal
}

export function openContact(): void {
  openContactModal?.()
}
