<script setup lang="ts">
import type { KhmerIconName } from '~/components/KhmerIcon.vue'
// Shared cinematic hero: drifting photograph, turning kbach mandala, gold
// dust, and the Moul title swept in with gold ink.
withDefaults(defineProps<{
  img: string
  title: string
  kicker?: string
  icon?: KhmerIconName
  en?: string
  sub?: string
  tall?: boolean
}>(), { kicker: '', icon: 'lotus', en: '', sub: '', tall: false })
</script>

<template>
  <section class="p-hero" :class="{ tall }">
    <div class="p-media" data-parallax="0.2">
      <NuxtImg :src="img" alt="" width="1920" height="1280" format="webp" loading="eager" fetchpriority="high" densities="x1" class="p-bg kenburns" />
    </div>
    <div class="p-veil" aria-hidden="true" />
    <div class="p-mandala" aria-hidden="true"><KbachMandala :petals="20" /></div>
    <GoldDust :count="36" />
    <div class="wrap p-inner">
      <div v-if="kicker" class="kicker" data-reveal><KhmerIcon :name="icon" :size="20" />{{ kicker }}</div>
      <h1 class="p-title shimmer" data-ink>{{ title }}</h1>
      <p v-if="en" class="en" data-scramble>{{ en.toUpperCase() }}</p>
      <p v-if="sub" class="sub" data-words>{{ sub }}</p>
      <slot />
    </div>
  </section>
</template>

<style scoped>
.p-hero{position:relative;min-height:72vh;display:flex;align-items:flex-end;text-align:center;overflow:hidden;border-bottom:1px solid rgba(212,175,55,.14)}
.p-hero.tall{min-height:92vh}
.p-media{position:absolute;inset:-12% 0}
.p-bg{width:100%;height:100%;object-fit:cover;opacity:.5}
.p-veil{position:absolute;inset:0;background:radial-gradient(90% 80% at 50% 40%,rgba(12,20,16,.3),rgba(12,20,16,.86) 72%),linear-gradient(180deg,rgba(12,20,16,.55),transparent 35%,var(--night))}
.p-mandala{position:absolute;width:min(80vmin,680px);aspect-ratio:1;left:50%;top:48%;translate:-50% -50%;color:var(--gold);opacity:.16}
.p-inner{position:relative;z-index:3;padding-top:140px;padding-bottom:70px;max-width:980px}
.kicker{display:inline-flex;align-items:center;gap:10px;font-family:var(--khmer);font-size:.9rem;letter-spacing:.08em;color:var(--gold-2);line-height:2}
.p-title{font-family:var(--display);font-size:clamp(2rem,6.4vw,4.6rem);line-height:var(--lh-display)}
.en{font-family:var(--latin-display);letter-spacing:.36em;font-size:.85rem;color:var(--stone)}
.sub{font-family:var(--khmer);color:var(--ivory);opacity:.85;font-size:1.08rem;line-height:2.1;margin:20px auto 0;max-width:700px}
</style>
