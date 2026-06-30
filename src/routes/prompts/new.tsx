import {
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ImageUpload, type PendingImage } from '@/components/image-upload'
import { createPromptFn } from '@/lib/prompts.functions'
import { DEFAULT_MODEL_ID, PROMPT_MODELS } from '@/lib/models'
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

export const Route = createFileRoute('/prompts/new')({
  component: NewPromptPage,
})

function NewPromptPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const createPrompt = useServerFn(createPromptFn)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [images, setImages] = useState<PendingImage[]>([])
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    negative_prompt: '',
    model: DEFAULT_MODEL_ID,
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('prompt', formData.prompt)
      payload.append('negative_prompt', formData.negative_prompt)
      payload.append('model', formData.model)
      payload.append('tags', formData.tags)
      for (const image of images) {
        payload.append('images', image.file)
      }

      await createPrompt({ data: payload })

      for (const image of images) {
        URL.revokeObjectURL(image.previewUrl)
      }

      await router.invalidate()
      await navigate({ to: '/gallery' })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">新建 Prompt</h1>
        <p className="mt-2 text-muted-foreground">
          记录你的提示词、模型和标签，并可上传多张参考图。
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle />
          <AlertTitle>保存失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">标题</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="给这个 Prompt 起个名字"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">正向 Prompt</Label>
          <Textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) =>
              setFormData({ ...formData, prompt: e.target.value })
            }
            className="min-h-40"
            placeholder="输入详细的提示词..."
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="negative_prompt">负向 Prompt</Label>
          <Textarea
            id="negative_prompt"
            value={formData.negative_prompt}
            onChange={(e) =>
              setFormData({ ...formData, negative_prompt: e.target.value })
            }
            className="min-h-24"
            placeholder="不需要的内容..."
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>参考图片</Label>
          <ImageUpload
            images={images}
            onChange={setImages}
            disabled={isSubmitting}
            error={imageError}
            onError={setImageError}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="model">模型</Label>
            <Select
              value={formData.model}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  model: value ?? DEFAULT_MODEL_ID,
                })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="model" className="w-full">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">标签（逗号分隔）</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="写实, 赛博朋克, 肖像"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" data-icon="inline-start" />
                保存中...
              </>
            ) : (
              '保存 Prompt'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}