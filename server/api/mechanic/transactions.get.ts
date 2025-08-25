// server/api/mechanic/transactions.get.ts
import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/db'
import { requireAuth } from '../../utils/auth'
import { decimalToNumber } from '../../utils/decimal'

export default defineEventHandler(async (event) => {
  console.log('[MECHANIC API] Request started')
  
  try {
    // بررسی اتصال به پایگاه داده
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('[MECHANIC API] Database connection OK')
    } catch (dbError) {
      console.error('[MECHANIC API] Database connection failed:', dbError)
      throw createError({ 
        statusCode: 500, 
        statusMessage: 'خطا در اتصال به پایگاه داده' 
      })
    }
    
    const auth = await requireAuth(event, ['MECHANIC'])
    console.log('[MECHANIC API] Auth successful:', { userId: auth.id, role: auth.role })

    const mech = await prisma.mechanic.findUnique({ where: { userId: auth.id } })
    if (!mech) {
      console.log('[MECHANIC API] Mechanic not found for userId:', auth.id)
      throw createError({ statusCode: 403, statusMessage: 'Mechanic not found' })
    }
    console.log('[MECHANIC API] Mechanic found:', { mechanicId: mech.id, code: mech.code })

    // دریافت query parameters
    const query = getQuery(event)
    const { from, to, status } = query
    console.log('[MECHANIC API] Query params:', { from, to, status })

    // ساخت where clause
    const where: any = { mechanicId: mech.id }
    
    // فیلتر تاریخ
    if (from || to) {
      where.createdAt = {}
      if (from) {
        try {
          where.createdAt.gte = new Date(from as string)
        } catch (dateError) {
          console.error('[MECHANIC API] Invalid from date:', from, dateError)
          throw createError({ 
            statusCode: 400, 
            statusMessage: 'تاریخ شروع نامعتبر است' 
          })
        }
      }
      if (to) {
        try {
          const toDate = new Date(to as string)
          toDate.setHours(23, 59, 59, 999) // تا آخر روز
          where.createdAt.lte = toDate
        } catch (dateError) {
          console.error('[MECHANIC API] Invalid to date:', to, dateError)
          throw createError({ 
            statusCode: 400, 
            statusMessage: 'تاریخ پایان نامعتبر است' 
          })
        }
      }
    }
    
    // فیلتر وضعیت
    if (status && status !== '') {
      where.status = status
    }

    console.log('[MECHANIC API] Where clause:', JSON.stringify(where))

    // دریافت تراکنش‌ها
    let items
    try {
      items = await prisma.transaction.findMany({
        where,
        orderBy: { id: 'desc' },
        include: {
          commission: true,
          vendor: { select: { id: true, user: { select: { fullName: true } } } },
        },
      })
      console.log('[MECHANIC API] Found transactions:', items.length)
    } catch (queryError) {
      console.error('[MECHANIC API] Database query failed:', queryError)
      throw createError({ 
        statusCode: 500, 
        statusMessage: 'خطا در دریافت اطلاعات از پایگاه داده' 
      })
    }

    // محاسبه مجموع سهم مکانیک
    const totalMechanic = items.reduce((sum, item) => {
      return sum + decimalToNumber(item.commission?.mechanicAmount)
    }, 0)

    // ساخت response
    const result = {
      items: items.map(item => ({
        id: item.id,
        createdAt: item.createdAt,
        vendor: item.vendor.user.fullName,
        status: item.status,
        amountTotal: item.amountTotal,
        amountEligible: item.amountEligible,
        mechanicAmount: item.commission?.mechanicAmount || 0
      })),
      count: items.length,
      totalMechanic
    }

    console.log('[MECHANIC API] Response prepared:', { count: result.count, totalMechanic: result.totalMechanic })
    return result
    
  } catch (error: any) {
    console.error('[MECHANIC API] Error:', error)
    // اگر error قبلاً createError شده، آن را دوباره throw نکن
    if (error.statusCode) {
      throw error
    }
    // در غیر این صورت، یک error عمومی ایجاد کن
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'خطای داخلی سرور' 
    })
  }
})
