import { Link } from '@tanstack/react-router'
import { ACTIVE_PILL, Tooltip } from '@/shared/ui'
import { useSlidingPill } from '@/shared/lib/useSlidingPill'
import { isItemActive, type AdminModuleItem } from './modules'
import { railItemClass } from './navStyles'

/** Боковая колонка разделов модуля; на главной пустая, но держит выравнивание листа. */
export function SubRail({ items, pathname }: { items: AdminModuleItem[]; pathname: string }) {
  const activeTo = items.find((i) => isItemActive(i, pathname))?.to ?? ''
  const { navRef, setItemRef, rect } = useSlidingPill<HTMLElement>(activeTo, {
    axis: 'y',
    deps: items.length,
  })

  return (
    <nav
      ref={navRef}
      className="relative hidden w-14 shrink-0 flex-col items-center gap-1.5 px-1 pb-3 pt-1 sm:flex"
    >
      {rect && activeTo && <span aria-hidden className={ACTIVE_PILL} style={rect} />}
      {items.map((item) => {
        const ItemIcon = item.icon
        return (
          <Tooltip key={item.to} label={item.label} side="right">
            <Link to={item.to} ref={setItemRef(item.to)} className={railItemClass(item.to === activeTo)}>
              <ItemIcon className="h-5 w-5" strokeWidth={1.6} />
            </Link>
          </Tooltip>
        )
      })}
    </nav>
  )
}
