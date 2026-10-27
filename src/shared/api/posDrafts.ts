import { adminFetch, del, post } from './core'

/** Отложенный чек: снимок корзины, бэк его не разбирает. */
export interface PosDraft {
  id: string
  sumMinor: number
  positions: number
  preview: string | null
  /** {cart, receiptDiscount} в том виде, как сохранила касса. */
  payload: unknown
  createdAt: string
}

export function fetchPosDrafts(shiftId: string): Promise<PosDraft[]> {
  return adminFetch(`/api/pos/shifts/${shiftId}/drafts`)
}

export function createPosDraft(
  shiftId: string,
  data: { sumMinor: number; positions: number; preview: string | null; payload: unknown },
): Promise<PosDraft> {
  return adminFetch(`/api/pos/shifts/${shiftId}/drafts`, post(data))
}

export function deletePosDraft(id: string): Promise<void> {
  return adminFetch(`/api/pos/drafts/${id}`, del())
}
