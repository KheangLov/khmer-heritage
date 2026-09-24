<script setup lang="ts">
// Concentric ring of kbach flame-leaves and lotus petals, drawn as one SVG.
// Used as a slowly turning halo behind hero titles.
withDefaults(defineProps<{ petals?: number; reverse?: boolean }>(), { petals: 24, reverse: false })
</script>

<template>
  <svg viewBox="-200 -200 400 400" class="mandala" :class="{ rev: reverse }" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="0.8">
    <circle r="192" stroke-dasharray="1 5" />
    <circle r="176" />
    <circle r="120" stroke-dasharray="2 4" />
    <circle r="62" />
    <g v-for="i in petals" :key="'k' + i" :transform="`rotate(${(360 / petals) * i})`">
      <!-- kbach flame leaf -->
      <path d="M0-176c7-14 16-22 16-36 0-12-8-20-16-26-8 6-16 14-16 26 0 14 9 22 16 36z" fill="currentColor" fill-opacity=".06" />
      <path d="M0-190c3-6 6-10 6-15s-3-8-6-10c-3 2-6 5-6 10s3 9 6 15z" />
      <!-- inner lotus petal -->
      <path d="M0-62c9-14 13-30 0-56-13 26-9 42 0 56z" fill="currentColor" fill-opacity=".05" />
      <circle cy="-148" r="2" fill="currentColor" stroke="none" />
    </g>
    <g v-for="i in 8" :key="'s' + i" :transform="`rotate(${45 * i + 22.5})`">
      <path d="M0-24c4-10 4-22 0-34-4 12-4 24 0 34z" />
    </g>
  </svg>
</template>
