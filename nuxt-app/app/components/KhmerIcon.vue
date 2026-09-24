<script lang="ts">
import angkorLogo from '~/data/angkor-logo.json'

// Angkor Wat follows the brand mark: the temple from the national flag
// (app/data/angkor-logo.json), drawn as outline + light fill so it sits with
// the other line icons. `.kh-aw *` (below) sets its line weight.
const ANGKOR = `<svg x="0" y="4" width="48" height="40" viewBox="62 548 266.5 176" overflow="visible"><g class="kh-aw" fill="currentColor" fill-opacity=".2" stroke="currentColor" stroke-linejoin="round">${
  angkorLogo.gallery + angkorLogo.centre + angkorLogo.left + angkorLogo.right + angkorLogo.base
}</g></svg>`

export const KHMER_ICONS = {
  temple: ANGKOR,
  // Bayon face tower — the serene smile of Jayavarman VII
  bayon: `
<path class="f" d="M14 44V21c0-6 4-11 10-17 6 6 10 11 10 17v23"/>
<path d="M17 21h14M19 16.5h10M21.5 12h5"/>
<path d="M18.5 27.5c1.2-.9 2.8-.9 4 0M25.5 27.5c1.2-.9 2.8-.9 4 0"/>
<path d="M24 29v4.5l-1.6 1.1h3.2"/>
<path d="M20 37.5c2.5 1.9 5.5 1.9 8 0"/>
<path d="M10 44h28"/>`,
  // Apsara — mkot crown, flexed fingers, lifted foot
  apsara: `
<path class="f" d="M24 2.5 22 8h4z"/>
<circle cx="24" cy="10.8" r="2.8"/>
<path d="M24 13.6c-1 3-1 6 0 9"/>
<path d="M22.6 15.6c-3 1-6 0-7.4-3-.6-1.2.2-2.4 1.4-2"/>
<path d="M25.4 15.6c3 1 6 3 6.5 6.5.2 1.3-1 2-2 1.2"/>
<path class="f" d="M20 22.6h8l2 9H18z"/>
<path d="M21 31.6 19 39l-3 2M27 31.6c3 .5 5 2 5.5 4.5l-3 .6"/>
<path d="M19.6 23.2c-3 2-4 5-3 8.5"/>`,
  // Seven-headed naga hood rising from the balustrade
  naga: `
<path d="M24 32 12 17M24 32l-7-20M24 32V9M24 32l7-20M24 32l12-15"/>
<ellipse class="f" cx="11" cy="15" rx="2.6" ry="3.2" transform="rotate(-40 11 15)"/>
<ellipse class="f" cx="16.3" cy="9.6" rx="2.6" ry="3.2" transform="rotate(-20 16.3 9.6)"/>
<ellipse class="f" cx="24" cy="6.8" rx="2.6" ry="3.2"/>
<ellipse class="f" cx="31.7" cy="9.6" rx="2.6" ry="3.2" transform="rotate(20 31.7 9.6)"/>
<ellipse class="f" cx="37" cy="15" rx="2.6" ry="3.2" transform="rotate(40 37 15)"/>
<path class="f" d="M15 24c3 5 6 8 9 8s6-3 9-8"/>
<path d="M24 32c0 5-8 5-8 9 0 2 2 3 5 3h21M6 44h6"/>`,
  // Lotus — petals rising from still water
  lotus: `
<path class="f" d="M24 9c4 5 6 10 6 15s-3 8-6 8-6-3-6-8 2-10 6-15z"/>
<path d="M18.5 16.5c-5 1-9 5-9 10s5 7.5 10.5 7.5M29.5 16.5c5 1 9 5 9 10s-5 7.5-10.5 7.5"/>
<path d="M9.5 26.5c-3 0-5 1.8-5.5 3.8 3 3 8 4 13.5 4.2M38.5 26.5c3 0 5 1.8 5.5 3.8-3 3-8 4-13.5 4.2"/>
<path d="M8 41c3-1.5 5-1.5 8 0s5 1.5 8 0 5-1.5 8 0 5 1.5 8 0"/>`,
  // Kbach phni tes — the flame-leaf ornament of Khmer carving
  kbach: `
<path class="f" d="M24 4c3 6 8 9 8 16 0 6-4 10-8 10s-8-4-8-10c0-7 5-10 8-16z"/>
<path d="M24 14c2 3 3 5 3 8s-1.5 4.5-3 4.5-3-1.5-3-4.5 1-5 3-8z"/>
<path d="M16 26c-5-1-8 2-8 6 0 3 2 5 5 5 2 0 3-1.5 3-3 0-1.2-1-2-2-2M32 26c5-1 8 2 8 6 0 3-2 5-5 5-2 0-3-1.5-3-3 0-1.2 1-2 2-2"/>
<path d="M24 30v14M18 44h12M24 38.5c-3 0-5-1-6-3M24 38.5c3 0 5-1 6-3"/>`,
  // Garuda — the royal bird-man, wings spread
  garuda: `
<circle cx="24" cy="10" r="3"/>
<path d="m22 7.2 2-4.2 2 4.2M26.8 10.2l3 1-3 1"/>
<path d="M21 16c-6-4-13-4-17 0 4 0 7 1 9 3-3 0-6 1-8 3 4 0 8 1 11 3M27 16c6-4 13-4 17 0-4 0-7 1-9 3 3 0 6 1 8 3-4 0-8 1-11 3"/>
<path class="f" d="M21 15h6l1.2 13h-8.4z"/>
<path d="m20 28-4 8 3 4M28 28l4 8-3 4M22 30l-1 10M26 30l1 10M24 30v11"/>`,
  // Hamsa (ហង្ស) — sacred goose, mount of Brahma
  hamsa: `
<path class="f" d="M7 31c3 6 10 9 18 8.5 8-.6 13-6 14-11.5-6 3-12 3-16 0z"/>
<path d="M22.5 28.5c-3-4-2-10 1-14 2-3 1-6-2-6-2 0-3 2-3 3.2l-3.2 1.6 3.2.6"/>
<path d="M39 28c2-4 4-6 6-7M38.5 26c1-5 .5-9-1.5-12"/>
<path d="M15 34c4 1.2 9 1 13.5-2"/>
<path d="M6 43c3-1.5 5-1.5 8 0s5 1.5 8 0 5-1.5 8 0 5 1.5 8 0"/>`,
  // Stupa / chedi — bell body, stacked rings, lotus finial
  stupa: `
<path d="M24 3v4M22 9.5h4M21.5 12.5h5M21 15.5h6"/>
<path d="m20.5 17.5 3.5-10 3.5 10"/>
<path class="f" d="M16.5 26c0-5 3-8 7.5-9 4.5 1 7.5 4 7.5 9z"/>
<path d="M14 26h20M12.5 30h23M11 34h26"/>
<path d="M9 34v4h30v-4M6 44h36M8 38v6M40 38v6"/>`,
  // Sugar palm (ដើមត្នោត) — the national tree of the rice fields
  palm: `
<path class="f" d="M22.6 44 23.5 20h1l.9 24z"/>
<path d="M24 20c-4-5-10-7-16-6M24 20c-3-6-3-11-1-15M24 20c4-5 10-7 16-6M24 20c3-6 3-11 1-15M24 20c-6-2-12 0-16 4M24 20c6-2 12 0 16 4"/>
<circle class="f" cx="22" cy="23" r="1.4"/><circle class="f" cx="26" cy="23" r="1.4"/>
<path d="M10 44h28"/>`,
  // Rumdul (រំដួល) — the national flower, six curled petals
  rumdul: `
<g class="f"><path d="M24 24c-3-4-3-10 0-16 3 6 3 12 0 16z"/><path d="M24 24c-3-4-3-10 0-16 3 6 3 12 0 16z" transform="rotate(120 24 24)"/><path d="M24 24c-3-4-3-10 0-16 3 6 3 12 0 16z" transform="rotate(240 24 24)"/></g>
<path d="M24 24c-2-2.6-2-6 0-9 2 3 2 6.4 0 9z" transform="rotate(60 24 24)"/>
<path d="M24 24c-2-2.6-2-6 0-9 2 3 2 6.4 0 9z" transform="rotate(180 24 24)"/>
<path d="M24 24c-2-2.6-2-6 0-9 2 3 2 6.4 0 9z" transform="rotate(300 24 24)"/>
<circle cx="24" cy="24" r="2"/>`,
  // Royal tiered parasol (ឆត្រ) — emblem of kingship
  parasol: `
<path d="M24 5v39M19 44h10"/>
<path class="f" d="m24 5-1.6 3h3.2z"/>
<path class="f" d="M15 12h18l-2 3.5H17zM13 20h22l-2 3.5H15zM11 28h26l-2 3.5H13z"/>
<path d="M17 15.5v2M31 15.5v2M15 23.5v2M33 23.5v2M13 31.5v2M35 31.5v2"/>`,
  // Conch (ស័ង្ខ) — sounded at royal and Brahmanic rites
  conch: `
<path class="f" d="M14 31c-4-6 0-18 10-20 6-1 11 3 12 8 1 6-4 10-8 12l-8 4c-3 1.5-5 0-6-4z"/>
<path d="M24 13c4 0 7 3 7 6s-2 5-5 5-4-2-4-3.6"/>
<path d="M20 35c3 2 7 3 12 3l6 3"/>`,
  // Sampeah (សំពះ) — palms pressed in greeting
  sampeah: `
<path class="f" d="M24 6c-3.2 1.5-5.6 5-5.6 10.5V27c0 2.5-1.5 4.5-3.4 6h18c-1.9-1.5-3.4-3.5-3.4-6V16.5C29.6 11 27.2 7.5 24 6z"/>
<path d="M24 7v26M21 11.5v9M27 11.5v9"/>
<path d="M18.4 21.5c-2 1-3.2 3-3.2 5.5M29.6 21.5c2 1 3.2 3 3.2 5.5"/>
<path d="m15 33-6 11M33 33l6 11"/>`,
  // Chapei dong veng — long-necked lute
  chapei: `
<circle class="f" cx="15" cy="34" r="8.5"/>
<circle cx="15" cy="34" r="2.2"/>
<path d="M20.5 28 37 7.5M22.6 30 39 9.5"/>
<path d="M38 8.5c.6-3 3.6-4.4 5.4-2.4 1.6 1.8-.2 4.4-2.4 3.4"/>
<path d="M26 22.5l2 1.6M29 19l2 1.6M32 15.4l2 1.6"/>
<path d="M12 37 38.4 8.4"/>`,
  // Skor thom — ceremonial barrel drum on its stand
  drum: `
<path class="f" d="M12 18c-2 4-2 12 0 16h24c2-4 2-12 0-16z"/>
<ellipse cx="24" cy="18" rx="12" ry="3"/>
<path d="m14 22 4 9 4-9 4 9 4-9 4 9"/>
<path d="m14 34.5-3 9.5M34 34.5l3 9.5M18 34.5 17 44M30 34.5l1 9.5"/>
<path d="M31 13l7-8M17 13l-7-8"/>`,
  // Krama — the checked cotton scarf, fringed ends
  krama: `
<path class="f" d="M8 9h32v25H8z"/>
<path d="M16 9v25M24 9v25M32 9v25M8 17.3h32M8 25.6h32"/>
<path d="M10 34v6M14 34v7M18 34v6M22 34v7M26 34v6M30 34v7M34 34v6M38 34v7"/>`,
  // Amok in a banana-leaf cup (ស្លឹកចេក)
  bowl: `
<path class="f" d="M9 22h30l-4 14c-1 3-4 5-7 5h-8c-3 0-6-2-7-5z"/>
<path d="m14 22 2 18M24 22v19M34 22l-2 18"/>
<path d="M18 16c-2-2 2-4 0-7M24 16c-2-2 2-4 0-7M30 16c-2-2 2-4 0-7"/>
<path d="M15.5 22c3-3.4 14-3.4 17 0"/>`,
  // Water-festival racing boat with naga prow and paddlers
  boat: `
<path class="f" d="M4 28c6 5 28 5.5 37 .5 2.2-1.2 3.2-4.2 3-7.5-2 1.6-3 3-5.5 4"/>
<circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/><circle cx="26" cy="19" r="1.6"/><circle cx="33" cy="19" r="1.6"/>
<path d="m12 21-1 6M19 21l-1 6M26 21l-1 6M33 21l-1 6"/>
<path d="m14 22-5 13M21 22l-5 13M28 22l-5 13M35 22l-5 13"/>
<path d="M4 39c3-1.5 5-1.5 8 0s5 1.5 8 0 5-1.5 8 0 5 1.5 8 0 5-1.5 8 0"/>`,
  // Mkot — the pointed Khmer crown
  crown: `
<path class="f" d="m24 3-3 12h6z"/>
<path class="f" d="M19 15h10l1 4H18zM17 19h14l1 4H16z"/>
<path d="M14 23h20v5c-3 2-7 3-10 3s-7-1-10-3z"/>
<path d="m14 26-3 8 4-1M34 26l3 8-4-1"/>
<circle cx="24" cy="26.5" r="1.4"/>`,
  // Palm-leaf manuscript (សាស្ត្រាស្លឹករឹត) bound with cord
  book: `
<rect x="4" y="12" width="40" height="6.5" rx="3.2"/>
<rect class="f" x="4" y="20.8" width="40" height="6.5" rx="3.2"/>
<rect x="4" y="29.6" width="40" height="6.5" rx="3.2"/>
<path d="M18 15.2h20M18 24h20M18 32.8h20" stroke-dasharray="2 2.4"/>
<path d="M12 15.2v17.6c0 3.4-2.6 6.4-6 7.8"/>`,
  // Lunar calendar — framed page with a crescent moon
  calendar: `
<rect class="f" x="6" y="10" width="36" height="32" rx="4"/>
<path d="M15 6v7M33 6v7M6 18h36"/>
<path d="M28.5 23.5a7 7 0 1 0 3.2 9.8 5.6 5.6 0 1 1-3.2-9.8z"/>
<path d="M12 25h6M12 30h6M12 35h6"/>`,
  // Sun wheel with kbach rays
  sun: `
<circle class="f" cx="24" cy="24" r="8"/>
<path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M37.4 10.6l-4.2 4.2M14.8 33.2l-4.2 4.2"/>
<circle cx="24" cy="24" r="3"/>`,
  // Bodhi leaf — heart shape with the long drip tip
  leaf: `
<path class="f" d="M24 44c0-3-1-5-3-7-8-6-13-12-13-19 0-6 4-10 9-10 3 0 5.4 1.6 7 4 1.6-2.4 4-4 7-4 5 0 9 4 9 10 0 7-5 13-13 19-2 2-3 4-3 7z"/>
<path d="M24 12v27M24 20l-6-4M24 20l6-4M24 27l-8-4M24 27l8-4"/>`,
  // Stone inscription stele — the written record of the kings
  stele: `
<path class="f" d="M14 44V13c0-5 4-9 10-9s10 4 10 9v31"/>
<path d="M18.5 14h11M18.5 19h11M18.5 24h11M18.5 29h8M18.5 34h11"/>
<path d="M10 44h28"/>`,
  // Sbek thom — leather shadow-puppet panel held on two poles
  puppet: `
<path class="f" d="M9 5h30v29H9z"/>
<circle cx="24" cy="12" r="2.6"/>
<path d="m22.4 9.4 1.6-3.4 1.6 3.4M24 14.6v8M24 17l-5 3 1 4M24 17l5-2 2 3M24 22.6l-4 7M24 22.6l4 7"/>
<path d="M16 34v10M32 34v10"/>`,
  // Incense and candle — remembrance, Pchum Ben offerings
  incense: `
<path d="M19 30V14M24 30V10M29 30V14"/>
<path d="M19 12c-1.6-1.6 1.2-3.2-.4-5.2M24 8c-1.6-1.6 1.2-3.2-.4-5.2M29 12c-1.6-1.6 1.2-3.2-.4-5.2"/>
<path class="f" d="M12 30h24l-3 10H15z"/>
<path d="M10 44h28"/>`,
  // Mekong / Tonle Sap waters
  water: `
<path d="M4 16c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0 5-2 4-1"/>
<path class="f" d="M4 26c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0 4-1.4 4-1V40H4z"/>
<path d="M4 34c3-2 6-2 9 0s6 2 9 0 6-2 9 0 6 2 9 0"/>`,
  // Map pin crowned with a lotus bud — "a place in history"
  pin: `
<path class="f" d="M24 44s-13-13.2-13-23.5C11 13.3 16.8 8 24 8s13 5.3 13 12.5C37 30.8 24 44 24 44z"/>
<path d="M24 14.5c2.6 2.8 3.8 5 3.8 7.2 0 2.3-1.7 3.8-3.8 3.8s-3.8-1.5-3.8-3.8c0-2.2 1.2-4.4 3.8-7.2z"/>
<path d="M24 8V4M21.6 5.6 24 3l2.4 2.6"/>`,
  // Compass rose with the eight Khmer directions
  compass: `
<circle cx="24" cy="24" r="19"/>
<path class="f" d="m24 7 4 13-4 4-4-4z"/>
<path d="m24 41-4-13 4-4 4 4z"/>
<path d="M7 24h5M36 24h5M12 12l3.2 3.2M36 12l-3.2 3.2M12 36l3.2-3.2M36 36l-3.2-3.2"/>`,
  // Four-pointed star ornament (kbach phka chan)
  star: `
<path class="f" d="M24 4c1.6 9 5 12.4 14 14-9 1.6-12.4 5-14 14-1.6-9-5-12.4-14-14 9-1.6 12.4-5 14-14z"/>
<path d="M24 32v12M18 44h12"/>`,
} as const

export type KhmerIconName = keyof typeof KHMER_ICONS
</script>

<script setup lang="ts">
// Hand-drawn Khmer heritage icon set — 48×48 grid, 1.6 stroke, duotone:
// strokes use currentColor and `.f` shapes get a translucent currentColor
// fill, so each motif reads as carved relief on any background.
// With `draw` set, the animation plugin traces the strokes on scroll.
defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{
  name: KhmerIconName
  size?: number
  draw?: boolean
}>(), {
  size: 24,
  draw: false,
})
</script>
<template>
  <!-- eslint-disable vue/no-v-html -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    :stroke-width="size <= 20 ? 2.4 : 1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="kh-icon"
    :class="[$attrs.class, { 'kh-draw': draw }]"
    aria-hidden="true"
    v-html="KHMER_ICONS[name]"
  />
</template>

<style>
.kh-icon .f{fill:currentColor;fill-opacity:.16}
.kh-aw *{stroke-width:5.5px}
.kh-aw g[fill="none"] *{fill:none}
</style>
