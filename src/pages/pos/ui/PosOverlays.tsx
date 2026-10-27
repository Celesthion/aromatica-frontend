import { useQueryClient } from '@tanstack/react-query'
import {
  posWriteOffSplit,
  type DocDto,
  type PosGiftRule,
  type PosProduct,
  type PosShift,
  type ProductKindInfo,
  queryKeys,
} from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { kindIcon } from '@/shared/lib/kindIcons'
import { kindAccent } from '@/shared/lib/kinds'
import { newUuid } from '@/shared/lib/uuid'
import { DEFAULT_DILUTION_PCT } from '@/entities/product/dilution'
import { pickBundleItem, qtyInCart, startGiftBundle } from '@/pages/pos/lib/cart'
import { planAfterShortfall, qtyAfterConvert } from '@/pages/pos/lib/pour'
import type { CartLine } from '@/pages/pos/lib/types'
import { CertificateSaleModal } from './CertificateSaleModal'
import { ConvertModal } from './ConvertModal'
import { CustomerModal } from './CustomerModal'
import { DraftsModal } from './DraftsModal'
import { GiftKindPicker } from './GiftKindPicker'
import { GiftsModal } from './GiftsModal'
import { NO_OVERLAY, type Overlay } from './overlay'
import { PaymentModal } from './payment/PaymentModal'
import { PresetPicker } from './pour/PresetPicker'
import { ReceiptDoneModal } from './payment/ReceiptDoneModal'
import { ReceiptsModal } from './ReceiptsModal'
import { ReservationsModal } from './ReservationsModal'
import { ShelfModal } from './ShelfModal'
import { CloseShiftModal, SummaryModal } from './ShiftModals'
import type { Notice } from './useNotice'
import type { PosData } from './usePosData'
import type { Receipt } from './receipt/useReceipt'
import type { ReceiptActions } from './receipt/useReceiptActions'
import { VariantPicker } from './VariantPicker'

/** Окна кассы и то, что происходит по их результату. */
export function PosOverlays({
  overlay,
  setOverlay,
  shift,
  login,
  userName,
  receipt,
  actions,
  data,
  kindLabel,
  kindStyle,
  onPickProduct,
  onReceiptDone,
  flash,
}: {
  overlay: Overlay
  setOverlay: (overlay: Overlay) => void
  shift: PosShift
  login: string
  userName: string
  receipt: Receipt
  actions: ReceiptActions
  data: PosData
  kindLabel: (kind: string) => string
  kindStyle: Map<string, ProductKindInfo>
  onPickProduct: (product: PosProduct) => void
  onReceiptDone: (doc: DocDto, changeMinor: number, isReturn: boolean) => void
  flash: (text: string, tone?: Notice['tone']) => void
}) {
  const queryClient = useQueryClient()
  const closeOverlay = () => setOverlay(NO_OVERLAY)

  const commitBundle = (lines: CartLine[]) => {
    receipt.addLines(lines)
    closeOverlay()
  }

  const startBundle = (rule: PosGiftRule) => {
    if (receipt.usedCount(rule.id) >= receipt.earnedCount(rule)) return
    const bundle = startGiftBundle(rule)
    if (bundle.queue.length === 0) commitBundle(bundle.lines)
    else setOverlay({ kind: 'bundle', bundle })
  }

  const writeOffShortfall = async (
    split: PosProduct,
    pouredMl: number,
    writeOffMl: number,
    shortfallMl: number,
  ) => {
    const plan = planAfterShortfall({
      kind: split.kind,
      stockQty: split.qty,
      writeOffMl,
      pouredMl,
    })
    // хвост флакона списываем сразу отдельным документом: духи уже вылиты, а чек может и не состояться
    await posWriteOffSplit(shift.id, { productId: split.id, qty: writeOffMl, pouredMl })
    // налитое клиент уже держит в руках, поэтому строка идёт в чек сразу
    if (plan.cartMl > 0) receipt.addLine(split, plan.cartMl)
    queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    flash(`Списано: ${split.name} · −${qtyFmt(writeOffMl)} мл`, 'warn')
    if (!plan.offerConvert) {
      closeOverlay()
      return
    }
    // флакон пуст: предлагаем вскрыть следующий того же аромата, потом возвращаем к наливу
    setOverlay({
      kind: 'convert',
      search: split.model ?? split.name,
      thenPour: { product: split, qty: plan.qtyAfterWriteOff, pendingMl: shortfallMl },
    })
  }

  switch (overlay.kind) {
    case 'none':
      return null

    case 'bundle': {
      const { bundle } = overlay
      return (
        <GiftKindPicker
          // новый key на каждом шаге очереди сбрасывает поиск прошлого шага
          key={`${bundle.groupId}:${bundle.queue.length}`}
          item={bundle.queue[0]}
          warehouseId={shift.warehouseId}
          inCartQty={receipt.inCartQty}
          reservedQty={(id) => qtyInCart(bundle.lines, id)}
          onBack={closeOverlay}
          onPick={(perfume) => {
            const next = pickBundleItem(bundle, perfume)
            if (next.queue.length === 0) commitBundle(next.lines)
            else setOverlay({ kind: 'bundle', bundle: next })
          }}
        />
      )
    }

    case 'variant': {
      const { group } = overlay
      const info = kindStyle.get(group.kind)
      return (
        <VariantPicker
          group={group}
          formLabel={kindLabel(group.kind)}
          accent={kindAccent(group.kind, info?.color)}
          icon={kindIcon(group.kind, info?.icon)}
          inCartQty={receipt.inCartQty}
          onClose={closeOverlay}
          onPick={onPickProduct}
        />
      )
    }

    case 'preset': {
      const { product } = overlay
      return (
        <PresetPicker
          product={product}
          kindName={kindStyle.get(product.kind)?.name}
          available={product.qty - receipt.inCartQty(product.id)}
          atomizers={data.atomizers}
          inCartQty={receipt.inCartQty}
          initialMl={overlay.pendingMl}
          onClose={closeOverlay}
          defaultDilutionPct={data.settings?.defaultDilutionPct ?? DEFAULT_DILUTION_PCT}
          onPick={(qty, priceMinor, atomizer, dilutionPct) => {
            // у масла и атомайзера одного налива общая метка: по ней флакон целиком уходит на полку
            const bundleId = newUuid()
            receipt.addLine(product, qty, { priceMinor, dilutionPct, bundleId })
            if (atomizer) receipt.addLine(atomizer, 1, { bundleId })
            closeOverlay()
          }}
          onShortfall={(pouredMl, writeOffMl, shortfallMl) =>
            writeOffShortfall(product, pouredMl, writeOffMl, shortfallMl)
          }
        />
      )
    }

    case 'gifts':
      return (
        <GiftsModal
          rules={receipt.matchedGiftRules}
          earnedCount={receipt.earnedCount}
          usedCount={receipt.usedCount}
          onClose={closeOverlay}
          // окно закрывает сам startBundle: следующим шагом может быть выбор наливного
          onPick={startBundle}
        />
      )

    case 'customers': {
      const { then } = overlay
      return (
        <CustomerModal
          attached={receipt.customer}
          onPick={(c) => {
            receipt.setCustomer(c)
            if (then === 'reservations') setOverlay({ kind: 'reservations', openForm: true })
            else closeOverlay()
          }}
          onClose={closeOverlay}
        />
      )
    }

    case 'paying':
      return (
        <PaymentModal
          shift={shift}
          cart={receipt.cart}
          receiptDiscount={receipt.receiptDiscount}
          onReceiptDiscountChange={receipt.setReceiptDiscount}
          packaging={data.packaging}
          shortages={receipt.shortages}
          reservationId={receipt.fromReservation?.id ?? null}
          counterpartyId={receipt.customer?.id ?? null}
          onClose={closeOverlay}
          onDone={(doc, change) => onReceiptDone(doc, change, false)}
        />
      )

    case 'certSale':
      return (
        <CertificateSaleModal
          shift={shift}
          onClose={closeOverlay}
          onSold={(code, nominal) => {
            closeOverlay()
            flash(`Продан сертификат ${code} · ${money(nominal)}`)
          }}
        />
      )

    case 'convert': {
      const back = overlay.thenPour
      return (
        <ConvertModal
          shift={shift}
          initialSearch={overlay.search}
          onClose={closeOverlay}
          onDone={(name, ml) => {
            flash(`Вскрыто: ${name} · +${qtyFmt(ml)} мл`)
            // пришли из нехватки при наливе: возвращаем к нему с остатком, пополненным вскрытым флаконом
            if (back)
              setOverlay({
                kind: 'preset',
                product: { ...back.product, qty: qtyAfterConvert(back.qty, ml) },
                pendingMl: back.pendingMl > 0 ? back.pendingMl : undefined,
              })
            else closeOverlay()
          }}
        />
      )
    }

    case 'drafts':
      return (
        <DraftsModal
          shift={shift}
          hasCart={receipt.cart.length > 0}
          parking={actions.park.isPending}
          resuming={actions.resume.isPending}
          resumeError={actions.resume.error}
          onPark={() => actions.park.mutate()}
          onResume={(d) => actions.resume.mutate(d)}
          onClose={closeOverlay}
        />
      )

    case 'reservations':
      return (
        <ReservationsModal
          shift={shift}
          cart={receipt.cart}
          customer={receipt.customer}
          openForm={overlay.openForm}
          onPickCustomer={() => setOverlay({ kind: 'customers', then: 'reservations' })}
          receiptDiscount={receipt.receiptDiscount}
          settings={data.settings}
          selling={actions.sell.isPending}
          sellError={actions.sell.error}
          onReserved={() => {
            receipt.clear()
            closeOverlay()
          }}
          onSell={(r) => actions.sell.mutate(r)}
          onClose={closeOverlay}
        />
      )

    case 'shelf':
      return (
        <ShelfModal
          shift={shift}
          inCartQty={receipt.inCartQty}
          onPick={(p, shelfId) => {
            // с полки всё уходит штуками со склада-полки
            receipt.addLine(p, 1, { warehouseId: shelfId })
            closeOverlay()
          }}
          onClose={closeOverlay}
        />
      )

    case 'summary':
      return <SummaryModal shift={shift} onClose={closeOverlay} />

    case 'receipts':
      return (
        <ReceiptsModal
          shift={shift}
          login={login}
          userName={userName}
          onClose={closeOverlay}
          onReturned={(doc) => onReceiptDone(doc, 0, true)}
        />
      )

    case 'closing':
      return <CloseShiftModal shift={shift} onClose={closeOverlay} />

    case 'done':
      return <ReceiptDoneModal result={overlay} shift={shift} userName={userName} onClose={closeOverlay} />
  }
}
