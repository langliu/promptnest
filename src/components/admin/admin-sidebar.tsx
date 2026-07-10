import { Link, useRouterState } from '@tanstack/react-router'
import { ExternalLink, FileText, FolderTree, LayoutDashboard } from 'lucide-react'

import { AppLogoMark } from '@/components/app-logo'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    to: '/admin',
    label: '仪表盘',
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === '/admin' || pathname === '/admin/',
  },
  {
    to: '/admin/prompts',
    label: 'Prompt 管理',
    icon: FileText,
    match: (pathname: string) => pathname.startsWith('/admin/prompts'),
  },
  {
    to: '/admin/categories',
    label: '分类管理',
    icon: FolderTree,
    match: (pathname: string) => pathname.startsWith('/admin/categories'),
  },
] as const

export function AdminSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <aside className='border-border bg-sidebar flex h-screen w-60 shrink-0 flex-col border-r'>
      <div className='border-border flex h-15 items-center gap-2.5 border-b px-4'>
        <AppLogoMark className='size-7' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold'>PromptNest</p>
          <p className='text-muted-foreground truncate text-xs'>管理后台</p>
        </div>
      </div>

      <nav className='flex-1 space-y-1 p-3'>
        <p className='text-muted-foreground mb-2 px-2 text-xs font-medium tracking-wide uppercase'>
          菜单
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = item.match(pathname)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className='size-4 shrink-0' />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className='border-border space-y-1 border-t p-3'>
        <a
          href='/gallery'
          target='_blank'
          rel='noreferrer'
          className='text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors'
        >
          <ExternalLink className='size-4' />
          打开画廊
        </a>
      </div>
    </aside>
  )
}
