<template>
  <div :key="String($route.fullPath)" class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Breadcrumbs -->
      <Breadcrumbs :items="[
        { label: 'خانه فروشگاه', to: '/vendor' },
        { label: 'تسویه‌ها', to: '/vendor/settlements' },
        { label: `#${settlementId}` }
      ]" />

        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">جزئیات تسویه</h1>
          <p class="mt-2 text-gray-600">شناسه: {{ settlementId }}</p>
        </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="text-gray-500">در حال بارگذاری...</div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="text-red-800">{{ error }}</div>
      </div>

      <!-- Settlement Details -->
      <div v-if="settlement" class="space-y-6">
        <!-- Debug Info - Only in development -->
        <div v-if="config.public.debug" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h3 class="text-sm font-medium text-yellow-800 mb-2">اطلاعات Debug:</h3>
          <pre class="text-xs text-yellow-700">{{ JSON.stringify(settlement, null, 2) }}</pre>
        </div>
        <!-- Summary Card -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">خلاصه تسویه</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt class="text-sm font-medium text-gray-500">دوره</dt>
              <dd class="mt-1 text-lg text-gray-900">
                {{ formatDate(settlement.periodFrom) }} تا {{ formatDate(settlement.periodTo) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">وضعیت</dt>
              <dd class="mt-1">
                <span 
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    settlement.status === 'PAID' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ settlement.status === 'PAID' ? 'پرداخت شده' : 'باز' }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">تاریخ ایجاد</dt>
              <dd class="mt-1 text-lg text-gray-900">
                {{ formatDate(settlement.createdAt) }}
              </dd>
            </div>
          </div>
        </div>

        <!-- Totals Card -->
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">مجموع‌ها</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt class="text-sm font-medium text-gray-500">مبلغ کل مشمول</dt>
              <dd class="mt-1 text-2xl font-bold text-gray-900">
                {{ formatNumber(settlement.totals.eligible) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">سهم مکانیک</dt>
              <dd class="mt-1 text-2xl font-bold text-blue-600">
                {{ formatNumber(settlement.totals.mechanic) }}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">سهم پلتفرم</dt>
              <dd class="md-1 text-2xl font-bold text-green-600">
                {{ formatNumber(settlement.totals.platform) }}
              </dd>
            </div>
          </div>
        </div>

        <!-- Transactions List -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">تراکنش‌های تسویه</h3>
            <p class="text-sm text-gray-500 mt-1">تعداد: {{ settlement.items?.length || 0 }}</p>
          </div>
          
          <div v-if="!settlement.items?.length" class="p-6 text-center text-gray-500">
            تراکنشی یافت نشد.
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شناسه</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ کل</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مبلغ مشمول</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سهم مکانیک</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">سهم پلتفرم</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in settlement.items" :key="item.txId" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ item.txId }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(item.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(item.amounts?.total) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatNumber(item.amounts?.eligible) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                    {{ formatNumber(item.amounts?.mechanic) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {{ formatNumber(item.amounts?.platform) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatJalali } from '~/utils/date'

const route = useRoute()
const config = useRuntimeConfig() // اضافه کردن runtime config

// 1) کلید صفحه را وابسته به id کن
definePageMeta({
  auth: true,
  layout: 'authenticated',
  key: (r) => `vendor-settlement-${r.params.id}`,
})

const { user } = useAuth()

// Type definitions برای settlement
interface SettlementItem {
  txId: number
  createdAt: string | Date
  customerPhone: string
  note: string
  mechanic: {
    id: number
    name: string
    code: string
  }
  amounts: {
    total: number
    eligible: number
    mechanic: number
    platform: number
  }
  commission: {
    rateMechanic: number
    ratePlatform: number
  } | null
}

interface Settlement {
  id: number
  vendor: {
    id: number
    name: string
    city: string | null
  }
  periodFrom: string | Date
  periodTo: string | Date
  totals: {
    eligible: number
    mechanic: number
    platform: number
  }
  status: string
  createdAt: string | Date
  paidAt: string | Date | null
  items: SettlementItem[]
}

// 2) useFetch را وابسته به id کن (هم url داینامیک، هم key)
const { data: settlement, pending: loading, error, refresh } = await useFetch<Settlement>(
  () => `/api/settlements/${route.params.id}`,
  {
    key: () => `fetch-settlement-${route.params.id}`,
  }
)

// Computed
const settlementId = computed(() => route.params.id as string)

// Methods
function formatDate(date: string | Date): string {
  return formatJalali(date)
}

function formatNumber(value: any): string {
  if (!value) return '0'
  const num = typeof value === 'object' && value.toNumber ? value.toNumber() : Number(value)
  return num.toLocaleString('fa-IR')
}

// 3) اگر جایی نیاز شد، تغییر id را watch و refresh کن
watch(() => route.params.id, () => {
  refresh()
})
</script>
