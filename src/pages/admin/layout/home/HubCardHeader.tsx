import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'

export const CARD_DARK =
  'rounded-[24px] border border-glass-line bg-gradient-to-b from-surface-accent-from to-surface-accent-to text-white shadow-soft backdrop-blur-xl backdrop-saturate-150'

/** Заголовок карточки главной с круглой ссылкой на раздел. */
export function HubCardHeader({ title, to, icon: Icon }: { title: string; to: string; icon: LucideIcon }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-lg font-medium">{title}</h3>
      <Link
        to={to}
        className="grid h-10 w-10 place-items-center rounded-full bg-glass-strong text-primary shadow-soft-sm"
      >
        <Icon className="h-4 w-4" />
      </Link>
    </div>
  )
}
