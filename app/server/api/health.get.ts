// server/api/health.get.ts
export default defineEventHandler(() => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    status: 'healthy'
  }
})
