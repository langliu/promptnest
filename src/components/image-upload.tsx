import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  ALLOWED_IMAGE_TYPES,
  MAX_PROMPT_IMAGES,
  THUMBNAIL_MAX_SIZE,
  THUMBNAIL_QUALITY,
  validateImageFile,
} from '@/lib/images'
import { cn } from '@/lib/utils'

export type PendingImage = {
  id: string
  file: File
  thumbnailFile?: File
  previewUrl: string
}

type ImageUploadProps = {
  images: PendingImage[]
  onChange: (images: PendingImage[]) => void
  disabled?: boolean
  error?: string | null
  maxImages?: number
  onError?: (message: string | null) => void
}

async function createThumbnailFile(file: File): Promise<File | undefined> {
  const image = await createImageBitmap(file)
  const ratio = Math.min(1, THUMBNAIL_MAX_SIZE / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * ratio))
  const height = Math.max(1, Math.round(image.height * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    image.close()
    return undefined
  }

  context.drawImage(image, 0, 0, width, height)
  image.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', THUMBNAIL_QUALITY)
  })

  if (!blob) return undefined

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'thumbnail'
  return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
}

export function ImageUpload({
  images,
  onChange,
  disabled = false,
  error,
  maxImages = MAX_PROMPT_IMAGES,
  onError,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const remaining = maxImages - images.length
    if (remaining <= 0) {
      onError?.(`最多上传 ${maxImages} 张图片`)
      return
    }

    const nextImages = [...images]
    const errors: string[] = []

    for (const file of fileArray.slice(0, remaining)) {
      const validationError = validateImageFile(file)
      if (validationError) {
        errors.push(validationError)
        continue
      }

      const thumbnailFile = await createThumbnailFile(file).catch(() => undefined)

      nextImages.push({
        id: crypto.randomUUID(),
        file,
        thumbnailFile,
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (fileArray.length > remaining) {
      errors.push(`最多还能添加 ${remaining} 张图片`)
    }

    onChange(nextImages)
    onError?.(errors.length > 0 ? errors.join('；') : null)
  }

  const removeImage = (id: string) => {
    const target = images.find((image) => image.id === id)
    if (target) {
      URL.revokeObjectURL(target.previewUrl)
    }
    onChange(images.filter((image) => image.id !== id))
    onError?.(null)
  }

  const moveImage = (id: string, direction: -1 | 1) => {
    const index = images.findIndex((image) => image.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= images.length) return

    const nextImages = [...images]
    ;[nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]]
    onChange(nextImages)
  }

  return (
    <div className='space-y-3'>
      <div
        role='button'
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          if (!disabled) addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/40',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <ImagePlus className='text-muted-foreground mb-3 size-8' />
        <p className='text-sm font-medium'>点击或拖拽上传图片</p>
        <p className='text-muted-foreground mt-1 text-xs'>
          支持 JPG / PNG / WebP / GIF，单张最大 5MB，最多 {maxImages} 张
        </p>
        <input
          id='image-upload-input'
          ref={inputRef}
          type='file'
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          className='hidden'
          disabled={disabled}
          onChange={async (e) => {
            if (e.target.files) await addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error && <p className='text-destructive text-sm'>{error}</p>}

      {images.length > 0 && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
          {images.map((image, index) => (
            <div
              key={image.id}
              className='group bg-muted relative aspect-square overflow-hidden rounded-lg border'
            >
              <img
                src={image.previewUrl}
                alt={image.file.name}
                className='size-full object-cover'
              />
              <div className='absolute top-2 left-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100'>
                <Button
                  type='button'
                  variant='secondary'
                  size='icon-xs'
                  disabled={disabled || index === 0}
                  aria-label='前移图片'
                  onClick={(e) => {
                    e.stopPropagation()
                    moveImage(image.id, -1)
                  }}
                >
                  <ArrowLeft />
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  size='icon-xs'
                  disabled={disabled || index === images.length - 1}
                  aria-label='后移图片'
                  onClick={(e) => {
                    e.stopPropagation()
                    moveImage(image.id, 1)
                  }}
                >
                  <ArrowRight />
                </Button>
              </div>
              <Button
                type='button'
                variant='destructive'
                size='icon-xs'
                className='absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100'
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(image.id)
                }}
              >
                <X />
              </Button>
              <div className='absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-xs text-white'>
                {(image.file.size / 1024).toFixed(0)} KB
              </div>
            </div>
          ))}
        </div>
      )}

      {disabled && images.length > 0 && (
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Loader2 className='size-4 animate-spin' />
          正在上传图片...
        </div>
      )}
    </div>
  )
}
