<script setup lang="ts">
const { open } = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const route = useRoute()

const labels: Record<string, string> = {
  index: 'داشبورد',
  orders: 'سفارش‌ها',
  settlements: 'تسویه‌ها',
  transactions: 'تراکنش‌ها',
  pos: 'دستگاه فروش'
}

function extractLinks(base: 'mechanic' | 'vendor') {
  const files = import.meta.glob(`~/pages/${base}/**/index.vue`, { eager: true })
  return Object.keys(files)
    .map((file) =>
      file
        .replace('~/pages', '')
        .replace(/index.vue$/, '')
        .replace(/\/$/, '')
    )
    .map((path) => {
      const segs = path.split('/').filter(Boolean)
      const key = segs[1] || 'index'
      return { to: path || '/', label: labels[key] || key }
    })
    .sort((a, b) => a.to.localeCompare(b.to))
}

const mechanicLinks = extractLinks('mechanic')
const vendorLinks = extractLinks('vendor')

const links = computed(() => {
  return route.path.startsWith('/vendor')
    ? vendorLinks
    : route.path.startsWith('/mechanic')
    ? mechanicLinks
    : []
})
</script>

<template>
  <div>
    <div
      v-if="open"
      class="fixed inset-0 bg-black/50 z-40 sm:hidden"
      @click="emit('close')"
    ></div>
    <aside
      class="fixed top-0 right-0 h-full bg-white shadow-lg z-50 transform transition-transform duration-200 overflow-y-auto w-full sm:w-64"
      :class="open ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="p-4 border-b flex items-center justify-between sm:hidden">
        <div class="font-bold">منو</div>
        <button @click="emit('close')" class="p-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav class="p-4 space-y-2">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block px-4 py-2 rounded hover:bg-gray-100 text-right"
          @click="emit('close')"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </aside>
  </div>
</template>
