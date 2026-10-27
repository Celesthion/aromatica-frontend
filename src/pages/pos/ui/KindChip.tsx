/** Чип формы над сеткой товаров; подложка активного одна на всех и переезжает. */
export function KindChip({
  active,
  onClick,
  chipRef,
  children,
}: {
  active: boolean
  onClick: () => void
  chipRef: (el: HTMLElement | null) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      ref={chipRef}
      onClick={onClick}
      className={`relative z-10 h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[13.5px] transition-colors duration-300 ${
        active ? 'text-cta-ink' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
