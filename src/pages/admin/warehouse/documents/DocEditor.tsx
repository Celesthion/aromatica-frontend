import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Combobox, ErrorNote, Field, Input, PageLoader } from '@/shared/ui'
import {
  searchCounterparties,
  fetchDoc,
  fetchMoneyAccounts,
  fetchWarehouses,
  type Counterparty,
  type CounterpartyType,
  type DocRequest,
  type DocType,
  type ProductPick,
  queryKeys,
} from '@/shared/api'
import { dateTimeFmt, money, toLocalInput } from '@/shared/lib/format'
import { minorToSom, somToMinorOr0 } from '@/shared/lib/money'
import { DocEditorHeader } from './DocEditorHeader'
import { DocHistory } from './DocHistory'
import { DocLinesTable } from './DocLinesTable'
import { DocPayAccount, DocPaymentSplit } from './DocPayment'
import { parseLine, type EditableLine } from './docLines'
import { ProductPicker } from './ProductPicker'
import { useDocMutations } from './useDocMutations'

/** Настройка редактора под тип документа. */
export interface DocEditorConfig {
  type: DocType
  titleNew: string
  titleOf: (n: number) => string
  /** Тип контрагента для селекта; без него контрагент не нужен. */
  counterparty?: CounterpartyType
  counterpartyLabel?: string
  /** Колонки цены и скидки. */
  showPrice: boolean
  /** Скрыть колонку скидки: в приёмке скидок нет. */
  noDiscount?: boolean
  priceLabel?: string
  qtyLabel?: string
  /** Подставлять каталожную цену при добавлении строки. */
  prefillPrice?: boolean
  /** 'split': нал + перевод, 'account': выбор счёта. */
  payment?: 'split' | 'account'
  hint?: string
}

export function DocEditor({
  docId,
  basePath,
  configs,
  newType,
  onClose,
}: {
  docId: string
  /** Например '/admin/sales'. */
  basePath: string
  configs: Partial<Record<DocType, DocEditorConfig>>
  newType: DocType
  /** Модальный режим: вместо перехода по роуту закрываем модалку. */
  onClose?: () => void
}) {
  const isNew = docId === 'new'

  const doc = useQuery({
    queryKey: queryKeys.doc(docId),
    queryFn: () => fetchDoc(docId),
    enabled: !isNew,
  })

  const config = configs[doc.data?.docType ?? newType] ?? configs[newType]!

  const warehouses = useQuery({
    queryKey: queryKeys.warehouses,
    queryFn: fetchWarehouses,
  })

  const accounts = useQuery({
    queryKey: queryKeys.moneyAccounts,
    queryFn: fetchMoneyAccounts,
    enabled: config.payment != null,
  })

  const [warehouseId, setWarehouseId] = useState('')
  const [counterpartyId, setCounterpartyId] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [moment, setMoment] = useState('')
  const [comment, setComment] = useState('')
  const [lines, setLines] = useState<EditableLine[]>([])
  const [cashSom, setCashSom] = useState('')
  const [noCashSom, setNoCashSom] = useState('')
  const [payAccountId, setPayAccountId] = useState('')
  const loaded = useRef<string | null>(null)

  useEffect(() => {
    if (isNew && warehouses.data && !warehouseId) {
      const def = warehouses.data.find((w) => w.isDefault) ?? warehouses.data[0]
      if (def) setWarehouseId(def.id)
    }
  }, [isNew, warehouses.data, warehouseId])

  useEffect(() => {
    if (doc.data && loaded.current !== doc.data.id + doc.data.status) {
      loaded.current = doc.data.id + doc.data.status
      setWarehouseId(doc.data.warehouseId)
      setCounterpartyId(doc.data.counterpartyId ?? '')
      setCounterpartyName(doc.data.counterpartyName ?? '')
      setMoment(toLocalInput(doc.data.moment))
      setComment(doc.data.comment ?? '')
      setCashSom(doc.data.cashMinor ? minorToSom(doc.data.cashMinor) : '')
      setNoCashSom(doc.data.noCashMinor ? minorToSom(doc.data.noCashMinor) : '')
      setPayAccountId(doc.data.payAccountId ?? '')
      setLines(
        doc.data.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          qty: String(l.qty),
          priceSom: l.priceMinor ? minorToSom(l.priceMinor) : '',
          discountPct: l.discountPct ? String(l.discountPct) : '',
        })),
      )
    }
  }, [doc.data])

  const patchLine = (i: number, patch: Partial<EditableLine>) =>
    setLines((prev) => prev.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const buildRequest = (): DocRequest => ({
    type: config.type,
    moment: moment ? `${moment}:00` : undefined,
    warehouseId: warehouseId || null,
    counterpartyId: counterpartyId || null,
    comment: comment || null,
    cashMinor: config.payment === 'split' ? somToMinorOr0(cashSom) : 0,
    noCashMinor: config.payment === 'split' ? somToMinorOr0(noCashSom) : 0,
    payAccountId: config.payment === 'account' && payAccountId ? payAccountId : null,
    lines: lines.map((l) => ({ productId: l.productId, ...parseLine(l) })),
  })

  const mutations = useDocMutations({ docId, basePath, buildRequest, onClose })

  if (!isNew && doc.isLoading) {
    return <PageLoader />
  }
  if (!isNew && doc.isError) {
    return <p className="py-24 text-center text-muted-foreground">Документ не найден</p>
  }

  const status = doc.data?.status ?? 'DRAFT'
  const readOnly = status !== 'DRAFT'
  const showWarehousePick = (warehouses.data?.length ?? 0) > 1

  return (
    <div>
      <DocEditorHeader
        title={isNew ? config.titleNew : config.titleOf(doc.data?.number ?? 0)}
        status={status}
        isNew={isNew}
        basePath={basePath}
        onClose={onClose}
        linesCount={lines.length}
        mutations={mutations}
      />

      {config.hint && !readOnly && (
        <p className="mb-4 rounded-md border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
          {config.hint}
        </p>
      )}

      <ErrorNote error={mutations.error} className="mb-4" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showWarehousePick && (
          <Field label="Склад">
            <select
              className="field w-full"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              disabled={readOnly}
            >
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {config.counterparty && (
          <Field label={config.counterpartyLabel ?? 'Контрагент'}>
            {readOnly ? (
              <div className="field w-full text-muted-foreground">{counterpartyName || '— не указан —'}</div>
            ) : (
              <Combobox<Counterparty>
                display={counterpartyName}
                placeholder="— не указан —"
                searchPlaceholder="Поиск контрагента…"
                queryKey={(q) => queryKeys.counterparties.search(config.counterparty ?? '', q)}
                fetch={(q, page) => searchCounterparties(q, config.counterparty, page)}
                itemKey={(c) => c.id}
                itemLabel={(c) => c.name}
                isSelected={(c) => c.id === counterpartyId}
                onSelect={(c) => {
                  setCounterpartyId(c.id)
                  setCounterpartyName(c.name)
                }}
                topItem={{
                  label: '— не указан —',
                  selected: !counterpartyId,
                  onSelect: () => {
                    setCounterpartyId('')
                    setCounterpartyName('')
                  },
                }}
              />
            )}
          </Field>
        )}
        <Field label="Дата документа">
          <Input
            type="datetime-local"
            value={moment}
            onChange={(e) => setMoment(e.target.value)}
            disabled={readOnly}
          />
        </Field>
        <Field label="Комментарий">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={readOnly}
            placeholder="необязательно"
          />
        </Field>
      </div>

      {config.payment === 'split' && (
        <DocPaymentSplit
          cashSom={cashSom}
          noCashSom={noCashSom}
          onCash={setCashSom}
          onNoCash={setNoCashSom}
          readOnly={readOnly}
        />
      )}

      {config.payment === 'account' && (
        <DocPayAccount
          docType={config.type}
          accounts={accounts.data ?? []}
          payAccountId={payAccountId}
          onChange={setPayAccountId}
          readOnly={readOnly}
        />
      )}

      {!readOnly && (
        <ProductPicker
          excludeKinds={config.type === 'SUPPLY' ? ['SPLIT'] : undefined}
          onPick={(p: ProductPick) =>
            setLines((prev) => [
              ...prev,
              {
                productId: p.id,
                productName: p.name,
                qty: '1',
                priceSom: config.prefillPrice && p.priceKopecks != null ? minorToSom(p.priceKopecks) : '',
                discountPct: '',
              },
            ])
          }
        />
      )}

      <DocLinesTable
        config={config}
        lines={lines}
        savedLines={doc.data?.lines}
        readOnly={readOnly}
        onPatch={patchLine}
        onRemove={(i) => setLines((prev) => prev.filter((_, j) => j !== i))}
      />

      {status === 'POSTED' && doc.data?.postedAt && (
        <p className="mt-4 text-xs text-muted-foreground">
          Проведён {dateTimeFmt(doc.data.postedAt)} · итог {money(doc.data.sumMinor)} · остатки обновлены
        </p>
      )}

      {!isNew && <DocHistory docId={docId} />}
    </div>
  )
}
