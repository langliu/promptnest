import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { updatePromptDraftFn } from '@/lib/prompts.functions'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type PromptDraftSwitchProps = {
  promptId: number
  draft: boolean
}

export function PromptDraftSwitch({ promptId, draft }: PromptDraftSwitchProps) {
  const router = useRouter()
  const updateDraft = useServerFn(updatePromptDraftFn)
  const [published, setPublished] = useState(!draft)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleCheckedChange = async (checked: boolean) => {
    const previous = published
    setPublished(checked)
    setIsUpdating(true)

    try {
      await updateDraft({ data: { id: promptId, draft: !checked } })
      await router.invalidate()
    } catch {
      setPublished(previous)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <Switch
        checked={published}
        onCheckedChange={handleCheckedChange}
        disabled={isUpdating}
        aria-label={published ? '已发布' : '草稿'}
      />
      <span
        className={cn(
          'text-xs',
          published ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {published ? '已发布' : '草稿'}
      </span>
    </div>
  )
}