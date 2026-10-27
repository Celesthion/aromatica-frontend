import type { LucideIcon } from 'lucide-react'

export function QuickPay({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/60 hover:border-primary hover:bg-primary/5'
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.5} />
      {label}
    </button>
  )
}
