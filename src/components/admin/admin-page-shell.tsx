import { cn } from '@/lib/utils'

type AdminPageShellProps = {
  header: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
}

export function AdminPageShell({
  header,
  children,
  contentClassName,
}: AdminPageShellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-15 shrink-0 items-center border-b border-border bg-background px-6">
        {header}
      </header>
      <div className={cn('min-h-0 flex-1 overflow-y-auto', contentClassName)}>
        {children}
      </div>
    </div>
  )
}

type AdminPageHeaderProps = {
  title: string
  description?: string
  action?: React.ReactNode
}

export function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm leading-tight text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
