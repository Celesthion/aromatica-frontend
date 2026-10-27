import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Clock, FileText, IdCard, Pencil, Undo2, X } from 'lucide-react'
import { Spinner, ErrorNote, ConfirmPanel } from '@/shared/ui'
import {
  cancelDoc,
  fetchDoc,
  fetchDocEvents,
  fetchMoneyAccounts,
  fetchWarehouses,
  postDoc,
  unpostDoc,
  queryKeys,
} from '@/shared/api'
import { dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import {
  FastView,
  FastViewHeader,
  FastViewNav,
  FastViewNavButton,
  FastViewNavDivider,
} from '@/pages/admin/layout/FastView'
import { DocStatusChip } from './DocStatus'
import { invalidateDoc } from './docQueries'
import { docEventLine } from './DocHistory'
import type { DocEditorConfig } from './DocEditor'

type DocPanel = 'info' | 'history' | 'post' | 'unpost' | 'cancel'

/** Документ в фаст-вью; черновик правится в полном редакторе через onEdit. */
export function DocFastView({
  docId,
  config,
  onClose,
  onEdit,
}: {
  docId: string
  config: DocEditorConfig
  onClose: () => void
  onEdit: (docId: string) => void
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [panel, setPanel] = useState<DocPanel>('info')

  useEffect(() => {
    setPanel('info')
    setError(null)
  }, [docId])

  const doc = useQuery({ queryKey: queryKeys.doc(docId), queryFn: () => fetchDoc(docId) })
  const events = useQuery({
    queryKey: queryKeys.docEvents(docId),
    queryFn: () => fetchDocEvents(docId),
  })
  const warehouses = useQuery({ queryKey: queryKeys.warehouses, queryFn: fetchWarehouses })
  const accounts = useQuery({
    queryKey: queryKeys.moneyAccounts,
    queryFn: fetchMoneyAccounts,
    enabled: config.payment === 'account',
  })

  const invalidate = () => invalidateDoc(queryClient, docId)

  const post = useMutation({
    mutationFn: () => postDoc(docId),
    onSuccess: () => {
      setError(null)
      invalidate()
      onClose()
    },
    onError: (e) => setError(e.message),
  })
  const unpost = useMutation({
    mutationFn: () => unpostDoc(docId),
    onSuccess: () => {
      setError(null)
      setPanel('info')
      invalidate()
    },
    onError: (e) => setError(e.message),
  })
  const cancel = useMutation({
    mutationFn: () => cancelDoc(docId),
    onSuccess: () => {
      invalidate()
      onClose()
    },
    onError: (e) => setError(e.message),
  })

  const busy = post.isPending || unpost.isPending || cancel.isPending

  if (!doc.data) {
    return (
      <FastView
        onClose={onClose}
        header={
          <div className="flex h-28 items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        }
      >
        <div />
      </FastView>
    )
  }

  const d = doc.data
  const warehouseName = warehouses.data?.find((w) => w.id === d.warehouseId)?.name
  const warehouseToName = d.warehouseToId
    ? warehouses.data?.find((w) => w.id === d.warehouseToId)?.name
    : null
  const accountName = accounts.data?.find((a) => a.id === d.payAccountId)?.name
  return (
    <FastView
      onClose={onClose}
      nav={
        <FastViewNav>
          <FastViewNavButton
            icon={IdCard}
            label="Документ"
            active={panel === 'info'}
            onClick={() => setPanel('info')}
          />
          <FastViewNavButton
            icon={Clock}
            label="История"
            active={panel === 'history'}
            onClick={() => setPanel('history')}
          />

          {d.status === 'DRAFT' && (
            <>
              <FastViewNavDivider />
              <FastViewNavButton
                icon={Pencil}
                label="Редактировать"
                disabled={busy}
                onClick={() => onEdit(docId)}
              />
              <FastViewNavButton
                icon={Check}
                label="Провести"
                active={panel === 'post'}
                disabled={busy}
                onClick={() => {
                  setError(null)
                  setPanel('post')
                }}
              />
              <FastViewNavButton
                icon={X}
                label="Отменить документ"
                active={panel === 'cancel'}
                tone="danger"
                disabled={busy}
                onClick={() => {
                  setError(null)
                  setPanel('cancel')
                }}
              />
            </>
          )}
          {d.status === 'POSTED' && (
            <>
              <FastViewNavDivider />
              <FastViewNavButton
                icon={Undo2}
                label="Распровести"
                active={panel === 'unpost'}
                disabled={busy}
                onClick={() => {
                  setError(null)
                  setPanel('unpost')
                }}
              />
            </>
          )}
        </FastViewNav>
      }
      header={
        <FastViewHeader icon={FileText}>
          <DocStatusChip status={d.status} className="absolute left-4 top-3.5 z-10" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl tracking-tight">{config.titleOf(d.number)}</h2>
            <p className="truncate text-sm text-muted-foreground">{dateTimeFmt(d.moment)}</p>
            {d.counterpartyName && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{d.counterpartyName}</p>
            )}
            <div className="mt-2 font-display text-2xl tabular-nums">{money(d.sumMinor)}</div>
          </div>
        </FastViewHeader>
      }
    >
      {error && (
        <div className="px-6 pt-5">
          <ErrorNote error={error} />
        </div>
      )}

      {panel === 'info' && (
        <>
          <div className="space-y-3 px-6 py-5 text-sm">
            {warehouseToName ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Откуда</span>
                  <span className="min-w-0 truncate">{warehouseName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Куда</span>
                  <span className="min-w-0 truncate">{warehouseToName}</span>
                </div>
              </>
            ) : (
              warehouseName && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Склад</span>
                  <span className="min-w-0 truncate">{warehouseName}</span>
                </div>
              )
            )}
            {config.payment === 'split' && (
              <>
                {d.cashMinor > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Наличными</span>
                    <span className="tabular-nums">{money(d.cashMinor)}</span>
                  </div>
                )}
                {d.noCashMinor > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Переводом</span>
                    <span className="tabular-nums">{money(d.noCashMinor)}</span>
                  </div>
                )}
                {d.cashMinor === 0 && d.noCashMinor === 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Оплата</span>
                    <span className="text-muted-foreground">вся наличными</span>
                  </div>
                )}
              </>
            )}
            {config.payment === 'account' && accountName && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {config.type === 'SUPPLY' ? 'Оплата со счёта' : 'Деньги на счёт'}
                </span>
                <span className="min-w-0 truncate">{accountName}</span>
              </div>
            )}
            {d.comment && (
              <div>
                <span className="mb-0.5 block text-xs text-muted-foreground">Комментарий</span>
                <p className="whitespace-pre-wrap">{d.comment}</p>
              </div>
            )}
          </div>

          <div className="border-t border-border/50">
            <div className="px-6 pb-1 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Позиции ({d.lines.length})
            </div>
            <ul className="divide-y divide-border/50">
              {d.lines.map((l) => (
                <li key={l.id} className="px-6 py-2.5 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">{l.productName}</span>
                    {config.showPrice && (
                      <span className="shrink-0 font-medium tabular-nums">{money(l.sumMinor)}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {qtyFmt(l.qty)}
                    {config.showPrice
                      ? ` × ${money(l.priceMinor)}${l.discountMinor ? ` − ${money(l.discountMinor)}` : ''}`
                      : l.costMinor != null
                        ? ` · себест. ${money(l.costMinor)}`
                        : ''}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {panel === 'history' && (
        <div className="px-6 py-5">
          {events.data && events.data.length > 0 ? (
            <div className="space-y-1">
              {events.data.map((e, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  {docEventLine(e)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Событий пока нет</p>
          )}
        </div>
      )}

      {panel === 'post' && (
        <ConfirmPanel
          tone="success"
          icon={Check}
          title="Провести документ?"
          description={
            <>
              Остатки и деньги обновятся по документу{' '}
              <span className="font-medium text-foreground">{config.titleOf(d.number)}</span>.
            </>
          }
          confirmLabel="Провести"
          busy={post.isPending}
          error={error}
          onConfirm={() => post.mutate()}
          onCancel={() => setPanel('info')}
        />
      )}

      {panel === 'unpost' && (
        <ConfirmPanel
          tone="warning"
          icon={Undo2}
          title="Распровести документ?"
          description="Проводки отменятся, остатки и деньги вернутся к состоянию до проведения. Документ станет черновиком."
          confirmLabel="Распровести"
          busy={unpost.isPending}
          error={error}
          onConfirm={() => unpost.mutate()}
          onCancel={() => setPanel('info')}
        />
      )}

      {panel === 'cancel' && (
        <ConfirmPanel
          tone="danger"
          icon={X}
          title="Отменить документ?"
          description={
            <>
              Черновик <span className="font-medium text-foreground">{config.titleOf(d.number)}</span> будет
              отменён.
            </>
          }
          confirmLabel="Отменить документ"
          busy={cancel.isPending}
          error={error}
          onConfirm={() => cancel.mutate()}
          onCancel={() => setPanel('info')}
        />
      )}
    </FastView>
  )
}
