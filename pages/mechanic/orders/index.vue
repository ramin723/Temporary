<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
      <div class="mb-8">
        <div class="flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">سفارش‌های من</h1>
            <p class="mt-2 text-gray-600">لیست تمام سفارش‌های ایجاد شده</p>
          </div>
          <div class="flex gap-3">
            <NuxtLink 
              to="/mechanic/orders/new"
              class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
            >
              <svg class="mr-2 w-4 h-4 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              سفارش جدید
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- فیلترها -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">وضعیت</label>
            <AppSelect
              v-model="filters.status"
              :options="[
                { value: '', label: 'همه' },
                { value: 'PENDING', label: 'در انتظار' },
                { value: 'CONSUMED', label: 'مصرف شده' }
              ]"
              @change="applyFilters"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">جستجو (شماره تلفن)</label>
            <AppInput
              v-model="filters.search"
              placeholder="09120000000"
              @input="debouncedSearch"
            />
          </div>
          
          <div class="flex items-end">
            <AppButton @click="applyFilters" variant="secondary" class="w-full">
              اعمال فیلتر
            </AppButton>
          </div>
        </div>
      </div>

      <!-- لیست سفارش‌ها -->
      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500">در حال بارگذاری...</div>
      </div>

      <div v-else-if="error" class="text-center py-8">
        <AppAlert :message="error" variant="error" />
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-8">
        <div class="text-gray-500">هیچ سفارشی یافت نشد</div>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="font-mono text-lg font-semibold text-blue-600">
                {{ order.code }}
              </div>
              <div class="text-sm text-gray-600">
                {{ formatDate(order.createdAt) }}
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <span
                :class="{
                  'px-2 py-1 rounded-full text-xs font-medium': true,
                  'bg-yellow-100 text-yellow-800': order.status === 'PENDING',
                  'bg-green-100 text-green-800': order.status === 'CONSUMED'
                }"
              >
                {{ getStatusLabel(order.status) }}
              </span>
              
              <button
                @click="copyOrderCode(order.code)"
                class="text-gray-400 hover:text-gray-600"
                title="کپی کد"
              >
                📋
              </button>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <div class="text-sm text-gray-600">مشتری:</div>
              <div class="font-medium">{{ maskPhone(order.customerPhone) }}</div>
            </div>
            
            <div>
              <div class="text-sm text-gray-600">تعداد آیتم‌ها:</div>
              <div class="font-medium">{{ order.itemCount || 0 }}</div>
            </div>
          </div>
          
          <div v-if="order.note" class="mb-3">
            <div class="text-sm text-gray-600">یادداشت:</div>
            <div class="text-sm text-gray-700">{{ order.note }}</div>
          </div>
          
          <!-- Actions for PENDING orders only -->
          <div v-if="order.status === 'PENDING'" class="flex gap-2">
            <button
              @click="copyOrderLink(order)"
              class="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
              title="کپی لینک"
            >
              📋 کپی لینک
            </button>
            
            <button
              @click="openOrderLink(order)"
              class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-200 rounded hover:bg-green-50"
              title="باز کردن لینک"
            >
              🔗 باز کردن
            </button>
            
            <button
              @click="sendOrderSMS(order)"
              class="text-purple-600 hover:text-purple-800 text-sm px-3 py-1 border border-purple-200 rounded hover:bg-purple-50"
              title="ارسال SMS"
            >
              📱 ارسال SMS
            </button>
          </div>
          
          <!-- Status display for non-PENDING orders -->
          <div v-else class="text-sm text-gray-500">
            {{ getStatusDescription(order.status) }}
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="hasMorePages" class="mt-6 flex justify-center space-x-2 rtl:space-x-reverse">
        <button 
          @click="previousPage"
          :disabled="filters.page <= 1"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          قبلی
        </button>
        <span class="px-4 py-2 text-sm text-gray-700">صفحه {{ filters.page }}</span>
        <button 
          @click="nextPage"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          بعدی
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  auth: true,
  layout: 'authenticated'
})

const { user } = useAuth()
const { show } = useToast()
const { post } = useApi()

// State
const loading = ref(false)
const error = ref('')
const orders = ref<any[]>([])
const hasMorePages = ref(false)

// Filters
const filters = ref({
  status: '',
  search: '',
  page: 1,
  pageSize: 20
})

// Fetch orders with stable key
const { data, pending, error: fetchError, refresh } = await useFetch(
  () => {
    const params = new URLSearchParams()
    if (filters.value.status) params.append('status', filters.value.status)
    if (filters.value.search) params.append('search', filters.value.search)
    params.append('page', filters.value.page.toString())
    params.append('pageSize', filters.value.pageSize.toString())
    
    return `/api/mechanic/orders?${params.toString()}`
  },
  {
    key: () => `mech-orders-${filters.value.status}-${filters.value.search}-${filters.value.page}-${filters.value.pageSize}`,
    default: () => ({ items: [], count: 0 }),
    watch: false
  }
)

// Watch data changes
watch(data, (newData: any) => {
  if (newData) {
    orders.value = newData.items || []
    hasMorePages.value = (newData.items || []).length === filters.value.pageSize
  }
}, { immediate: true })

// Watch loading and error
watch(pending, (newPending) => {
  loading.value = newPending
})

watch(fetchError, (newError) => {
  error.value = newError?.data?.statusMessage || newError?.message || 'خطا در بارگذاری'
})

// Methods
function applyFilters() {
  filters.value.page = 1
  refresh()
}

function debouncedSearch() {
  // Simple debounce - reset page and refresh after 500ms
  clearTimeout((window as any).searchTimeout)
  ;(window as any).searchTimeout = setTimeout(() => {
    filters.value.page = 1
    refresh()
  }, 500)
}

function nextPage() {
  filters.value.page++
  refresh()
}

function previousPage() {
  if (filters.value.page > 1) {
    filters.value.page--
    refresh()
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'در انتظار'
    case 'CONSUMED': return 'مصرف شده'
    case 'CANCELLED': return 'لغو شده'
    case 'EXPIRED': return 'منقضی شده'
    default: return status
  }
}

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 5) return '***'
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`
}

function formatDate(date: string | Date): string {
  return formatJalali(date)
}

function copyOrderCode(code: string) {
  navigator.clipboard.writeText(code)
    .then(() => show('کد سفارش کپی شد', 'success'))
    .catch(() => show('خطا در کپی کردن کد', 'error'))
}

function shareOrder(order: any) {
  const shareUrl = `${window.location.origin}/o/${order.code}`
  
  if (navigator.share) {
    navigator.share({
      title: 'سفارش جدید',
      text: `سفارش شما آماده است`,
      url: shareUrl
    }).catch(() => {
      // Fallback to copy
      copyShareUrl(shareUrl)
    })
  } else {
    copyShareUrl(shareUrl)
  }
}

function copyShareUrl(url: string) {
  navigator.clipboard.writeText(url)
    .then(() => show('لینک اشتراک‌گذاری کپی شد', 'success'))
    .catch(() => show('خطا در کپی کردن لینک', 'error'))
}

async function copyOrderLink(order: any) {
  const siteUrl = config.public.siteUrl || window.location.origin
  const shareUrl = `${siteUrl}/o/${order.code}`
  
  navigator.clipboard.writeText(shareUrl)
    .then(() => show('لینک سفارش کپی شد', 'success'))
    .catch(() => show('خطا در کپی کردن لینک', 'error'))
}

function openOrderLink(order: any) {
  const siteUrl = config.public.siteUrl || window.location.origin
  const shareUrl = `${siteUrl}/o/${order.code}`
  
  window.open(shareUrl, '_blank')
}

function getStatusDescription(status: string): string {
  switch (status) {
    case 'CONSUMED': return 'این سفارش قبلاً مصرف شده است'
    case 'CANCELLED': return 'این سفارش لغو شده است'
    case 'EXPIRED': return 'این سفارش منقضی شده است'
    default: return `وضعیت: ${getStatusLabel(status)}`
  }
}

async function sendOrderSMS(order: any) {
  try {
    const siteUrl = config.public.siteUrl || window.location.origin
    const shareUrl = `${siteUrl}/o/${order.code}`
    
    // Use post from useApi() to include CSRF token
    const response = await post('/api/notify/sms', {
      phone: order.customerPhone,
      text: `لینک سفارش شما: ${shareUrl}`
    })
    
    show('درخواست SMS ثبت شد', 'success')
    
  } catch (error: any) {
    console.error('SMS error:', error)
    show('خطا در ارسال SMS', 'error')
  }
}

// Runtime config
const config = useRuntimeConfig()

// Date utilities
import { formatJalali } from '~/utils/date'
</script>
