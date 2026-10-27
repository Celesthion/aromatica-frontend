import { describe, expect, it } from 'vitest'
import type { Reservation } from '@/shared/api'
import { NO_RECEIPT_DISCOUNT } from './discount'
import {
  daysLeft,
  normalizeReservationDays,
  reservationLines,
  reservationSumMinor,
  reservationToCart,
} from './reservations'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const product = (id: string) => makeProduct({ id, name: `Товар ${id}`, priceMinor: 1000, qty: 5 })

const line = (id: string, over: Partial<CartLine> = {}) =>
  makeLine({ lineId: `line-${id}`, product: product(id), priceMinor: 1000, ...over })

describe('normalizeReservationDays', () => {
  it('обычный ввод проходит как есть', () => {
    expect(normalizeReservationDays('7', 3, 14)).toBe(7)
  })

  it('пусто, мусор, ноль и минус дают срок по умолчанию', () => {
    expect(normalizeReservationDays('', 3, 14)).toBe(3)
    expect(normalizeReservationDays('abc', 3, 14)).toBe(3)
    expect(normalizeReservationDays('0', 3, 14)).toBe(3)
    expect(normalizeReservationDays('-5', 3, 14)).toBe(3)
  })

  it('выше потолка срезается, как на бэке', () => {
    expect(normalizeReservationDays('999', 3, 14)).toBe(14)
  })

  it('дробное округляется вниз до целых дней', () => {
    expect(normalizeReservationDays('2.9', 3, 14)).toBe(2)
  })
})

describe('reservationLines', () => {
  it('подарки не бронируются', () => {
    const lines = reservationLines([line('a'), line('g', { isGift: true })], NO_RECEIPT_DISCOUNT)
    expect(lines).toEqual([{ productId: 'a', qty: 1, priceMinor: 1000 }])
  })

  it('фиксируемая цена учитывает скидку строки и скидку на чек поверх неё', () => {
    // 1000 - 100 (строка) = 900; 10 % чека = 90; итого 810 за единицу
    const lines = reservationLines([line('a', { discountMinor: 100 })], { mode: 'pct', value: '10' })
    expect(lines[0].priceMinor).toBe(810)
  })

  it('без скидок цена не меняется', () => {
    expect(reservationLines([line('a')], NO_RECEIPT_DISCOUNT)[0].priceMinor).toBe(1000)
  })
})

describe('reservationSumMinor', () => {
  it('дробное qty (распив, мл): одно округление на строку', () => {
    // 2.5 мл * 333 = 832.5, округляется до 833, а не остаётся дробным
    expect(reservationSumMinor([{ productId: 'a', qty: 2.5, priceMinor: 333 }])).toBe(833)
  })

  it('сумма по строкам', () => {
    expect(
      reservationSumMinor([
        { productId: 'a', qty: 2, priceMinor: 500 },
        { productId: 'b', qty: 1, priceMinor: 300 },
      ]),
    ).toBe(1300)
  })
})

describe('reservationToCart', () => {
  it('строки падают в чек по зафиксированным ценам, без скидок и подарков', () => {
    const r: Reservation = {
      id: 'r1',
      customerName: 'Клиент',
      phone: null,
      counterpartyId: null,
      comment: null,
      expiresAt: '2026-08-23T12:00:00',
      expired: false,
      status: 'ACTIVE',
      sumMinor: 1620,
      lines: [{ productId: 'a', productName: 'Товар a', qty: 2, priceMinor: 810, product: product('a') }],
    }
    const cart = reservationToCart(r)
    expect(cart).toHaveLength(1)
    expect(cart[0]).toMatchObject({ qty: 2, priceMinor: 810, discountMinor: 0, isGift: false })
    expect(cart[0].product.id).toBe('a')
    expect(cart[0].lineId).toBeTruthy()
  })
})

describe('daysLeft', () => {
  const now = new Date('2026-08-20T12:00:00')

  it('целые сутки дают ровно N', () => {
    expect(daysLeft('2026-08-23T12:00:00', now)).toBe(3)
  })

  it('неполные сутки округляются вверх', () => {
    expect(daysLeft('2026-08-21T09:00:00', now)).toBe(1)
  })

  it('граница и прошлое: не меньше нуля', () => {
    expect(daysLeft('2026-08-20T12:00:00', now)).toBe(0)
    expect(daysLeft('2026-08-19T12:00:00', now)).toBe(0)
  })
})
