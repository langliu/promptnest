import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/images')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const searchParams = new URL(request.url).searchParams
        const key = searchParams.get('key')
        const fallbackKey = searchParams.get('fallback')
        if (!key) {
          return new Response('Missing key', { status: 400 })
        }

        try {
          const { env } = await import('cloudflare:workers')
          if (!env.IMAGES) {
            return new Response('R2 not available', { status: 503 })
          }

          let servedFallback = false
          let object = await env.IMAGES.get(key)
          if (!object && fallbackKey) {
            object = await env.IMAGES.get(fallbackKey)
            servedFallback = Boolean(object)
          }
          if (!object) {
            return new Response('Not found', { status: 404 })
          }

          const headers = new Headers()
          object.writeHttpMetadata(headers)
          headers.set(
            'Cache-Control',
            servedFallback ? 'public, max-age=300' : 'public, max-age=31536000, immutable',
          )

          return new Response(object.body, { headers })
        } catch {
          return new Response('Failed to load image', { status: 500 })
        }
      },
    },
  },
})
