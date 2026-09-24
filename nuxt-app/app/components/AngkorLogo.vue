<script setup lang="ts">
// Angkor Wat brand mark — the temple from the Cambodian national flag, drawn
// path-for-path from the flag artwork (scripts/angkor-logo.py builds
// app/data/angkor-logo.json from scripts/flag-of-cambodia.svg). Gold fill with
// dark engraved lines instead of the flag's white and black.
//
// On page load it builds itself: the stepped base rises, the central gallery
// settles, the two corner prangs grow, then the central prang, and the
// equinox sun rises behind it (at the spring equinox the sun rises directly
// over the central tower, seen from the west entrance). Hover replays it.
import logo from '~/data/angkor-logo.json'

withDefaults(defineProps<{ height?: number; animate?: boolean }>(), { height: 36, animate: true })

const [, , vbW, vbH] = logo.viewBox.split(' ').map(Number) as [number, number, number, number]
const uid = useId()
const gradId = `al-gold-${uid}`
const sunId = `al-sun-${uid}`

// Throttled so sweeping the cursor across it doesn't restart a build midway.
const run = ref(0)
let last = 0
function replay() {
  if (Date.now() - last < 3500) return
  last = Date.now()
  run.value++
}
onMounted(() => { last = Date.now() })
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="logo.viewBox"
    :height="height"
    :width="Math.round((height * vbW) / vbH)"
    role="img"
    aria-label="អង្គរវត្ត"
    class="angkor-logo"
    :class="{ play: animate }"
    @mouseenter="animate && replay()"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#F4DC8A" />
        <stop offset=".55" stop-color="#D4AF37" />
        <stop offset="1" stop-color="#B08D5F" />
      </linearGradient>
      <radialGradient :id="sunId">
        <stop offset="0" stop-color="#F4DC8A" stop-opacity=".75" />
        <stop offset=".5" stop-color="#E8C96A" stop-opacity=".22" />
        <stop offset="1" stop-color="#E8C96A" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g :key="run" :fill="`url(#${gradId})`" stroke="var(--logo-ink, #0C1410)">
      <circle class="al-sun" :cx="logo.sun.cx" :cy="logo.sun.cy" :r="logo.sun.r" :fill="`url(#${sunId})`" stroke="none" />
      <g class="al-gallery" v-html="logo.gallery" />
      <g class="al-centre" v-html="logo.centre" />
      <g class="al-side al-left" v-html="logo.left" />
      <g class="al-side al-right" v-html="logo.right" />
      <g class="al-base" v-html="logo.base" />
    </g>
  </svg>
</template>

<style scoped>
.angkor-logo{display:block;overflow:visible}
.angkor-logo g{transform-box:fill-box}

.play .al-base{transform-origin:50% 100%;animation:al-rise .7s cubic-bezier(.22,.61,.36,1) both}
.play .al-gallery{transform-origin:50% 100%;animation:al-rise .6s cubic-bezier(.22,.61,.36,1) .3s both}
.play .al-side{transform-origin:50% 100%;animation:al-grow .75s cubic-bezier(.34,1.3,.64,1) .55s both}
.play .al-right{animation-delay:.7s}
.play .al-centre{transform-origin:50% 100%;animation:al-grow .85s cubic-bezier(.34,1.3,.64,1) .95s both}
.play .al-sun{transform-origin:50% 50%;animation:al-sun 2.4s cubic-bezier(.22,.61,.36,1) 1.5s both}

@keyframes al-rise{from{transform:translateY(12%);opacity:0}to{transform:none;opacity:1}}
@keyframes al-grow{from{transform:scaleY(0);opacity:0}30%{opacity:1}to{transform:none;opacity:1}}
@keyframes al-sun{
  0%{transform:translateY(40%) scale(.6);opacity:0}
  60%{opacity:1}
  100%{transform:none;opacity:1}
}
@media (prefers-reduced-motion: reduce){
  .play g,.play circle{animation:none !important}
}
</style>
