import {
  Link,
  useNavigate,
  useRouteContext,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { LogOut } from 'lucide-react'

import { AppLogo } from '@/components/app-logo'
import { Button } from '@/components/ui/button'
import { logoutFn } from '@/lib/auth.functions'
import { cn } from '@/lib/utils'

function NavLink({
  to,
  children,
  exact,
}: {
  to: string
  children: React.ReactNode
  exact?: boolean
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isActive = exact ? pathname === to : pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        isActive ? 'text-white' : 'text-white/55 hover:text-white/90',
      )}
    >
      {children}
    </Link>
  )
}

export function AppHeader() {
  const { auth } = useRouteContext({ from: '__root__' })
  const navigate = useNavigate()
  const router = useRouter()
  const logout = useServerFn(logoutFn)

  const handleLogout = async () => {
    await logout()
    await router.invalidate()
    await navigate({ to: '/login' })
  }

  return (
    <header className='pointer-events-none fixed inset-x-0 top-0 z-50'>
      <div className='relative flex justify-center px-3 pt-4 sm:px-5'>
        <nav
          className={cn(
            'pointer-events-auto relative isolate flex h-12 w-full max-w-160',
            'items-center justify-between gap-3 px-3',
            'rounded-[14px]',
            'shadow-[0_18px_44px_-24px_rgba(0,0,0,0.78)]',
          )}
        >
          <div
            aria-hidden='true'
            className='absolute inset-0 rounded-[14px] bg-[#17111f]/82 backdrop-blur-2xl backdrop-saturate-150'
          />
          <div
            aria-hidden='true'
            className={cn(
              'absolute inset-0 rounded-[14px] border border-white/8',
              'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-10px_22px_-16px_rgba(0,0,0,0.38)]',
            )}
          />

          <div className='relative z-10 flex min-w-0 items-center gap-5'>
            <Link
              to='/'
              className='flex shrink-0 items-center gap-2 rounded-lg py-1.5 text-white transition-opacity hover:opacity-90'
            >
              <AppLogo className='size-5' />
              <span className='text-[0.9375rem] font-semibold tracking-tight'>PromptNest</span>
            </Link>

            <div className='flex items-center'>
              <NavLink to='/' exact>
                首页
              </NavLink>
              <NavLink to='/gallery'>画廊</NavLink>
            </div>
          </div>

          <div className='relative z-10 flex items-center gap-2'>
            {auth.isAuthenticated ? (
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                onClick={handleLogout}
                className='text-white/55 hover:bg-white/10 hover:text-white'
                aria-label='退出登录'
              >
                <LogOut className='size-4' />
              </Button>
            ) : (
              <Button
                render={<Link to='/login' />}
                nativeButton={false}
                className='h-8 rounded-[10px] bg-white px-4 text-sm font-medium text-black shadow-none hover:bg-white/90'
              >
                登录
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
