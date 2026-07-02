import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/images')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')
        if (!key) {
          return new Response('Missing key', { status: 400 })
        }

        try {
          const { env } = await import('cloudflare:workers')
          if (!env.IMAGES) {
            return new Response('R2 not available', { status: 503 })
          }

          const object = await env.IMAGES.get(key)
          if (!object) {
            return new Response('Not found', { status: 404 })
          }

          const headers = new Headers()
          object.writeHttpMetadata(headers)
          headers.set('Cache-Control', 'public, max-age=31536000, immutable')

          return new Response(object.body, { headers })
        } catch {
          return new Response('Failed to load image', { status: 500 })
        }
      },
    },
  },
})
