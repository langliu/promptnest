import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Pencil, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { AdminPageHeader, AdminPageShell } from '@/components/admin/admin-page-shell'
import { PromptDraftSwitch } from '@/components/admin/prompt-draft-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getModelLabel, MODEL_FILTER_SELECT_ITEMS } from '@/lib/models'
import { parsePromptTags } from '@/lib/prompt-tags'
import { listPromptsAdminFn } from '@/lib/prompts.functions'

const searchSchema = z.object({
  keyword: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(['published', 'draft']).optional(),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/admin/prompts/')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({
    keyword: search.keyword,
    model: search.model,
    status: search.status,
    page: search.page,
  }),
  loader: async ({ deps }) => {
    const result = await listPromptsAdminFn({
      data: {
        keyword: deps.keyword,
        model: deps.model,
        status: deps.status,
        page: deps.page,
      },
    })
    return {
      prompts: result.items,
      pagination: result.pagination,
    }
  },
  component: AdminPromptsPage,
})

function AdminPromptsPage() {
  const { prompts, pagination } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [keyword, setKeyword] = useState(search.keyword ?? '')
  const [model, setModel] = useState(search.model ?? 'all')
  const [status, setStatus] = useState(search.status ?? 'all')

  useEffect(() => {
    setKeyword(search.keyword ?? '')
    setModel(search.model ?? 'all')
    setStatus(search.status ?? 'all')
  }, [search.keyword, search.model, search.status])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate({
      search: {
        keyword: keyword.trim() || undefined,
        model: model === 'all' ? undefined : model,
        status: status === 'all' ? undefined : (status as 'published' | 'draft'),
        page: undefined,
      },
    })
  }

  const handleReset = () => {
    setKeyword('')
    setModel('all')
    setStatus('all')
    navigate({
      search: { keyword: undefined, model: undefined, status: undefined, page: undefined },
    })
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
    <AdminPageShell
      header={
        <AdminPageHeader
          title='Prompt 管理'
          description='查询、新建和编辑所有 Prompt'
          action={
            <Button render={<Link to='/admin/prompts/new' />} nativeButton={false}>
              <Plus data-icon='inline-start' />
              新建 Prompt
            </Button>
          }
        />
      }
      contentClassName='space-y-6 p-6'
    >
      <form onSubmit={handleSearch} className='border-border bg-card rounded-xl border p-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center'>
          <div className='flex flex-1 flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='flex min-w-0 flex-1 items-center gap-3'>
              <Label htmlFor='keyword' className='text-muted-foreground w-14 shrink-0 text-right'>
                关键词
              </Label>
              <Input
                id='keyword'
                name='keyword'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder='搜索标题、标签或 Prompt 内容'
                className='min-w-0 flex-1'
              />
            </div>

            <div className='flex w-full items-center gap-3 sm:w-auto'>
              <Label htmlFor='model' className='text-muted-foreground w-14 shrink-0 text-right'>
                模型
              </Label>
              <Select
                value={model}
                items={MODEL_FILTER_SELECT_ITEMS}
                onValueChange={(value) => setModel(value ?? 'all')}
              >
                <SelectTrigger id='model' className='w-full sm:w-44'>
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

            <div className='flex w-full items-center gap-3 sm:w-auto'>
              <Label htmlFor='status' className='text-muted-foreground w-14 shrink-0 text-right'>
                状态
              </Label>
              <Select
                value={status}
                items={[
                  { value: 'all', label: '全部状态' },
                  { value: 'published', label: '已发布' },
                  { value: 'draft', label: '草稿' },
                ]}
                onValueChange={(value) => setStatus(value ?? 'all')}
              >
                <SelectTrigger id='status' className='w-full sm:w-36'>
                  <SelectValue placeholder='全部状态' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部状态</SelectItem>
                  <SelectItem value='published'>已发布</SelectItem>
                  <SelectItem value='draft'>草稿</SelectItem>
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

      <div className='border-border bg-card overflow-hidden rounded-xl border'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[1080px] table-fixed text-left text-sm'>
            <colgroup>
              <col className='w-16' />
              <col className='w-[420px]' />
              <col className='w-36' />
              <col className='w-32' />
              <col className='w-20' />
              <col className='w-36' />
              <col className='w-40' />
              <col className='w-32' />
            </colgroup>
            <thead className='border-border bg-muted/40 border-b'>
              <tr>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>ID</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>标题</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>模型</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>标签</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>图片</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>状态</th>
                <th className='px-4 py-3 font-medium whitespace-nowrap'>创建时间</th>
                <th className='bg-muted sticky right-0 z-20 px-4 py-3 font-medium whitespace-nowrap shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.8)]'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {prompts.length === 0 ? (
                <tr>
                  <td colSpan={8} className='text-muted-foreground px-4 py-12 text-center'>
                    暂无数据，试试调整筛选条件或新建 Prompt
                  </td>
                </tr>
              ) : (
                prompts.map((prompt) => (
                  <tr key={prompt.id} className='border-border/70 border-b last:border-0'>
                    <td className='text-muted-foreground px-4 py-3'>{prompt.id}</td>
                    <td className='px-4 py-3'>
                      <div className='w-full min-w-0'>
                        <p className='truncate font-medium'>{prompt.title}</p>
                        <p className='text-muted-foreground mt-1 truncate text-xs'>
                          {prompt.prompt}
                        </p>
                      </div>
                    </td>
                    <td className='px-4 py-3 whitespace-nowrap'>{getModelLabel(prompt.model)}</td>
                    <td className='px-4 py-3'>
                      <div className='flex max-w-[180px] flex-wrap gap-1'>
                        {parsePromptTags(prompt.tags).length > 0 ? (
                          parsePromptTags(prompt.tags)
                            .slice(0, 3)
                            .map((tag) => (
                              <Badge key={tag} variant='secondary'>
                                {tag}
                              </Badge>
                            ))
                        ) : (
                          <span className='text-muted-foreground'>-</span>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-3 whitespace-nowrap'>{prompt.images.length}</td>
                    <td className='px-4 py-3'>
                      <PromptDraftSwitch promptId={prompt.id} draft={prompt.draft} />
                    </td>
                    <td className='text-muted-foreground px-4 py-3 whitespace-nowrap'>
                      {format(prompt.created_at, 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className='bg-card sticky right-0 z-10 px-4 py-3 shadow-[-12px_0_18px_-18px_rgba(0,0,0,0.8)]'>
                      <Button
                        render={<Link to='/admin/prompts/$id/edit' params={{ id: prompt.id }} />}
                        nativeButton={false}
                        variant='outline'
                        size='sm'
                      >
                        <Pencil data-icon='inline-start' />
                        编辑
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className='border-border flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-muted-foreground text-sm'>
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
            <span className='text-muted-foreground min-w-20 text-center text-sm'>
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
    </AdminPageShell>
  )
}
