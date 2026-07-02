import { useEffect, useState } from 'react'

import type { DarkVeilProps } from '@/components/DarkVeil'

type DarkVeilBackgroundProps = DarkVeilProps & {
  className?: string
}

export function DarkVeilBackground({ className, ...props }: DarkVeilBackgroundProps) {
  const [DarkVeil, setDarkVeil] = useState<typeof import('@/components/DarkVeil').default | null>(
    null,
  )

  useEffect(() => {
    import('@/components/DarkVeil').then((module) => {
      setDarkVeil(() => module.default)
    })
  }, [])

  return (
    <div className={className}>
      {DarkVeil ? <DarkVeil {...props} /> : <div className='bg-background size-full' />}
    </div>
  )
}
