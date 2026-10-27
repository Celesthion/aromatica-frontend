import { adminFetch, post, qs } from './core'
import type { DocDto, LineRequest } from './docs'
import type { GiftCondition } from './giftRules'
import type { ProductKind, ProductUnit } from './kinds'

export interface PosProduct {
  id: string
  name: string
  /** Для товаров в мл (распив, разлив) цена за 1 мл. */
  priceMinor: number | null
  unit: ProductUnit
  kind: ProductKind
  qty: number
  /** Объём в мл; у атомайзера задаёт вариант распива или разлива. */
  volumeMl: number | null
  /** null: рисуем флакон-заглушку. */
  mainImageId: string | null
  /** Касса группирует карточки по паре (modelId, kind). */
  modelId?: string | null
  /** Для заголовка сгруппированной карточки. */
  brand?: string | null
  model?: string | null
  /** Чем отличается вариант, например цвет; подпись при выборе варианта. */
  label?: string | null
}

export interface PosWarehouse {
  id: string
  name: string
  isDefault: boolean
}

export function searchPosProducts(search: string, warehouseId?: string): Promise<PosProduct[]> {
  return adminFetch(`/api/pos/products${qs({ search, warehouseId })}`)
}

export function fetchPosWarehouses(): Promise<PosWarehouse[]> {
  return adminFetch('/api/pos/warehouses')
}

/** Полка склада смены: её id (склад строк чека) и что на ней лежит. */
export interface PosShelf {
  warehouseId: string
  items: PosProduct[]
}

export function fetchPosShelf(warehouseId?: string): Promise<PosShelf> {
  return adminFetch(`/api/pos/shelf${qs({ warehouseId })}`)
}

/** "На полку" из чека до оплаты: строки одной вещи, например масло с долей и атомайзер. */
export function posToShelf(
  shiftId: string,
  data: { lines: LineRequest[]; comment?: string | null },
): Promise<DocDto> {
  return adminFetch(`/api/pos/shifts/${shiftId}/shelf`, post(data))
}

/** Упаковку предлагаем при оплате, в обычном поиске её нет. */
export function fetchPosPackaging(warehouseId?: string): Promise<PosProduct[]> {
  return adminFetch(`/api/pos/packaging${qs({ warehouseId })}`)
}

/** Атомайзеры; их объёмы задают варианты распива и разлива в кассе. */
export function fetchPosAtomizers(warehouseId?: string): Promise<PosProduct[]> {
  return adminFetch(`/api/pos/atomizers${qs({ warehouseId })}`)
}

/** Свежие остатки для восстановления отложенного чека. */
export function fetchPosCards(ids: string[], warehouseId?: string): Promise<PosProduct[]> {
  return adminFetch(`/api/pos/products/cards${qs({ ids: ids.join(','), warehouseId })}`)
}

/** Позиция набора-подарка для кассы; product null: любой товар формы kind. */
export interface PosItem {
  product: PosProduct | null
  kind: ProductKind | null
  kindName: string | null
  qty: number
}

/** Правило подарка для кассы: активное, набор целиком покрыт остатком; условия касса считает по составу чека. */
export interface PosGiftRule {
  id: string
  name: string
  conditions: GiftCondition[]
  stepMinor: number | null
  maxGifts: number | null
  items: PosItem[]
}

export function fetchPosGiftRules(warehouseId?: string): Promise<PosGiftRule[]> {
  return adminFetch(`/api/pos/gift-rules${qs({ warehouseId })}`)
}

/** Товары формы в наличии: выбор экземпляра для позиции набора "любой товар формы". */
export function fetchGiftKindProducts(kind: string, warehouseId?: string): Promise<PosProduct[]> {
  return adminFetch(`/api/pos/gift-products${qs({ kind, warehouseId })}`)
}

/** Есть ли у аромата распив; касса проверяет перед вскрытием. */
export interface PosSplitInfo {
  exists: boolean
  productId: string | null
  name: string | null
  /** Цена за мл в тыйынах. */
  priceMinor: number | null
  suggestedName: string
}

export function fetchPosSplitInfo(sourceProductId: string): Promise<PosSplitInfo> {
  return adminFetch(`/api/pos/convert/split${qs({ sourceProductId })}`)
}

/**
 * Вскрытие флакона или тестера в распив с кассы. Объём бэк берёт из карточки товара,
 * склад из смены, кассир их не задаёт.
 */
export function posConvert(
  shiftId: string,
  data: { sourceProductId: string; sourcePcs: number },
): Promise<DocDto> {
  return adminFetch(`/api/pos/shifts/${shiftId}/convert`, post(data))
}

/**
 * "Не хватило" при наливе: флакон кончился раньше учётного остатка.
 * qty: сколько списать, считает касса, потому что только она знает, сколько уже в чеке.
 * pouredMl: сколько реально налили, пишется в комментарий документа.
 */
export function posWriteOffSplit(
  shiftId: string,
  data: { productId: string; qty: number; pouredMl: number },
): Promise<DocDto> {
  return adminFetch(`/api/pos/shifts/${shiftId}/split-writeoff`, post(data))
}

export function createReceipt(
  shiftId: string,
  data: {
    lines: LineRequest[]
    cashMinor: number
    noCashMinor: number
    comment?: string | null
    /** Продажа по брони: после проведения чека бронь станет проданной. */
    reservationId?: string | null
    /** null: продажа без покупателя. */
    counterpartyId?: string | null
    /** Платная сумма до скидки на чек; от неё сервер проверяет пороги акций. */
    giftBaseMinor?: number
    /** Оплата сертификатом: код и сколько с него списать. */
    certificateCode?: string
    certificateMinor?: number
  },
): Promise<DocDto> {
  return adminFetch(`/api/pos/shifts/${shiftId}/receipts`, post(data))
}

/** Возврат только по чеку: документ RETURN ссылается на исходную продажу. */
export function createPosReturn(
  shiftId: string,
  data: {
    sourceReceiptId: string
    lines: LineRequest[]
    cashMinor: number
    noCashMinor: number
    comment?: string | null
  },
): Promise<DocDto> {
  return adminFetch(`/api/pos/shifts/${shiftId}/returns`, post(data))
}

/** Сторно возможно только для чека своей открытой смены. */
export function voidPosReceipt(shiftId: string, docId: string): Promise<void> {
  return adminFetch(`/api/pos/shifts/${shiftId}/receipts/${docId}/void`, post())
}
