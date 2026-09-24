<script setup lang="ts">
// Drifting gold motes (incense embers / temple dust) on a canvas. Particles
// rise slowly, flicker, and part around the pointer.
// Performance: one glow sprite is pre-rendered and stamped with drawImage
// (no per-particle gradients); fewer particles and a capped resolution on
// phones / low-core devices; the loop stops off-screen and in hidden tabs;
// nothing runs for reduced-motion users.
const props = withDefaults(defineProps<{ count?: number }>(), { count: 70 })
const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  const el = canvas.value
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const ctx = el.getContext('2d', { alpha: true })!
  const lowEnd = matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 8) <= 4
  const count = Math.round(props.count * (lowEnd ? 0.45 : 1))
  const dpr = Math.min(window.devicePixelRatio || 1, lowEnd ? 1 : 1.5)

  // Pre-rendered glow sprite
  const S = 32
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = S
  const sc = sprite.getContext('2d')!
  const g = sc.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(250,225,150,1)')
  g.addColorStop(0.35, 'rgba(232,201,106,.55)')
  g.addColorStop(1, 'rgba(212,175,55,0)')
  sc.fillStyle = g
  sc.fillRect(0, 0, S, S)

  let w = 0, h = 0, raf = 0, visible = true
  const mouse = { x: -9999, y: -9999 }
  const resize = () => {
    w = el.clientWidth; h = el.clientHeight
    el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  const P = Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: Math.random() * 1.8 + 0.5, vy: -(Math.random() * 0.35 + 0.08),
    vx: (Math.random() - 0.5) * 0.15, t: Math.random() * Math.PI * 2,
  }))
  const tick = () => {
    ctx.clearRect(0, 0, w, h)
    for (const p of P) {
      p.t += 0.02
      const dx = p.x - mouse.x, dy = p.y - mouse.y
      if (dx * dx + dy * dy < 12000) { p.x += dx * 0.012; p.y += dy * 0.012 }
      p.x += p.vx + Math.sin(p.t) * 0.12
      p.y += p.vy
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
      ctx.globalAlpha = 0.3 + Math.sin(p.t * 1.7) * 0.25 + 0.2
      const s = p.r * 8
      ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s)
    }
    ctx.globalAlpha = 1
    raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0
  }
  const restart = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick) }
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting
    if (visible) restart()
  })
  io.observe(el)
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top
  }
  window.addEventListener('resize', resize, { passive: true })
  window.addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('visibilitychange', restart)
  onBeforeUnmount(() => {
    cancelAnimationFrame(raf); io.disconnect()
    window.removeEventListener('resize', resize)
    window.removeEventListener('pointermove', onMove)
    document.removeEventListener('visibilitychange', restart)
  })
})
</script>

<template>
  <canvas ref="canvas" class="gold-dust" aria-hidden="true" />
</template>

<style scoped>
.gold-dust{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
</style>
