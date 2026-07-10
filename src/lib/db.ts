import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

export async function getDb(): Promise<DrizzleD1Database | null> {
  const { env } = await import('cloudflare:workers')
  if (!env.DB) return null

  return drizzle(env.DB)
}

export function formatDbError(error: unknown): string {
  if (!(error instanceof Error)) return '保存失败，请重试'

  const cause = error.cause
  if (cause instanceof Error && cause.message) {
    if (cause.message.includes('no such table')) {
      return '数据库未初始化，请运行 pnpm db:setup:local 后重启开发服务器'
    }
    if (cause.message.includes('SQLITE_BUSY')) {
      return '数据库繁忙，请稍后重试'
    }
    return cause.message
  }

  if (error.message.includes('Failed query')) {
    return '数据库写入失败，请确认已运行 pnpm db:setup:local'
  }

  return error.message || '保存失败，请重试'
}
