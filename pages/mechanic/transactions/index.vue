<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">تراکنش‌ها</h1>
        <p class="mt-2 text-xl text-gray-600">سلام، {{ mechanicName }}</p>
      </div>

      <!-- Filters -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">فیلترها</h2>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">از تاریخ</label>
            <JalaliDatePicker 
              v-model="filters.from" 
              placeholder="1403-06-05 (شمسی)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">تا تاریخ</label>
            <JalaliDatePicker 
              v-model="filters.to" 
              placeholder="1403-06-05 (شمسی)"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">وضعیت</label>
            <select 
              v-model="filters.status" 
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">همه</option>
              <option value="PENDING">در انتظار</option>
              <option value="SETTLED">تسویه‌شده</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">صفحه</label>
            <input 
              v-model.number="filters.page" 
              type="number" 
              min="1"
              class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div class="flex items-end">
            <button 
              @click="applyFilters"
              :disabled="loading"
              class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <span v-if="loading">در حال بارگذاری...</span>
              <span v-else>اعمال فیلتر</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 6" :key="i" class="bg-white shadow rounded-lg p-6 animate-pulse">
          <div class="flex space-x-4">
            <div class="rounded-full bg-gray-200 h-12 w-12"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              <div class="h-4 bg-gray-200 rounded w-1/2"></div>
              <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="text-red-800 text-center">
          <p class="text-lg font-medium mb-2">خطا در بارگذاری</p>
          <p>{{ error }}</p>
        </div>
      </div>

      <!-- Transactions List -->
      <div v-else-if="transactions && transactions.length > 0" class="space-y-4">
        <!-- Summary -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <dt class="text-sm font-medium text-gray-500">تعداد تراکنش‌ها</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900">{{ transactions.length }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">جمع سهم مکانیک</dt>
              <dd class="mt-1 text-2xl font-semibold text-indigo-600">{{ formatCurrency(totalMechanic) }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">صفحه فعلی</dt>
              <dd class="mt-1 text-2xl font-semibold text-gray-900">{{ filters.page }}</dd>
            </div>
          </div>
        </div>

        <!-- Transactions Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="transaction in transactions" 
            :key="transaction.id" 
            class="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <!-- Header Row -->
            <div class="flex justify-between items-start mb-4">
              <div>
                <div class="text-sm text-gray-500">شماره تراکنش</div>
                <div class="font-semibold text-gray-900">#{{ transaction.id }}</div>
              </div>
              <div class="text-left">
                <span 
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    transaction.status === 'SETTLED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ transaction.status === 'SETTLED' ? 'تسویه‌شده' : 'در انتظار' }}
                </span>
              </div>
            </div>

            <!-- Date Row -->
            <div class="mb-4">
              <div class="text-sm text-gray-500">تاریخ ایجاد</div>
              <div class="font-medium text-gray-900">{{ formatDate(transaction.createdAt) }}</div>
            </div>

            <!-- Amounts Row -->
            <div class="space-y-2 mb-4">
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">مبلغ کل:</span>
                <span class="font-medium">{{ formatCurrency(transaction.amountTotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">مبلغ مشمول:</span>
                <span class="font-medium">{{ formatCurrency(transaction.amountEligible) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-500">سهم مکانیک:</span>
                <span class="font-bold text-indigo-600">{{ formatCurrency(transaction.mechanicAmount) }}</span>
              </div>
            </div>

            <!-- Vendor & Customer Row -->
            <div class="space-y-2 mb-4">
              <div>
                <div class="text-sm text-gray-500">فروشگاه</div>
                <div class="font-medium text-gray-900">{{ transaction.vendor }}</div>
              </div>
              <div v-if="transaction.customerPhone">
                <div class="text-sm text-gray-500">مشتری</div>
                <div class="font-medium text-gray-900">{{ transaction.customerPhone }}</div>
              </div>
              <div v-if="transaction.note">
                <div class="text-sm text-gray-500">یادداشت</div>
                <div class="text-sm text-gray-700">{{ transaction.note }}</div>
              </div>
            </div>

            <!-- QR Code (Optional) -->
            <div v-if="transaction.mechanicCode" class="mb-4">
              <div class="text-sm text-gray-500 mb-2">کد مکانیک</div>
              <div class="bg-gray-100 p-2 rounded text-center font-mono text-sm">{{ transaction.mechanicCode }}</div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="hasMorePages" class="flex justify-center space-x-2 rtl:space-x-reverse">
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

      <!-- Empty State -->
      <div v-else class="bg-white shadow rounded-lg p-12 text-center">
        <div class="text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <p class="text-lg mb-2">هیچ تراکنشی یافت نشد</p>
          <p class="text-sm">برای این فیلترها تراکنشی وجود ندارد.</p>
        </div>
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

// State
const loading = ref(false)
const error = ref('')
const transactions = ref<any[]>([])
const totalMechanic = ref(0)
const hasMorePages = ref(false)

// Filters
const filters = reactive({
  from: '',
  to: '',
  status: '',
  page: 1,
  pageSize: 20
})

// Computed
const mechanicName = computed(() => user.value?.fullName || 'نامشخص')

// Fetch transactions with stable key
const { data, pending, error: fetchError, refresh } = await useFetch(
  () => {
    const params = new URLSearchParams()
    if (filters.from) params.append('from', toISOFromJalaliInput(filters.from) || '')
    if (filters.to) params.append('to', toISOEndOfDayFromJalaliInput(filters.to) || '')
    if (filters.status) params.append('status', filters.status)
    params.append('page', filters.page.toString())
    params.append('pageSize', filters.pageSize.toString())
    
    return `/api/mechanic/transactions?${params.toString()}`
  },
  {
    key: () => `mech-tx-${filters.status}-${filters.from}-${filters.to}-${filters.page}-${filters.pageSize}`,
    default: () => ({ items: [], count: 0, totalMechanic: 0 }),
    watch: false
  }
)

// Watch data changes
watch(data, (newData) => {
  if (newData) {
    transactions.value = newData.items || []
    totalMechanic.value = newData.totalMechanic || 0
    hasMorePages.value = (newData.items || []).length === filters.pageSize
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
  filters.page = 1 // Reset to first page
  refresh()
}

function nextPage() {
  filters.page++
  refresh()
}

function previousPage() {
  if (filters.page > 1) {
    filters.page--
    refresh()
  }
}

// Date utilities
import { toISOFromJalaliInput, toISOEndOfDayFromJalaliInput, formatJalali } from '~/utils/date'
import JalaliDatePicker from '~/components/JalaliDatePicker.vue'

function formatDate(date: string | Date): string {
  return formatJalali(date)
}

function formatCurrency(amount: any): string {
  if (!amount) return '0 تومان'
  const num = typeof amount === 'object' && amount.toNumber ? amount.toNumber() : Number(amount)
  return num.toLocaleString('fa-IR') + ' تومان'
}
</script>
