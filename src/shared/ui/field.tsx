import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/** Поле формы: подпись сверху, контрол внутри, подсказка снизу. */
export function Field({
  label,
  className,
  hint,
  hintTone = 'muted',
  children,
}: {
  label: ReactNode
  /** Класс обёртки (например sm:col-span-2). */
  className?: string
  /** Подсказка под контролом (например требования к паролю). */
  hint?: ReactNode
  hintTone?: 'muted' | 'error'
  children: ReactNode
}) {
  return (
    <label className={cn('block text-sm', className)}>
      <span className="mb-0.5 block text-xs text-muted-foreground">{label}</span>
      {children}
      {hint != null && (
        <span
          className={cn(
            'mt-1 block text-xs',
            hintTone === 'error' ? 'text-brand-bad' : 'text-muted-foreground/70',
          )}
        >
          {hint}
        </span>
      )}
    </label>
  )
}
