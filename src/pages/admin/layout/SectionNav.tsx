import { useSlidingPill } from '@/shared/lib/useSlidingPill'

interface SectionNavItem<T extends string> {
  value: T
  label: string
}

/** Секции слева от списка (лента на телефоне) со скользящей пилюлей. */
export function SectionNav<T extends string>({
  items,
  active,
  onChange,
}: {
  items: SectionNavItem<T>[]
  active: T
  onChange: (value: T) => void
}) {
  // на телефоне лента горизонтальная, на десктопе колонка, поэтому ось берём с контейнера
  const { navRef, setItemRef, rect } = useSlidingPill<HTMLElement>(active, {
    axis: 'auto',
    deps: items.length,
  })

  return (
    <nav
      ref={navRef}
      className="relative flex shrink-0 gap-1 overflow-x-auto no-scrollbar md:w-48 md:flex-col md:gap-1.5"
    >
      {rect && (
        <span
          aria-hidden
          className="absolute rounded-full bg-card shadow-[0_1px_3px_rgba(40,40,43,0.15)]"
          style={rect}
        />
      )}
      {items.map((item) => {
        const isActive = active === item.value
        return (
          <button
            key={item.value}
            type="button"
            ref={setItemRef(item.value)}
            onClick={() => onChange(item.value)}
            className={`relative z-10 flex shrink-0 items-center justify-between gap-2 rounded-full px-4 py-2 text-left text-sm transition-colors duration-300 ${
              isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
