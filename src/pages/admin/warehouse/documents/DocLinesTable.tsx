import type { LineDto } from '@/shared/api'
import { money } from '@/shared/lib/format'
import type { DocEditorConfig } from './DocEditor'
import { LineNumCell, RemoveLineCell } from './DocLineCells'
import { lineSum, type EditableLine } from './docLines'

export function DocLinesTable({
  config,
  lines,
  savedLines,
  readOnly,
  onPatch,
  onRemove,
}: {
  config: DocEditorConfig
  lines: EditableLine[]
  /** Строки сохранённого документа: из них берётся себестоимость. */
  savedLines: LineDto[] | undefined
  readOnly: boolean
  onPatch: (i: number, patch: Partial<EditableLine>) => void
  onRemove: (i: number) => void
}) {
  const totalMinor = config.showPrice ? lines.reduce((s, l) => s + lineSum(l), 0) : 0
  const priceCols = config.showPrice ? (config.noDiscount ? 2 : 3) : 0
  const columns = 1 + 1 + priceCols + (readOnly && !config.showPrice ? 1 : 0) + (readOnly ? 0 : 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 font-medium">Товар</th>
            <th className="w-32 px-4 py-3 text-right font-medium">{config.qtyLabel ?? 'Кол-во'}</th>
            {config.showPrice && (
              <>
                <th className="w-36 px-4 py-3 text-right font-medium">{config.priceLabel ?? 'Цена, с'}</th>
                {!config.noDiscount && <th className="w-28 px-4 py-3 text-right font-medium">Скидка, %</th>}
                <th className="w-36 px-4 py-3 text-right font-medium">Сумма</th>
              </>
            )}
            {readOnly && !config.showPrice && (
              <th className="w-36 px-4 py-3 text-right font-medium">Себестоимость</th>
            )}
            {!readOnly && <th className="w-12 px-2 py-3" />}
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={columns} className="px-4 py-10 text-center text-muted-foreground">
                Добавьте товары через поиск выше
              </td>
            </tr>
          ) : (
            lines.map((l, i) => {
              const cost = savedLines?.[i]?.costMinor
              return (
                <tr key={`${l.productId}-${i}`} className="border-b last:border-0">
                  <td className="px-4 py-2">{l.productName}</td>
                  <LineNumCell readOnly={readOnly} value={l.qty} onChange={(qty) => onPatch(i, { qty })} />
                  {config.showPrice && (
                    <>
                      <LineNumCell
                        readOnly={readOnly}
                        value={l.priceSom}
                        onChange={(priceSom) => onPatch(i, { priceSom })}
                      />
                      {!config.noDiscount && (
                        <LineNumCell
                          readOnly={readOnly}
                          value={l.discountPct}
                          display={l.discountPct || '—'}
                          onChange={(discountPct) => onPatch(i, { discountPct })}
                        />
                      )}
                      <td className="px-4 py-2 text-right tabular-nums">{money(lineSum(l))}</td>
                    </>
                  )}
                  {readOnly && !config.showPrice && (
                    <td className="px-4 py-2 text-right tabular-nums">{cost != null ? money(cost) : '—'}</td>
                  )}
                  {!readOnly && <RemoveLineCell onRemove={() => onRemove(i)} />}
                </tr>
              )
            })
          )}
        </tbody>
        {config.showPrice && lines.length > 0 && (
          <tfoot>
            <tr className="bg-muted/30">
              <td className="px-4 py-3 font-medium" colSpan={2}>
                Итого
              </td>
              <td colSpan={priceCols} className="px-4 py-3 text-right font-medium tabular-nums">
                {money(totalMinor)}
              </td>
              {!readOnly && <td />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
