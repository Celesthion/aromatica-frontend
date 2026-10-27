import { useEffect, useState } from 'react'
import { Menu, type LucideIcon } from 'lucide-react'
import { useOutsideClick } from '@/shared/lib/useOutsideClick'

/** Редкие действия смены под одной кнопкой; закрытие смены отделено чертой, чтобы не попасть промахом. */
export function ShiftMenu({
  items,
  triggerClassName,
}: {
  triggerClassName: string
  items: {
    icon: LucideIcon
    label: string
    tone?: 'danger'
    onClick: () => void
  }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        title="Действия смены"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={triggerClassName}
      >
        <Menu className="h-5 w-5" strokeWidth={1.7} />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-56 overflow-hidden rounded-2xl left-0 border border-white/10 bg-brand-graphite-panel p-1.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/10 ${
                item.tone === 'danger'
                  ? 'mt-1.5 border-t border-white/10 pt-3 text-brand-bad-soft'
                  : 'text-white/85'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
