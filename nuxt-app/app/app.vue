<script setup lang="ts">
import '~/assets/css/animations.css'
import type { KhmerIconName } from '~/components/KhmerIcon.vue'

// Social sharing defaults (Open Graph / Twitter). Titles, descriptions,
// canonical and og:url come from each page + site config (@nuxtjs/seo);
// article pages override the image with their own photo.
const site = useSiteConfig()
useSeoMeta({
  ogType: 'website',
  ogSiteName: 'បេតិកភណ្ឌខ្មែរ — Khmer Heritage',
  ogLocale: 'km_KH',
  ogImage: `${site.url}/og-image.jpg`,
  ogImageAlt: 'បេតិកភណ្ឌខ្មែរ — អង្គរវត្តពេលថ្ងៃរះ',
  twitterCard: 'summary_large_image',
  twitterImage: `${site.url}/og-image.jpg`,
})
useHead({
  htmlAttrs: { lang: 'km' },
  titleTemplate: (t) => (t ? `${t} — បេតិកភណ្ឌខ្មែរ` : 'បេតិកភណ្ឌខ្មែរ — Khmer Heritage'),
})

const navLinks: Array<{ to: string; label: string; icon: KhmerIconName }> = [
  { to: '/', label: 'ទំព័រដើម', icon: 'temple' },
  { to: '/timeline', label: 'ប្រវត្តិសាស្ត្រ', icon: 'book' },
  { to: '/era', label: 'សម័យកាល', icon: 'bayon' },
  { to: '/heritage', label: 'បេតិកភណ្ឌរស់', icon: 'apsara' },
  { to: '/map', label: 'ផែនទី', icon: 'pin' },
  { to: '/calendar', label: 'ប្រតិទិន', icon: 'calendar' },
]

// "Install app" in the footer: shown when the browser offers installation, or
// on iOS Safari (manual Add to Home Screen); opens the card in PwaPrompt.vue.
const { $pwa } = useNuxtApp()
const installOpen = useState('kh-install-open', () => false)
const iosBrowser = ref(false)
onMounted(() => {
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  iosBrowser.value = !standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)
})
const canInstall = computed(() => (!!$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled) || iosBrowser.value)

const menuOpen = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { menuOpen.value = false })
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <PwaPrompt />
  <header>
    <NuxtLink to="/" class="brand">
      <AngkorLogo :height="40" />
      <span>បេតិកភណ្ឌខ្មែរ</span>
    </NuxtLink>
    <button class="menu-btn" :aria-expanded="menuOpen" aria-controls="site-nav" aria-label="ម៉ឺនុយ" @click="menuOpen = !menuOpen">
      <span /><span />
    </button>
    <nav id="site-nav" :class="{ open: menuOpen }">
      <NuxtLink v-for="l in navLinks" :key="l.to" :to="l.to">
        <KhmerIcon :name="l.icon" :size="18" class="nav-ic" />
        {{ l.label }}
      </NuxtLink>
    </nav>
  </header>

  <main>
    <NuxtPage />
  </main>

  <footer>
    <div class="wrap footer-inner">
      <div class="f-brand">
        <AngkorLogo :height="52" :animate="false" />
        <span>បេតិកភណ្ឌខ្មែរ</span>
      </div>
      <button v-if="canInstall" class="f-install" @click="installOpen = true">
        <KhmerIcon name="lotus" :size="18" />ដំឡើងកម្មវិធី · អានក្រៅបណ្ដាញ
      </button>
      <p class="f-quote">«ប្រាសាទនៅតែឈរ ព្រោះមនុស្សនៅតែចាំ»</p>
      <p class="f-note">គណនាថ្ងៃខែតាមប្រព័ន្ធសុរិយយាត្រ — J.C. Eade, <em>The Calendrical Systems of Mainland South-East Asia</em> (Brill, 1995). · <NuxtLink to="/credits">ប្រភពរូបភាព</NuxtLink></p>
    </div>
  </footer>
</template>

<style scoped>
/* Floating squircle bar: inset from the edges, light blur (a heavy blur on a
   fixed full-width bar is expensive to repaint while scrolling). */
header{
  position:fixed;top:calc(10px + env(safe-area-inset-top));left:16px;right:16px;z-index:90;max-width:1440px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;
  padding:6px 10px 6px 18px;border-radius:var(--r-lg);
  background:rgba(12,20,16,.86);backdrop-filter:blur(8px) saturate(1.2);
  border:1px solid rgba(212,175,55,.2);box-shadow:0 10px 30px rgba(0,0,0,.35);
}
.brand{display:flex;align-items:center;gap:12px;font-family:var(--display);font-size:1.02rem;line-height:2;color:var(--gold-2)}
nav{display:flex;gap:2px;font-family:var(--khmer);font-size:.88rem}
nav a{display:flex;align-items:center;gap:6px;color:var(--ivory-dim);padding:6px 12px;border-radius:var(--r-pill);line-height:1.9;transition:color .3s,background .3s}
.nav-ic{flex:none;opacity:.75}
nav a:hover{color:var(--gold-2);background:rgba(212,175,55,.08)}
nav a.router-link-exact-active,nav a.router-link-active:not([href="/"]){color:var(--gold-2);background:rgba(212,175,55,.12)}
.menu-btn{display:none;background:none;border:1px solid var(--gold-dim);border-radius:var(--r-sm);width:44px;height:44px;position:relative}
.menu-btn span{position:absolute;left:12px;right:12px;height:1.5px;background:var(--gold-2);transition:transform .3s var(--ease)}
.menu-btn span:first-child{top:17px}
.menu-btn span:last-child{top:25px}
.menu-btn[aria-expanded="true"] span:first-child{transform:translateY(4px) rotate(45deg)}
.menu-btn[aria-expanded="true"] span:last-child{transform:translateY(-4px) rotate(-45deg)}
@media(max-width:1060px){
  /* phones: a solid bar — re-blurring the page under a fixed header on every
     scroll frame is one of the costliest things a mobile GPU can be asked to do */
  header{padding:6px 8px 6px 14px;left:10px;right:10px;top:calc(8px + env(safe-area-inset-top));background:rgba(12,20,16,.97);backdrop-filter:none}
  .menu-btn{display:block}
  nav{position:absolute;top:calc(100% + 8px);left:0;right:0;flex-direction:column;gap:2px;padding:12px 12px 16px;background:rgba(10,16,13,.97);border:1px solid rgba(212,175,55,.2);border-radius:var(--r-lg);
    clip-path:inset(0 0 100% 0);transition:clip-path .45s var(--ease);pointer-events:none}
  nav.open{clip-path:inset(0 0 0 0);pointer-events:auto}
  nav a{font-size:1.05rem;padding:10px 12px}
}
/* installed app on a notched phone: keep pages clear of the status bar */
main{position:relative;z-index:1;padding-top:env(safe-area-inset-top)}
footer{position:relative;z-index:1;border-top:1px solid rgba(212,175,55,.14);padding:56px 0;background:radial-gradient(80% 120% at 50% 100%,rgba(46,74,53,.35),transparent),var(--night-2)}
.footer-inner{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.f-brand{display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--display);color:var(--gold-2);font-size:1.1rem;line-height:2}
.f-install{display:inline-flex;align-items:center;gap:8px;font-family:var(--khmer);font-size:.9rem;line-height:1.9;padding:6px 18px;border-radius:var(--r-pill);border:1px solid var(--gold-dim);background:rgba(212,175,55,.08);color:var(--gold-2);cursor:pointer;transition:background .25s}
.f-install:hover{background:rgba(212,175,55,.16)}
.f-quote{font-family:var(--script);font-size:1.35rem;color:var(--stone);line-height:2}
.f-note{font-family:var(--khmer);color:var(--ivory-dim);font-size:.8rem;max-width:640px;line-height:2}
.f-note a{color:var(--gold-2);border-bottom:1px solid var(--gold-dim)}
</style>
