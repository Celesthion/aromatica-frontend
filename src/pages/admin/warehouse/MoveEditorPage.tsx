import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { PageLoader, ErrorNote, Field } from '@/shared/ui'
import { fetchDoc, fetchWarehouses, type DocRequest, type WarehouseInfo, queryKeys } from '@/shared/api'
import { dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import { DocEditorHeader } from '@/pages/admin/warehouse/documents/DocEditorHeader'
import { LineNumCell, RemoveLineCell } from '@/pages/admin/warehouse/documents/DocLineCells'
import { ProductPicker } from '@/pages/admin/warehouse/documents/ProductPicker'
import { useDocMutations } from '@/pages/admin/warehouse/documents/useDocMutations'

interface MoveLine {
  productId: string
  productName: string
  qty: string
}

function WarehouseSelect({
  label,
  warehouses,
  value,
  onChange,
}: {
  label: string
  warehouses: WarehouseInfo[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <Field label={label}>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {warehouses.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </Field>
  )
}

/** Редактор перемещения между складами. Без пропсов это страница по роуту, с onClose модалка. */
export function MoveEditorPage({
  docId: docIdProp,
  onClose,
}: {
  docId?: string
  onClose?: () => void
} = {}) {
  const params = useParams({ strict: false }) as { docId?: string }
  const docId = docIdProp ?? params.docId ?? 'new'
  const isNew = docId === 'new'

  const doc = useQuery({
    queryKey: queryKeys.doc(docId),
    queryFn: () => fetchDoc(docId),
    enabled: !isNew,
  })
  const warehouses = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: fetchWarehouses,
  })

  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [lines, setLines] = useState<MoveLine[]>([])
  const loaded = useRef<string | null>(null)

  // новому документу сразу подставляем склады
  useEffect(() => {
    if (isNew && warehouses.data && !fromId) {
      const def = warehouses.data.find((w) => w.isDefault) ?? warehouses.data[0]
      const other = warehouses.data.find((w) => w.id !== def?.id)
      if (def) setFromId(def.id)
      if (other) setToId(other.id)
    }
  }, [isNew, warehouses.data, fromId])

  useEffect(() => {
    if (doc.data && loaded.current !== doc.data.id + doc.data.status) {
      loaded.current = doc.data.id + doc.data.status
      setFromId(doc.data.warehouseId)
      setToId(doc.data.warehouseToId ?? '')
      setLines(
        doc.data.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          qty: String(l.qty),
        })),
      )
    }
  }, [doc.data])

  const buildRequest = (): DocRequest => ({
    type: 'MOVE',
    warehouseId: fromId || null,
    warehouseToId: toId || null,
    lines: lines.map((l) => ({
      productId: l.productId,
      qty: parseFloat(l.qty) || 0,
      priceMinor: 0,
      discountMinor: 0,
    })),
  })

  const mutations = useDocMutations({ docId, basePath: '/admin/moves', buildRequest, onClose })

  const warehouseName = useMemo(() => {
    const map = new Map((warehouses.data ?? []).map((w) => [w.id, w.name]))
    return (id: string | null) => (id ? (map.get(id) ?? '?') : '?')
  }, [warehouses.data])

  if (!isNew && doc.isLoading) {
    return <PageLoader />
  }
  if (!isNew && doc.isError) {
    return <p className="py-24 text-center text-muted-foreground">Документ не найден</p>
  }

  const status = doc.data?.status ?? 'DRAFT'
  const readOnly = status !== 'DRAFT'

  return (
    <div>
      <DocEditorHeader
        title={isNew ? 'Новое перемещение' : `Перемещение №${doc.data?.number}`}
        status={status}
        isNew={isNew}
        basePath="/admin/moves"
        onClose={onClose}
        postDisabled={!fromId || !toId || fromId === toId}
        linesCount={lines.length}
        mutations={mutations}
      />

      <ErrorNote error={mutations.error} className="mb-4" />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        {readOnly ? (
          <p className="flex items-center gap-2 text-sm">
            <span className="font-medium">{warehouseName(doc.data?.warehouseId ?? null)}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{warehouseName(doc.data?.warehouseToId ?? null)}</span>
          </p>
        ) : (
          <>
            <WarehouseSelect
              label="Откуда"
              warehouses={warehouses.data ?? []}
              value={fromId}
              onChange={setFromId}
            />
            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
            <WarehouseSelect
              label="Куда"
              warehouses={warehouses.data ?? []}
              value={toId}
              onChange={setToId}
            />
            {fromId && fromId === toId && (
              <p className="mb-2 text-sm text-brand-bad">Склады должны быть разными</p>
            )}
          </>
        )}
      </div>

      {!readOnly && (
        <ProductPicker
          onPick={(p) => setLines((prev) => [...prev, { productId: p.id, productName: p.name, qty: '1' }])}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Товар</th>
              <th className="w-32 px-4 py-3 text-right font-medium">Кол-во</th>
              {readOnly && <th className="w-36 px-4 py-3 text-right font-medium">Себестоимость</th>}
              {!readOnly && <th className="w-12 px-2 py-3" />}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  Добавьте товары через поиск выше
                </td>
              </tr>
            ) : (
              lines.map((l, i) => {
                const cost = doc.data?.lines[i]?.costMinor
                return (
                  <tr key={`${l.productId}-${i}`} className="border-b last:border-0">
                    <td className="px-4 py-2">{l.productName}</td>
                    <LineNumCell
                      readOnly={readOnly}
                      value={l.qty}
                      display={qtyFmt(parseFloat(l.qty))}
                      onChange={(qty) =>
                        setLines((prev) => prev.map((x, j) => (j === i ? { ...x, qty } : x)))
                      }
                    />
                    {readOnly && (
                      <td className="px-4 py-2 text-right tabular-nums">
                        {cost != null ? money(cost) : '—'}
                      </td>
                    )}
                    {!readOnly && (
                      <RemoveLineCell onRemove={() => setLines((prev) => prev.filter((_, j) => j !== i))} />
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {status === 'POSTED' && doc.data?.postedAt && (
        <p className="mt-4 text-xs text-muted-foreground">
          Проведено {dateTimeFmt(doc.data.postedAt)} · себестоимость приехала на склад-приёмник
        </p>
      )}
    </div>
  )
}
