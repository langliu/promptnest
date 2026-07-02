export const MAX_PROMPT_IMAGES = 10
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const THUMBNAIL_MAX_SIZE = 960
export const THUMBNAIL_QUALITY = 0.9

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export function getImageUrl(r2Key: string, fallbackKey?: string) {
  const params = new URLSearchParams({ key: r2Key })
  if (fallbackKey) {
    params.set('fallback', fallbackKey)
  }
  return `/api/images?${params.toString()}`
}

export function getThumbnailKey(r2Key: string) {
  const match = r2Key.match(/^(prompts\/[^/]+)\/([^/]+)$/)
  if (!match) return null

  const [, directory, fileName] = match
  const baseName = fileName.replace(/\.[^.]+$/, '')
  return `${directory}/thumbs/${baseName}.webp`
}

export function getThumbnailUrl(r2Key: string, storedThumbnailKey?: string | null) {
  const thumbnailKey = storedThumbnailKey ?? getThumbnailKey(r2Key)
  return thumbnailKey ? getImageUrl(thumbnailKey, r2Key) : getImageUrl(r2Key)
}

export function isAllowedImageType(type: string): type is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)
}

export function validateImageFile(file: File) {
  if (!isAllowedImageType(file.type)) {
    return `不支持的图片格式：${file.name}`
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `图片 ${file.name} 超过 5MB 限制`
  }
  return null
}

export function buildPromptImageKey(promptId: number, fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  return `prompts/${promptId}/${crypto.randomUUID()}.${ext}`
}

export function buildPromptImageKeys(promptId: number, fileName: string) {
  const imageKey = buildPromptImageKey(promptId, fileName)
  const thumbnailKey = getThumbnailKey(imageKey)

  if (!thumbnailKey) {
    throw new Error('缩略图路径生成失败')
  }

  return { imageKey, thumbnailKey }
}
