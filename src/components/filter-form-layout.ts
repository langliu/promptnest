/**
 * 响应式筛选网格：每行最多 N 个筛选项，查询/重置紧跟末行、不独占一行。
 * 末列留给操作按钮，筛选项列数：2 → 3 → 4 → 5（xl 为 5 筛选项 + 1 按钮列）。
 */
export const FILTER_FORM_GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'

export const FILTER_FIELD_CLASS = 'flex min-w-0 items-center gap-2'

export const FILTER_LABEL_CLASS = 'text-muted-foreground shrink-0 whitespace-nowrap'

export const FILTER_ACTIONS_CLASS = 'flex items-center gap-2 justify-self-end'
