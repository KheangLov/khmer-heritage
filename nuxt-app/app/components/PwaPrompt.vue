<script setup lang="ts">
// The installed-app layer, all in one place:
//   install card   offered after some reading (not on arrival), "ពេលក្រោយ"
//                  snoozes it for two weeks; the footer's "ដំឡើងកម្មវិធី"
//                  button opens it any time
//   iOS hint       Safari has no install prompt: Share → Add to Home Screen
//   update toast   a new version is waiting (registerType: 'prompt')
//   offline-ready  shown once, when everything is saved on the device
//   offline pill   while there is no connection
const { $pwa } = useNuxtApp()
const requested = useState('kh-install-open', () => false)

const SNOOZE = 'kh-install-snooze'
const snoozed = () => {
  try { return Date.now() < Number(localStorage.getItem(SNOOZE) || 0) } catch { return false }
}
function snooze() {
  try { localStorage.setItem(SNOOZE, String(Date.now() + 14 * 24 * 3600 * 1000)) } catch { /* private mode */ }
  card.value = false
  requested.value = false
}

const online = ref(true)
const ios = ref(false)
const card = ref(false)
const readyToast = ref(false)
const canPrompt = computed(() => !!$pwa?.showInstallPrompt && !$pwa?.isPWAInstalled)

// Notices wait for the reader's first tap / key press. Before that they would
// be the newest, largest text on screen and count as the page's Largest
// Contentful Paint (browsers stop measuring LCP at the first input) — on the
// map page, a toast appearing after the precache made LCP ~17 s on mobile.
const interacted = ref(false)
const markInteracted = () => { interacted.value = true }

let offerTimer: ReturnType<typeof setTimeout> | undefined
const setOnline = () => { online.value = navigator.onLine }
onMounted(() => {
  window.addEventListener('pointerdown', markInteracted, { once: true, passive: true })
  window.addEventListener('keydown', markInteracted, { once: true })
  setOnline()
  window.addEventListener('online', setOnline)
  window.addEventListener('offline', setOnline)
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  ios.value = !standalone && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
  // Offer to install after ~40 s of reading, once per snooze period.
  offerTimer = setTimeout(() => {
    if (!snoozed() && (canPrompt.value || ios.value)) card.value = true
  }, 40_000)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', markInteracted)
  window.removeEventListener('keydown', markInteracted)
  clearTimeout(offerTimer)
  window.removeEventListener('online', setOnline)
  window.removeEventListener('offline', setOnline)
})
watch(requested, (v) => { if (v) card.value = true })
watch(() => !!$pwa?.offlineReady && interacted.value, (v) => {
  if (!v) return
  readyToast.value = true
  setTimeout(() => { readyToast.value = false }, 6000)
})

const showCard = computed(() => card.value && interacted.value && (canPrompt.value || ios.value))
async function install() {
  const choice = await $pwa?.install()
  card.value = false
  requested.value = false
  if (choice?.outcome === 'dismissed') snooze()
}
const update = () => $pwa?.updateServiceWorker(true)
const later = () => $pwa?.cancelPrompt()
</script>

<template>
  <div class="pwa" aria-live="polite">
    <Transition name="pwa-pop">
      <div v-if="!online" class="pill" role="status">
        <span class="dot" />ក្រៅបណ្ដាញ — បង្ហាញអ្វីដែលបានរក្សាទុក
      </div>
    </Transition>

    <Transition name="pwa-pop">
      <div v-if="$pwa?.needRefresh" class="toast" role="alert">
        <KhmerIcon name="lotus" :size="22" class="t-ic" />
        <span class="t-txt">មានកំណែថ្មីនៃគេហទំព័រ</span>
        <button class="btn primary" @click="update">ធ្វើបច្ចុប្បន្នភាព</button>
        <button class="x" aria-label="បិទ" @click="later">×</button>
      </div>
      <div v-else-if="readyToast" class="toast" role="status">
        <KhmerIcon name="lotus" :size="22" class="t-ic" />
        <span class="t-txt">រួចរាល់ — អាចអានបានដោយគ្មានអ៊ីនធឺណិត</span>
      </div>
    </Transition>

    <Transition name="pwa-pop">
      <aside v-if="showCard" class="card" aria-label="ដំឡើងកម្មវិធី">
        <button class="x" aria-label="ពេលក្រោយ" @click="snooze">×</button>
        <img src="/icon-192.png" alt="" width="56" height="56" class="app-ic">
        <div class="c-txt">
          <b>ដំឡើង «បេតិកភណ្ឌខ្មែរ»</b>
          <p>បើកពីអេក្រង់ដើមដូចកម្មវិធី លឿនជាងមុន ហើយអានប្រវត្តិ ផែនទី និងប្រតិទិនបាន សូម្បីតែក្រៅបណ្ដាញ។</p>
          <ol v-if="!canPrompt && ios" class="ios">
            <li>
              ចុច
              <svg viewBox="0 0 24 24" class="share" aria-label="ចែករំលែក"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" /></svg>
              «ចែករំលែក» (Share) នៅ Safari
            </li>
            <li>ជ្រើស «បន្ថែមទៅអេក្រង់ដើម» (Add to Home Screen)</li>
          </ol>
          <div v-else class="c-act">
            <button class="btn primary" @click="install">ដំឡើង</button>
            <button class="btn" @click="snooze">ពេលក្រោយ</button>
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
.pwa{position:fixed;left:0;right:0;bottom:calc(16px + env(safe-area-inset-bottom));z-index:150;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;padding:0 12px}
.pwa > *{pointer-events:auto}
.pill,.toast,.card{background:#0B120E;border:1px solid rgba(212,175,55,.3);box-shadow:0 18px 44px rgba(0,0,0,.5);color:var(--ivory)}
.pill{display:flex;align-items:center;gap:8px;font-family:var(--khmer);font-size:.8rem;line-height:1.9;padding:4px 14px;border-radius:var(--r-pill);color:var(--ivory-dim)}
.dot{width:8px;height:8px;border-radius:50%;background:#E7A38D;box-shadow:0 0 0 3px rgba(231,163,141,.2)}
.toast{display:flex;align-items:center;gap:10px;max-width:min(560px,100%);padding:8px 8px 8px 14px;border-radius:var(--r-lg)}
.t-ic{color:var(--gold-2);flex:none}
.t-txt{font-family:var(--khmer);font-size:.88rem;line-height:1.9;flex:1}
.card{position:relative;display:flex;gap:14px;align-items:flex-start;width:min(440px,100%);padding:16px 18px;border-radius:var(--r-xl)}
.app-ic{flex:none;border-radius:var(--r-md)}
.c-txt{display:flex;flex-direction:column;gap:4px;padding-right:18px}
.c-txt b{font-family:var(--title);font-weight:400;font-size:1rem;line-height:1.8;color:var(--gold-2)}
.c-txt p{font-family:var(--khmer);font-size:.84rem;line-height:1.95;color:var(--ivory-dim)}
.c-act{display:flex;gap:8px;margin-top:6px}
.ios{margin:4px 0 0 18px;font-family:var(--khmer);font-size:.84rem;line-height:2;color:var(--ivory)}
.share{display:inline-block;vertical-align:-4px;width:20px;height:20px;fill:none;stroke:var(--gold-2);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.btn{font-family:var(--khmer);font-size:.85rem;line-height:1.8;padding:5px 16px;border-radius:var(--r-pill);border:1px solid var(--gold-dim);background:none;color:var(--gold-2);cursor:pointer;white-space:nowrap}
.btn:hover{background:rgba(212,175,55,.12)}
.btn.primary{border-color:transparent;background:linear-gradient(180deg,var(--gold-2),var(--gold));color:var(--night)}
.x{flex:none;width:30px;height:30px;border-radius:var(--r-sm);border:0;background:none;color:var(--stone);font-size:1.2rem;line-height:1;cursor:pointer}
.card .x{position:absolute;top:8px;right:8px}
.x:hover{color:var(--gold-2)}
.pwa-pop-enter-active,.pwa-pop-leave-active{transition:opacity .35s var(--ease),transform .35s var(--ease)}
.pwa-pop-enter-from,.pwa-pop-leave-to{opacity:0;transform:translateY(14px)}
</style>
