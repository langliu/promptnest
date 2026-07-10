import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'

import { PromptPreviewContent } from '@/components/prompt-preview-dialog'
import { Button } from '@/components/ui/button'
import { getGalleryPromptByIdFn } from '@/lib/prompts.functions'

export const Route = createFileRoute('/gallery_/$id')({
  params: {
    parse: (params) => ({
      id: z.coerce.number().int().positive().parse(params.id),
    }),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: async ({ params }) => {
    const prompt = await getGalleryPromptByIdFn({ data: params.id })
    if (!prompt) throw notFound()
    return { prompt }
  },
  component: GalleryPromptPage,
})

function GalleryPromptPage() {
  const { prompt } = Route.useLoaderData()

  return (
    <div className='px-6 py-8'>
      <div className='mx-auto max-w-6xl space-y-5'>
        <Button
          render={<Link to='/gallery' />}
          nativeButton={false}
          variant='ghost'
          size='sm'
          className='px-0'
        >
          <ArrowLeft data-icon='inline-start' />
          返回画廊
        </Button>

        <div className='border-border bg-card h-[min(78vh,46rem)] min-h-0 overflow-hidden rounded-xl border'>
          <PromptPreviewContent
            prompt={prompt}
            className='h-full'
            shareUrl={`/gallery/${prompt.id}`}
          />
        </div>
      </div>
    </div>
  )
}
