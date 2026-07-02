import { useEffect, useState } from 'react'

import type { FerrofluidProps } from '@/components/Ferrofluid'

type FerrofluidBackgroundProps = FerrofluidProps & {
  className?: string
}

export function FerrofluidBackground({ className, ...props }: FerrofluidBackgroundProps) {
  const [Ferrofluid, setFerrofluid] = useState<
    typeof import('@/components/Ferrofluid').default | null
  >(null)

  useEffect(() => {
    import('@/components/Ferrofluid').then((module) => {
      setFerrofluid(() => module.default)
    })
  }, [])

  return (
    <div className={className}>
      {Ferrofluid ? <Ferrofluid {...props} /> : <div className='bg-background size-full' />}
    </div>
  )
}
