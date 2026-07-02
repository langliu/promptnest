import { Check, ChevronLeft, ChevronRight, Copy, ImageIcon, Share2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { getModelLabel } from '@/lib/models'
import { parsePromptTags } from '@/lib/prompt-tags'
import { cn } from '@/lib/utils'

export function formatPromptForCopy(prompt: string, negativePrompt: string | null): string {
  const positive = prompt.trim()
  const negative = negativePrompt?.trim()

  if (!negative) {
    return positive
  }

  return `${positive}\n\n负面提示词\n\n${negative}`
}

export type GalleryPrompt = {
  id: number
  title: string
  prompt: string
  negative_prompt: string | null
  model: string
  tags: string | null
  images: { id: number; url: string; thumbnailUrl?: string; sort_order: number | null }[]
}

type PromptPreviewDialogProps = {
  prompt: GalleryPrompt
  onClose: () => void
}

type PromptPreviewContentProps = {
  prompt: GalleryPrompt
  className?: string
  shareUrl?: string
}

function PromptField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <h3 className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>{label}</h3>
      <p className='border-border/60 bg-muted/40 rounded-lg border p-3 text-sm leading-relaxed whitespace-pre-wrap'>
        {value}
      </p>
    </div>
  )
}

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url
  if (typeof window === 'undefined') return url
  return new URL(url, window.location.origin).toString()
}

export function PromptPreviewContent({ prompt, className, shareUrl }: PromptPreviewContentProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  useEffect(() => {
    setActiveIndex(0)
    setCopied(false)
    setShareCopied(false)
  }, [prompt.id])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  useEffect(() => {
    if (!shareCopied) return
    const timer = window.setTimeout(() => setShareCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [shareCopied])

  const handleCopy = async () => {
    const text = formatPromptForCopy(prompt.prompt, prompt.negative_prompt)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const handleShareCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(toAbsoluteUrl(shareUrl))
      setShareCopied(true)
    } catch {
      setShareCopied(false)
    }
  }

  const images = prompt.images
  const hasMultipleImages = images.length > 1
  const tags = parsePromptTags(prompt.tags)

  const goToIndex = (index: number) => {
    setActiveIndex(index)
  }

  const showPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIndex((index) => (index > 0 ? index - 1 : images.length - 1))
  }

  const showNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIndex((index) => (index < images.length - 1 ? index + 1 : 0))
  }

  return (
    <div
      className={cn(
        'grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden md:grid-cols-2 md:grid-rows-1',
        className,
      )}
    >
      <div className='bg-muted relative flex min-h-0 flex-col'>
        <div className='relative min-h-0 flex-1 p-4'>
          {images.length > 0 ? (
            <div className='pointer-events-none relative size-full'>
              {images.map((image, index) => (
                <img
                  key={image.id}
                  src={image.url}
                  alt={index === activeIndex ? prompt.title : ''}
                  aria-hidden={index !== activeIndex}
                  className={cn(
                    'absolute inset-0 size-full object-contain transition-opacity duration-200',
                    index === activeIndex ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ))}
            </div>
          ) : (
            <div className='text-muted-foreground flex size-full flex-col items-center justify-center gap-2'>
              <ImageIcon className='size-10' />
              <span className='text-sm'>暂无参考图</span>
            </div>
          )}

          {hasMultipleImages && (
            <>
              <button
                type='button'
                aria-label='上一张'
                className='border-border/60 bg-background/90 text-foreground hover:bg-background absolute top-1/2 left-3 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg border shadow-sm backdrop-blur-sm transition-colors'
                onClick={showPrev}
              >
                <ChevronLeft className='size-4' />
              </button>
              <button
                type='button'
                aria-label='下一张'
                className='border-border/60 bg-background/90 text-foreground hover:bg-background absolute top-1/2 right-3 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg border shadow-sm backdrop-blur-sm transition-colors'
                onClick={showNext}
              >
                <ChevronRight className='size-4' />
              </button>
            </>
          )}
        </div>

        {hasMultipleImages && (
          <div className='border-border/60 flex shrink-0 gap-2 overflow-x-auto border-t p-3'>
            {images.map((image, index) => (
              <button
                key={image.id}
                type='button'
                onClick={(e) => {
                  e.stopPropagation()
                  goToIndex(index)
                }}
                className={cn(
                  'size-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                  index === activeIndex
                    ? 'border-primary'
                    : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img src={image.url} alt='' className='size-full object-cover' />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className='flex min-h-0 flex-col overflow-hidden'>
        <div className='shrink-0 space-y-3 px-6 pt-6 pr-14'>
          <h2 className='pr-2 text-xl font-semibold tracking-tight'>{prompt.title}</h2>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge variant='secondary'>{getModelLabel(prompt.model)}</Badge>
            {tags?.map((tag) => (
              <Badge key={tag} variant='outline'>
                {tag}
              </Badge>
            ))}
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='w-fit'
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check data-icon='inline-start' />
                  已复制
                </>
              ) : (
                <>
                  <Copy data-icon='inline-start' />
                  复制提示词
                </>
              )}
            </Button>

            {shareUrl && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='w-fit'
                onClick={handleShareCopy}
              >
                {shareCopied ? (
                  <>
                    <Check data-icon='inline-start' />
                    已复制链接
                  </>
                ) : (
                  <>
                    <Share2 data-icon='inline-start' />
                    分享
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Separator className='mx-6 mt-5 mb-0 shrink-0' />

        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-5 pr-14 pb-6'>
          <div className='space-y-5'>
            <PromptField label='正向 Prompt' value={prompt.prompt} />
            {prompt.negative_prompt && (
              <PromptField label='负向 Prompt' value={prompt.negative_prompt} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PromptPreviewDialog({ prompt, onClose }: PromptPreviewDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogContent className='flex h-[min(90vh,42rem)] max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl'>
        <DialogTitle className='sr-only'>{prompt.title}</DialogTitle>
        <PromptPreviewContent prompt={prompt} shareUrl={`/gallery/${prompt.id}`} />
      </DialogContent>
    </Dialog>
  )
}
