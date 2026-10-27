import { Trash2 } from 'lucide-react'
import { Button, CARD, PageLoader } from '@/shared/ui'
import { fetchMoneyMovements, queryKeys, type MoneyMovement } from '@/shared/api'
import { amountTone, dateTimeFmt, money } from '@/shared/lib/format'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import { TABLE, THEAD, THEAD_TR } from '@/pages/admin/layout/ListLayout'

/** Журнал движений денег; ручные операции можно удалить. */
export function MovementsJournal({
  accountId,
  onRemove,
}: {
  accountId: string
  onRemove: (movement: MoneyMovement) => void
}) {
  const movements = useInfiniteList(queryKeys.moneyMovements.list(accountId), (page) =>
    fetchMoneyMovements(accountId || undefined, page),
  )

  return (
    <div className={`${CARD} p-6`}>
      <h2 className="mb-4 font-display text-lg tracking-tight">Журнал операций</h2>
      {movements.isLoading ? (
        <PageLoader className="py-16" />
      ) : movements.rows.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Движений денег ещё нет</p>
      ) : (
        <div
          ref={movements.rootRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-2xl border border-glass-line bg-glass-strong backdrop-blur-xl backdrop-saturate-150"
        >
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <th className="px-3 py-2.5 font-medium">Дата</th>
                <th className="px-3 py-2.5 font-medium">Счёт</th>
                <th className="px-3 py-2.5 font-medium">Основание</th>
                <th className="px-3 py-2.5 text-right font-medium">Сумма</th>
                <th className="w-12 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {movements.rows.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/40"
                >
                  <td className="px-3 py-3 whitespace-nowrap">{dateTimeFmt(m.moment)}</td>
                  <td className="px-3 py-3" data-label="Счёт">
                    {m.accountName}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground" data-label="Основание">
                    {m.docLabel ?? m.comment ?? 'Ручная операция'}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-medium tabular-nums ${amountTone(m.amountMinor)}`}
                    data-label="Сумма"
                  >
                    {m.amountMinor > 0 ? '+' : ''}
                    {money(m.amountMinor)}
                  </td>
                  <td className="px-2 py-3">
                    {m.docId == null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Удалить ручное движение"
                        onClick={() => onRemove(m)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {movements.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </div>
      )}
    </div>
  )
}
