import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { updatePromptStarredAdminFn, updatePublishedPromptStarredFn } from '@/lib/prompts.functions'
import { cn } from '@/lib/utils'

type PromptStarButtonProps = {
  promptId: number
  starred: boolean
  admin?: boolean
  className?: string
  label?: boolean
  stopPropagation?: boolean
}

export function PromptStarButton({
  promptId,
  starred,
  admin = false,
  className,
  label = false,
  stopPropagation = true,
}: PromptStarButtonProps) {
  const router = useRouter()
  const updatePublishedStarred = useServerFn(updatePublishedPromptStarredFn)
  const updateAdminStarred = useServerFn(updatePromptStarredAdminFn)
  const [checked, setChecked] = useState(starred)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    setChecked(starred)
  }, [starred])

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.stopPropagation()
    }

    const next = !checked
    setChecked(next)
    setIsUpdating(true)

    try {
      const result = admin
        ? await updateAdminStarred({ data: { id: promptId, starred: next } })
        : await updatePublishedStarred({ data: { id: promptId, starred: next } })

      if (!result) {
        setChecked(!next)
        return
      }

      await router.invalidate()
    } catch {
      setChecked(!next)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Button
      type='button'
      variant={checked ? 'secondary' : 'outline'}
      size={label ? 'sm' : 'icon-sm'}
      disabled={isUpdating}
      aria-pressed={checked}
      aria-label={checked ? '取消星标' : '设为星标'}
      className={cn(
        checked && 'text-amber-500 hover:text-amber-500',
        !label && 'bg-background/90 backdrop-blur-md',
        className,
      )}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (stopPropagation) {
          event.stopPropagation()
        }
      }}
    >
      <Star
        data-icon={label ? 'inline-start' : undefined}
        className={checked ? 'fill-current' : undefined}
      />
      {label && (checked ? '已星标' : '星标')}
    </Button>
  )
}
