import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, DoorClosed, DoorOpen, Receipt, Store, Wallet } from 'lucide-react'
import { Button, Field, Spinner, StatusChip } from '@/shared/ui'
import { fetchOpenShifts, fetchShifts, queryKeys, type PosShift } from '@/shared/api'
import { dateTimeFmt, money } from '@/shared/lib/format'
import {
  ShiftDiff,
  ShiftSummaryBody,
  receiptLinesSummary,
  useShiftReceipts,
} from '@/entities/shift/shiftSummary'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import {
  KpiCard,
  ListShell,
  ListStats,
  ListTable,
  ListToolbar,
  TABLE,
  THEAD,
} from '@/pages/admin/layout/ListLayout'
import {
  FastView,
  FastViewHeader,
  FastViewNav,
  FastViewNavButton,
  FastViewPortal,
} from '@/pages/admin/layout/FastView'
import { PosSettingsButton } from './PosSettingsButton'

type ShiftPanel = 'summary' | 'receipts'

/** История кассовых смен; по строке открываются сводка и чеки смены. */
export function ShiftsPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'' | 'OPEN' | 'CLOSED'>('')
  const list = useInfiniteList(queryKeys.shifts.list(q, status), (page) =>
    fetchShifts(page, q, status || undefined),
  )

  // открытые смены для KPI: сколько касс работает и сколько в них размена
  const openShifts = useQuery({
    queryKey: queryKeys.shifts.open,
    queryFn: fetchOpenShifts,
  })
  const openCount = openShifts.data?.length
  const openFloatMinor = openShifts.data?.reduce((sum, s) => sum + s.openingCashMinor, 0)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [panel, setPanel] = useState<ShiftPanel>('summary')

  const items = list.rows
  const selected = selectedId ? (items.find((s) => s.id === selectedId) ?? null) : null

  // при выборе другой смены начинаем со сводки
  useEffect(() => setPanel('summary'), [selectedId])

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Всего смен"
          value={list.total ? String(list.total) : '…'}
          sub="за всю историю"
          icon={ClipboardList}
          dark
        />
        <KpiCard
          label="Открыто сейчас"
          value={openCount != null ? String(openCount) : '…'}
          sub="кассы в работе"
          icon={DoorOpen}
          tone="good"
          dark
        />
        <KpiCard
          label="Закрыто"
          value={list.total && openCount != null ? String(Math.max(0, list.total - openCount)) : '…'}
          sub="завершённые смены"
          icon={DoorClosed}
          dark
        />
        <KpiCard
          label="Размен в кассах"
          value={openFloatMinor != null ? money(openFloatMinor) : '…'}
          sub="в открытых сменах"
          icon={Wallet}
          tone="warn"
          dark
        />
      </ListStats>

      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск по номеру смены…"
        filtersCount={status ? 1 : 0}
        filters={
          <Field label="Статус">
            <select
              className="field w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value as '' | 'OPEN' | 'CLOSED')}
            >
              <option value="">Все смены</option>
              <option value="OPEN">Открытые</option>
              <option value="CLOSED">Закрытые</option>
            </select>
          </Field>
        }
      >
        <Link to="/admin/pos">
          <Button>
            <Store className="mr-2 h-4 w-4" />
            Открыть кассу
          </Button>
        </Link>
        <PosSettingsButton />
      </ListToolbar>

      {list.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Смен ещё не было — откройте кассу</p>
      ) : (
        <ListTable ref={list.rootRef} loadingMore={list.isFetchingNextPage}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-normal">№</th>
                <th className="pb-2 pr-3 font-normal">Статус</th>
                <th className="pb-2 pr-3 font-normal">Склад</th>
                <th className="pb-2 pr-3 font-normal">Открыта</th>
                <th className="pb-2 pr-3 font-normal">Закрыта</th>
                {!selected && (
                  <>
                    <th className="pb-2 pr-3 text-right font-normal">Размен</th>
                    <th className="pb-2 pr-3 text-right font-normal">Нал (расчёт)</th>
                    <th className="pb-2 pr-3 text-right font-normal">Нал (факт)</th>
                    <th className="pb-2 text-right font-normal">Расхождение</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`cursor-pointer border-b border-border/40 transition-colors ${
                    selectedId === s.id ? 'bg-muted/60' : 'hover:bg-muted/50'
                  }`}
                >
                  <td className="py-2.5 pr-3 font-medium">№{s.number}</td>
                  <td className="py-2.5 pr-3" data-label="Статус">
                    <ShiftStatusChip status={s.status} />
                  </td>
                  <td className="py-2.5 pr-3" data-label="Склад">
                    {s.warehouseName}
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground" data-label="Открыта">
                    {dateTimeFmt(s.openedAt)} · {s.openedBy}
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground" data-label="Закрыта">
                    {s.closedAt ? `${dateTimeFmt(s.closedAt)} · ${s.closedBy}` : '—'}
                  </td>
                  {!selected && (
                    <>
                      <td className="py-2.5 pr-3 text-right" data-label="Размен">
                        {money(s.openingCashMinor)}
                      </td>
                      <td className="py-2.5 pr-3 text-right" data-label="Нал (расчёт)">
                        {s.expectedCashMinor != null ? money(s.expectedCashMinor) : '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-right" data-label="Нал (факт)">
                        {s.countedCashMinor != null ? money(s.countedCashMinor) : '—'}
                      </td>
                      <td className="py-2.5 text-right" data-label="Расхождение">
                        <ShiftDiff shift={s} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </ListTable>
      )}

      <FastViewPortal open={selected != null}>
        {selected && (
          <FastView
            onClose={() => setSelectedId(null)}
            nav={
              <FastViewNav>
                <FastViewNavButton
                  icon={ClipboardList}
                  label="Сводка"
                  active={panel === 'summary'}
                  onClick={() => setPanel('summary')}
                />
                <FastViewNavButton
                  icon={Receipt}
                  label="Чеки"
                  active={panel === 'receipts'}
                  onClick={() => setPanel('receipts')}
                />
              </FastViewNav>
            }
            header={
              <FastViewHeader icon={Store}>
                <span className="absolute left-4 top-3.5 z-10">
                  <ShiftStatusChip status={selected.status} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-xl tracking-tight">Смена №{selected.number}</h2>
                  <p className="truncate text-sm text-muted-foreground">{selected.warehouseName}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Открыл <span className="text-foreground">{selected.openedBy}</span> ·{' '}
                    {dateTimeFmt(selected.openedAt)}
                  </p>
                  {selected.closedAt && (
                    <p className="text-xs text-muted-foreground">
                      Закрыл <span className="text-foreground">{selected.closedBy}</span> ·{' '}
                      {dateTimeFmt(selected.closedAt)}
                    </p>
                  )}
                </div>
              </FastViewHeader>
            }
          >
            {panel === 'summary' ? (
              <ShiftSummaryBody shift={selected} showCounted className="px-6 py-5" />
            ) : (
              <ShiftReceipts shiftId={selected.id} />
            )}
          </FastView>
        )}
      </FastViewPortal>
    </ListShell>
  )
}

function ShiftStatusChip({ status }: { status: PosShift['status'] }) {
  return status === 'OPEN' ? (
    <StatusChip tone="active" dot>
      открыта
    </StatusChip>
  ) : (
    <StatusChip tone="archived">закрыта</StatusChip>
  )
}

/** Чеки смены одной колонкой (панель узкая). */
function ShiftReceipts({ shiftId }: { shiftId: string }) {
  const receipts = useShiftReceipts(shiftId)
  if (!receipts.data) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }
  if (receipts.data.length === 0) {
    return <p className="px-6 py-5 text-sm text-muted-foreground">Чеков нет</p>
  }
  return (
    <ul className="divide-y divide-border/50">
      {receipts.data.map((d) => (
        <li key={d.id} className="px-6 py-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <Link
              to="/admin/sales/$docId"
              params={{ docId: d.id }}
              className="font-medium underline-offset-2 hover:underline"
            >
              {d.docType === 'RETURN' ? 'Возврат' : 'Продажа'} №{d.number}
            </Link>
            <span className="shrink-0 font-medium tabular-nums">{money(d.sumMinor)}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{dateTimeFmt(d.moment)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{receiptLinesSummary(d)}</p>
        </li>
      ))}
    </ul>
  )
}
