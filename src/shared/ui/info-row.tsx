import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

/** Строка "подпись и значение" для сводок и фаст-вью. */
export function InfoRow({
  label,
  className,
  valueClassName,
  children,
}: {
  label: string
  className?: string
  /** Класс значения (окраска, truncate, font-medium и т.п.). */
  valueClassName?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', valueClassName)}>{children}</span>
    </div>
  )
}
