import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

let schemaReady: Promise<void> | null = null

export async function getDb(): Promise<DrizzleD1Database | null> {
  const { env } = await import('cloudflare:workers')
  if (!env.DB) return null

  const db = drizzle(env.DB)
  await ensureSchema(env.DB)
  return db
}

async function ensureSchema(d1: D1Database) {
  if (!schemaReady) {
    schemaReady = initSchema(d1)
  }
  await schemaReady
}

async function initSchema(d1: D1Database) {
  const table = await d1
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'prompts'",
    )
    .first<{ name: string }>()

  if (table) {
    await ensureDraftColumn(d1)
    return
  }

  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS prompt_images (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      prompt_id integer NOT NULL,
      r2_key text NOT NULL,
      sort_order integer DEFAULT 0,
      created_at integer NOT NULL
    )`),
    d1.prepare(`CREATE TABLE IF NOT EXISTS prompts (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      title text NOT NULL,
      prompt text NOT NULL,
      negative_prompt text,
      model text NOT NULL,
      parameters text,
      tags text,
      draft integer DEFAULT 1 NOT NULL,
      created_at integer NOT NULL,
      updated_at integer NOT NULL
    )`),
  ])
}

async function ensureDraftColumn(d1: D1Database) {
  const columns = await d1
    .prepare('PRAGMA table_info(prompts)')
    .all<{ name: string }>()

  const hasDraft = columns.results?.some((column) => column.name === 'draft')
  if (hasDraft) return

  await d1
    .prepare(
      'ALTER TABLE prompts ADD COLUMN draft integer NOT NULL DEFAULT 0',
    )
    .run()
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