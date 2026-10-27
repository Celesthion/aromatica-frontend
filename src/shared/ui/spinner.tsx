import { Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

/** md для страниц и списков, sm для панелей и догрузки. */
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', size === 'sm' ? 'h-5 w-5' : 'h-8 w-8', className)}
    />
  )
}

const BUTTON_SPINNER_SIZE = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' } as const

/** Спиннер в кнопке на время запроса; spaced оставляет отступ до подписи справа. */
export function ButtonSpinner({
  size = 'md',
  spaced = false,
}: {
  size?: keyof typeof BUTTON_SPINNER_SIZE
  spaced?: boolean
}) {
  return <Loader2 className={`${spaced ? 'mr-2 ' : ''}${BUTTON_SPINNER_SIZE[size]} animate-spin`} />
}

/** Спиннер по центру списка или страницы; для догрузки size="sm" и py-3. */
export function PageLoader({ size, className }: { size?: 'sm' | 'md'; className?: string }) {
  return (
    <div className={cn('flex justify-center py-24', className)}>
      <Spinner size={size} />
    </div>
  )
}
