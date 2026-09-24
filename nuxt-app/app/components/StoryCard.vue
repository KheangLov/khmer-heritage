<script setup lang="ts">
import type { KhmerIconName } from '~/components/KhmerIcon.vue'
// Photo card with a medallion icon, 3D tilt and gold glare.
withDefaults(defineProps<{
  to: string
  img: string
  icon: KhmerIconName
  title: string
  tag?: string
  sub?: string
  badge?: string
  headingLevel?: 'h2' | 'h3'
}>(), { tag: '', sub: '', badge: '', headingLevel: 'h2' })
</script>

<template>
  <NuxtLink :to="to" class="card" data-reveal data-tilt>
    <div class="media">
      <div class="clip">
        <NuxtImg :src="img" :alt="title" width="640" height="420" format="webp" loading="lazy" />
      </div>
      <span v-if="badge" class="badge-year">{{ badge }}</span>
      <span class="medal"><KhmerIcon :name="icon" :size="28" /></span>
    </div>
    <div class="body">
      <div v-if="tag" class="tag">{{ tag }}</div>
      <component :is="headingLevel" class="title">{{ title }}</component>
      <p v-if="sub">{{ sub }}</p>
      <span class="go">ស្វែងយល់ →</span>
    </div>
  </NuxtLink>
</template>

<style scoped>
.card{display:flex;flex-direction:column;border:1px solid rgba(201,168,124,.16);border-radius:var(--r-md);overflow:hidden;background:linear-gradient(180deg,rgba(30,51,38,.6),rgba(20,36,27,.6));transition:border-color .3s,box-shadow .4s var(--ease)}
.card:hover{border-color:var(--gold-dim);box-shadow:0 22px 50px rgba(0,0,0,.45)}
.media{position:relative;aspect-ratio:16/10}
.clip{position:absolute;inset:0;overflow:hidden;border-bottom:1px solid rgba(212,175,55,.25)}
.clip img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
.card:hover .clip img{transform:scale(1.07)}
.clip::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(10,16,13,.75))}
.badge-year{position:absolute;left:16px;bottom:8px;z-index:1;font-family:var(--title);font-size:1.15rem;line-height:1.9;color:var(--gold-2);text-shadow:0 2px 12px rgba(0,0,0,.9)}
.medal{position:absolute;right:14px;bottom:-24px;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:var(--moss-3);border:1px solid var(--gold-dim);color:var(--gold-2);z-index:2;box-shadow:0 6px 20px rgba(0,0,0,.4)}
.body{padding:26px 24px;display:flex;flex-direction:column;gap:8px;flex:1}
.tag{font-family:var(--khmer);font-size:.78rem;letter-spacing:.06em;color:var(--gold-2);line-height:1.9;padding-right:48px}
.title{font-family:var(--title);font-size:1.3rem;color:var(--ivory)}
p{font-family:var(--khmer);color:var(--ivory-dim);font-size:.92rem;line-height:2;flex:1}
.go{font-family:var(--khmer);color:var(--gold-2);font-size:.88rem}
</style>
