import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const prompts = sqliteTable('prompts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  negative_prompt: text('negative_prompt'),
  model: text('model').notNull(),
  parameters: text('parameters'), // JSON string
  tags: text('tags'), // comma separated
  draft: integer('draft', { mode: 'boolean' }).notNull().default(true),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const prompt_images = sqliteTable('prompt_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  prompt_id: integer('prompt_id').notNull(),
  r2_key: text('r2_key').notNull(),
  thumbnail_r2_key: text('thumbnail_r2_key'),
  sort_order: integer('sort_order').default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
})
