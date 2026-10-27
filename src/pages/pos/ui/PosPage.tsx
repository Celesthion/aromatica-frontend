import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type SearchInputHandle, Spinner } from '@/shared/ui'
import { type DocDto, fetchOpenShifts, me, type PosProduct, type PosShift, queryKeys } from '@/shared/api'
import { LoginScreen } from '@/features/auth/LoginScreen'
import { useKindLabels, useKinds } from '@/entities/kind/useKinds'
import { canOpenShift } from '@/entities/staff/roles'
import type { ProductGroup } from '@/pages/pos/lib/types'
import { CatalogPanel } from './CatalogPanel'
import { NO_OVERLAY, type Overlay } from './overlay'
import { PosOverlays } from './PosOverlays'
import { ReceiptPanel } from './receipt/ReceiptPanel'
import { OpenShiftScreen } from './ShiftModals'
import { useNotice } from './useNotice'
import { usePosData } from './usePosData'
import { useReceipt } from './receipt/useReceipt'
import { useReceiptActions } from './receipt/useReceiptActions'
import { useTypeToSearch } from './useTypeToSearch'

// после чека остатки устарели: сбрасываем всё, что их использует
const STOCK_QUERY_KEYS = [
  queryKeys.pos.products.all,
  queryKeys.pos.summary.all,
  queryKeys.pos.receipts.all,
  queryKeys.pos.giftRules.all,
  queryKeys.pos.giftProducts.all,
  queryKeys.pos.atomizers.all,
  queryKeys.pos.packaging.all,
  queryKeys.pos.shelf.all,
  queryKeys.pos.purchases.all,
  queryKeys.pos.reservations.all,
]

export function PosPage() {
  const queryClient = useQueryClient()
  const session = useQuery({ queryKey: queryKeys.me, queryFn: me, retry: false, staleTime: 5 * 60_000 })
  const shifts = useQuery({
    queryKey: queryKeys.pos.openShifts,
    queryFn: fetchOpenShifts,
    enabled: !!session.data,
  })
  if (session.isLoading || (session.data && shifts.isLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (session.isError || !session.data) {
    return <LoginScreen onSuccess={() => queryClient.invalidateQueries({ queryKey: queryKeys.admin })} />
  }

  const user = session.data
  const shift = (shifts.data ?? [])[0]

  if (!shift) {
    return <OpenShiftScreen canOpen={canOpenShift(user.role)} />
  }

  return (
    <PosTerminal key={shift.id} shift={shift} login={user.login} userName={user.displayName ?? user.login} />
  )
}

function PosTerminal({ shift, login, userName }: { shift: PosShift; login: string; userName: string }) {
  const queryClient = useQueryClient()
  const [overlay, setOverlay] = useState<Overlay>(NO_OVERLAY)
  const closeOverlay = () => setOverlay(NO_OVERLAY)
  const searchRef = useRef<SearchInputHandle>(null)
  const { notice, flash } = useNotice()
  useTypeToSearch(searchRef, overlay.kind === 'none')

  // иконка и цвет формы из справочника, их настраивает админ
  const kindLabel = useKindLabels()
  const kinds = useKinds()
  const kindStyle = useMemo(() => new Map((kinds.data ?? []).map((k) => [k.code, k])), [kinds.data])

  const data = usePosData(shift)
  const receipt = useReceipt(data.giftRules)
  const actions = useReceiptActions(shift, receipt, closeOverlay)

  // мл-товар сначала ведёт к вводу объёма; окно вариантов, если открыто, закрывается
  const pickProduct = (p: PosProduct) => {
    if (p.unit === 'ML') {
      setOverlay({ kind: 'preset', product: p })
    } else {
      receipt.addLine(p, 1)
      closeOverlay()
    }
  }

  const openGroup = (g: ProductGroup) => {
    if (g.variants.length === 1) pickProduct(g.variants[0])
    else setOverlay({ kind: 'variant', group: g })
  }

  const finishReceipt = (doc: DocDto, changeMinor: number, isReturn: boolean) => {
    receipt.clear()
    receipt.setCustomer(null)
    setOverlay({
      kind: 'done',
      doc,
      changeMinor,
      isReturn,
      receiptDiscountMinor: isReturn ? 0 : receipt.totals.receiptDiscountMinor,
    })
    STOCK_QUERY_KEYS.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
    searchRef.current?.focus()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-0">
        <CatalogPanel
          shift={shift}
          searchRef={searchRef}
          kindLabel={kindLabel}
          kindStyle={kindStyle}
          onOpenGroup={openGroup}
          onOpen={setOverlay}
        />
        <ReceiptPanel
          receipt={receipt}
          notice={notice}
          draftCount={data.draftCount}
          activeReservations={data.activeReservations}
          onToShelf={(line) => actions.toShelf.mutate(line)}
          onOpen={setOverlay}
        />
      </div>

      <PosOverlays
        overlay={overlay}
        setOverlay={setOverlay}
        shift={shift}
        login={login}
        userName={userName}
        receipt={receipt}
        actions={actions}
        data={data}
        kindLabel={kindLabel}
        kindStyle={kindStyle}
        onPickProduct={pickProduct}
        onReceiptDone={finishReceipt}
        flash={flash}
      />
    </div>
  )
}
