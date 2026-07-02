import { useEffect, useState } from 'react'

import type { ThreadsProps } from '@/components/Threads'

type ThreadsBackgroundProps = ThreadsProps & {
  className?: string
}

export function ThreadsBackground({ className, ...props }: ThreadsBackgroundProps) {
  const [Threads, setThreads] = useState<typeof import('@/components/Threads').default | null>(null)

  useEffect(() => {
    import('@/components/Threads').then((module) => {
      setThreads(() => module.default)
    })
  }, [])

  return (
    <div className={className}>
      {Threads ? (
        <Threads className='size-full' {...props} />
      ) : (
        <div className='size-full bg-[#03010A]' />
      )}
    </div>
  )
}
