import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, gte, inArray, isNotNull, ne } from 'drizzle-orm'
import { subDays, format, startOfDay } from 'date-fns'
import { authMiddleware } from '@/lib/auth.middleware'
import { formatDbError, getDb } from '@/lib/db'
import { getModelLabel } from '@/lib/models'
import { parsePromptTags } from '@/lib/prompt-tags'
import { prompt_images, prompts } from '../../drizzle/schema'

export type DashboardStats = {
  totals: {
    prompts: number
    images: number
    promptsLast7Days: number
    promptsLast30Days: number
    avgImagesPerPrompt: number
  }
  modelDistribution: { model: string; label: string; count: number }[]
  creationTrend: { date: string; label: string; count: number }[]
  topTags: { tag: string; count: number }[]
  recentPrompts: {
    id: number
    title: string
    model: string
    modelLabel: string
    imageCount: number
    created_at: Date
  }[]
}

function buildCreationTrend(
  rows: { created_at: Date }[],
  days = 14,
): DashboardStats['creationTrend'] {
  const today = startOfDay(new Date())
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = subDays(today, days - 1 - index)
    return {
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MM/dd'),
      count: 0,
    }
  })

  const bucketMap = new Map(buckets.map((bucket) => [bucket.date, bucket]))

  for (const row of rows) {
    const key = format(startOfDay(row.created_at), 'yyyy-MM-dd')
    const bucket = bucketMap.get(key)
    if (bucket) bucket.count += 1
  }

  return buckets
}

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async (): Promise<DashboardStats> => {
    try {
      const db = await getDb()
      if (!db) {
        return {
          totals: {
            prompts: 0,
            images: 0,
            promptsLast7Days: 0,
            promptsLast30Days: 0,
            avgImagesPerPrompt: 0,
          },
          modelDistribution: [],
          creationTrend: buildCreationTrend([]),
          topTags: [],
          recentPrompts: [],
        }
      }

      const now = new Date()
      const last7Days = subDays(now, 7)
      const last30Days = subDays(now, 30)
      const trendStart = subDays(startOfDay(now), 13)

      const [promptCountRow] = await db
        .select({ count: count() })
        .from(prompts)
      const [imageCountRow] = await db
        .select({ count: count() })
        .from(prompt_images)
      const [last7DaysRow] = await db
        .select({ count: count() })
        .from(prompts)
        .where(gte(prompts.created_at, last7Days))
      const [last30DaysRow] = await db
        .select({ count: count() })
        .from(prompts)
        .where(gte(prompts.created_at, last30Days))

      const modelRows = await db
        .select({
          model: prompts.model,
          count: count(),
        })
        .from(prompts)
        .groupBy(prompts.model)
        .orderBy(desc(count()))

      const trendRows = await db
        .select({ created_at: prompts.created_at })
        .from(prompts)
        .where(gte(prompts.created_at, trendStart))

      const tagRows = await db
        .select({ tags: prompts.tags })
        .from(prompts)
        .where(and(isNotNull(prompts.tags), ne(prompts.tags, '')))

      const recentRows = await db
        .select({
          id: prompts.id,
          title: prompts.title,
          model: prompts.model,
          created_at: prompts.created_at,
        })
        .from(prompts)
        .orderBy(desc(prompts.created_at))
        .limit(5)

      const recentIds = recentRows.map((row) => row.id)
      const imageCountRows =
        recentIds.length > 0
          ? await db
              .select({
                prompt_id: prompt_images.prompt_id,
                count: count(),
              })
              .from(prompt_images)
              .where(inArray(prompt_images.prompt_id, recentIds))
              .groupBy(prompt_images.prompt_id)
          : []

      const imageCountByPromptId = new Map(
        imageCountRows.map((row) => [row.prompt_id, row.count]),
      )

      const tagCounter = new Map<string, number>()
      for (const row of tagRows) {
        for (const tag of parsePromptTags(row.tags)) {
          tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1)
        }
      }

      const topTags = [...tagCounter.entries()]
        .map(([tag, tagCount]) => ({ tag, count: tagCount }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

      const totalPrompts = promptCountRow?.count ?? 0
      const totalImages = imageCountRow?.count ?? 0

      return {
        totals: {
          prompts: totalPrompts,
          images: totalImages,
          promptsLast7Days: last7DaysRow?.count ?? 0,
          promptsLast30Days: last30DaysRow?.count ?? 0,
          avgImagesPerPrompt:
            totalPrompts > 0
              ? Math.round((totalImages / totalPrompts) * 10) / 10
              : 0,
        },
        modelDistribution: modelRows.map((row) => ({
          model: row.model,
          label: getModelLabel(row.model),
          count: row.count,
        })),
        creationTrend: buildCreationTrend(trendRows),
        topTags,
        recentPrompts: recentRows.map((row) => ({
          id: row.id,
          title: row.title,
          model: row.model,
          modelLabel: getModelLabel(row.model),
          imageCount: imageCountByPromptId.get(row.id) ?? 0,
          created_at: row.created_at,
        })),
      }
    } catch (error) {
      throw new Error(formatDbError(error))
    }
  })