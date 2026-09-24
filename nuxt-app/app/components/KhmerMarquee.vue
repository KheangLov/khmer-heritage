<script setup lang="ts">
import type { KhmerIconName } from '~/components/KhmerIcon.vue'
// Endless ribbon of Khmer heritage words, each paired with its motif.
const items: Array<{ t: string; i: KhmerIconName }> = [
  { t: 'អង្គរវត្ត', i: 'temple' }, { t: 'របាំអប្សរា', i: 'apsara' }, { t: 'បាយ័ន', i: 'bayon' },
  { t: 'នាគរាជ', i: 'naga' }, { t: 'ក្បាច់ភ្ញីទេស', i: 'kbach' }, { t: 'ចាប៉ីដងវែង', i: 'chapei' },
  { t: 'ស្បែកធំ', i: 'puppet' }, { t: 'ក្រមា', i: 'krama' }, { t: 'អុំទូក', i: 'boat' },
  { t: 'ផ្កាឈូក', i: 'lotus' }, { t: 'ដើមត្នោត', i: 'palm' }, { t: 'ផ្ការំដួល', i: 'rumdul' },
  { t: 'គ្រុឌ', i: 'garuda' }, { t: 'សាស្ត្រាស្លឹករឹត', i: 'book' },
]
</script>

<template>
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      <template v-for="n in 2" :key="n">
        <span v-for="it in items" :key="n + it.t" class="mq-item">
          <KhmerIcon :name="it.i" :size="30" />{{ it.t }}
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.marquee{overflow:hidden;border-block:1px solid rgba(212,175,55,.18);padding:26px 0;background:linear-gradient(90deg,var(--night),rgba(30,51,38,.55),var(--night));mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.mq-item{display:inline-flex;align-items:center;gap:14px;margin-right:56px;font-family:var(--title);font-size:1.35rem;line-height:2;color:var(--stone);white-space:nowrap}
.mq-item :deep(.kh-icon){color:var(--gold-2)}
</style>
