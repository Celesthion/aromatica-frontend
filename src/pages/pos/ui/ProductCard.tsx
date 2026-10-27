import type { ProductKindInfo } from '@/shared/api'
import { UNIT_LABELS, qtyFmt } from '@/shared/lib/format'
import { kindIcon } from '@/shared/lib/kindIcons'
import { kindAccent } from '@/shared/lib/kinds'
import type { ProductGroup } from '@/pages/pos/lib/types'
import { PosThumb } from './PosThumb'

/** Карточка группы в сетке кассы: модель в одной форме, варианты выбираются в окне. */
export function ProductCard({
  group: g,
  kindLabel,
  kindInfo,
  onClick,
}: {
  group: ProductGroup
  kindLabel: string
  kindInfo?: ProductKindInfo
  onClick: () => void
}) {
  // нет остатка ни в одном варианте: карточка видна, но неактивна
  const outOfStock = g.totalQty <= 0
  const many = g.variants.length > 1
  const accent = kindAccent(g.kind, kindInfo?.color)
  const KindIcon = kindIcon(g.kind, kindInfo?.icon)
  // единственный вариант уходит в чек сразу, поэтому показываем его отличие (объём, цвет)
  const only = many ? null : g.variants[0]
  const onlyTag = only
    ? only.label?.trim() || (only.volumeMl != null ? `${qtyFmt(only.volumeMl)} мл` : '')
    : ''

  return (
    <button
      type="button"
      disabled={outOfStock}
      onClick={onClick}
      className={`group flex min-h-[116px] items-stretch overflow-hidden rounded-3xl border border-glass-line bg-gradient-to-b from-surface-from to-surface-to backdrop-blur-xl backdrop-saturate-150 text-left shadow-soft-sm transition duration-200 ${
        outOfStock
          ? 'cursor-not-allowed opacity-45'
          : 'hover:-translate-y-0.5 hover:border-brand-green/30 hover:shadow-soft active:translate-y-0'
      }`}
    >
      <span className="relative w-[88px] shrink-0 overflow-hidden">
        <PosThumb kind={g.kind} imageId={g.imageId} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col p-2.5">
        {g.brand && (
          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
            {g.brand}
          </span>
        )}
        <span className="line-clamp-2 text-[13.5px] font-semibold leading-snug">{g.model}</span>

        <span className="mt-auto pt-2">
          <span className="block truncate text-[12.5px] font-medium" style={{ color: accent }}>
            {kindLabel}
          </span>
          <span className="mt-1 flex items-center justify-between gap-1.5">
            <span
              aria-hidden
              className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: `${accent}22`, color: accent }}
            >
              <KindIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
            <span className="flex items-center gap-1 text-[10.5px] tabular-nums text-muted-foreground/70">
              {many ? <span>{g.variants.length} вар.</span> : onlyTag ? <span>{onlyTag}</span> : null}
              {(many || onlyTag) && <span className="text-muted-foreground/40">·</span>}
              <span className={outOfStock ? 'text-destructive' : 'text-muted-foreground/80'}>
                {outOfStock && g.minusQty === 0
                  ? 'нет'
                  : !outOfStock
                    ? `${qtyFmt(g.totalQty)} ${UNIT_LABELS[g.unit]}`
                    : null}
                {g.minusQty > 0 && (
                  <span className="text-destructive">
                    {outOfStock ? '' : ' · '}−{qtyFmt(g.minusQty)} {UNIT_LABELS[g.unit]}
                  </span>
                )}
              </span>
            </span>
          </span>
        </span>
      </span>
    </button>
  )
}
