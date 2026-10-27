import { cn } from '@/shared/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-label="AROMATICA"
        className="font-brand text-[17px] uppercase leading-none tracking-[0.2em] text-foreground"
      >
        Aromatica
      </span>
    </span>
  )
}
