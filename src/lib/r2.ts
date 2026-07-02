export async function getR2Bucket() {
  try {
    const { env } = await import('cloudflare:workers')
    return env.IMAGES ?? null
  } catch {
    return null
  }
}

export async function uploadImage(
  key: string,
  data: ArrayBuffer | ReadableStream,
  contentType: string,
) {
  const bucket = await getR2Bucket()
  if (!bucket) {
    throw new Error('R2 bucket IMAGES is not available')
  }

  await bucket.put(key, data, {
    httpMetadata: { contentType },
  })

  return key
}

export async function getImage(key: string) {
  const bucket = await getR2Bucket()
  if (!bucket) return null
  return bucket.get(key)
}

export async function deleteImage(key: string) {
  const bucket = await getR2Bucket()
  if (!bucket) return false
  await bucket.delete(key)
  return true
}

export async function listImages(prefix?: string) {
  const bucket = await getR2Bucket()
  if (!bucket) return []

  const listed = await bucket.list({ prefix })
  return listed.objects
}
