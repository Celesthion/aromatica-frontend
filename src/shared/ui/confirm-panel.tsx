import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from './button'
import { ButtonSpinner } from './spinner'
import { ErrorNote } from './error-note'

const TONES = {
  success: {
    box: 'border-brand-green/20 bg-brand-green/5',
    icon: 'bg-brand-green/10 text-brand-green',
  },
  warning: {
    box: 'border-brand-warn/30 bg-brand-warn/10',
    icon: 'bg-brand-warn/15 text-brand-warn',
  },
  danger: {
    box: 'border-destructive/20 bg-destructive/5',
    icon: 'bg-destructive/10 text-destructive',
  },
} as const

/** Подтверждение действия: иконка, вопрос, кнопки "действие" и "назад" столбиком. */
export function ConfirmPanel({
  tone = 'danger',
  icon: Icon,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Назад',
  busy,
  error,
  onConfirm,
  onCancel,
  className,
}: {
  tone?: keyof typeof TONES
  icon: LucideIcon
  title: ReactNode
  description: ReactNode
  confirmLabel: ReactNode
  cancelLabel?: ReactNode
  busy?: boolean
  error?: unknown
  onConfirm: () => void
  onCancel: () => void
  className?: string
}) {
  return (
    <div className={cn('space-y-4 px-6 py-5', className)}>
      <div className={cn('flex items-start gap-3 rounded-xl border px-3 py-3', TONES[tone].box)}>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TONES[tone].icon)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="text-sm">
          <p className="font-medium">{title}</p>
          <p className="mt-0.5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <ErrorNote error={error} />
      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          variant={tone === 'danger' ? 'destructive' : 'default'}
          className="w-full justify-center"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? <ButtonSpinner spaced /> : null}
          {confirmLabel}
        </Button>
        <Button type="button" variant="outline" className="w-full justify-center" onClick={onCancel}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  )
}
