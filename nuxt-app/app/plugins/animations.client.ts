import { defineNuxtPlugin } from '#imports'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import Lenis from 'lenis'

// Motion layer. Pages opt in with data attributes — no per-page JS:
//   data-reveal          fade/lift/blur in, siblings cascade
//   data-ink             gold "brush" sweep reveal for headings (mask, not clip)
//   data-words           words drift in one by one (split on spaces only —
//                        Khmer clusters are never broken apart)
//   data-scramble        Latin caption decodes from random glyphs
//   data-img-reveal      image uncovered by a rising curtain, then settles
//   data-parallax="0.2"  scroll-linked drift (fraction of viewport)
//   data-count="802"     number counts up (rendered in Khmer numerals)
//   data-tilt            3D tilt + gold glare that follows the cursor
//   data-magnetic        element leans toward the cursor
//   .kh-draw             KhmerIcon strokes trace themselves in
//   [data-h-scroll]      pinned horizontal track (timeline)
// Everything is transform/opacity/mask; nothing animates layout.
export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin)
  // Initial hidden states only apply under `.js-anim` (see animations.css),
  // so no-JS visitors and crawlers always see the full content.
  document.documentElement.classList.add('js-anim')

  // ---- Smooth scroll (Lenis) driven by GSAP's ticker ----
  // allowNestedScroll: wheel/touch over an inner scroller (the map's temple
  // list, the map card, calendar panels) scrolls that element natively instead
  // of being hijacked into a page scroll.
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, allowNestedScroll: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
  nuxtApp.hook('page:finish', () => lenis.scrollTo(0, { immediate: true }))

  // ---- Scroll progress bar ----
  const bar = document.createElement('div')
  bar.className = 'kh-progress'
  document.body.appendChild(bar)
  lenis.on('scroll', ({ progress }: { progress: number }) => { bar.style.transform = `scaleX(${progress || 0})` })

  // ---- Cursor: gold ring + dot, grows over interactive elements ----
  const finePointer = window.matchMedia('(pointer: fine)').matches
  if (finePointer) {
    const ring = document.createElement('div')
    const dot = document.createElement('div')
    ring.className = 'kh-cursor'
    dot.className = 'kh-cursor-dot'
    document.body.append(ring, dot)
    const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' })
    const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' })
    const dx = gsap.quickSetter(dot, 'x', 'px')
    const dy = gsap.quickSetter(dot, 'y', 'px')
    // The hover test (closest) runs at most once per frame, not per event.
    let target: Element | null = null
    let queued = false
    window.addEventListener('pointermove', (e) => {
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY)
      target = e.target as Element | null
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        ring.classList.toggle('is-hot', !!target?.closest?.('a,button,[data-tilt],.kh-mk'))
        // Over the map the native grab/pointer cursor is the right affordance,
        // and a blended layer over a WebGL canvas costs a composite per frame.
        const off = !!target?.closest?.('.maplibregl-canvas-container')
        ring.classList.toggle('is-off', off)
        dot.classList.toggle('is-off', off)
      })
    }, { passive: true })
  }

  const khmerDigits = '០១២៣៤៥៦៧៨៩'
  const toKhmer = (n: number) => String(n).replace(/\d/g, (d) => khmerDigits[+d])
  let cleanups: Array<() => void> = []

  function once(el: Element, key: string) {
    if (el.hasAttribute(`data-a-${key}`)) return false
    el.setAttribute(`data-a-${key}`, '')
    return true
  }

  function setup() {
    // Drop triggers belonging to the previous route. (Pointer listeners go
    // away with their elements, so they need no cleanup.)
    cleanups.forEach((fn) => fn())
    cleanups = []
    ScrollTrigger.getAll().forEach((st) => {
      const t = st.trigger as Element | undefined
      if (t && !t.isConnected) st.kill()
    })

    // Cascading reveals, grouped by parent.
    const zones = new Map<Element, Element[]>()
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      if (!once(el, 'reveal') || !el.parentElement) return
      const g = zones.get(el.parentElement) ?? []
      g.push(el)
      zones.set(el.parentElement, g)
    })
    zones.forEach((group) => group.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1, delay: (i % 6) * 0.12, ease: 'power3.out', overwrite: 'auto' }),
      })
    }))

    // Gold ink sweep: animates a CSS mask position, so glyphs are never clipped
    // vertically (the element carries extra block padding in CSS).
    gsap.utils.toArray<HTMLElement>('[data-ink]').forEach((el) => {
      if (!once(el, 'ink')) return
      gsap.fromTo(el, { '--ink': '-30%' }, {
        '--ink': '130%', duration: 1.8, ease: 'power2.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    })

    // Word cascade. Split only on whitespace — never by character — so Khmer
    // consonant clusters, subscripts and vowels stay intact.
    gsap.utils.toArray<HTMLElement>('[data-words]').forEach((el) => {
      if (!once(el, 'words')) return
      const split = new SplitText(el, { type: 'words', wordsClass: 'kh-word' })
      gsap.set(el, { autoAlpha: 1 })
      gsap.from(split.words, {
        autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.05, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      })
    })

    gsap.utils.toArray<HTMLElement>('[data-scramble]').forEach((el) => {
      if (!once(el, 'scramble')) return
      const text = el.textContent ?? ''
      gsap.to(el, {
        duration: 1.6, scrambleText: { text, chars: 'ᚠΛΞΣΦΨΩ◇◆✦', revealDelay: 0.3, speed: 0.5 },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      })
    })

    gsap.utils.toArray<HTMLElement>('[data-img-reveal]').forEach((el) => {
      if (!once(el, 'img')) return
      const img = el.querySelector('img')
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out' })
      if (img) tl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0)
    })

    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      if (!once(el, 'parallax')) return
      const amt = parseFloat(el.dataset.parallax || '0.2')
      gsap.fromTo(el, { yPercent: -amt * 50 }, {
        yPercent: amt * 50, ease: 'none',
        scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
      })
    })

    gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
      if (!once(el, 'count')) return
      const end = parseFloat(el.dataset.count || '0')
      const obj = { v: 0 }
      gsap.to(obj, {
        v: end, duration: 2.2, ease: 'power2.out',
        onUpdate: () => { el.textContent = toKhmer(Math.round(obj.v)) + (el.dataset.suffix ?? '') },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      })
    })

    // Stroke tracing without measuring: pathLength="1" normalises every stroke,
    // so a dash offset of 1 hides it and 0 shows it. (DrawSVG measured each
    // path with getBBox/getScreenCTM up front — ~400 forced layouts on the
    // timeline.) The tween is only built when the icon scrolls into view.
    gsap.utils.toArray<SVGSVGElement>('svg.kh-draw').forEach((svg) => {
      if (!once(svg, 'draw')) return
      const strokes = [...svg.querySelectorAll<SVGGeometryElement>('path,circle,ellipse,rect')]
      strokes.forEach((el) => el.setAttribute('pathLength', '1'))
      svg.classList.add('kh-armed')
      ScrollTrigger.create({
        trigger: svg, start: 'top 92%', once: true,
        onEnter: () => gsap.fromTo(strokes, { strokeDashoffset: 1 }, {
          strokeDashoffset: 0, duration: 1.6, stagger: 0.08, ease: 'power2.inOut',
          onComplete: () => {
            svg.classList.remove('kh-armed')
            gsap.set(strokes, { clearProps: 'strokeDashoffset' })
            strokes.forEach((el) => el.removeAttribute('pathLength'))
          },
        }),
      })
    })

    if (finePointer) {
      gsap.utils.toArray<HTMLElement>('[data-tilt]').forEach((el) => {
        if (!once(el, 'tilt')) return
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          const px = (e.clientX - r.left) / r.width
          const py = (e.clientY - r.top) / r.height
          el.style.setProperty('--gx', `${px * 100}%`)
          el.style.setProperty('--gy', `${py * 100}%`)
          gsap.to(el, { rotateY: (px - 0.5) * 10, rotateX: (0.5 - py) * 10, transformPerspective: 900, duration: 0.5, ease: 'power2.out' })
        }
        const leave = () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1,0.5)' })
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
      })

      gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
        if (!once(el, 'magnetic')) return
        const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' })
        const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' })
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect()
          xTo((e.clientX - r.left - r.width / 2) * 0.35)
          yTo((e.clientY - r.top - r.height / 2) * 0.35)
        }
        const leave = () => { xTo(0); yTo(0) }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
      })
    }

    // Pinned horizontal timeline (desktop only; mobile stacks vertically).
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px)', () => {
      gsap.utils.toArray<HTMLElement>('[data-h-scroll]').forEach((section) => {
        const track = section.querySelector<HTMLElement>('[data-h-track]')
        const fill = section.querySelector<HTMLElement>('[data-h-fill]')
        if (!track) return
        const dist = () => track.scrollWidth - window.innerWidth
        const tween = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: section, pin: true, scrub: 0.6, start: 'top top',
            end: () => '+=' + dist(), invalidateOnRefresh: true,
            onUpdate: (st) => { if (fill) fill.style.transform = `scaleX(${st.progress})` },
          },
        })
        // Cards rise and their images drift as they cross the viewport.
        track.querySelectorAll<HTMLElement>('.h-card').forEach((card) => {
          gsap.from(card, {
            y: 60, autoAlpha: 0.25, rotate: 1.5, duration: 1, ease: 'power2.out',
            scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 92%', end: 'left 60%', scrub: true },
          })
          const img = card.querySelector('img')
          if (img) gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } })
        })
      })
    })
    cleanups.push(() => mm.revert())

    ScrollTrigger.refresh()
  }

  // One setup per navigation: these hooks fire in quick succession, and every
  // setup ends in ScrollTrigger.refresh(), which re-measures every trigger.
  // The latest request wins; page:finish waits out the out-in transition in
  // case page:transition:finish never comes (e.g. no transition on the route).
  let pending: ReturnType<typeof setTimeout> | undefined
  const schedule = (delay: number) => {
    clearTimeout(pending)
    pending = setTimeout(() => requestAnimationFrame(setup), delay)
  }
  nuxtApp.hook('app:mounted', () => schedule(0))
  nuxtApp.hook('page:transition:finish', () => schedule(0))
  nuxtApp.hook('page:finish', () => schedule(450))
  window.addEventListener('load', () => ScrollTrigger.refresh())
  document.fonts?.ready.then(() => ScrollTrigger.refresh())

  return { provide: { lenis } }
})
