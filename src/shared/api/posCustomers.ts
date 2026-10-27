import { adminFetch, post, qs } from './core'
import type { ProductUnit } from './kinds'

/** Покупатель для кассы: свой эндпоинт, весь справочник контрагентов с поставщиками ей не нужен. */
export interface PosCustomer {
  id: string
  name: string
  phone: string
  gender: 'MALE' | 'FEMALE' | null
  /** ISO `гггг-мм-дд`. */
  birthDate: string | null
}

export interface PosPurchaseLine {
  productName: string
  unit: ProductUnit
  qty: number
  /** Со скидкой; считает бэк, чтобы совпадало с чеком. */
  sumMinor: number
  gift: boolean
}

export interface PosPurchase {
  docId: string
  number: number
  moment: string
  sumMinor: number
  positions: number
  lines: PosPurchaseLine[]
}

/**
 * Поиск по имени или телефону. На слишком короткий запрос бэк отвечает пустым списком:
 * весь список клиентов кассиру показывать нельзя.
 */
export function searchPosCustomers(q: string): Promise<PosCustomer[]> {
  return adminFetch(`/api/pos/customers/search${qs({ q })}`)
}

export function createPosCustomer(data: {
  name: string
  phone: string
  gender?: 'MALE' | 'FEMALE' | null
  birthDate?: string | null
}): Promise<PosCustomer> {
  return adminFetch('/api/pos/customers', post(data))
}

export function fetchCustomerPurchases(customerId: string): Promise<PosPurchase[]> {
  return adminFetch(`/api/pos/customers/${customerId}/purchases`)
}
