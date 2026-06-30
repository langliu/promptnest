import { z } from 'zod'

export type PromptModel = {
  id: string
  label: string
  vendor?: string
}

/** 维护模型列表：增删改只改这一处 */
export const PROMPT_MODELS = [
  { id: 'gpt-image-2', label: 'GPT-Image 2.0', vendor: 'OpenAI' },
  { id: 'nano-banana-2', label: 'Nano Banana 2', vendor: 'Google' },
  { id: 'grok-image-1.5', label: 'Grok-Image 1.5', vendor: 'xAI' },
  { id: 'seedream-5', label: 'Seedream 5.0', vendor: 'ByteDance' },
  { id: 'qwen-image-2', label: 'Qwen-Image 2.0', vendor: 'Alibaba' },
] as const satisfies readonly PromptModel[]

export type PromptModelId = (typeof PROMPT_MODELS)[number]['id']

const modelIds = PROMPT_MODELS.map((model) => model.id)

export const DEFAULT_MODEL_ID = PROMPT_MODELS[0].id

export const modelIdSchema = z.enum(
  modelIds as [PromptModelId, ...PromptModelId[]],
  { message: '请选择有效的模型' },
)

const modelById = new Map(PROMPT_MODELS.map((model) => [model.id, model]))

/** 历史数据可能存的是 label 或旧模型名，展示时做兼容 */
const modelByLabel = new Map(
  PROMPT_MODELS.map((model) => [model.label.toLowerCase(), model]),
)

export function getModelOption(modelId: PromptModelId) {
  return modelById.get(modelId)!
}

export function getModelLabel(modelValue: string) {
  const byId = modelById.get(modelValue as PromptModelId)
  if (byId) return byId.label

  const byLabel = modelByLabel.get(modelValue.toLowerCase())
  if (byLabel) return byLabel.label

  return modelValue
}

export function isKnownModel(modelValue: string) {
  return (
    modelById.has(modelValue as PromptModelId) ||
    modelByLabel.has(modelValue.toLowerCase())
  )
}