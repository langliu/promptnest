export const MAX_PROMPT_IMAGES = 10
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export function getImageUrl(r2Key: string) {
  return `/api/images?key=${encodeURIComponent(r2Key)}`
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