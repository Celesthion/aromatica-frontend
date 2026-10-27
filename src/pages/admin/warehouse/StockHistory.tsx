import { Button, Spinner } from '@/shared/ui'
import { fetchHistory, queryKeys } from '@/shared/api'
import { amountTone, dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import { DOC_TYPE_LABELS } from '@/pages/admin/lib/labels'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'

export function StockHistory({ productId, warehouseId }: { productId: string; warehouseId?: string }) {
  // догружаем кнопкой: у панели нет своего скролла
  const history = useInfiniteList(queryKeys.history.list(productId, warehouseId), (page) =>
    fetchHistory(productId, warehouseId, page),
  )

  if (history.isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }
  if (history.rows.length === 0) {
    return <p className="px-6 py-5 text-sm text-muted-foreground">Движений нет</p>
  }
  return (
    <ul className="divide-y divide-border/50">
      {history.rows.map((m) => (
        <li key={m.id} className="px-6 py-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              {DOC_TYPE_LABELS[m.docType]} №{m.docNumber}
            </span>
            <span className={`shrink-0 tabular-nums ${amountTone(m.qtyDelta)}`}>
              {m.qtyDelta < 0 ? '' : '+'}
              {qtyFmt(m.qtyDelta)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{dateTimeFmt(m.moment)}</span>
            <span className="tabular-nums">по {money(m.costMinor)}</span>
          </div>
        </li>
      ))}
      {history.hasNextPage && (
        <li className="px-6 py-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={history.isFetchingNextPage}
            onClick={() => history.fetchNextPage()}
          >
            {history.isFetchingNextPage ? 'Загружаю…' : 'Ещё'}
          </Button>
        </li>
      )}
    </ul>
  )
}
