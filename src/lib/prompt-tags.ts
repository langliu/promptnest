export function parsePromptTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  return tags
    .split(/[,，;；、\n]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, list) => {
      const normalized = tag.toLocaleLowerCase()
      return list.findIndex((item) => item.toLocaleLowerCase() === normalized) === index
    })
}

export function formatPromptTags(tags: string | null | undefined): string | null {
  const parsedTags = parsePromptTags(tags)
  return parsedTags.length > 0 ? parsedTags.join(', ') : null
}
