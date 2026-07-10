import { createServerFn } from '@tanstack/react-start'
import { asc, desc, eq, like, or } from 'drizzle-orm'
import { z } from 'zod'

import { authMiddleware } from '@/lib/auth.middleware'
import { formatDbError, getDb } from '@/lib/db'
import { logError } from '@/lib/utils'

import { categories } from '../../drizzle/schema'

const categoryInputSchema = z.object({
  name: z.string().trim().min(1, '分类名称不能为空').max(50, '分类名称不能超过 50 个字符'),
  description: z
    .string()
    .trim()
    .max(200, '描述不能超过 200 个字符')
    .optional()
    .transform((value) => value || undefined),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
})

const categorySearchSchema = z.object({
  keyword: z.string().optional(),
})

export type CategoryItem = {
  id: number
  name: string
  description: string | null
  sort_order: number
  created_at: Date
  updated_at: Date
}

export const NO_CATEGORY_VALUE = 'none'

export function buildCategorySelectOptions(categories: CategoryItem[]) {
  return [
    { value: NO_CATEGORY_VALUE, label: '未分类' },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ]
}

export function buildCategoryFilterOptions(categories: CategoryItem[]) {
  return [
    { value: 'all', label: '全部分类' },
    { value: NO_CATEGORY_VALUE, label: '未分类' },
    ...categories.map((category) => ({
      value: String(category.id),
      label: category.name,
    })),
  ]
}

async function queryCategories(keyword?: string): Promise<CategoryItem[]> {
  const db = await getDb()
  if (!db) return []

  const normalizedKeyword = keyword?.trim()
  return db
    .select()
    .from(categories)
    .where(
      normalizedKeyword
        ? or(
            like(categories.name, `%${normalizedKeyword}%`),
            like(categories.description, `%${normalizedKeyword}%`),
          )
        : undefined,
    )
    .orderBy(asc(categories.sort_order), desc(categories.created_at))
}

export const listCategoriesFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CategoryItem[]> => {
    try {
      return await queryCategories()
    } catch (error) {
      logError('Failed to list public categories', error)
      throw new Error(formatDbError(error))
    }
  },
)

export const listCategoriesAdminFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((input: unknown) => categorySearchSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<CategoryItem[]> => {
    try {
      return await queryCategories(data.keyword)
    } catch (error) {
      logError('Failed to list categories', error, { keyword: data.keyword })
      throw new Error(formatDbError(error))
    }
  })

export const createCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: unknown) => categoryInputSchema.parse(input))
  .handler(async ({ data }): Promise<CategoryItem> => {
    try {
      const db = await getDb()
      if (!db) throw new Error('数据库未初始化，请运行 pnpm db:setup:local')

      const now = new Date()
      const [created] = await db
        .insert(categories)
        .values({
          name: data.name,
          description: data.description ?? null,
          sort_order: data.sort_order,
          created_at: now,
          updated_at: now,
        })
        .returning()

      if (!created) throw new Error('创建分类失败')
      return created
    } catch (error) {
      logError('Failed to create category', error, { name: data.name })
      throw new Error(formatDbError(error))
    }
  })

export const updateCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    categoryInputSchema.extend({ id: z.coerce.number().int().positive() }).parse(input),
  )
  .handler(async ({ data }): Promise<CategoryItem> => {
    try {
      const db = await getDb()
      if (!db) throw new Error('数据库未初始化，请运行 pnpm db:setup:local')

      const [updated] = await db
        .update(categories)
        .set({
          name: data.name,
          description: data.description ?? null,
          sort_order: data.sort_order,
          updated_at: new Date(),
        })
        .where(eq(categories.id, data.id))
        .returning()

      if (!updated) throw new Error('分类不存在')
      return updated
    } catch (error) {
      logError('Failed to update category', error, { id: data.id, name: data.name })
      throw new Error(formatDbError(error))
    }
  })

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: z.coerce.number().int().positive() }).parse(input))
  .handler(async ({ data }): Promise<{ success: true }> => {
    try {
      const db = await getDb()
      if (!db) throw new Error('数据库未初始化，请运行 pnpm db:setup:local')

      const [deleted] = await db
        .delete(categories)
        .where(eq(categories.id, data.id))
        .returning({ id: categories.id })

      if (!deleted) throw new Error('分类不存在')
      return { success: true }
    } catch (error) {
      logError('Failed to delete category', error, { id: data.id })
      throw new Error(formatDbError(error))
    }
  })
