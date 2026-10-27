import { X, type LucideIcon } from 'lucide-react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { CARD, Tooltip } from '@/shared/ui'
import { useFastViewOpen } from './fastViewContext'

/** Рисует фаст-вью в слоте каркаса через портал; при размонтировании слот закрывается. */
export function FastViewPortal({ open, children }: { open: boolean; children: ReactNode }) {
  const slot = useFastViewOpen(open)
  return open && slot ? createPortal(children, slot) : null
}

/** Лист фаст-вью: шапка сверху, под ней рельс действий и прокручиваемое тело. */
export function FastView({
  onClose,
  header,
  nav,
  children,
}: {
  onClose: () => void
  header: ReactNode
  nav?: ReactNode
  children: ReactNode
}) {
  return (
    <aside className={`relative flex min-h-0 flex-1 animate-fade-up flex-col overflow-hidden ${CARD}`}>
      <div className="relative shrink-0 border-b border-border">
        <button
          type="button"
          onClick={onClose}
          title="Закрыть"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        {header}
      </div>
      <div className="flex min-h-0 flex-1">
        {nav && <div className="shrink-0">{nav}</div>}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </aside>
  )
}

export function FastViewNav({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-14 flex-col items-center gap-2 bg-foreground/[0.03] py-4">{children}</div>
  )
}

export function FastViewNavDivider() {
  return <div className="my-1 h-px w-6 bg-border/70" />
}

const NAV_ACTIVE = {
  brand: 'bg-nav-active text-nav-active-ink shadow-soft-sm',
  danger: 'bg-destructive/10 text-destructive',
  success: 'bg-brand-good/15 text-brand-good',
} as const

/** Кнопка рельса. tone задаёт цвет активного состояния. */
export function FastViewNavButton({
  icon: Icon,
  label,
  active = false,
  tone = 'brand',
  disabled,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active?: boolean
  tone?: keyof typeof NAV_ACTIVE
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <Tooltip label={label} side="right">
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
          active ? NAV_ACTIVE[tone] : 'text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
        }`}
      >
        <Icon className="h-4 w-4" />
      </button>
    </Tooltip>
  )
}

/** Шапка с градиентом: слева children, справа плитка с иконкой или текстом. */
export function FastViewHeader({
  icon: Icon,
  avatarText,
  children,
}: {
  icon?: LucideIcon
  /** Текст вместо иконки, например инициалы. */
  avatarText?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-4 bg-gradient-to-br from-primary/10 to-transparent px-6 pb-6 pt-9">
      {children}
      <div
        className={`flex aspect-square w-32 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-nav-active-light via-nav-active to-nav-active-dark text-nav-active-ink shadow-soft ring-1 ring-nav-active/30 ${
          avatarText != null ? 'text-3xl font-medium' : ''
        }`}
      >
        {avatarText != null ? avatarText : Icon ? <Icon className="h-12 w-12" strokeWidth={1.25} /> : null}
      </div>
    </div>
  )
}
