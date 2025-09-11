// Helper function to mask phone number
function maskPhone(phone: string): string {
  if (!phone || phone.length <= 5) return '***'
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`
}

// PROD: Auth middleware with RBAC and minimal logging for production
export default defineNuxtRouteMiddleware(async (to) => {
  // Allowlist صفحات عمومی (بدون لاگین)
  const publicPaths = [
    '/',
    '/login',
    '/403',
    '/404'
  ]
  
  const publicPrefixes = [
    '/o/',
    '/invite/'
  ]
  
  // بررسی allowlist
  if (publicPaths.includes(to.path) || to.meta.auth === false) {
    return
  }
  
  // بررسی prefix های عمومی
  if (publicPrefixes.some(prefix => to.path.startsWith(prefix))) {
    return
  }

  const user = useState<any>('auth:user', () => null)
  const hydrated = useState<boolean>('auth:hydrated', () => false)

  // فقط یک بار هیدریت شویم
  if (!hydrated.value) {
    try {
      // نکتهٔ مهم: روی سرور، کوکی‌های درخواستِ کاربر را به /me پاس بده
      const headers = process.server ? (useRequestHeaders(['cookie']) as Record<string, string>) : undefined
      const res: any = await $fetch('/api/auth/me', { headers })
      user.value = res?.user ?? null
    } catch (error: any) {
      // فقط خطاهای غیر از 401 را log کنیم (401 طبیعی است)
      if (error?.statusCode !== 401) {
        console.error('[AUTH MIDDLEWARE] /me error:', error)
      }
      user.value = null
    } finally {
      hydrated.value = true
    }
  }

  // اگر کاربر لاگین نشده و صفحه نیازمند auth است
  if (!user.value && (to.meta.auth === true || isProtectedPath(to.path))) {
    return navigateTo('/login')
  }

  // اگر کاربر لاگین شده و به /login می‌رود، redirect به هاب مناسب
  if (to.path === '/login' && user.value) {
    return redirectToRoleHub(user.value.role)
  }

  // اگر کاربر لاگین شده و باید رمز اولیه تعیین کند
  if (user.value && user.value.mustChangePassword) {
    console.debug('[MW] mustChangePassword', user.value?.mustChangePassword, to.path)
    
    // مسیرهای مجاز برای کاربران با mustChangePassword=true
    const allowedPaths = [
      '/onboarding/set-password',
      '/logout',
      '/api/auth/password/set-initial',
      '/api/auth/logout',
      '/api/auth/me'
    ]
    
    // اگر به مسیر مجاز می‌رود، اجازه بده
    if (allowedPaths.includes(to.path)) {
      return
    }
    
    // در غیر این صورت، به صفحه تعیین رمز هدایت کن
    return navigateTo('/onboarding/set-password')
  }

  // RBAC: بررسی دسترسی بر اساس نقش
  if (user.value) {
    const hasAccess = checkRoleAccess(to, user.value.role)
    if (!hasAccess) {
      return navigateTo('/403')
    }
  }
})

// تابع کمکی برای تشخیص مسیرهای محافظت‌شده
function isProtectedPath(path: string): boolean {
  return path.startsWith('/admin/') || 
         path.startsWith('/vendor/') || 
         path.startsWith('/mechanic/')
}

// تابع کمکی برای redirect به هاب نقش
function redirectToRoleHub(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'VENDOR':
      return '/vendor'
    case 'MECHANIC':
      return '/mechanic'
    default:
      return '/'
  }
}

// تابع کمکی برای بررسی دسترسی نقش
function checkRoleAccess(to: any, userRole: string): boolean {
  // اگر صفحه roles مشخص کرده، از آن استفاده کن
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    return to.meta.roles.includes(userRole)
  }
  
  // در غیر این صورت، از prefix mapping استفاده کن
  if (to.path.startsWith('/admin/')) {
    return userRole === 'ADMIN'
  }
  if (to.path.startsWith('/vendor/')) {
    return userRole === 'VENDOR'
  }
  if (to.path.startsWith('/mechanic/')) {
    return userRole === 'MECHANIC'
  }
  
  // برای سایر مسیرها، دسترسی مجاز است
  return true
}
