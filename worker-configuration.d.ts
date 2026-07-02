declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    IMAGES: R2Bucket
    AUTH_PASSWORD: string
    SESSION_SECRET: string
  }
}

interface Env extends Cloudflare.Env {}
