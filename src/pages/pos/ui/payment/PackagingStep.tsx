import { useState } from 'react'
import { Minus, Package, Plus } from 'lucide-react'
import { Button } from '@/shared/ui'
import { money, qtyFmt } from '@/shared/lib/format'
import { imageUrl, type PosProduct } from '@/shared/api'
import { groupProducts } from '@/pages/pos/lib/grouping'
import type { ProductGroup } from '@/pages/pos/lib/types'
import { BackLink } from '@/pages/pos/ui/BackLink'
import { CARD_OFF, CARD_ON } from '@/pages/pos/ui/cardStyles'

/** Упаковка перед оплатой: карточка с одним вариантом добавляет его сразу, с несколькими раскрывает список. */
export function PackagingStep({
  packaging,
  packagingQty,
  packagingCount,
  packagingMinor,
  onChange,
  onContinue,
}: {
  packaging: PosProduct[]
  /** id упаковки -> количество */
  packagingQty: Record<string, number>
  packagingCount: number
  packagingMinor: number
  onChange: (p: PosProduct, delta: number) => void
  onContinue: () => void
}) {
  // раскрытая карточка упаковки
  const [pkgGroup, setPkgGroup] = useState<ProductGroup | null>(null)

  return (
    <>
      {pkgGroup == null ? (
        <>
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" strokeWidth={1.7} />
            Предложите клиенту упаковку
          </p>
          <div className="grid max-h-[52vh] grid-cols-3 gap-2.5 overflow-y-auto p-1 pr-1.5">
            {groupProducts(packaging).map((g) => {
              const total = g.variants.reduce((s, v) => s + (packagingQty[v.id] ?? 0), 0)
              const out = g.totalQty <= 0
              const single = g.variants.length === 1
              const first = g.variants[0]
              const inCart = single ? (packagingQty[first.id] ?? 0) : 0
              const minPrice = Math.min(...g.variants.map((v) => v.priceMinor ?? 0))
              const activate = () => {
                if (single) {
                  if (inCart < first.qty) onChange(first, 1)
                } else setPkgGroup(g)
              }
              return (
                <div
                  key={g.key}
                  role="button"
                  tabIndex={out ? -1 : 0}
                  onClick={() => {
                    if (!out) activate()
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !out) {
                      e.preventDefault()
                      activate()
                    }
                  }}
                  className={`relative flex select-none flex-col items-center rounded-2xl border p-3 text-center transition-all ${
                    out
                      ? 'cursor-not-allowed border-border/50 opacity-40'
                      : `cursor-pointer ${total > 0 ? CARD_ON : CARD_OFF}`
                  }`}
                >
                  {total > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 z-10 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground shadow">
                      {total}
                    </span>
                  )}
                  {/* без фото зелёная подложка, как у PosThumb */}
                  <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-tint-pack to-tint-pack-deep">
                    {g.imageId ? (
                      <img
                        src={imageUrl(g.imageId)}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-brand-good-deep" strokeWidth={1.6} />
                    )}
                  </span>
                  <span className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{g.model}</span>
                  <span className="mt-auto pt-1 text-sm font-semibold tracking-tight">
                    {single ? money(first.priceMinor ?? 0) : `от ${money(minPrice)}`}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {out
                      ? 'нет в наличии'
                      : single
                        ? `остаток ${qtyFmt(g.totalQty)}`
                        : `${g.variants.length} вар. · остаток ${qtyFmt(g.totalQty)}`}
                  </span>
                  {/* место под степпер держим всегда, чтобы сетка не прыгала; степпер только у одиночных */}
                  <div
                    className={`mt-1.5 flex h-7 w-full items-center justify-center gap-3 ${single && inCart > 0 ? '' : 'invisible'}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(first, -1)
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full border border-border/70 bg-background transition hover:bg-secondary"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[1.25rem] text-sm font-semibold tabular-nums">{inCart}</span>
                    <button
                      type="button"
                      disabled={single && inCart >= first.qty}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(first, 1)
                      }}
                      className="grid h-7 w-7 place-items-center rounded-full border border-border/70 bg-background transition hover:bg-secondary disabled:opacity-30"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <BackLink onClick={() => setPkgGroup(null)}>
            {pkgGroup.model}
            <span className="text-muted-foreground/60">· ко всем упаковкам</span>
          </BackLink>
          <div className="max-h-[52vh] space-y-1 overflow-y-auto pr-1">
            {[...pkgGroup.variants]
              .sort((a, b) => (a.priceMinor ?? 0) - (b.priceMinor ?? 0))
              .map((v) => {
                const q = packagingQty[v.id] ?? 0
                const outOfStock = v.qty <= 0
                return (
                  <div
                    key={v.id}
                    role="button"
                    tabIndex={outOfStock ? -1 : 0}
                    onClick={() => !outOfStock && q < v.qty && onChange(v, 1)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !outOfStock && q < v.qty) {
                        e.preventDefault()
                        onChange(v, 1)
                      }
                    }}
                    className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-[13px] transition ${
                      outOfStock
                        ? 'cursor-not-allowed border-border/50 opacity-40'
                        : q > 0
                          ? 'cursor-pointer border-primary/50 bg-primary/[0.06]'
                          : 'cursor-pointer border-border/60 hover:border-primary/40 hover:bg-secondary'
                    }`}
                  >
                    {/* без лейбла вместо названия показываем цену */}
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {v.label ?? (v.priceMinor != null ? money(v.priceMinor) : '—')}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {outOfStock ? 'нет в наличии' : `остаток ${qtyFmt(v.qty)}`}
                    </span>
                    {v.label && q === 0 && (
                      <span className="shrink-0 font-medium tabular-nums">
                        {v.priceMinor != null ? money(v.priceMinor) : '—'}
                      </span>
                    )}
                    {q > 0 ? (
                      <span className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onChange(v, -1)
                          }}
                          className="grid h-7 w-7 place-items-center rounded-full border border-border/70 bg-background transition hover:bg-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center font-semibold tabular-nums">{q}</span>
                        <button
                          type="button"
                          disabled={q >= v.qty}
                          onClick={(e) => {
                            e.stopPropagation()
                            onChange(v, 1)
                          }}
                          className="grid h-7 w-7 place-items-center rounded-full border border-border/70 bg-background transition hover:bg-secondary disabled:opacity-30"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : (
                      <Plus
                        className={`h-4 w-4 shrink-0 text-muted-foreground ${outOfStock ? 'invisible' : ''}`}
                      />
                    )}
                  </div>
                )
              })}
          </div>
        </>
      )}

      <Button className="mt-5 h-12 w-full text-base" onClick={onContinue}>
        Продолжить оплату
        {packagingCount > 0 && <span className="ml-2 opacity-80">· упаковка {money(packagingMinor)}</span>}
      </Button>
    </>
  )
}
