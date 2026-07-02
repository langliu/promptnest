import { createFileRoute } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { GalleryCardTags } from '@/components/gallery-card-tags'
import { PromptPreviewDialog, type GalleryPrompt } from '@/components/prompt-preview-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getAllPromptsFn } from '@/lib/prompts.functions'

export const Route = createFileRoute('/gallery')({
  loader: async () => {
    const prompts = await getAllPromptsFn()
    return { prompts }
  },
  component: GalleryPage,
})

function GalleryPage() {
  const { prompts } = Route.useLoaderData()
  const [previewPrompt, setPreviewPrompt] = useState<GalleryPrompt | null>(null)

  return (
    <div className='p-8'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold tracking-tight'>画廊</h1>
          <p className='text-muted-foreground mt-2'>浏览和管理你保存的所有 Prompt</p>
        </div>

        {prompts.length === 0 ? (
          <Card className='py-16 text-center'>
            <CardContent className='flex flex-col items-center gap-4'>
              <ImageIcon className='text-muted-foreground size-10' />
              <p className='text-muted-foreground'>暂无已发布的 Prompt</p>
            </CardContent>
          </Card>
        ) : (
          <div className='columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4'>
            {prompts.map((prompt) => {
              const cover = prompt.images[0]

              return (
                <Card
                  key={prompt.id}
                  className='mb-6 break-inside-avoid gap-0 overflow-hidden py-0'
                >
                  <button
                    type='button'
                    className='group bg-muted relative block w-full cursor-pointer transition-opacity hover:opacity-95'
                    onClick={() => setPreviewPrompt(prompt)}
                    aria-label={`查看 ${prompt.title} 的详情`}
                  >
                    {cover ? (
                      <img
                        src={cover.url}
                        alt={prompt.title}
                        className='block h-auto w-full'
                        loading='lazy'
                      />
                    ) : (
                      <div className='flex aspect-[4/3] items-center justify-center'>
                        <ImageIcon className='text-muted-foreground size-8' />
                      </div>
                    )}

                    {prompt.images.length > 1 && (
                      <Badge
                        variant='secondary'
                        className='pointer-events-none absolute top-2 right-2 border-white/15 bg-black/55 text-white backdrop-blur-md'
                      >
                        +{prompt.images.length - 1}
                      </Badge>
                    )}

                    <div className='pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/35 to-transparent px-2.5 pt-10 pb-2.5'>
                      <GalleryCardTags overlay model={prompt.model} tags={prompt.tags} />
                    </div>
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {previewPrompt && (
        <PromptPreviewDialog prompt={previewPrompt} onClose={() => setPreviewPrompt(null)} />
      )}
    </div>
  )
}
