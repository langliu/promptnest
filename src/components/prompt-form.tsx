import { AlertCircle, ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react'
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
import { MAX_PROMPT_IMAGES } from '@/lib/images'
import { DEFAULT_MODEL_ID, MODEL_SELECT_ITEMS } from '@/lib/models'
import { formatPromptTags } from '@/lib/prompt-tags'
import { cn } from '@/lib/utils'

export type ExistingPromptImage = {
  id: number
  url: string
  sort_order?: number | null
}

export type PromptCategoryOption = {
  value: string
  label: string
}

export type PromptFormValues = {
  title: string
  prompt: string
  negative_prompt: string
  model: string
  category_id: string
  tags: string
}

type PromptFormProps = {
  mode: 'create' | 'edit'
  categoryOptions: PromptCategoryOption[]
  initialValues?: Partial<PromptFormValues>
  existingImages?: ExistingPromptImage[]
  submitLabel?: string
  onSubmit: (payload: {
    formData: PromptFormValues
    images: PendingImage[]
    removeImageIds: number[]
    imageOrder: number[]
  }) => Promise<void>
  onCancel?: () => void
}

const defaultValues: PromptFormValues = {
  title: '',
  prompt: '',
  negative_prompt: '',
  model: DEFAULT_MODEL_ID,
  category_id: 'none',
  tags: '',
}

export function PromptForm({
  mode,
  categoryOptions,
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
  const [existingImageOrder, setExistingImageOrder] = useState(() =>
    [...existingImages]
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((image) => image.id),
  )
  const [removeImageIds, setRemoveImageIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const existingImagesById = new Map(existingImages.map((image) => [image.id, image]))
  const visibleExistingImages = existingImageOrder
    .map((id) => existingImagesById.get(id))
    .filter((image): image is ExistingPromptImage => Boolean(image))
    .filter((image) => !removeImageIds.includes(image.id))
  const maxNewImages =
    mode === 'edit'
      ? Math.max(0, MAX_PROMPT_IMAGES - visibleExistingImages.length)
      : MAX_PROMPT_IMAGES

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        formData,
        images,
        removeImageIds,
        imageOrder: visibleExistingImages.map((image) => image.id),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const moveExistingImage = (id: number, direction: -1 | 1) => {
    setExistingImageOrder((current) => {
      const index = current.indexOf(id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current

      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
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
            {visibleExistingImages.map((image, index) => (
              <div
                key={image.id}
                className='group border-border relative overflow-hidden rounded-lg border'
              >
                <img src={image.url} alt='' className='aspect-square w-full object-cover' />
                <div className='absolute top-1.5 left-1.5 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100'>
                  <Button
                    type='button'
                    variant='secondary'
                    size='icon-xs'
                    disabled={isSubmitting || index === 0}
                    aria-label='前移图片'
                    onClick={() => moveExistingImage(image.id, -1)}
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    type='button'
                    variant='secondary'
                    size='icon-xs'
                    disabled={isSubmitting || index === visibleExistingImages.length - 1}
                    aria-label='后移图片'
                    onClick={() => moveExistingImage(image.id, 1)}
                  >
                    <ArrowRight />
                  </Button>
                </div>
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
          maxImages={maxNewImages}
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
          <Label htmlFor='category_id'>分类</Label>
          <Select
            value={formData.category_id}
            items={categoryOptions}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                category_id: value ?? 'none',
              })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger id='category_id' className='w-full'>
              <SelectValue placeholder='选择分类' />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='tags'>标签（逗号分隔）</Label>
        <Input
          id='tags'
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          onBlur={() => setFormData({ ...formData, tags: formatPromptTags(formData.tags) ?? '' })}
          placeholder='写实, 赛博朋克, 肖像'
          disabled={isSubmitting}
        />
        <p className='text-muted-foreground text-xs'>
          支持逗号、顿号、分号或换行分隔，保存时会自动去重。
        </p>
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
