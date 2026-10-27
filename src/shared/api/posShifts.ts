import { adminFetch, type Paged, post, sortBody, type SortParam } from './core'
import type { DocDto } from './docs'

export interface PosShift {
  id: string
  number: number
  status: 'OPEN' | 'CLOSED'
  warehouseId: string
  warehouseName: string | null
  openedBy: string
  openedAt: string
  openingCashMinor: number
  closedBy: string | null
  closedAt: string | null
  countedCashMinor: number | null
  expectedCashMinor: number | null
  comment: string | null
}

export interface SellerLine {
  login: string
  name: string
  receiptsCount: number
  revenueMinor: number
  returnsMinor: number
  /** Сколько разлива этот продавец списал при наливе. */
  writeOffMl: number
  writeOffCostMinor: number
}

/** X-отчёт по проведённым чекам смены. */
export interface PosShiftSummary {
  receiptsCount: number
  revenueMinor: number
  cashMinor: number
  noCashMinor: number
  returnsCount: number
  returnsMinor: number
  expectedCashMinor: number
  /** Средний чек; 0 при пустой смене. */
  avgReceiptMinor: number
  /** Построчные скидки и скидки на чек вместе. */
  discountsMinor: number
  /** Сколько подарков выдано и их себестоимость. */
  giftsCount: number
  giftsCostMinor: number
  /** Проданные сертификаты: деньги в кассе есть, выручки нет, это аванс. */
  certificatesSoldCount: number
  certificatesSoldMinor: number
  /** Оплата сертификатами: выручка есть, а денег в кассу не пришло. */
  certificatesRedeemedMinor: number
  /**
   * Списано кнопкой "Не хватило", когда флакон кончился раньше учётного остатка.
   * Выручки нет, это убыток по себестоимости.
   */
  splitWriteOffMl: number
  splitWriteOffCostMinor: number
  perSeller: SellerLine[]
}

/** null: касса закрыта, бэк отвечает 204. */
export function fetchCurrentShift(): Promise<PosShift | null> {
  return adminFetch<PosShift | undefined>('/api/pos/shift/current').then((s) => s ?? null)
}

export function openShift(data: {
  warehouseId?: string | null
  openingCashMinor: number
}): Promise<PosShift> {
  return adminFetch('/api/pos/shift/open', post(data))
}

export function closeShift(
  shiftId: string,
  data: { countedCashMinor: number; comment?: string | null },
): Promise<PosShift> {
  return adminFetch(`/api/pos/shifts/${shiftId}/close`, post(data))
}

export function fetchOpenShifts(): Promise<PosShift[]> {
  return adminFetch('/api/pos/shifts/open')
}

/** История смен: поиск по номеру и фильтр по статусу. */
export function fetchShifts(
  page = 0,
  q = '',
  status?: 'OPEN' | 'CLOSED',
  sort?: SortParam,
  size = 20,
): Promise<Paged<PosShift>> {
  return adminFetch(
    '/api/pos/shifts/search',
    post({ page, size, q: q || undefined, status, ...sortBody(sort) }),
  )
}

export function fetchShiftSummary(shiftId: string): Promise<PosShiftSummary> {
  return adminFetch(`/api/pos/shifts/${shiftId}/summary`)
}

export function fetchShiftReceipts(shiftId: string): Promise<DocDto[]> {
  return adminFetch(`/api/pos/shifts/${shiftId}/receipts`)
}
