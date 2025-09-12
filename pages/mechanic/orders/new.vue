<template>
  <div>
    <div class="max-w-2xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">سفارش جدید</h1>
        <p class="mt-2 text-gray-600">ایجاد سفارش جدید با QR آنلاین</p>
      </div>

      <AppCard title="ساخت سفارش جدید">
        <!-- فرم ساخت سفارش -->
        <form v-if="!orderCreated" @submit.prevent="createOrder" novalidate>
          <!-- شماره تلفن مشتری -->
          <div class="mb-4">
            <AppInput
              v-model="form.customerPhone"
              label="شماره تلفن مشتری"
              type="tel"
              placeholder="09120000000"
              :error="errors.customerPhone"
              required
            />
          </div>

          <!-- یادداشت -->
          <div class="mb-4">
            <AppInput
              v-model="form.note"
              label="یادداشت (اختیاری)"
              type="text"
              placeholder="توضیحات اضافی..."
            />
          </div>

          <!-- آیتم‌ها -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              آیتم‌های سفارش *
            </label>
            
            <div v-for="(item, index) in form.items" :key="index" class="border rounded-lg p-4 mb-3 bg-gray-50">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <AppInput
                  v-model="item.title"
                  label="عنوان آیتم"
                  placeholder="نام قطعه یا سرویس"
                  :error="getItemError(index, 'title')"
                  required
                />
                
                <AppInput
                  v-model.number="item.quantity"
                  label="تعداد"
                  type="number"
                  min="1"
                  :error="getItemError(index, 'quantity')"
                  required
                />
                
                <AppInput
                  v-model="item.note"
                  label="یادداشت (اختیاری)"
                  placeholder="توضیحات آیتم"
                />
              </div>
              
              <div class="mt-2 flex justify-end">
                <button
                  v-if="form.items.length > 1"
                  type="button"
                  @click="removeItem(index)"
                  class="text-red-600 hover:text-red-800 text-sm"
                >
                  حذف آیتم
                </button>
              </div>
            </div>

            <button
              type="button"
              @click="addItem"
              class="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
            >
              + افزودن آیتم
            </button>
          </div>

          <!-- خطاهای کلی -->
          <AppAlert v-if="generalError" :message="generalError" variant="error" class="mb-4" />

          <!-- دکمه ارسال -->
          <AppButton
            type="submit"
            :loading="loading"
            loading-text="در حال ایجاد سفارش..."
            class="w-full"
            :disabled="!isFormValid"
          >
            ایجاد سفارش
          </AppButton>
        </form>

        <!-- نمایش سفارش ایجاد شده -->
        <div v-else class="text-center">
          <div class="mb-6">
            <div class="text-green-600 text-lg font-semibold mb-2">
              ✅ سفارش با موفقیت ایجاد شد!
            </div>
            <div class="text-gray-600">
              کد سفارش: <span class="font-mono text-lg">{{ orderData.code }}</span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="mb-6">
            <div class="text-sm text-gray-600 mb-2">QR Code سفارش:</div>
            <div v-if="!isClient" class="text-gray-500">در حال بارگذاری...</div>
            <div v-else ref="qrContainer" class="flex justify-center"></div>
          </div>

          <!-- لینک اشتراک‌گذاری -->
          <div class="mb-6">
            <div class="text-sm text-gray-600 mb-2">لینک اشتراک‌گذاری:</div>
            <div class="flex items-center gap-2 justify-center">
              <input
                :value="orderData.shareUrl"
                readonly
                class="flex-1 px-3 py-2 border rounded text-sm font-mono bg-gray-50"
              />
              <AppButton
                @click="copyLink"
                size="sm"
                variant="secondary"
              >
                کپی
              </AppButton>
              <AppButton
                @click="openLink"
                size="sm"
                variant="secondary"
              >
                باز کردن
              </AppButton>
            </div>
          </div>

          <!-- دکمه‌های عملیات -->
          <div class="flex gap-3 justify-center">
            <AppButton
              @click="sendSMS"
              :loading="smsLoading"
              loading-text="در حال ارسال..."
              variant="secondary"
            >
              ارسال SMS
            </AppButton>
            
            <AppButton
              @click="createNewOrder"
              variant="outline"
            >
              سفارش جدید
            </AppButton>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ auth: true })

// State
const form = ref({
  customerPhone: '',
  note: '',
  items: [{ title: '', quantity: 1, note: '' }]
})

const errors = ref<Record<string, string>>({})
const generalError = ref('')
const loading = ref(false)
const orderCreated = ref(false)
const orderData = ref<{ code: string; shareUrl: string } | null>(null)
const smsLoading = ref(false)
const isClient = ref(false)
const qrContainer = ref<HTMLElement>()

// Composables
const { post } = useApi()
const { show: showToast } = useToast()

// Validation
const isFormValid = computed(() => {
  return form.value.customerPhone.trim() && 
         form.value.items.every(item => item.title.trim() && item.quantity > 0)
})

function getItemError(index: number, field: string): string {
  const item = form.value.items[index]
  if (!item) return ''
  
  if (field === 'title' && !item.title.trim()) {
    return 'عنوان آیتم الزامی است'
  }
  if (field === 'quantity' && item.quantity < 1) {
    return 'تعداد باید حداقل 1 باشد'
  }
  return ''
}

// Methods
function addItem() {
  form.value.items.push({ title: '', quantity: 1, note: '' })
}

function removeItem(index: number) {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

async function createOrder() {
  // Clear previous errors
  errors.value = {}
  generalError.value = ''
  
  // Validate form
  if (!isFormValid.value) {
    generalError.value = 'لطفاً تمام فیلدهای الزامی را پر کنید'
    return
  }
  
  loading.value = true
  
  try {
    const response = await post('/api/orders', {
      customerPhone: form.value.customerPhone.trim(),
             note: form.value.note?.trim() || undefined,
      items: form.value.items.map(item => ({
        title: item.title.trim(),
        quantity: item.quantity,
        note: item.note?.trim() || undefined
      }))
    })
    
    if (response.ok) {
      orderData.value = response.order
      orderCreated.value = true
      showToast('سفارش با موفقیت ایجاد شد!', 'success')
    } else {
      throw new Error(response.message || 'خطا در ایجاد سفارش')
    }
    
  } catch (error: any) {
    console.error('Order creation error:', error)
    
    if (error.statusCode === 429) {
      generalError.value = 'تلاش زیادی انجام شده. لطفاً کمی صبر کنید.'
    } else if (error.statusCode === 400) {
      generalError.value = error.data?.statusMessage || 'داده‌های وارد شده نامعتبر است'
    } else if (error.statusCode === 403) {
      generalError.value = 'شما مجاز به ایجاد سفارش نیستید'
    } else {
      generalError.value = 'خطا در ایجاد سفارش. لطفاً دوباره تلاش کنید.'
    }
  } finally {
    loading.value = false
  }
}

async function sendSMS() {
  if (!orderData.value) return
  
  smsLoading.value = true
  
  try {
    const response = await post('/api/notify/sms', {
      phone: form.value.customerPhone,
      text: `لینک سفارش شما: ${orderData.value.shareUrl}`
    })
    
    if (response.ok) {
      showToast('درخواست SMS ثبت شد', 'success')
    } else {
      throw new Error(response.message || 'خطا در ارسال SMS')
    }
    
  } catch (error: any) {
    console.error('SMS error:', error)
    showToast('خطا در ارسال SMS', 'error')
  } finally {
    smsLoading.value = false
  }
}

function copyLink() {
  if (!orderData.value) return
  
  navigator.clipboard.writeText(orderData.value.shareUrl)
    .then(() => showToast('لینک کپی شد', 'success'))
    .catch(() => showToast('خطا در کپی کردن لینک', 'error'))
}

function openLink() {
  if (!orderData.value) return
  window.open(orderData.value.shareUrl, '_blank')
}

function createNewOrder() {
  // Reset form
  form.value = {
    customerPhone: '',
    note: '',
    items: [{ title: '', quantity: 1, note: '' }]
  }
  errors.value = {}
  generalError.value = ''
  orderCreated.value = false
  orderData.value = null
}

// QR Code generation (client-only)
onMounted(() => {
  isClient.value = true
  
  // Generate QR code if order is created
  if (orderCreated.value && orderData.value && qrContainer.value) {
    generateQRCode()
  }
})

watch(orderCreated, (newValue) => {
  if (newValue && orderData.value && qrContainer.value && isClient.value) {
    nextTick(() => generateQRCode())
  }
})

async function generateQRCode() {
  if (!orderData.value || !qrContainer.value) return
  
  try {
    // Dynamic import for QR code library (client-only)
    const QRCode = (await import('qrcode')).default
    
    // Clear previous QR
    qrContainer.value.innerHTML = ''
    
    // Generate QR code
    const canvas = await QRCode.toCanvas(orderData.value.shareUrl, {
      width: 200,
      margin: 2
    })
    
    qrContainer.value.appendChild(canvas)
    
  } catch (error) {
    console.error('QR generation error:', error)
    qrContainer.value.innerHTML = '<div class="text-red-500">خطا در تولید QR</div>'
  }
}
</script>
