import { useEffect, useState } from 'react'
import type { DashboardStats } from '@/lib/dashboard.functions'

type DashboardChartsLazyProps = {
  stats: DashboardStats
}

export function DashboardChartsLazy({ stats }: DashboardChartsLazyProps) {
  const [Charts, setCharts] = useState<
    typeof import('@/components/admin/dashboard-charts').DashboardCharts | null
  >(null)

  useEffect(() => {
    import('@/components/admin/dashboard-charts').then((module) => {
      setCharts(() => module.DashboardCharts)
    })
  }, [])

  if (!Charts) {
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={`h-72 animate-pulse rounded-xl border border-border bg-muted/30 ${
              index === 2 ? 'xl:col-span-2' : ''
            }`}
          />
        ))}
      </div>
    )
  }

  return <Charts stats={stats} />
}