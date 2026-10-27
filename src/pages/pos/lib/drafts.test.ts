import { describe, expect, it } from 'vitest'
import type { PosCustomer } from '@/shared/api'
import { NO_RECEIPT_DISCOUNT } from './discount'
import { draftSnapshot, parseDraftPayload, withFreshProducts } from './drafts'
import { makeLine, makeProduct } from './testing/fixtures'
import type { CartLine } from './types'

const product = (id: string, qty = 5) => makeProduct({ id, name: `Товар ${id}`, priceMinor: 1000, qty })

const line = (id: string, over: Partial<CartLine> = {}) =>
  makeLine({ lineId: `line-${id}`, product: product(id), priceMinor: 1000, ...over })

const buyer: PosCustomer = {
  id: 'c1',
  name: 'Айгуль',
  phone: '+996700112233',
  gender: 'FEMALE',
  birthDate: null,
}

describe('draftSnapshot', () => {
  it('денормализует: сумма, позиции, превью из первых двух имён', () => {
    const cart = [line('a'), line('b'), line('c')]
    const snap = draftSnapshot(cart, { mode: 'pct', value: '10' }, null, null, 2700)
    expect(snap.sumMinor).toBe(2700)
    expect(snap.positions).toBe(3)
    expect(snap.preview).toBe('Товар a, Товар b…')
  })

  it('короткий чек без многоточия; привязка к брони уходит в payload', () => {
    const cart = [line('a')]
    const snap = draftSnapshot(cart, { mode: 'pct', value: '' }, { id: 'r1', name: 'Клиент' }, null, 1000)
    expect(snap.preview).toBe('Товар a')
    expect(snap.payload).toEqual({
      cart,
      receiptDiscount: { mode: 'pct', value: '' },
      fromReservation: { id: 'r1', name: 'Клиент' },
      customer: null,
    })
  })
})

describe('parseDraftPayload', () => {
  it('снапшот после JSON разбирается один в один', () => {
    const cart = [line('a', { discountMinor: 150 }), line('b', { isGift: true })]
    const rd = { mode: 'sum' as const, value: '50' }
    const snap = draftSnapshot(cart, rd, { id: 'r1', name: 'Клиент' }, buyer, 1850)
    const parsed = parseDraftPayload(JSON.parse(JSON.stringify(snap.payload)))
    expect(parsed.cart).toEqual(cart)
    expect(parsed.receiptDiscount).toEqual(rd)
    expect(parsed.fromReservation).toEqual({ id: 'r1', name: 'Клиент' })
    expect(parsed.customer).toEqual(buyer)
  })

  it('старый формат без fromReservation: привязка null, скидка пустая', () => {
    const parsed = parseDraftPayload({ cart: [line('a')] })
    expect(parsed.fromReservation).toBeNull()
    expect(parsed.receiptDiscount).toEqual(NO_RECEIPT_DISCOUNT)
  })

  it('прежний формат: скидка чека строкой процентов, строка с discountPct переводится в сумму', () => {
    const legacy = { ...line('a', { qty: 2, priceMinor: 1000 }) } as Record<string, unknown>
    delete legacy.discountMinor
    legacy.discountPct = 10
    const parsed = parseDraftPayload({ cart: [legacy], receiptDiscount: '5' })
    expect(parsed.cart[0].discountMinor).toBe(200)
    expect('discountPct' in parsed.cart[0]).toBe(false)
    expect(parsed.receiptDiscount).toEqual({ mode: 'pct', value: '5' })
  })

  it('покупателя без id не восстанавливаем: привязать его к чеку всё равно нечем', () => {
    expect(parseDraftPayload({ cart: [line('a')], customer: { name: 'Без id' } }).customer).toBeNull()
    expect(parseDraftPayload({ cart: [line('a')], customer: buyer }).customer).toEqual(buyer)
  })

  it('битый payload даёт понятную ошибку, а не setCart(undefined)', () => {
    expect(() => parseDraftPayload(null)).toThrow(/другой версией/)
    expect(() => parseDraftPayload({ cart: 'oops' })).toThrow()
    expect(() => parseDraftPayload({ cart: [{ qty: 1 }] })).toThrow()
    expect(() => parseDraftPayload('{"cart":[]}')).toThrow()
  })

  it('строка без lineId (чужая версия) получает новый ключ', () => {
    const raw = { cart: [{ ...line('a'), lineId: undefined }] }
    const parsed = parseDraftPayload(JSON.parse(JSON.stringify(raw)))
    expect(typeof parsed.cart[0].lineId).toBe('string')
    expect(parsed.cart[0].lineId.length).toBeGreaterThan(0)
  })
})

describe('withFreshProducts', () => {
  it('карточка обновляется (остаток), цена строки остаётся как в чеке', () => {
    const cart = [line('a', { priceMinor: 900 })]
    const merged = withFreshProducts(cart, [product('a', 1)])
    expect(merged[0].product.qty).toBe(1)
    expect(merged[0].priceMinor).toBe(900)
  })

  it('товар пропал из каталога: остаток 0, защита от минуса подсветит', () => {
    const merged = withFreshProducts([line('a')], [])
    expect(merged[0].product.qty).toBe(0)
    expect(merged[0].product.name).toBe('Товар a')
  })
})
