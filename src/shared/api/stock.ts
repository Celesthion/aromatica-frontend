import {
  adminFetch,
  fetchSliced,
  type Paged,
  qs,
  searchPaged,
  type Sliced,
  sortBody,
  type SortParam,
} from './core'
import type { ProductKind, ProductUnit } from './kinds'

export type StockLevel = 'IN_STOCK' | 'LOW' | 'OUT'

export interface StockRow {
  productId: string
  productName: string
  qty: number
  avgCostMinor: number
  valueMinor: number
  kind: ProductKind
  unit: ProductUnit
  /** Уровень остатка считает сервер: "заканчивается" до 10 мл или 5 шт. */
  level: StockLevel
}

/** Показатели склада одним запросом, без выгрузки всех строк. */
export interface StockSummary {
  positions: number
  onHand: number
  low: number
  out: number
  totalValueMinor: number
}

export interface MovementRow {
  id: number
  docId: string
  docType: 'SUPPLY' | 'SALE' | 'WRITE_OFF' | 'SURPLUS' | 'INVENTORY' | 'MOVE'
  docNumber: number
  docStatus: 'DRAFT' | 'POSTED' | 'CANCELLED'
  qtyDelta: number
  costMinor: number
  moment: string
}

export interface StockQuery {
  warehouseId?: string
  q?: string
  page?: number
  size?: number
  sort?: SortParam
  /** Только эти позиции (строки, уже показанные в списке). */
  productIds?: string[]
}

/** Остатки склада страницами. */
export function fetchStock({
  warehouseId,
  q = '',
  page = 0,
  size = 30,
  sort,
  productIds,
}: StockQuery = {}): Promise<Paged<StockRow>> {
  return searchPaged<StockRow>('/api/admin/stock/search', {
    warehouseId,
    q: q || undefined,
    page,
    size,
    productIds,
    ...sortBody(sort),
  })
}

export function fetchStockSummary(warehouseId?: string): Promise<StockSummary> {
  return adminFetch(`/api/admin/stock/summary${qs({ warehouseId })}`)
}

/** История движений позиции страницами по 50: движения копятся годами. */
export function fetchHistory(
  productId: string,
  warehouseId: string | undefined,
  page: number,
): Promise<Sliced<MovementRow>> {
  return fetchSliced<MovementRow>(
    `/api/admin/stock/${productId}/history${qs({ warehouseId, page, size: 50 })}`,
  )
}
