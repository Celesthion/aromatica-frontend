import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createPosDraft,
  deletePosDraft,
  fetchPosCards,
  posToShelf,
  type PosDraft,
  type PosShift,
  type Reservation,
  queryKeys,
} from '@/shared/api'
import { NO_RECEIPT_DISCOUNT } from '@/pages/pos/lib/discount'
import { draftSnapshot, parseDraftPayload, withFreshProducts } from '@/pages/pos/lib/drafts'
import { reservationToCart } from '@/pages/pos/lib/reservations'
import type { CartLine } from '@/pages/pos/lib/types'
import type { Receipt } from './useReceipt'

/** Действия с собранным чеком целиком: на полку, отложить, вернуть отложенный, продать бронь. */
export function useReceiptActions(shift: PosShift, receipt: Receipt, closeOverlay: () => void) {
  const queryClient = useQueryClient()
  const { cart } = receipt

  // налитый флакон, от которого отказались: масло, вода и атомайзер списываются, вещь ложится на полку
  const toShelf = useMutation({
    mutationFn: (line: CartLine) =>
      posToShelf(shift.id, {
        lines: cart
          .filter((l) => l.bundleId != null && l.bundleId === line.bundleId)
          .map((l) => ({
            productId: l.product.id,
            qty: l.qty,
            priceMinor: l.priceMinor,
            discountMinor: 0,
            dilutionPct: l.dilutionPct,
            bundleId: l.bundleId,
          })),
      }),
    onSuccess: (_doc, line) => {
      receipt.removeBundle(line.bundleId)
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    },
  })

  const parkCurrent = () =>
    createPosDraft(
      shift.id,
      draftSnapshot(
        cart,
        receipt.receiptDiscount,
        receipt.fromReservation,
        receipt.customer,
        receipt.totals.payableMinor,
      ),
    )

  const park = useMutation({
    mutationFn: parkCurrent,
    onSuccess: () => {
      receipt.clear()
      closeOverlay()
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.all })
    },
  })

  // собранный сейчас чек откладывается сам, клиенты меняются местами
  const resume = useMutation({
    mutationFn: async (d: PosDraft) => {
      // битый payload падает здесь, до удаления черновика с сервера
      const p = parseDraftPayload(d.payload)
      let lines = p.cart
      try {
        const ids = [...new Set(p.cart.map((l) => l.product.id))]
        lines = withFreshProducts(p.cart, await fetchPosCards(ids, shift.warehouseId))
      } catch {
        // сеть подвела: восстановим по снимку, остатки сервер перепроверит при проведении чека
      }
      if (cart.length > 0) await parkCurrent()
      await deletePosDraft(d.id)
      return { ...p, cart: lines }
    },
    onSuccess: (p) => {
      receipt.load(p)
      closeOverlay()
    },
    // обмен мог пройти наполовину (чек отложен, удаление упало), поэтому список обновляем всегда
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.all }),
  })

  // собранный чек при продаже брони уходит в отложенные
  const sell = useMutation({
    mutationFn: async (r: Reservation) => {
      if (cart.length > 0) await parkCurrent()
      return r
    },
    onSuccess: (r) => {
      receipt.load({
        cart: reservationToCart(r),
        receiptDiscount: NO_RECEIPT_DISCOUNT,
        fromReservation: { id: r.id, name: r.customerName },
        // покупатель брони становится покупателем чека; пол и дата рождения чеку не нужны
        customer: r.counterpartyId
          ? {
              id: r.counterpartyId,
              name: r.customerName,
              phone: r.phone ?? '',
              gender: null,
              birthDate: null,
            }
          : null,
      })
      closeOverlay()
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.all })
    },
  })

  return { toShelf, park, resume, sell }
}

export type ReceiptActions = ReturnType<typeof useReceiptActions>
