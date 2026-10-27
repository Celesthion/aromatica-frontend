import { cn } from '@/shared/lib/utils'

/** Строка или Error; пусто: ничего не рендерит. */
export function ErrorNote({ error, className }: { error?: unknown; className?: string }) {
  if (error == null || error === '' || error === false) return null
  const text = typeof error === 'string' ? error : error instanceof Error ? error.message : 'Ошибка'
  return (
    <p
      className={cn(
        'rounded-md border border-brand-bad/30 bg-brand-bad/10 px-3 py-2 text-sm text-brand-bad',
        className,
      )}
    >
      {text}
    </p>
  )
}
