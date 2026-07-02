import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Images } from 'lucide-react'

import { FerrofluidBackground } from '@/components/ferrofluid-background'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const features = [
  {
    title: '提示词归档',
    description: '正向、负向 Prompt 和标签统一管理，方便搜索复用。',
  },
  {
    title: '多图参考',
    description: '每条 Prompt 可附带多张参考图，效果一目了然。',
  },
  {
    title: '模型标记',
    description: '记录使用的模型版本，跨平台切换不混乱。',
  },
] as const

function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

function HomePage() {
  return (
    <div className='relative min-h-svh overflow-x-hidden bg-[#03010A] text-white sm:h-svh sm:overflow-hidden'>
      <div className='pointer-events-none absolute inset-0'>
        <FerrofluidBackground
          className='size-full'
          colors={['#ffffff', '#ffffff', '#ffffff']}
          speed={0.5}
          scale={1}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={3}
          shimmer={1}
          glow={2}
          flowDirection='down'
          opacity={1}
          mouseInteraction
        />
        <div className='absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-[#03010A] via-[#03010A]/80 to-transparent' />
      </div>

      <div className='pointer-events-none relative z-10 flex min-h-svh flex-col px-6 pt-24 pb-6 sm:h-svh sm:min-h-0 sm:px-8 sm:pt-24 sm:pb-8'>
        <div className='mx-auto flex w-full max-w-5xl flex-1 flex-col'>
          <section className='flex min-h-0 flex-1 flex-col items-center justify-center py-8 text-center sm:py-10 lg:py-8'>
            <div className='pointer-events-auto mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm'>
              <span className='rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-black'>
                NEW
              </span>
              <span className='px-3 py-0.5 text-sm text-white/65'>AI 提示词管理工具</span>
            </div>

            <h1 className='text-5xl leading-none font-bold tracking-tight sm:text-6xl lg:text-[5rem]'>
              PromptNest
            </h1>
            <p className='mx-auto mt-5 max-w-3xl text-base leading-relaxed text-white/55 sm:text-lg'>
              集中管理你的 AI 绘图提示词、参考图片和模型参数。 随时复用，不再散落在聊天记录里。
            </p>

            <div className='pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3'>
              <Button
                render={<Link to='/gallery' />}
                nativeButton={false}
                className='h-10 rounded-lg border-0 bg-white px-6 text-sm font-medium text-black hover:bg-white/92'
              >
                <Images className='size-4' />
                进入画廊
              </Button>
            </div>
          </section>

          <section className='grid shrink-0 gap-4 sm:grid-cols-3'>
            {features.map((feature) => (
              <GlassCard
                key={feature.title}
                className='pointer-events-auto flex flex-col p-4 sm:p-5'
              >
                <h3 className='text-base font-medium'>{feature.title}</h3>
                <p className='mt-2 flex-1 text-sm leading-relaxed text-white/50'>
                  {feature.description}
                </p>
                <Button
                  render={<Link to='/gallery' />}
                  nativeButton={false}
                  variant='ghost'
                  size='sm'
                  className='mt-3 w-fit px-0 text-white/60 hover:bg-transparent hover:text-white'
                >
                  查看画廊
                  <ArrowRight className='size-3.5' />
                </Button>
              </GlassCard>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}
