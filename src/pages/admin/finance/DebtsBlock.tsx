import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, HandCoins } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote } from '@/shared/ui'
import { fetchDebts, payDoc, queryKeys, type MoneyAccount } from '@/shared/api'
import { dateTimeFmt, money } from '@/shared/lib/format'
import { DOC_TYPE_LABELS } from '@/pages/admin/lib/labels'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'

/** Долги поставщикам: неоплаченные приёмки, которые можно оплатить со счёта в один клик. */
export function DebtsBlock({ accounts }: { accounts: MoneyAccount[] }) {
  const debts = useQuery({ queryKey: queryKeys.debts, queryFn: fetchDebts })
  const [openRowKey, setOpenRowKey] = useState<string | null>(null)
  const [payingDoc, setPayingDoc] = useState<string | null>(null)
  const [accountId, setAccountId] = useState('')
  const payAccountId = accountId || accounts[0]?.id

  const pay = useEntityMutation({
    mutationFn: (docId: string) => payDoc(docId, payAccountId),
    invalidate: [queryKeys.debts, queryKeys.moneyAccounts, queryKeys.moneyMovements.all],
    onDone: () => setPayingDoc(null),
  })

  if (!debts.data || debts.data.length === 0) return null

  const total = debts.data.reduce((s, d) => s + d.debtMinor, 0)

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-brand-warn/30 bg-brand-warn/10">
      <div className="flex items-center gap-2 px-5 py-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-warn/15 text-brand-warn">
          <HandCoins className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <h2 className="font-display text-lg tracking-tight">Долги поставщикам</h2>
        <span className="ml-auto font-display text-lg tabular-nums text-brand-warn">{money(total)}</span>
      </div>
      {debts.data.map((d) => {
        const rowKey = d.counterpartyId ?? 'none'
        const open = openRowKey === rowKey
        return (
          <div key={rowKey} className="border-t border-brand-warn/30">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-sm hover:bg-brand-warn/15"
              onClick={() => setOpenRowKey(open ? null : rowKey)}
            >
              {open ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="flex-1">{d.counterpartyName}</span>
              <span className="font-medium tabular-nums">{money(d.debtMinor)}</span>
            </button>
            {open && (
              <div className="space-y-1.5 px-5 pb-3 pl-11">
                {d.docs.map((doc) => (
                  <div key={doc.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      {DOC_TYPE_LABELS[doc.docType]} №{doc.number}
                    </span>
                    <span className="text-xs text-muted-foreground">{dateTimeFmt(doc.moment)}</span>
                    <span className="font-medium tabular-nums">{money(doc.sumMinor)}</span>
                    {payingDoc === doc.id ? (
                      <span className="flex items-center gap-2">
                        <select
                          className="field h-8 px-2"
                          value={payAccountId ?? ''}
                          onChange={(e) => setAccountId(e.target.value)}
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" disabled={pay.isPending} onClick={() => pay.mutate(doc.id)}>
                          {pay.isPending ? <ButtonSpinner /> : 'Оплатить'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPayingDoc(null)}>
                          Отмена
                        </Button>
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setPayingDoc(doc.id)}>
                        Оплатить
                      </Button>
                    )}
                  </div>
                ))}
                <ErrorNote error={pay.error} className="text-xs" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
