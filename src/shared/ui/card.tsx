import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Поверхность карточки: светлая тема даёт градиент, тёмная стекло. */
export const CARD =
  'rounded-[24px] border border-glass-line bg-gradient-to-b from-surface-from to-surface-to shadow-soft backdrop-blur-xl backdrop-saturate-150'

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(CARD, 'text-card-foreground', className)} {...props} />
  ),
)
Card.displayName = 'Card'
