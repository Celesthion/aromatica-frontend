import { useEffect, useReducer, useState } from 'react'
import { Modal, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NO_RECEIPT_DISCOUNT, receiptTotalMinor } from '@/pages/pos/lib/discount'
import { groupProducts } from '@/pages/pos/lib/grouping'
import {
  changeMinor,
  givenEnough,
  initPaymentSplit,
  paidMinor,
  paymentReducer,
} from '@/pages/pos/lib/paymentSplit'
import { buildReceiptLines, giftBaseMinor } from '@/pages/pos/lib/payload'
import { createReceipt, fetchPosPackaging, posToShelf, queryKeys, type DocDto } from '@/shared/api'
import { somToMinor } from '@/shared/lib/money'
import { staffName, useSession } from '~/features/auth/session'
import { useKeyboardHeight } from '~/hooks/useKeyboardHeight'
import { space } from '~/theme'
import { useCart } from '../cart'
import { CustomerSheet } from '../CustomerSheet'
import { GiftSheet } from '../GiftSheet'
import { ParkedSheet } from '../ParkedSheet'
import { isOpenReservation, useDrafts, useReservations, useShift } from '../queries'
import { ReservationSheet } from '../ReservationSheet'
import { ShelfSheet } from '../ShelfSheet'
import { CartStep } from './CartStep'
import { CheckoutFooter, type CheckoutTool } from './CheckoutFooter'
import { CheckoutHeader } from './CheckoutHeader'
import { ConfirmClear } from './ConfirmClear'
import { DoneCard } from './DoneCard'
import { PayStep } from './PayStep'

/** Чек и оплата в одном полноэкранном окне. */
export function CheckoutSheet({
  visible,
  onClose,
  shiftId,
  warehouseId,
}: {
  visible: boolean
  onClose: () => void
  shiftId: string | null
  warehouseId?: string
}) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  // клавиатура не должна закрывать скидку и сумму внесённого
  const keyboard = useKeyboardHeight()

  const lines = useCart((s) => s.lines)
  const removeBundle = useCart((s) => s.removeBundle)
  const clear = useCart((s) => s.clear)
  const receiptDiscount = useCart((s) => s.receiptDiscount)
  const customer = useCart((s) => s.customer)
  const setCustomer = useCart((s) => s.setCustomer)
  const fromReservation = useCart((s) => s.fromReservation)

  const [step, setStep] = useState<'cart' | 'pay'>('cart')
  const [confirmClear, setConfirmClear] = useState(false)
  const [openLine, setOpenLine] = useState<string | null>(null)
  const [sheet, setSheet] = useState<'none' | 'customer' | CheckoutTool>('none')

  // налили, а клиент передумал: флакон уходит на полку, его строки из чека
  const toShelf = useMutation({
    mutationFn: (bundleId: string) =>
      posToShelf(shiftId!, {
        lines: lines
          .filter((l) => l.bundleId === bundleId)
          .map((l) => ({
            productId: l.product.id,
            qty: l.qty,
            priceMinor: l.priceMinor,
            discountMinor: 0,
            dilutionPct: l.dilutionPct,
            bundleId: l.bundleId,
          })),
      }),
    onSuccess: (_doc, bundleId) => {
      removeBundle(bundleId)
      setOpenLine(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    },
  })

  // упаковка продаётся при оплате отдельными строками без скидки
  const [pkgQty, setPkgQty] = useState<Record<string, number>>({})
  const [openPkg, setOpenPkg] = useState<string | null>(null)
  const packaging = useQuery({
    queryKey: queryKeys.pos.packaging.byWarehouse(warehouseId),
    queryFn: () => fetchPosPackaging(warehouseId),
    enabled: visible && step === 'pay',
  })

  const drafts = useDrafts(shiftId, visible)
  const reservations = useReservations(warehouseId, visible)

  const subtotal = lines.reduce((s, l) => s + l.qty * l.priceMinor, 0)
  const goods = receiptTotalMinor(lines, NO_RECEIPT_DISCOUNT)
  const grand = receiptTotalMinor(lines, receiptDiscount)
  const lineDiscount = subtotal - goods
  const receiptDiscountMinor = goods - grand

  const pkgList = packaging.data ?? []
  const pkgTotal = pkgList.reduce((sum, p) => sum + (pkgQty[p.id] ?? 0) * (p.priceMinor ?? 0), 0)
  const grandTotal = grand + pkgTotal

  // сдача пробитого чека; null, пока чек не пробит
  const [paidChange, setPaidChange] = useState<number | null>(null)
  // проведённый документ нужен для печати после оплаты
  const [postedDoc, setPostedDoc] = useState<DocDto | null>(null)
  const user = useSession((s) => s.user)
  const shift = useShift(visible)
  const [split, dispatch] = useReducer(paymentReducer, initPaymentSplit(grand))

  useEffect(() => {
    dispatch({ type: 'grand', grandMinor: grandTotal })
  }, [grandTotal])

  // без сброса окно откроется на оплате прошлого чека
  useEffect(() => {
    if (!visible) {
      setStep('cart')
      setPaidChange(null)
      setPostedDoc(null)
      setPkgQty({})
    }
  }, [visible])

  const paid = paidMinor(split)
  const change = changeMinor(split, grandTotal)
  const cashShort = !givenEnough(split, grandTotal)

  const pay = useMutation({
    mutationFn: () => {
      if (!shiftId) throw new Error('Смена закрыта')
      return createReceipt(shiftId, {
        lines: buildReceiptLines(
          lines,
          pkgList.map((p) => ({ product: p, qty: pkgQty[p.id] ?? 0 })),
          receiptDiscount,
        ),
        cashMinor: somToMinor(split.cash) ?? 0,
        noCashMinor: somToMinor(split.noCash) ?? 0,
        giftBaseMinor: giftBaseMinor(lines),
        counterpartyId: customer?.id ?? undefined,
        reservationId: fromReservation?.id ?? undefined,
      })
    },
    onSuccess: (doc) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setPostedDoc(doc)
      setPaidChange(change)
      clear()
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    },
  })

  const canPay = split.mode !== null && paid === grandTotal && !cashShort && !!shiftId && grandTotal > 0
  const closeSheet = () => setSheet('none')

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top + space(2) }]}>
        <CheckoutHeader
          done={paidChange !== null}
          customer={customer}
          canClear={paidChange === null && step === 'cart' && lines.length > 0}
          onCustomer={() => setSheet('customer')}
          onUnlinkCustomer={() => setCustomer(null)}
          onClear={() => setConfirmClear(true)}
          onClose={onClose}
        />

        {paidChange !== null ? (
          <DoneCard
            change={paidChange}
            doc={postedDoc}
            shift={shift.data}
            seller={staffName(user)}
            receiptDiscountMinor={receiptDiscountMinor}
            onClose={onClose}
          />
        ) : (
          <View style={{ flex: 1, paddingBottom: keyboard }}>
            {step === 'cart' ? (
              <CartStep
                openLine={openLine}
                onToggleLine={(lineId) => setOpenLine((cur) => (cur === lineId ? null : lineId))}
                onToShelf={(bundleId) => toShelf.mutate(bundleId)}
                shelfPending={toShelf.isPending}
                subtotal={subtotal}
                lineDiscount={lineDiscount}
                receiptDiscountMinor={receiptDiscountMinor}
              />
            ) : (
              <PayStep
                pkgGroups={groupProducts(pkgList)}
                pkgQty={pkgQty}
                onPkgQty={(productId, n) => setPkgQty((q) => ({ ...q, [productId]: n }))}
                openPkg={openPkg}
                onOpenPkg={setOpenPkg}
                receiptDiscountMinor={receiptDiscountMinor}
                split={split}
                dispatch={dispatch}
                grandTotal={grandTotal}
                paid={paid}
                change={change}
                cashShort={cashShort}
                payFailed={pay.isError}
              />
            )}

            <CheckoutFooter
              step={step}
              total={grandTotal}
              bottomInset={insets.bottom}
              draftsCount={drafts.data?.length}
              reservationsCount={(reservations.data ?? []).filter(isOpenReservation).length}
              hasLines={lines.length > 0}
              onTool={setSheet}
              onToPay={() => setStep('pay')}
              onBack={() => setStep('cart')}
              canPay={canPay}
              paying={pay.isPending}
              onPay={() => pay.mutate()}
            />
          </View>
        )}

        {confirmClear ? (
          <ConfirmClear
            count={lines.length}
            onCancel={() => setConfirmClear(false)}
            onConfirm={() => {
              clear()
              setConfirmClear(false)
            }}
          />
        ) : null}

        <CustomerSheet visible={sheet === 'customer'} onClose={closeSheet} />
        <GiftSheet visible={sheet === 'gifts'} onClose={closeSheet} warehouseId={warehouseId} />
        {shiftId ? (
          <ParkedSheet
            visible={sheet === 'parked'}
            onClose={closeSheet}
            shiftId={shiftId}
            warehouseId={warehouseId}
          />
        ) : null}
        <ReservationSheet visible={sheet === 'reservations'} onClose={closeSheet} warehouseId={warehouseId} />
        <ShelfSheet visible={sheet === 'shelf'} onClose={closeSheet} warehouseId={warehouseId} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // чек тёмный в обеих темах, поэтому части окна берут цвета из светлой палитры
  screen: { flex: 1, backgroundColor: '#2b2d33' },
})
