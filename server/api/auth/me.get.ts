// server/api/auth/me.get.ts
import { prisma } from '../../utils/db'
import { verifyAccessToken, isTokenExpired } from '../../utils/tokens'
import { createRequestLogger } from '../../utils/logger'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const requestId = randomUUID()
  const logger = createRequestLogger(requestId)
  
  logger.info('Me endpoint called')
  
  // Try to get token from Authorization header first
  let token = getHeader(event, 'authorization')
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7)
  } else {
    // If no Authorization header, try to get from cookie
    token = getCookie(event, 'at')
  }
  
  if (!token) {
    logger.error('No token found in header or cookie')
    throw createError({ statusCode: 401, statusMessage: 'No token provided' })
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    logger.info('Access token expired, attempting refresh')
    
    // Try to refresh the token
    try {
      const refreshResponse = await $fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Cookie': getHeader(event, 'cookie') || ''
        }
      })
      
      // Get the new token from the response headers or cookies
      const newToken = getCookie(event, 'at')
      if (newToken) {
        token = newToken
        logger.info('Token refreshed successfully')
      } else {
        logger.error('Failed to get new token after refresh')
        throw createError({ statusCode: 401, statusMessage: 'Token refresh failed' })
      }
    } catch (refreshError: any) {
      logger.error('Token refresh failed', { error: refreshError?.message || 'Unknown error' })
      console.error('[ME API] Token refresh failed:', refreshError)
      throw createError({ statusCode: 401, statusMessage: 'Token refresh failed' })
    }
  }
  
  // Verify the token
  const payload = verifyAccessToken(token)
  if (!payload) {
    logger.error('Invalid token')
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
  
  // Get user from database
  const user = await prisma.user.findUnique({ 
    where: { id: payload.userId },
    select: { id: true, role: true, fullName: true, phone: true }
  })
  
  if (!user) {
    logger.error('User not found', { userId: payload.userId })
    throw createError({ statusCode: 401, statusMessage: 'User not found' })
  }
  
  logger.info('User authenticated successfully', { userId: user.id, role: user.role })
  
  return { 
    user: { 
      id: user.id, 
      role: user.role, 
      fullName: user.fullName, 
      phone: user.phone 
    } 
  }
})
