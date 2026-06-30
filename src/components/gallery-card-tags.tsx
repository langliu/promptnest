import { Badge } from '@/components/ui/badge'
import { getModelLabel } from '@/lib/models'
import { parsePromptTags } from '@/lib/prompt-tags'
import { cn } from '@/lib/utils'

const MAX_VISIBLE_TAGS = 3

export function GalleryCardTags({
  model,
  tags,
  className,
  overlay = false,
}: {
  model: string
  tags: string | null
  className?: string
  overlay?: boolean
}) {
  const parsedTags = parsePromptTags(tags)
  const visibleTags = parsedTags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = parsedTags.length - visibleTags.length

  const badgeClass = overlay
    ? 'border-white/15 bg-black/55 text-white backdrop-blur-md'
    : undefined

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1',
        !overlay && 'gap-1.5 border-t border-border/40 px-3 py-2',
        className,
      )}
    >
      <Badge variant={overlay ? 'outline' : 'secondary'} className={badgeClass}>
        {getModelLabel(model)}
      </Badge>
      {visibleTags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={cn(
            'max-w-full truncate font-normal',
            overlay
              ? 'border-white/15 bg-black/45 text-white/90 backdrop-blur-md'
              : 'text-muted-foreground',
          )}
        >
          {tag}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge
          variant="ghost"
          className={overlay ? 'text-white/80' : 'text-muted-foreground'}
        >
          +{hiddenCount}
        </Badge>
      )}
    </div>
  )
}