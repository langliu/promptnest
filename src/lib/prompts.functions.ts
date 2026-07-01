import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/lib/auth.middleware'
import { formatDbError, getDb } from '@/lib/db'
import { desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import {
  buildPromptImageKey,
  getImageUrl,
  MAX_PROMPT_IMAGES,
  validateImageFile,
} from '@/lib/images'
import { modelIdSchema } from '@/lib/models'
import { prompt_images, prompts } from '../../drizzle/schema'

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

  const parsed = z
    .object({
      title: z.string().min(1, '标题不能为空'),
      prompt: z.string().min(1, '正向 Prompt 不能为空'),
      negative_prompt: z.string().optional(),
      model: modelIdSchema,
      tags: z.string().optional(),
    })
    .parse({
      title,
      prompt,
      negative_prompt: negative_prompt || undefined,
      model,
      tags: tags || undefined,
    })

  const imageFiles = data
    .getAll('images')
    .filter((entry): entry is File => entry instanceof File)

  if (imageFiles.length > MAX_PROMPT_IMAGES) {
    throw new Error(`最多上传 ${MAX_PROMPT_IMAGES} 张图片`)
  }

  for (const file of imageFiles) {
    const error = validateImageFile(file)
    if (error) throw new Error(error)
  }

  return { ...parsed, imageFiles }
}

export const getAllPromptsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const db = await getDb()
      if (!db) return []

      const promptRows = await db
        .select()
        .from(prompts)
        .orderBy(desc(prompts.created_at))
        .limit(50)

      if (promptRows.length === 0) return []

      const promptIds = promptRows.map((row) => row.id)
      const imageRows = await db
        .select()
        .from(prompt_images)
        .where(inArray(prompt_images.prompt_id, promptIds))
        .orderBy(prompt_images.sort_order)

      const imagesByPromptId = new Map<
        number,
        { id: number; url: string; sort_order: number | null }[]
      >()

      for (const image of imageRows) {
        const list = imagesByPromptId.get(image.prompt_id) ?? []
        list.push({
          id: image.id,
          url: getImageUrl(image.r2_key),
          sort_order: image.sort_order,
        })
        imagesByPromptId.set(image.prompt_id, list)
      }

      return promptRows.map((row) => ({
        ...row,
        images: imagesByPromptId.get(row.id) ?? [],
      }))
    } catch {
      return []
    }
  },
)

export const getPromptByIdFn = createServerFn({ method: 'GET' })
  .validator((id: number) => id)
  .handler(async ({ data: id }) => {
    try {
      const db = await getDb()
      if (!db) return null

      const result = await db
        .select()
        .from(prompts)
        .where(eq(prompts.id, id))
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

      const result = await db
        .insert(prompts)
        .values({
          title: data.title.trim(),
          prompt: data.prompt.trim(),
          negative_prompt: data.negative_prompt?.trim() || null,
          model: data.model,
          tags: data.tags?.trim() || null,
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
          const key = buildPromptImageKey(created.id, file.name)
          const buffer = await file.arrayBuffer()

          await bucket!.put(key, buffer, {
            httpMetadata: { contentType: file.type },
          })
          uploadedKeys.push(key)

          await db.insert(prompt_images).values({
            prompt_id: created.id,
            r2_key: key,
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