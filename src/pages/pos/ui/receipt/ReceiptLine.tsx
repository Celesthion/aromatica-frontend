import { Archive, AlertTriangle, Minus, Plus, Trash2 } from 'lucide-react'
import { Money } from '@/shared/ui'
import { lineSumMinor, parseDecimal } from '@/shared/lib/money'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import { pricePerSprayMl, sprayForOil } from '@/entities/product/dilution'
import type { CartLine } from '@/pages/pos/lib/types'
import { PosThumb } from '@/pages/pos/ui/PosThumb'
import { LineDiscountInput } from './DiscountInputs'

/** Строка чека; количество и скидка правятся в панели по наведению, она висит поверх соседних строк. */
export function ReceiptLine({
  line: l,
  index: i,
  patchLine,
  removeLine,
  onToShelf,
}: {
  line: CartLine
  index: number
  patchLine: (index: number, patch: Partial<CartLine>) => void
  removeLine: (index: number) => void
  /** Только у связок: налили, а клиент передумал. */
  onToShelf?: (line: CartLine) => void
}) {
  // у комплекта фиксированная цена, скидки на него нет
  const kit = l.product.kind === 'KIT'
  // налитое в тару количеством не правится, только новым наливом
  const poured = l.product.unit === 'ML'
  // у разлива в строке масло, а показываем флакон клиента
  const shownQty = l.dilutionPct != null ? sprayForOil(l.qty, l.dilutionPct) : l.qty
  return (
    <div className="group relative border-t border-white/[0.07] py-2 first:border-t-0">
      <div className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1 transition-all duration-150 group-hover:-translate-x-1.5 group-hover:bg-white/[0.05]">
        <PosThumb kind={l.product.kind} variant="tile" imageId={l.product.mainImageId} />
        <span className="min-w-0 flex-1">
          <b className="block truncate text-[13.5px] font-medium leading-snug">{l.product.name}</b>
          <small className="text-[11.5px] text-white/45">
            {l.dilutionPct != null ? (
              <>
                {qtyFmt(shownQty)} мл · {qtyFmt(l.dilutionPct)} %{' × '}
                {money(pricePerSprayMl(l.priceMinor, l.dilutionPct))}
              </>
            ) : (
              <>
                {qtyFmt(l.qty)} {UNIT_LABELS[l.product.unit]} × {money(l.priceMinor)}
              </>
            )}
            {l.discountMinor > 0 && ` · −${money(l.discountMinor)}`}
            {l.warehouseId != null && ' · с полки'}
          </small>
        </span>
        <span className="w-[76px] shrink-0 whitespace-nowrap text-right text-[13.5px] font-medium">
          <Money minor={lineSumMinor(l.qty, l.priceMinor, l.discountMinor)} />
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-full z-20 translate-y-[-6px] rounded-xl border border-white/10 bg-brand-graphite-panel p-2 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <p className="mb-2 px-1 text-[12.5px] leading-snug text-white/70">{l.product.name}</p>
        <div className="flex items-center gap-2">
          {poured ? (
            <span className="shrink-0 rounded-full bg-white/[0.09] px-3 py-1 text-[13px] tabular-nums text-white/70">
              {qtyFmt(shownQty)} мл
            </span>
          ) : (
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.09] p-1">
              <button
                type="button"
                className="grid h-6 w-6 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                // минус на единице удаляет строку
                onClick={() => (l.qty - 1 <= 0 ? removeLine(i) : patchLine(i, { qty: l.qty - 1 }))}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                className="w-9 border-0 bg-transparent text-center text-[13px] tabular-nums text-white outline-none"
                inputMode="decimal"
                value={l.qty}
                onChange={(e) => {
                  const n = parseDecimal(e.target.value)
                  patchLine(i, { qty: Number.isFinite(n) && n >= 0 ? n : 0 })
                }}
              />
              <button
                type="button"
                className="grid h-6 w-6 place-items-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => patchLine(i, { qty: l.qty + 1 })}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* цену не правят: для уступки есть скидка, её потолок проверяет сервер */}
          {!kit && (
            <>
              <span className="text-[11px] text-white/45">Скидка</span>
              <LineDiscountInput line={l} onChange={(minor) => patchLine(i, { discountMinor: minor })} />
            </>
          )}
          {l.bundleId != null && onToShelf && (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Налили, а клиент передумал — флакон на полку"
              onClick={() => onToShelf(l)}
            >
              <Archive className="h-3.5 w-3.5" />
              На полку
            </button>
          )}
          <button
            type="button"
            className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-white/60 transition-colors hover:bg-destructive/20 hover:text-brand-bad-soft"
            onClick={() => removeLine(i)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Убрать
          </button>
        </div>
      </div>

      {l.qty > l.product.qty && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-bad-soft">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          на складе {qtyFmt(Math.max(0, l.product.qty))} {UNIT_LABELS[l.product.unit]} — продать столько
          нельзя
        </p>
      )}
    </div>
  )
}
