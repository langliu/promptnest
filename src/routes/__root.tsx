import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

import { AppHeader } from '@/components/app-header'
import { getAuthFn, type AuthState } from '@/lib/auth.functions'

import appCss from '../styles.css?url'

const Devtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }] = await Promise.all([
        import('@tanstack/react-devtools'),
        import('@tanstack/react-router-devtools'),
      ])

      return {
        default: function DevtoolsPanel() {
          return (
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          )
        },
      }
    })
  : null

export interface RouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const auth = await getAuthFn()
    return { auth }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'PromptNest' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      {
        rel: 'icon',
        href: '/favicon-48.png',
        type: 'image/png',
        sizes: '48x48',
      },
      { rel: 'apple-touch-icon', href: '/logo192.png', sizes: '192x192' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isLoginPage = pathname === '/login'
  const isAdminPage = pathname.startsWith('/admin')
  const isHomePage = pathname === '/'

  return (
    <>
      {!isLoginPage && !isAdminPage && <AppHeader />}
      <main className={isLoginPage || isAdminPage || isHomePage ? undefined : 'pt-20'}>
        <Outlet />
      </main>
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='zh-CN' className='dark'>
      <head>
        <HeadContent />
      </head>
      <body className='bg-background min-h-screen font-sans antialiased'>
        {children}

        {Devtools && (
          <Suspense fallback={null}>
            <Devtools />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  )
}
