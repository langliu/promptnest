import { createFileRoute, Link, notFound, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft } from 'lucide-react'
import { z } from 'zod'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { PromptForm } from '@/components/prompt-form'
import { Button } from '@/components/ui/button'
import { getPromptByIdFn, updatePromptFn } from '@/lib/prompts.functions'

export const Route = createFileRoute('/_authenticated/admin/prompts/$id/edit')({
  params: {
    parse: (params) => ({
      id: z.coerce.number().int().positive().parse(params.id),
    }),
    stringify: ({ id }) => ({ id: String(id) }),
  },
  loader: async ({ params }) => {
    const prompt = await getPromptByIdFn({ data: params.id })
    if (!prompt) throw notFound()
    return { prompt }
  },
  component: AdminEditPromptPage,
})

function AdminEditPromptPage() {
  const { prompt } = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const updatePrompt = useServerFn(updatePromptFn)

  return (
    <AdminPageShell
      header={
        <div className='flex items-center gap-3'>
          <Button
            render={<Link to='/admin/prompts' />}
            nativeButton={false}
            variant='ghost'
            size='icon-sm'
            aria-label='返回列表'
          >
            <ArrowLeft className='size-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>编辑 Prompt</h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              修改 #{prompt.id} {prompt.title}
            </p>
          </div>
        </div>
      }
      contentClassName='p-6'
    >
      <div className='mx-auto w-full max-w-3xl'>
        <PromptForm
          mode='edit'
          initialValues={{
            title: prompt.title,
            prompt: prompt.prompt,
            negative_prompt: prompt.negative_prompt ?? '',
            model: prompt.model,
            tags: prompt.tags ?? '',
          }}
          existingImages={prompt.images}
          onCancel={() => navigate({ to: '/admin/prompts' })}
          onSubmit={async ({ formData, images, removeImageIds }) => {
            const payload = new FormData()
            payload.append('id', String(prompt.id))
            payload.append('title', formData.title)
            payload.append('prompt', formData.prompt)
            payload.append('negative_prompt', formData.negative_prompt)
            payload.append('model', formData.model)
            payload.append('tags', formData.tags)
            if (removeImageIds.length > 0) {
              payload.append('removeImageIds', removeImageIds.join(','))
            }
            for (const image of images) {
              payload.append('images', image.file)
              payload.append('thumbnails', image.thumbnailFile ?? new File([], 'missing-thumbnail'))
            }

            await updatePrompt({ data: payload })

            for (const image of images) {
              URL.revokeObjectURL(image.previewUrl)
            }

            await router.invalidate()
            await navigate({ to: '/admin/prompts' })
          }}
        />
      </div>
    </AdminPageShell>
  )
}
