import type { LineDto, PosProduct } from '@/shared/api'
import type { CartLine } from '../types'

let lineSeq = 0

export function makeProduct(over: Partial<PosProduct> = {}): PosProduct {
  return {
    id: 'p1',
    name: 'Товар',
    priceMinor: 100_000,
    unit: 'PCS',
    kind: 'BOTTLE',
    qty: 10,
    volumeMl: null,
    mainImageId: null,
    ...over,
  }
}

/** Строка корзины; lineId по умолчанию уникален в рамках файла тестов. */
export function makeLine(over: Partial<CartLine> = {}): CartLine {
  return {
    lineId: `line-${++lineSeq}`,
    product: makeProduct(),
    qty: 1,
    priceMinor: 100_000,
    discountMinor: 0,
    isGift: false,
    ...over,
  }
}

/** Строка документа: штучный флакон без связки. */
export function makeLineDto(over: Partial<LineDto> = {}): LineDto {
  return {
    id: 'l',
    productId: 'p',
    productName: 'Товар',
    productKind: 'BOTTLE',
    qty: 1,
    priceMinor: 100_000,
    discountPct: 0,
    discountMinor: 0,
    costMinor: 0,
    sumMinor: 100_000,
    lineNo: 1,
    gift: false,
    dilutionPct: null,
    bundleId: null,
    warehouseId: null,
    ...over,
  }
}
