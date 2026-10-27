import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

const TONES = {
  active: { chip: 'bg-brand-good/15 text-brand-good', dot: 'bg-brand-good' },
  archived: { chip: 'bg-foreground/[0.06] text-muted-foreground', dot: 'bg-muted-foreground' },
  warning: { chip: 'bg-brand-warn/15 text-brand-warn', dot: 'bg-brand-warn' },
  danger: { chip: 'bg-brand-bad/15 text-brand-bad', dot: 'bg-brand-bad' },
} as const

type StatusTone = keyof typeof TONES

/** Статус в виде таблетки; цвета: активен, архив, внимание, отказ. */
export function StatusChip({
  tone,
  dot,
  className,
  children,
}: {
  tone: StatusTone
  /** Точка-индикатор слева. */
  dot?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone].chip,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', TONES[tone].dot)} />}
      {children}
    </span>
  )
}
