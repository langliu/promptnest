import { ImagePlus, Loader2, X } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ALLOWED_IMAGE_TYPES, MAX_PROMPT_IMAGES, validateImageFile } from '@/lib/images'
import { cn } from '@/lib/utils'

export type PendingImage = {
  id: string
  file: File
  previewUrl: string
}

type ImageUploadProps = {
  images: PendingImage[]
  onChange: (images: PendingImage[]) => void
  disabled?: boolean
  error?: string | null
  onError?: (message: string | null) => void
}

export function ImageUpload({
  images,
  onChange,
  disabled = false,
  error,
  onError,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const remaining = MAX_PROMPT_IMAGES - images.length
    if (remaining <= 0) {
      onError?.(`最多上传 ${MAX_PROMPT_IMAGES} 张图片`)
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

      nextImages.push({
        id: crypto.randomUUID(),
        file,
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
          支持 JPG / PNG / WebP / GIF，单张最大 5MB，最多 {MAX_PROMPT_IMAGES} 张
        </p>
        <input
          id='image-upload-input'
          ref={inputRef}
          type='file'
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          className='hidden'
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {error && <p className='text-destructive text-sm'>{error}</p>}

      {images.length > 0 && (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
          {images.map((image) => (
            <div
              key={image.id}
              className='group bg-muted relative aspect-square overflow-hidden rounded-lg border'
            >
              <img
                src={image.previewUrl}
                alt={image.file.name}
                className='size-full object-cover'
              />
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
