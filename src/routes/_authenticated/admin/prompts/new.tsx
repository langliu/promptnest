import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ArrowLeft } from 'lucide-react'

import { AdminPageShell } from '@/components/admin/admin-page-shell'
import { PromptForm } from '@/components/prompt-form'
import { Button } from '@/components/ui/button'
import { createPromptFn } from '@/lib/prompts.functions'

export const Route = createFileRoute('/_authenticated/admin/prompts/new')({
  component: AdminNewPromptPage,
})

function AdminNewPromptPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const createPrompt = useServerFn(createPromptFn)

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
            <h1 className='text-2xl font-semibold tracking-tight'>新建 Prompt</h1>
            <p className='text-muted-foreground mt-1 text-sm'>创建一条新的 Prompt 记录</p>
          </div>
        </div>
      }
      contentClassName='p-6'
    >
      <div className='mx-auto w-full max-w-3xl'>
        <PromptForm
          mode='create'
          onCancel={() => navigate({ to: '/admin/prompts' })}
          onSubmit={async ({ formData, images }) => {
            const payload = new FormData()
            payload.append('title', formData.title)
            payload.append('prompt', formData.prompt)
            payload.append('negative_prompt', formData.negative_prompt)
            payload.append('model', formData.model)
            payload.append('tags', formData.tags)
            for (const image of images) {
              payload.append('images', image.file)
              payload.append('thumbnails', image.thumbnailFile ?? new File([], 'missing-thumbnail'))
            }

            await createPrompt({ data: payload })

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
