import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { authMiddleware } from '@/lib/auth.middleware'
import { NO_CATEGORY_VALUE } from '@/lib/categories.functions'
import { formatDbError, getDb } from '@/lib/db'
import {
  buildPromptImageKeys,
  getImageUrl,
  getThumbnailKey,
  getThumbnailUrl,
  MAX_PROMPT_IMAGES,
  validateImageFile,
} from '@/lib/images'
import { modelIdSchema } from '@/lib/models'
import { formatPromptTags } from '@/lib/prompt-tags'
import { logError } from '@/lib/utils'

import { categories, prompt_images, prompts } from '../../drizzle/schema'

function parseCategoryId(raw: FormDataEntryValue | null): number | null {
  const value = raw?.toString().trim()
  if (!value || value === NO_CATEGORY_VALUE) return null

  const parsed = z.coerce.number().int().positive('无效的分类').safeParse(value)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? '无效的分类')
  }

  return parsed.data
}

async function resolveCategoryId(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  categoryId: number | null,
) {
  if (categoryId === null) return null

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1)

  if (!category) {
    throw new Error('所选分类不存在')
  }

  return categoryId
}

const ADMIN_PROMPTS_PAGE_SIZE = 20
const GALLERY_PAGE_SIZE = 24

async function getR2() {
  const { env } = await import('cloudflare:workers')
  return env.IMAGES ?? null
}

function parseCreatePromptFormData(data: FormData) {
  const title = data.get('title')?.toString().trim() ?? ''
  const prompt = data.get('prompt')?.toString().trim() ?? ''
  const negative_prompt = data.get('negative_prompt')?.toString().trim() ?? ''
  const model = data.get('model')?.toString() ?? ''
  const tags = data.get('tags')?.toString().trim() ?? ''
  const normalizedTags = formatPromptTags(tags)
  const category_id = parseCategoryId(data.get('category_id'))

  const parsed = z
    .object({
      title: z.string().min(1, '标题不能为空'),
      prompt: z.string().min(1, '正向 Prompt 不能为空'),
      negative_prompt: z.string().optional(),
      model: modelIdSchema,
      tags: z.string().optional(),
      category_id: z.number().int().positive().nullable(),
    })
    .parse({
      title,
      prompt,
      negative_prompt: negative_prompt || undefined,
      model,
      tags: normalizedTags || undefined,
      category_id,
    })

  const imageFiles = data.getAll('images').filter((entry): entry is File => entry instanceof File)
  const thumbnailFiles = data
    .getAll('thumbnails')
    .map((entry) => (entry instanceof File && entry.size > 0 ? entry : null))

  if (imageFiles.length > MAX_PROMPT_IMAGES) {
    throw new Error(`最多上传 ${MAX_PROMPT_IMAGES} 张图片`)
  }

  for (const file of imageFiles) {
    const error = validateImageFile(file)
    if (error) throw new Error(error)
  }
  for (const file of thumbnailFiles) {
    if (!file) continue
    const error = validateImageFile(file)
    if (error) throw new Error(error)
  }

  return { ...parsed, imageFiles, thumbnailFiles }
}

function parseUpdatePromptFormData(data: FormData) {
  const id = Number(data.get('id'))
  const title = data.get('title')?.toString().trim() ?? ''
  const prompt = data.get('prompt')?.toString().trim() ?? ''
  const negative_prompt = data.get('negative_prompt')?.toString().trim() ?? ''
  const model = data.get('model')?.toString() ?? ''
  const tags = data.get('tags')?.toString().trim() ?? ''
  const normalizedTags = formatPromptTags(tags)
  const removeImageIdsRaw = data.get('removeImageIds')?.toString().trim() ?? ''
  const imageOrderRaw = data.get('imageOrder')?.toString().trim() ?? ''
  const category_id = parseCategoryId(data.get('category_id'))

  const parsed = z
    .object({
      id: z.number().int().positive('无效的 Prompt ID'),
      title: z.string().min(1, '标题不能为空'),
      prompt: z.string().min(1, '正向 Prompt 不能为空'),
      negative_prompt: z.string().optional(),
      model: modelIdSchema,
      tags: z.string().optional(),
      category_id: z.number().int().positive().nullable(),
      removeImageIds: z.array(z.number().int().positive()),
      imageOrder: z.array(z.number().int().positive()),
    })
    .parse({
      id,
      title,
      prompt,
      negative_prompt: negative_prompt || undefined,
      model,
      tags: normalizedTags || undefined,
      category_id,
      removeImageIds: removeImageIdsRaw
        ? removeImageIdsRaw.split(',').map((value) => Number(value.trim()))
        : [],
      imageOrder: imageOrderRaw
        ? imageOrderRaw.split(',').map((value) => Number(value.trim()))
        : [],
    })

  const imageFiles = data.getAll('images').filter((entry): entry is File => entry instanceof File)
  const thumbnailFiles = data
    .getAll('thumbnails')
    .map((entry) => (entry instanceof File && entry.size > 0 ? entry : null))

  if (imageFiles.length > MAX_PROMPT_IMAGES) {
    throw new Error(`最多上传 ${MAX_PROMPT_IMAGES} 张图片`)
  }

  for (const file of imageFiles) {
    const error = validateImageFile(file)
    if (error) throw new Error(error)
  }
  for (const file of thumbnailFiles) {
    if (!file) continue
    const error = validateImageFile(file)
    if (error) throw new Error(error)
  }

  return { ...parsed, imageFiles, thumbnailFiles }
}

const promptSearchSchema = z.object({
  keyword: z.string().optional(),
  model: z.string().optional(),
  category: z.union([z.literal(NO_CATEGORY_VALUE), z.coerce.number().int().positive()]).optional(),
  status: z.enum(['published', 'draft']).optional(),
  starred: z.enum(['starred']).optional(),
  page: z.coerce.number().int().min(1).catch(1),
})

const gallerySearchSchema = promptSearchSchema.omit({ status: true }).extend({
  sort: z.enum(['newest', 'popular', 'starred']).optional().catch(undefined),
})

async function fetchPromptsWithImages(promptRows: (typeof prompts.$inferSelect)[]) {
  if (promptRows.length === 0) return []

  const promptIds = promptRows.map((row) => row.id)
  const db = await getDb()
  if (!db) return []

  const imageRows = await db
    .select()
    .from(prompt_images)
    .where(inArray(prompt_images.prompt_id, promptIds))
    .orderBy(prompt_images.sort_order)

  const imagesByPromptId = new Map<
    number,
    { id: number; url: string; thumbnailUrl: string; sort_order: number | null }[]
  >()

  for (const image of imageRows) {
    const list = imagesByPromptId.get(image.prompt_id) ?? []
    list.push({
      id: image.id,
      url: getImageUrl(image.r2_key),
      thumbnailUrl: getThumbnailUrl(image.r2_key, image.thumbnail_r2_key),
      sort_order: image.sort_order,
    })
    imagesByPromptId.set(image.prompt_id, list)
  }

  const categoryIds = [
    ...new Set(promptRows.map((row) => row.category_id).filter((id): id is number => id != null)),
  ]
  const categoryNameById = new Map<number, string>()

  if (categoryIds.length > 0) {
    const categoryRows = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(inArray(categories.id, categoryIds))

    for (const category of categoryRows) {
      categoryNameById.set(category.id, category.name)
    }
  }

  return promptRows.map((row) => ({
    ...row,
    images: imagesByPromptId.get(row.id) ?? [],
    categoryName: row.category_id ? (categoryNameById.get(row.category_id) ?? null) : null,
  }))
}

export const listPromptsAdminFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((input: unknown) => promptSearchSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      if (!db) {
        return {
          items: [],
          pagination: {
            page: 1,
            pageSize: ADMIN_PROMPTS_PAGE_SIZE,
            total: 0,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          },
        }
      }

      const filters = []
      const keyword = data.keyword?.trim()
      if (keyword) {
        const pattern = `%${keyword}%`
        filters.push(
          or(
            like(prompts.title, pattern),
            like(prompts.prompt, pattern),
            like(prompts.tags, pattern),
          ),
        )
      }
      if (data.model) {
        filters.push(eq(prompts.model, data.model))
      }
      if (data.status) {
        filters.push(eq(prompts.draft, data.status === 'draft'))
      }
      if (data.starred) {
        filters.push(eq(prompts.starred, true))
      }
      if (data.category === NO_CATEGORY_VALUE) {
        filters.push(isNull(prompts.category_id))
      } else if (data.category) {
        filters.push(eq(prompts.category_id, data.category))
      }
      const where = filters.length > 0 ? and(...filters) : undefined
      const [{ total = 0 } = { total: 0 }] = await db
        .select({ total: count() })
        .from(prompts)
        .where(where)

      const totalPages = Math.max(1, Math.ceil(total / ADMIN_PROMPTS_PAGE_SIZE))
      const page = Math.min(data.page, totalPages)

      const promptRows = await db
        .select()
        .from(prompts)
        .where(where)
        .orderBy(desc(prompts.created_at))
        .limit(ADMIN_PROMPTS_PAGE_SIZE)
        .offset((page - 1) * ADMIN_PROMPTS_PAGE_SIZE)

      return {
        items: await fetchPromptsWithImages(promptRows),
        pagination: {
          page,
          pageSize: ADMIN_PROMPTS_PAGE_SIZE,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      }
    } catch (error) {
      logError('Failed to list admin prompts', error, {
        keyword: data.keyword,
        model: data.model,
        page: data.page,
      })
      throw new Error(formatDbError(error))
    }
  })

export const listGalleryPromptsFn = createServerFn({ method: 'GET' })
  .validator((input: unknown) => gallerySearchSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      if (!db) {
        return {
          items: [],
          pagination: {
            page: 1,
            pageSize: GALLERY_PAGE_SIZE,
            total: 0,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          },
        }
      }

      const filters = [eq(prompts.draft, false)]
      const keyword = data.keyword?.trim()
      if (keyword) {
        const pattern = `%${keyword}%`
        filters.push(
          or(
            like(prompts.title, pattern),
            like(prompts.prompt, pattern),
            like(prompts.tags, pattern),
          )!,
        )
      }
      if (data.model) {
        filters.push(eq(prompts.model, data.model))
      }
      if (data.starred) {
        filters.push(eq(prompts.starred, true))
      }
      if (data.category === NO_CATEGORY_VALUE) {
        filters.push(isNull(prompts.category_id))
      } else if (data.category) {
        filters.push(eq(prompts.category_id, data.category))
      }

      const orderBy =
        data.sort === 'popular'
          ? [desc(prompts.copy_count), desc(prompts.created_at)]
          : data.sort === 'starred'
            ? [desc(prompts.starred), desc(prompts.created_at)]
            : [desc(prompts.created_at)]

      const where = and(...filters)
      const [{ total = 0 } = { total: 0 }] = await db
        .select({ total: count() })
        .from(prompts)
        .where(where)

      const totalPages = Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE))
      const page = Math.min(data.page, totalPages)

      const promptRows = await db
        .select()
        .from(prompts)
        .where(where)
        .orderBy(...orderBy)
        .limit(GALLERY_PAGE_SIZE)
        .offset((page - 1) * GALLERY_PAGE_SIZE)

      return {
        items: await fetchPromptsWithImages(promptRows),
        pagination: {
          page,
          pageSize: GALLERY_PAGE_SIZE,
          total,
          totalPages,
          hasPrev: page > 1,
          hasNext: page < totalPages,
        },
      }
    } catch {
      return {
        items: [],
        pagination: {
          page: 1,
          pageSize: GALLERY_PAGE_SIZE,
          total: 0,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      }
    }
  })

export const getGalleryPromptByIdFn = createServerFn({ method: 'GET' })
  .validator(z.number().int().positive())
  .handler(async ({ data: id }) => {
    try {
      const db = await getDb()
      if (!db) return null

      const result = await db
        .select()
        .from(prompts)
        .where(and(eq(prompts.id, id), eq(prompts.draft, false)))
        .limit(1)

      const prompt = result[0]
      if (!prompt) return null

      const images = await db
        .select()
        .from(prompt_images)
        .where(eq(prompt_images.prompt_id, id))
        .orderBy(prompt_images.sort_order)

      return {
        ...prompt,
        images: images.map((image) => ({
          id: image.id,
          url: getImageUrl(image.r2_key),
          thumbnailUrl: getThumbnailUrl(image.r2_key, image.thumbnail_r2_key),
          sort_order: image.sort_order,
        })),
      }
    } catch {
      return null
    }
  })

export const recordPromptCopyFn = createServerFn({ method: 'POST' })
  .validator(z.number().int().positive())
  .handler(async ({ data: id }) => {
    try {
      const db = await getDb()
      if (!db) return null

      const result = await db
        .update(prompts)
        .set({
          copy_count: sql`${prompts.copy_count} + 1`,
          last_copied_at: new Date(),
        })
        .where(and(eq(prompts.id, id), eq(prompts.draft, false)))
        .returning({ id: prompts.id, copy_count: prompts.copy_count })

      return result[0] ?? null
    } catch {
      return null
    }
  })

export const updatePublishedPromptStarredFn = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.number().int().positive(),
      starred: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      if (!db) return null

      const result = await db
        .update(prompts)
        .set({
          starred: data.starred,
          updated_at: new Date(),
        })
        .where(and(eq(prompts.id, data.id), eq(prompts.draft, false)))
        .returning({ id: prompts.id, starred: prompts.starred })

      return result[0] ?? null
    } catch {
      return null
    }
  })

export const updatePromptStarredAdminFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      starred: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      if (!db) {
        throw new Error('数据库不可用，请确认本地 D1 已启动')
      }

      const result = await db
        .update(prompts)
        .set({
          starred: data.starred,
          updated_at: new Date(),
        })
        .where(eq(prompts.id, data.id))
        .returning({ id: prompts.id, starred: prompts.starred })

      if (!result[0]) {
        throw new Error('Prompt 不存在')
      }

      return result[0]
    } catch (error) {
      throw new Error(formatDbError(error))
    }
  })

export const getPromptByIdFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(z.number().int().positive())
  .handler(async ({ data: id }) => {
    try {
      const db = await getDb()
      if (!db) return null

      const result = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1)

      const prompt = result[0]
      if (!prompt) return null

      const images = await db
        .select()
        .from(prompt_images)
        .where(eq(prompt_images.prompt_id, id))
        .orderBy(prompt_images.sort_order)

      return {
        ...prompt,
        images: images.map((image) => ({
          id: image.id,
          url: getImageUrl(image.r2_key),
          thumbnailUrl: getThumbnailUrl(image.r2_key, image.thumbnail_r2_key),
          sort_order: image.sort_order,
        })),
      }
    } catch {
      return null
    }
  })

export const createPromptFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('提交数据格式错误')
    }
    return parseCreatePromptFormData(data)
  })
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      const bucket = await getR2()

      if (!db) {
        throw new Error('数据库不可用，请确认本地 D1 已启动')
      }
      if (data.imageFiles.length > 0 && !bucket) {
        throw new Error('图片存储不可用，请确认本地 R2 已启动')
      }

      const now = new Date()
      const uploadedKeys: string[] = []
      const category_id = await resolveCategoryId(db, data.category_id)

      const result = await db
        .insert(prompts)
        .values({
          title: data.title.trim(),
          prompt: data.prompt.trim(),
          negative_prompt: data.negative_prompt?.trim() || null,
          model: data.model,
          tags: formatPromptTags(data.tags),
          category_id,
          draft: true,
          created_at: now,
          updated_at: now,
        })
        .returning({ id: prompts.id })

      const created = result[0]
      if (!created) {
        throw new Error('保存失败，请重试')
      }

      try {
        for (const [index, file] of data.imageFiles.entries()) {
          const { imageKey, thumbnailKey } = buildPromptImageKeys(created.id, file.name)
          const buffer = await file.arrayBuffer()

          await bucket!.put(imageKey, buffer, {
            httpMetadata: { contentType: file.type },
          })
          uploadedKeys.push(imageKey)

          const thumbnailFile = data.thumbnailFiles[index]
          const storedThumbnailKey = thumbnailFile ? thumbnailKey : null
          if (thumbnailFile) {
            await bucket!.put(thumbnailKey, await thumbnailFile.arrayBuffer(), {
              httpMetadata: { contentType: thumbnailFile.type },
            })
            uploadedKeys.push(thumbnailKey)
          }

          await db.insert(prompt_images).values({
            prompt_id: created.id,
            r2_key: imageKey,
            thumbnail_r2_key: storedThumbnailKey,
            sort_order: index,
            created_at: now,
          })
        }
      } catch (error) {
        await Promise.all(uploadedKeys.map((key) => bucket!.delete(key)))
        await db.delete(prompts).where(eq(prompts.id, created.id))
        throw error instanceof Error ? error : new Error('图片上传失败')
      }

      return { id: created.id, imageCount: data.imageFiles.length }
    } catch (error) {
      throw new Error(formatDbError(error))
    }
  })

export const updatePromptFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('提交数据格式错误')
    }
    return parseUpdatePromptFormData(data)
  })
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      const bucket = await getR2()

      if (!db) {
        throw new Error('数据库不可用，请确认本地 D1 已启动')
      }

      const existing = await db.select().from(prompts).where(eq(prompts.id, data.id)).limit(1)

      if (!existing[0]) {
        throw new Error('Prompt 不存在')
      }

      const currentImages = await db
        .select()
        .from(prompt_images)
        .where(eq(prompt_images.prompt_id, data.id))
        .orderBy(prompt_images.sort_order)

      const remainingCount =
        currentImages.length - data.removeImageIds.length + data.imageFiles.length

      if (remainingCount > MAX_PROMPT_IMAGES) {
        throw new Error(`最多保留 ${MAX_PROMPT_IMAGES} 张图片`)
      }

      if (data.imageFiles.length > 0 && !bucket) {
        throw new Error('图片存储不可用，请确认本地 R2 已启动')
      }

      const now = new Date()
      const uploadedKeys: string[] = []
      const category_id = await resolveCategoryId(db, data.category_id)

      await db
        .update(prompts)
        .set({
          title: data.title.trim(),
          prompt: data.prompt.trim(),
          negative_prompt: data.negative_prompt?.trim() || null,
          model: data.model,
          tags: formatPromptTags(data.tags),
          category_id,
          updated_at: now,
        })
        .where(eq(prompts.id, data.id))

      const imagesToRemove = currentImages.filter((image) => data.removeImageIds.includes(image.id))

      for (const image of imagesToRemove) {
        if (bucket) {
          await bucket.delete(image.r2_key)
          const thumbnailKey = image.thumbnail_r2_key ?? getThumbnailKey(image.r2_key)
          if (thumbnailKey) {
            await bucket.delete(thumbnailKey)
          }
        }
        await db.delete(prompt_images).where(eq(prompt_images.id, image.id))
      }

      const remainingImages = currentImages.filter(
        (image) => !data.removeImageIds.includes(image.id),
      )
      const orderIds =
        data.imageOrder.length > 0 ? data.imageOrder : remainingImages.map((image) => image.id)
      const orderIndex = new Map(orderIds.map((id, index) => [id, index]))
      const orderedRemainingImages = [...remainingImages].sort((a, b) => {
        const aIndex = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const bIndex = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER
        if (aIndex !== bIndex) return aIndex - bIndex
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
      })

      for (const [index, image] of orderedRemainingImages.entries()) {
        if (image.sort_order === index) continue
        await db
          .update(prompt_images)
          .set({ sort_order: index })
          .where(eq(prompt_images.id, image.id))
      }

      try {
        for (const [index, file] of data.imageFiles.entries()) {
          const { imageKey, thumbnailKey } = buildPromptImageKeys(data.id, file.name)
          const buffer = await file.arrayBuffer()

          await bucket!.put(imageKey, buffer, {
            httpMetadata: { contentType: file.type },
          })
          uploadedKeys.push(imageKey)

          const thumbnailFile = data.thumbnailFiles[index]
          const storedThumbnailKey = thumbnailFile ? thumbnailKey : null
          if (thumbnailFile) {
            await bucket!.put(thumbnailKey, await thumbnailFile.arrayBuffer(), {
              httpMetadata: { contentType: thumbnailFile.type },
            })
            uploadedKeys.push(thumbnailKey)
          }

          await db.insert(prompt_images).values({
            prompt_id: data.id,
            r2_key: imageKey,
            thumbnail_r2_key: storedThumbnailKey,
            sort_order: orderedRemainingImages.length + index,
            created_at: now,
          })
        }
      } catch (error) {
        await Promise.all(uploadedKeys.map((key) => bucket!.delete(key)))
        throw error instanceof Error ? error : new Error('图片上传失败')
      }

      return { id: data.id, imageCount: remainingCount }
    } catch (error) {
      throw new Error(formatDbError(error))
    }
  })

export const updatePromptDraftFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.number().int().positive(),
      draft: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const db = await getDb()
      if (!db) {
        throw new Error('数据库不可用，请确认本地 D1 已启动')
      }

      const result = await db
        .update(prompts)
        .set({
          draft: data.draft,
          updated_at: new Date(),
        })
        .where(eq(prompts.id, data.id))
        .returning({ id: prompts.id })

      if (!result[0]) {
        throw new Error('Prompt 不存在')
      }

      return { id: data.id, draft: data.draft }
    } catch (error) {
      throw new Error(formatDbError(error))
    }
  })
