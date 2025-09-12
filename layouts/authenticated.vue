<script setup lang="ts">
import Sidebar from '~/components/navigation/Sidebar.vue'
const { user, hydrated, ensureAuth, logout } = useAuth()
const { show } = useToast()

// اطمینان از اینکه user data load شده
onMounted(async () => {
  if (!user.value) {
    await ensureAuth()
  }
  
  // Failsafe: اگر کاربر باید رمز تعیین کند و در صفحه درست نیست
  if (user.value?.mustChangePassword && !useRoute().path.includes('/onboarding/set-password')) {
    console.debug('[AUTH LAYOUT] Failsafe redirect to set password')
    await navigateTo('/onboarding/set-password')
  }
})

// Watch برای تغییرات user
watch(user, async (newUser) => {
  if (newUser?.mustChangePassword && !useRoute().path.includes('/onboarding/set-password')) {
    console.debug('[AUTH LAYOUT] Watch failsafe redirect to set password')
    await navigateTo('/onboarding/set-password')
  }
})

// State برای منوی کاربری
const isUserMenuOpen = ref(false)
// State برای سایدبار
const isSidebarOpen = ref(false)

// تابع برای بستن منو هنگام کلیک خارج از آن
function closeUserMenu() {
  isUserMenuOpen.value = false
}

// تابع برای نمایش پیام "به زودی"
function showComingSoon() {
  show('این قابلیت به زودی اضافه خواهد شد', 'info')
  closeUserMenu()
}

// تابع logout
async function handleLogout() {
  try {
    await logout()
    show('با موفقیت خارج شدید', 'success')
  } catch (err) {
    console.warn('Logout error', err)
    show('خطا در خروج از سیستم', 'error')
  }
}
</script>

<template>
  <div
    class="min-h-screen bg-white text-gray-900"
    :class="{ 'sm:pr-64': isSidebarOpen }"
    @click="closeUserMenu"
  >
    <Sidebar :open="isSidebarOpen" @close="isSidebarOpen = false" />
    <header class="border-b bg-gray-50">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click.stop="isSidebarOpen = !isSidebarOpen"
            class="p-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div class="font-bold">همکاری</div>
        </div>

        <!-- منوی کاربری -->
        <div v-if="user" class="relative">
          <button 
            @click.stop="isUserMenuOpen = !isUserMenuOpen"
            class="flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
              {{ user.fullName?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="text-right">
              <div class="font-medium">{{ user.fullName }}</div>
              <div class="text-xs text-gray-500">{{ user.role === 'MECHANIC' ? 'مکانیک' : user.role === 'VENDOR' ? 'فروشنده' : 'مدیر' }}</div>
            </div>
            <svg class="w-4 h-4 text-gray-400" :class="{ 'rotate-180': isUserMenuOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <!-- منوی آبشاری -->
          <div 
            v-if="isUserMenuOpen"
            @click.stop
            class="absolute left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50"
          >
            <div class="py-2">
              <!-- ویرایش پروفایل -->
              <NuxtLink 
                to="/profile/edit"
                @click="closeUserMenu"
                class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                ویرایش پروفایل
              </NuxtLink>

              <!-- تغییر رمز عبور -->
              <NuxtLink 
                to="/profile/change-password"
                @click="closeUserMenu"
                class="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                </svg>
                تغییر رمز عبور
              </NuxtLink>

              <!-- آمار و گزارش‌ها -->
              <button 
                @click="showComingSoon"
                class="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 transition-colors w-full text-right"
                disabled
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                آمار و گزارش‌ها
              </button>

              <!-- خط جداکننده -->
              <div class="border-t my-1"></div>

              <!-- خروج -->
              <button 
                @click="handleLogout"
                class="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-right"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                خروج
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
