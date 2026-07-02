import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, ImageIcon, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { GalleryCardTags } from '@/components/gallery-card-tags'
import { PromptPreviewDialog, type GalleryPrompt } from '@/components/prompt-preview-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MODEL_FILTER_SELECT_ITEMS } from '@/lib/models'
import { listGalleryPromptsFn } from '@/lib/prompts.functions'

const searchSchema = z.object({
  keyword: z.string().optional(),
  model: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export const Route = createFileRoute('/gallery')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    keyword: search.keyword,
    model: search.model,
    page: search.page,
  }),
  loader: async ({ deps }) => {
    const result = await listGalleryPromptsFn({
      data: {
        keyword: deps.keyword,
        model: deps.model,
        page: deps.page,
      },
    })
    return {
      prompts: result.items,
      pagination: result.pagination,
    }
  },
  component: GalleryPage,
})

function GalleryPage() {
  const { prompts, pagination } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [previewPrompt, setPreviewPrompt] = useState<GalleryPrompt | null>(null)
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const [model, setModel] = useState(search.model ?? 'all')

  useEffect(() => {
    setKeyword(search.keyword ?? '')
    setModel(search.model ?? 'all')
  }, [search.keyword, search.model])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate({
      search: {
        keyword: keyword.trim() || undefined,
        model: model === 'all' ? undefined : model,
        page: undefined,
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    setModel('all')
    navigate({ search: { keyword: undefined, model: undefined, page: undefined } })
  }

  const goToPage = (page: number) => {
    navigate({
      search: (previous) => ({
        ...previous,
        page: page > 1 ? page : undefined,
      }),
    })
  }

  const firstItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.total)

  return (
    <div className='p-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-6'>
          <h1 className='text-4xl font-bold tracking-tight'>画廊</h1>
          <p className='text-muted-foreground mt-2'>浏览和复用已发布的 Prompt</p>
        </div>

        <form onSubmit={handleSearch} className='border-border bg-card mb-6 rounded-xl border p-4'>
          <div className='flex flex-col gap-4 lg:flex-row lg:items-center'>
            <div className='flex flex-1 flex-col gap-4 sm:flex-row sm:items-center'>
              <div className='flex min-w-0 flex-1 items-center gap-3'>
                <Label
                  htmlFor='gallery-keyword'
                  className='text-muted-foreground w-14 shrink-0 text-right'
                >
                  关键词
                </Label>
                <Input
                  id='gallery-keyword'
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder='搜索标题、标签或 Prompt 内容'
                  className='min-w-0 flex-1'
                />
              </div>

              <div className='flex w-full items-center gap-3 sm:w-auto'>
                <Label
                  htmlFor='gallery-model'
                  className='text-muted-foreground w-14 shrink-0 text-right'
                >
                  模型
                </Label>
                <Select
                  value={model}
                  items={MODEL_FILTER_SELECT_ITEMS}
                  onValueChange={(value) => setModel(value ?? 'all')}
                >
                  <SelectTrigger id='gallery-model' className='w-full sm:w-44'>
                    <SelectValue placeholder='全部模型' />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_FILTER_SELECT_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex shrink-0 gap-2 lg:ml-2'>
              <Button type='submit' className='min-w-24'>
                <Search data-icon='inline-start' />
                查询
              </Button>
              <Button type='button' variant='outline' className='min-w-24' onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </form>

        {prompts.length === 0 ? (
          <Card className='py-16 text-center'>
            <CardContent className='flex flex-col items-center gap-4'>
              <ImageIcon className='text-muted-foreground size-10' />
              <p className='text-muted-foreground'>暂无已发布的 Prompt</p>
            </CardContent>
          </Card>
        ) : (
          <div className='columns-1 gap-6 sm:columns-2 lg:columns-4'>
            {prompts.map((prompt) => {
              const cover = prompt.images[0]

              return (
                <Card
                  key={prompt.id}
                  role='button'
                  tabIndex={0}
                  className='focus-visible:ring-ring mb-6 cursor-pointer break-inside-avoid gap-0 overflow-hidden py-0 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                  aria-label={`查看 ${prompt.title} 的详情`}
                  onClick={() => setPreviewPrompt(prompt)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    setPreviewPrompt(prompt)
                  }}
                >
                  <div className='group bg-muted relative block w-full'>
                    {cover ? (
                      <img
                        src={cover.thumbnailUrl ?? cover.url}
                        alt={prompt.title}
                        className='block h-auto w-full'
                        loading='lazy'
                      />
                    ) : (
                      <div className='flex aspect-[4/3] items-center justify-center'>
                        <ImageIcon className='text-muted-foreground size-8' />
                      </div>
                    )}

                    {prompt.images.length > 1 && (
                      <Badge
                        variant='secondary'
                        className='pointer-events-none absolute top-2 right-2 border-white/15 bg-black/55 text-white backdrop-blur-md'
                      >
                        +{prompt.images.length - 1}
                      </Badge>
                    )}

                    <div className='pointer-events-none absolute inset-x-0 bottom-0 space-y-2 bg-linear-to-t from-black/80 via-black/45 to-transparent px-3 pt-16 pb-3'>
                      <h2 className='line-clamp-2 text-left text-base leading-snug font-semibold text-white drop-shadow-sm'>
                        {prompt.title}
                      </h2>
                      <GalleryCardTags overlay model={prompt.model} tags={prompt.tags} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <div className='text-muted-foreground mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between'>
          <p>
            共 {pagination.total} 条
            {pagination.total > 0 && (
              <>
                ，当前显示 {firstItem}-{lastItem}
              </>
            )}
          </p>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!pagination.hasPrev}
              onClick={() => goToPage(pagination.page - 1)}
            >
              <ChevronLeft className='size-4' />
              上一页
            </Button>
            <span className='min-w-20 text-center'>
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!pagination.hasNext}
              onClick={() => goToPage(pagination.page + 1)}
            >
              下一页
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </div>

      {previewPrompt && (
        <PromptPreviewDialog prompt={previewPrompt} onClose={() => setPreviewPrompt(null)} />
      )}
    </div>
  )
}
