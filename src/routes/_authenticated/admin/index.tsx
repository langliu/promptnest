import { createFileRoute, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Copy, FileText, ImageIcon, Star } from 'lucide-react'

import { AdminPageHeader, AdminPageShell } from '@/components/admin/admin-page-shell'
import { DashboardChartsLazy } from '@/components/admin/dashboard-charts-lazy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getDashboardStatsFn, type DashboardStats } from '@/lib/dashboard.functions'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/admin/')({
  loader: async () => {
    const stats = await getDashboardStatsFn()
    return { stats }
  },
  component: AdminDashboardPage,
})

const statCards = [
  {
    key: 'prompts',
    label: 'Prompt 总数',
    icon: FileText,
    getValue: (stats: DashboardStats) => stats.totals.prompts,
    hint: (stats: DashboardStats) => `近 7 天新增 ${stats.totals.promptsLast7Days}`,
  },
  {
    key: 'images',
    label: '参考图总数',
    icon: ImageIcon,
    getValue: (stats: DashboardStats) => stats.totals.images,
    hint: (stats: DashboardStats) => `平均每条 ${stats.totals.avgImagesPerPrompt} 张`,
  },
  {
    key: 'copies',
    label: '复制总次数',
    icon: Copy,
    getValue: (stats: DashboardStats) => stats.totals.copies,
    hint: (stats: DashboardStats) => `近 30 天新增 ${stats.totals.promptsLast30Days} 条`,
  },
  {
    key: 'starred',
    label: '星标 Prompt',
    icon: Star,
    getValue: (stats: DashboardStats) => stats.totals.starred,
    hint: (stats: DashboardStats) => `近 7 天新增 ${stats.totals.promptsLast7Days}`,
  },
] as const

function AdminDashboardPage() {
  const { stats } = Route.useLoaderData()

  return (
    <AdminPageShell
      header={
        <AdminPageHeader
          title='仪表盘'
          description='PromptNest 后台数据概览'
          action={
            <Button render={<Link to='/admin/prompts/new' />} nativeButton={false}>
              新建 Prompt
            </Button>
          }
        />
      }
      contentClassName='space-y-6 p-6'
    >
      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} className='border-border bg-card rounded-xl border p-5'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='text-muted-foreground text-sm'>{card.label}</p>
                  <p className='mt-2 text-3xl font-semibold tracking-tight'>
                    {card.getValue(stats)}
                  </p>
                  <p className='text-muted-foreground mt-2 text-xs'>{card.hint(stats)}</p>
                </div>
                <div className='border-border bg-muted/40 rounded-lg border p-2.5'>
                  <Icon className='text-muted-foreground size-4' />
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <DashboardChartsLazy stats={stats} />

      <section className='border-border bg-card rounded-xl border'>
        <div className='border-border flex items-center justify-between border-b px-5 py-4'>
          <div>
            <h2 className='text-base font-semibold'>最近更新</h2>
            <p className='text-muted-foreground mt-1 text-sm'>最新创建的 5 条 Prompt</p>
          </div>
          <Button
            render={<Link to='/admin/prompts' />}
            nativeButton={false}
            variant='outline'
            size='sm'
          >
            查看全部
          </Button>
        </div>

        {stats.recentPrompts.length === 0 ? (
          <div className='text-muted-foreground px-5 py-10 text-center text-sm'>
            还没有 Prompt 数据
          </div>
        ) : (
          <div className='divide-border divide-y'>
            {stats.recentPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className='flex flex-wrap items-center justify-between gap-3 px-5 py-4'
              >
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{prompt.title}</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    #{prompt.id} · {format(prompt.created_at, 'yyyy-MM-dd HH:mm')}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary'>{prompt.modelLabel}</Badge>
                  <Badge variant='outline'>{prompt.imageCount} 图</Badge>
                  <Button
                    render={<Link to='/admin/prompts/$id/edit' params={{ id: prompt.id }} />}
                    nativeButton={false}
                    variant='ghost'
                    size='sm'
                    className={cn('text-muted-foreground')}
                  >
                    编辑
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  )
}
