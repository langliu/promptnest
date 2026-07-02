import { AlertCircle, Loader2, X } from 'lucide-react'
import { useState } from 'react'

import { ImageUpload, type PendingImage } from '@/components/image-upload'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_MODEL_ID, MODEL_SELECT_ITEMS } from '@/lib/models'
import { cn } from '@/lib/utils'

export type ExistingPromptImage = {
  id: number
  url: string
}

export type PromptFormValues = {
  title: string
  prompt: string
  negative_prompt: string
  model: string
  tags: string
}

type PromptFormProps = {
  mode: 'create' | 'edit'
  initialValues?: Partial<PromptFormValues>
  existingImages?: ExistingPromptImage[]
  submitLabel?: string
  onSubmit: (payload: {
    formData: PromptFormValues
    images: PendingImage[]
    removeImageIds: number[]
  }) => Promise<void>
  onCancel?: () => void
}

const defaultValues: PromptFormValues = {
  title: '',
  prompt: '',
  negative_prompt: '',
  model: DEFAULT_MODEL_ID,
  tags: '',
}

export function PromptForm({
  mode,
  initialValues,
  existingImages = [],
  submitLabel,
  onSubmit,
  onCancel,
}: PromptFormProps) {
  const [formData, setFormData] = useState<PromptFormValues>({
    ...defaultValues,
    ...initialValues,
  })
  const [images, setImages] = useState<PendingImage[]>([])
  const [removeImageIds, setRemoveImageIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const visibleExistingImages = existingImages.filter((image) => !removeImageIds.includes(image.id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        formData,
        images,
        removeImageIds,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <Alert variant='destructive'>
          <AlertCircle />
          <AlertTitle>保存失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='space-y-2'>
        <Label htmlFor='title'>标题</Label>
        <Input
          id='title'
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder='给这个 Prompt 起个名字'
          required
          disabled={isSubmitting}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='prompt'>正向 Prompt</Label>
        <Textarea
          id='prompt'
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          className='min-h-40'
          placeholder='输入详细的提示词...'
          required
          disabled={isSubmitting}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='negative_prompt'>负向 Prompt</Label>
        <Textarea
          id='negative_prompt'
          value={formData.negative_prompt}
          onChange={(e) => setFormData({ ...formData, negative_prompt: e.target.value })}
          className='min-h-24'
          placeholder='不需要的内容...'
          disabled={isSubmitting}
        />
      </div>

      {mode === 'edit' && visibleExistingImages.length > 0 && (
        <div className='space-y-2'>
          <Label>已有参考图</Label>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {visibleExistingImages.map((image) => (
              <div
                key={image.id}
                className='group border-border relative overflow-hidden rounded-lg border'
              >
                <img src={image.url} alt='' className='aspect-square w-full object-cover' />
                <button
                  type='button'
                  onClick={() => setRemoveImageIds((current) => [...current, image.id])}
                  disabled={isSubmitting}
                  className={cn(
                    'absolute top-1.5 right-1.5 flex size-6 items-center justify-center',
                    'rounded-full bg-black/60 text-white opacity-0 transition-opacity',
                    'group-hover:opacity-100',
                  )}
                  aria-label='移除图片'
                >
                  <X className='size-3.5' />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='space-y-2'>
        <Label>{mode === 'edit' ? '新增参考图' : '参考图片'}</Label>
        <ImageUpload
          images={images}
          onChange={setImages}
          disabled={isSubmitting}
          error={imageError}
          onError={setImageError}
        />
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label htmlFor='model'>模型</Label>
          <Select
            value={formData.model}
            items={MODEL_SELECT_ITEMS}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                model: value ?? DEFAULT_MODEL_ID,
              })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id='model' className='w-full'>
              <SelectValue placeholder='选择模型' />
            </SelectTrigger>
            <SelectContent>
              {MODEL_SELECT_ITEMS.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='tags'>标签（逗号分隔）</Label>
          <Input
            id='tags'
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder='写实, 赛博朋克, 肖像'
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className='flex flex-wrap gap-3 pt-2'>
        <Button type='submit' size='lg' disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className='animate-spin' data-icon='inline-start' />
              保存中...
            </>
          ) : (
            (submitLabel ?? (mode === 'create' ? '创建 Prompt' : '保存修改'))
          )}
        </Button>
        {onCancel && (
          <Button
            type='button'
            variant='outline'
            size='lg'
            disabled={isSubmitting}
            onClick={onCancel}
          >
            取消
          </Button>
        )}
      </div>
    </form>
  )
}
