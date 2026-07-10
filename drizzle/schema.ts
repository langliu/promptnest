import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const prompts = sqliteTable('prompts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  prompt: text('prompt').notNull(),
  negative_prompt: text('negative_prompt'),
  model: text('model').notNull(),
  parameters: text('parameters'), // JSON string
  tags: text('tags'), // comma separated
  category_id: integer('category_id').references(() => categories.id),
  starred: integer('starred', { mode: 'boolean' }).notNull().default(false),
  copy_count: integer('copy_count').notNull().default(0),
  last_copied_at: integer('last_copied_at', { mode: 'timestamp' }),
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
