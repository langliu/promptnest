import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import { ThreadsBackground } from '@/components/threads-background'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginFn } from '@/lib/auth.functions'
import { cn } from '@/lib/utils'

const DEFAULT_LOGIN_REDIRECT = '/admin'

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect ?? DEFAULT_LOGIN_REDIRECT })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const { redirect: redirectTo } = Route.useSearch()
  const login = useServerFn(loginFn)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ data: { password } })
      await router.invalidate()
      await navigate({ to: redirectTo ?? DEFAULT_LOGIN_REDIRECT })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='relative min-h-screen overflow-hidden bg-[#03010A] text-white'>
      <div aria-hidden='true' className='absolute inset-0'>
        <ThreadsBackground
          className='size-full'
          amplitude={2.3}
          distance={0}
          enableMouseInteraction
        />
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_65%)]' />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-[#03010A] via-[#03010A]/60 to-transparent' />
      </div>

      <div className='relative z-10 flex min-h-screen items-center justify-center px-6'>
        <div
          className={cn(
            'w-full max-w-sm rounded-2xl border border-white/10',
            'bg-white/4 p-8 backdrop-blur-xl',
            'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07),0_20px_50px_-16px_rgba(0,0,0,0.8)]',
          )}
        >
          <div className='mb-8 text-center'>
            <div className='mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-white/6'>
              <Lock className='size-5 text-white/70' />
            </div>
            <h1 className='text-2xl font-semibold tracking-tight'>登录 PromptNest</h1>
            <p className='mt-2 text-sm text-white/50'>输入授权码以继续</p>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertCircle />
              <AlertTitle>登录失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <Input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='授权码'
              autoComplete='current-password'
              autoFocus
              required
              disabled={isSubmitting}
              className='h-10 border-white/15 bg-white/6 text-white placeholder:text-white/35'
            />

            <Button
              type='submit'
              className='h-10 w-full border-0 bg-white text-sm font-medium text-black hover:bg-white/92'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='animate-spin' data-icon='inline-start' />
                  验证中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
