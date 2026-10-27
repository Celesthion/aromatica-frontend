import type { LucideIcon } from 'lucide-react'
import { CARD } from '@/shared/ui'

/** Плитка счёта с балансом; emphasis рисует тёмную плитку итога. */
export function AccountTile({
  icon: Icon,
  label,
  value,
  negative,
  emphasis,
}: {
  icon: LucideIcon
  label: string
  value: string
  negative?: boolean
  emphasis?: boolean
}) {
  if (emphasis) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nav-active-light via-nav-active to-nav-active-dark p-5 text-nav-active-ink shadow-soft">
        <div className="flex items-start justify-between">
          <span className="text-sm text-nav-active-ink/80">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
        <p
          className={`mt-3 font-display text-3xl tracking-tight tabular-nums ${negative ? 'text-brand-bad-soft' : ''}`}
        >
          {value}
        </p>
      </div>
    )
  }
  return (
    <div className={`relative overflow-hidden ${CARD} p-5`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(34,123,99,0.08),transparent_55%)]" />
      <div className="relative flex items-start justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
      </div>
      <p
        className={`relative mt-3 font-display text-3xl tracking-tight tabular-nums ${negative ? 'text-brand-bad' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}
