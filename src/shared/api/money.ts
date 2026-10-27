import { adminFetch, del, fetchSliced, post, qs, type Sliced } from './core'
import type { DocDto } from './docs'

export interface MoneyAccount {
  id: string
  name: string
  type: 'CASH' | 'BANK'
  isDefault: boolean
  balanceMinor: number
}

export interface MoneyMovement {
  id: number
  accountId: string
  accountName: string
  docId: string | null
  docLabel: string | null
  amountMinor: number
  moment: string
  comment: string | null
}

export function fetchMoneyAccounts(): Promise<MoneyAccount[]> {
  return adminFetch('/api/admin/money/accounts')
}

export function fetchMoneyMovements(accountId?: string, page = 0): Promise<Sliced<MoneyMovement>> {
  return fetchSliced<MoneyMovement>(`/api/admin/money/movements${qs({ accountId, page, size: 10 })}`)
}

export function createManualMovement(data: {
  accountId: string
  amountMinor: number
  comment?: string
}): Promise<MoneyMovement> {
  return adminFetch('/api/admin/money/movements', post(data))
}

export function deleteManualMovement(id: number): Promise<void> {
  return adminFetch(`/api/admin/money/movements/${id}`, del())
}

/** Например, инкассация. */
export function transferMoney(data: {
  fromAccountId: string
  toAccountId: string
  amountMinor: number
  comment?: string | null
}): Promise<void> {
  return adminFetch('/api/admin/money/transfer', post(data))
}

export interface DebtDoc {
  id: string
  docType: 'SUPPLY' | 'RETURN_SUPPLY'
  number: number
  moment: string
  sumMinor: number
}

export interface DebtRow {
  counterpartyId: string | null
  counterpartyName: string
  debtMinor: number
  docs: DebtDoc[]
}

export function fetchDebts(): Promise<DebtRow[]> {
  return adminFetch('/api/admin/money/debts')
}

/** Оплата со счёта уже проведённой приёмки или возврата поставщику. */
export function payDoc(docId: string, accountId: string): Promise<DocDto> {
  return adminFetch(`/api/admin/money/pay/${docId}`, post({ accountId }))
}
