import { adminFetch, post, qs } from './core'
import type { DocDto } from './docs'

export function convertToSplit(data: {
  sourceProductId: string
  sourcePcs: number
  targetMl?: number
  /** Цена за 1 мл для нового распива (если его ещё нет). */
  targetPriceMinor?: number | null
  /** Имя нового распива (если его ещё нет). */
  targetName?: string
  comment?: string
}): Promise<DocDto> {
  return adminFetch('/api/admin/convert', post(data))
}

/** Есть ли у аромата распив-SKU и с какой ценой; иначе предлагаемое имя. */
export interface SplitInfo {
  exists: boolean
  productId: string | null
  name: string | null
  priceMinor: number | null
  suggestedName: string | null
}

/** Состояние распива для формы вскрытия. */
export function fetchSplitInfo(sourceProductId: string): Promise<SplitInfo> {
  return adminFetch(`/api/admin/convert/split${qs({ sourceProductId })}`)
}
