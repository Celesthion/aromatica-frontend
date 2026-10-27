import { useRef, useState, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'

/** Кнопка фильтров с панелью: открывается по наведению и по клику, на чипе число активных фильтров. */
export function FiltersButton({
  activeCount = 0,
  align = 'left',
  children,
}: {
  activeCount?: number
  /** Край, к которому прижата панель; у правого края экрана нужен 'right'. */
  align?: 'left' | 'right'
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<number | null>(null)

  const enter = () => {
    if (timer.current) window.clearTimeout(timer.current)
    setOpen(true)
  }
  const leave = () => {
    timer.current = window.setTimeout(() => setOpen(false), 200)
  }

  return (
    <div className="relative inline-block" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        type="button"
        title="Фильтры"
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        onClick={() => setOpen((v) => !v)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          open || activeCount > 0
            ? 'bg-foreground/10 text-foreground'
            : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-nav-active px-1 text-[10px] font-medium text-nav-active-ink">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div
          className={`absolute z-30 mt-2 w-80 max-w-[calc(100vw-3rem)] space-y-3 rounded-2xl border border-glass-edge bg-glass-panel p-4 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_1px_3px_rgba(40,40,43,0.06),0_16px_40px_-12px_rgba(40,40,43,0.28)] ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
