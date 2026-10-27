import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Boxes, FlaskConical, PackageSearch, PackageX, TrendingDown, Wallet } from 'lucide-react'
import { Button, Field, PageLoader, SortTh, useSort } from '@/shared/ui'
import {
  convertToSplit,
  fetchSplitInfo,
  fetchStock,
  fetchStockSummary,
  fetchWarehouses,
  type StockRow,
  queryKeys,
} from '@/shared/api'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import { somToMinorOr0 } from '@/shared/lib/money'
import { useKindLabels } from '@/entities/kind/useKinds'
import { FastViewPortal } from '@/pages/admin/layout/FastView'
import {
  KpiCard,
  ListEmpty,
  ListShell,
  ListStats,
  ListTable,
  ListToolbar,
  TABLE,
  THEAD,
  THEAD_TR,
} from '@/pages/admin/layout/ListLayout'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { useInfiniteList } from '@/pages/admin/lib/useInfiniteList'
import { StockFastView, type ConvertForm, type StockPanel } from './StockFastView'

const canConvert = (r: StockRow) => (r.kind === 'BOTTLE' || r.kind === 'TESTER') && r.qty > 0

const EMPTY_CONVERT_FORM: ConvertForm = { pcs: '1', splitName: '', splitPrice: '' }

export function StockPage() {
  const kindLabel = useKindLabels()
  const [q, setQ] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [panel, setPanel] = useState<StockPanel>('info')
  // распив создаётся при вскрытии, если его ещё нет
  const [form, setForm] = useState<ConvertForm>(EMPTY_CONVERT_FORM)

  const warehouses = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: fetchWarehouses,
  })
  // '' = склад по умолчанию
  const effectiveWarehouseId = warehouseId || undefined

  const { sort, toggle } = useSort({ key: 'name', dir: 'asc' })
  const list = useInfiniteList(
    queryKeys.stock.list(warehouseId, q, sort),
    (page) => fetchStock({ warehouseId: effectiveWarehouseId, q, page, sort }),
    { refetchInterval: 60_000 },
  )

  const rows = list.rows

  const summary = useQuery({
    queryKey: queryKeys.stock.summary(warehouseId),
    queryFn: () => fetchStockSummary(effectiveWarehouseId),
  })
  const selected = selectedId ? (rows.find((r) => r.productId === selectedId) ?? null) : null

  const splitInfo = useQuery({
    queryKey: queryKeys.splitInfo(selectedId),
    queryFn: () => fetchSplitInfo(selected!.productId),
    enabled: selected != null && canConvert(selected) && panel === 'convert',
  })
  const needsSplit = splitInfo.data != null && !splitInfo.data.exists
  useEffect(() => {
    const d = splitInfo.data
    if (d && !d.exists) setForm((f) => ({ ...f, splitName: f.splitName || d.suggestedName || '' }))
  }, [splitInfo.data])

  const resetConvertForm = () => setForm(EMPTY_CONVERT_FORM)

  const convert = useEntityMutation({
    mutationFn: () =>
      // объём распива бэкенд берёт из карточки флакона
      convertToSplit({
        sourceProductId: selected!.productId,
        sourcePcs: parseFloat(form.pcs) || 1,
        // имя и цену бэкенд читает только при создании распива
        targetName: needsSplit ? form.splitName.trim() || undefined : undefined,
        targetPriceMinor: needsSplit && form.splitPrice.trim() ? somToMinorOr0(form.splitPrice) : undefined,
      }),
    invalidate: [queryKeys.stock.all, queryKeys.history.all, queryKeys.docs.all, queryKeys.products.all],
    onDone: () => {
      setPanel('info')
      resetConvertForm()
    },
  })

  // другая позиция открывается с основной информации и чистой формой вскрытия
  const select = (id: string | null, next: StockPanel = 'info') => {
    if (id === selectedId) return
    setSelectedId(id)
    setPanel(next)
    resetConvertForm()
    convert.clearError()
  }

  return (
    <ListShell>
      <ListStats>
        <KpiCard
          label="Позиций на остатке"
          value={summary.data ? String(summary.data.onHand) : '…'}
          sub="с ненулевым остатком"
          icon={Boxes}
          dark
        />
        <KpiCard
          label="Заканчивается"
          value={summary.data ? String(summary.data.low) : '…'}
          sub="остаток ниже нормы"
          icon={TrendingDown}
          tone="warn"
          dark
        />
        <KpiCard
          label="Нет в наличии"
          value={summary.data ? String(summary.data.out) : '…'}
          sub="нужен дозаказ"
          icon={PackageX}
          tone="bad"
          dark
        />
        <KpiCard
          label="Стоимость остатков"
          value={summary.data ? money(summary.data.totalValueMinor) : '…'}
          sub="по себестоимости"
          icon={Wallet}
          tone="good"
          dark
        />
      </ListStats>

      <ListToolbar
        onSearch={setQ}
        placeholder="Поиск по товару…"
        filtersCount={warehouseId ? 1 : 0}
        filters={
          (warehouses.data?.length ?? 0) > 1 ? (
            <Field label="Склад">
              <select
                className="field w-full"
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {warehouses.data!.map((w) => (
                  <option key={w.id} value={w.isDefault ? '' : w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : undefined
        }
      />

      {list.isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <ListEmpty fill={false} icon={<PackageSearch className="h-10 w-10" />}>
          {q === '' ? 'Движений ещё нет — остатки появятся после первой приёмки' : 'Ничего не найдено'}
        </ListEmpty>
      ) : (
        <ListTable ref={list.rootRef}>
          <table className={TABLE}>
            <thead className={THEAD}>
              <tr className={THEAD_TR}>
                <SortTh label="Товар" sortKey="name" sort={sort} onSort={toggle} />
                <SortTh label="Остаток" sortKey="qty" sort={sort} onSort={toggle} align="right" />
                {!selected && (
                  <SortTh
                    label="Ср. себестоимость"
                    sortKey="cost"
                    sort={sort}
                    onSort={toggle}
                    align="right"
                  />
                )}
                <SortTh label="Сумма" sortKey="value" sort={sort} onSort={toggle} align="right" />
                {!selected && <th className="w-24 px-2 py-3" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.productId}
                  onClick={() => select(r.productId)}
                  className={`cursor-pointer border-b border-border/50 last:border-0 transition-colors ${
                    selectedId === r.productId ? 'bg-muted/60' : 'hover:bg-muted/40'
                  }`}
                >
                  <td className="px-4 py-3">{r.productName}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums ${
                      r.qty < 0 ? 'font-medium text-brand-bad' : ''
                    }`}
                    data-label="Остаток"
                  >
                    {qtyFmt(r.qty)} {UNIT_LABELS[r.unit]}
                  </td>
                  {!selected && (
                    <td className="px-4 py-3 text-right tabular-nums" data-label="Ср. себестоимость">
                      {money(r.avgCostMinor)}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right tabular-nums" data-label="Сумма">
                    {money(r.valueMinor)}
                  </td>
                  {!selected && (
                    <td className="px-2 py-3 text-right">
                      {canConvert(r) && (
                        <Button
                          variant="outline"
                          size="sm"
                          title="Вскрыть в распив"
                          onClick={(e) => {
                            e.stopPropagation()
                            select(r.productId, 'convert')
                          }}
                        >
                          <FlaskConical className="mr-1 h-3 w-3" />
                          Вскрыть
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {list.isFetchingNextPage && <PageLoader size="sm" className="py-3" />}
        </ListTable>
      )}

      <FastViewPortal open={selected != null}>
        {selected && (
          <StockFastView
            row={selected}
            panel={panel}
            onPanel={setPanel}
            canConvert={canConvert(selected)}
            onOpenConvert={() => {
              setForm((f) => ({ ...f, pcs: '1' }))
              convert.clearError()
              setPanel('convert')
            }}
            onClose={() => select(null)}
            kindLabel={kindLabel}
            warehouseId={effectiveWarehouseId}
            splitInfo={splitInfo.data}
            splitInfoLoading={splitInfo.isLoading}
            needsSplit={needsSplit}
            form={form}
            onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            converting={convert.isPending}
            convertError={convert.error}
            onConvert={() => convert.mutate()}
          />
        )}
      </FastViewPortal>
    </ListShell>
  )
}
