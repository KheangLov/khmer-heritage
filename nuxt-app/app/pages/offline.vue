<script setup lang="ts">
// Shown by the service worker when a page that is not saved on the device is
// opened without a connection. Every prerendered page is saved at install, so
// this only appears for pages outside the app (or before the first install).
useHead({ title: 'ក្រៅបណ្ដាញ', meta: [{ name: 'robots', content: 'noindex' }] })

const saved = [
  { to: '/', label: 'ទំព័រដើម', icon: 'temple' },
  { to: '/timeline', label: 'ប្រវត្តិសាស្ត្រ', icon: 'book' },
  { to: '/era', label: 'សម័យកាល', icon: 'bayon' },
  { to: '/heritage', label: 'បេតិកភណ្ឌរស់', icon: 'apsara' },
  { to: '/map', label: 'ផែនទី', icon: 'pin' },
  { to: '/calendar', label: 'ប្រតិទិន', icon: 'calendar' },
] as const
const retry = () => window.location.reload()
</script>

<template>
  <div class="offline wrap">
    <KhmerIcon name="lotus" :size="64" class="ic" />
    <h1>អ្នកកំពុងនៅក្រៅបណ្ដាញ</h1>
    <p class="lead">ទំព័រនេះមិនទាន់បានរក្សាទុកលើឧបករណ៍នៅឡើយទេ។ ទំព័រខាងក្រោម អានបានដោយគ្មានអ៊ីនធឺណិត — ផែនទីបង្ហាញតំបន់ដែលអ្នកធ្លាប់មើល។</p>
    <nav class="saved">
      <NuxtLink v-for="l in saved" :key="l.to" :to="l.to"><KhmerIcon :name="l.icon" :size="20" />{{ l.label }}</NuxtLink>
    </nav>
    <button class="retry" @click="retry">ព្យាយាមម្ដងទៀត</button>
  </div>
</template>

<style scoped>
.offline{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding-top:110px;padding-bottom:60px}
.ic{color:var(--gold-2)}
h1{font-family:var(--display);font-size:clamp(1.5rem,4vw,2.2rem);color:var(--ivory);line-height:var(--lh-display)}
.lead{font-family:var(--khmer);color:var(--ivory-dim);max-width:560px;line-height:2}
.saved{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:6px}
.saved a{display:inline-flex;align-items:center;gap:8px;font-family:var(--khmer);font-size:.9rem;line-height:1.9;padding:6px 16px;border-radius:var(--r-pill);border:1px solid rgba(212,175,55,.3);color:var(--gold-2);background:rgba(10,17,13,.5)}
.saved a:hover{background:rgba(212,175,55,.12)}
.retry{margin-top:8px;font-family:var(--khmer);font-size:.9rem;padding:8px 22px;border-radius:var(--r-pill);border:0;background:linear-gradient(180deg,var(--gold-2),var(--gold));color:var(--night);cursor:pointer}
</style>
