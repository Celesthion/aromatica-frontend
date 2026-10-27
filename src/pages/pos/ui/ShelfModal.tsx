import { useQuery } from '@tanstack/react-query'
import { Modal, Spinner } from '@/shared/ui'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import { fetchPosShelf, type PosProduct, type PosShift, queryKeys } from '@/shared/api'
import { PosThumb } from './PosThumb'

/**
 * Полка склада смены: готовые флаконы, комплекты и возвраты.
 * На витрине их нет, продаются только отсюда и штуками. Количество правят уже в чеке.
 */
export function ShelfModal({
  shift,
  inCartQty,
  onPick,
  onClose,
}: {
  shift: PosShift
  /** Сколько этого товара уже в чеке, чтобы не предлагать больше, чем лежит. */
  inCartQty: (productId: string) => number
  /** Позиция и склад-полка, с которого она уходит в чек. */
  onPick: (p: PosProduct, shelfId: string) => void
  onClose: () => void
}) {
  const list = useQuery({
    queryKey: queryKeys.pos.shelf.byWarehouse(shift.warehouseId),
    queryFn: () => fetchPosShelf(shift.warehouseId),
  })

  return (
    <Modal align="center" maxWidth="max-w-lg" onClose={onClose} title="Полка">
      {!list.data ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : list.data.items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          На полке пусто. Сюда попадает налитое, от которого отказались, и принесённое обратно.
        </p>
      ) : (
        <div className="max-h-[60vh] divide-y divide-border/40 overflow-y-auto">
          {list.data.items.map((p) => {
            const left = p.qty - inCartQty(p.id)
            return (
              <button
                key={p.id}
                type="button"
                disabled={left <= 0}
                onClick={() => onPick(p, list.data.warehouseId)}
                className="flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="shrink-0 rounded-xl bg-secondary">
                  <PosThumb kind={p.kind} variant="tile" imageId={p.mainImageId} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {left <= 0 ? 'всё уже в чеке' : `${qtyFmt(left)} ${UNIT_LABELS[p.unit]}`}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {p.priceMinor != null ? money(p.priceMinor) : '—'}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
