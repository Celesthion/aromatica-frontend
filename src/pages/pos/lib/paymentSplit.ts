import { minorToSom, somToMinor } from '@/shared/lib/money'
import type { PayChoice } from './types'

/** Раскладка оплаты по способам; все изменения идут через paymentReducer. */
export interface PaymentSplit {
  /** null: способ не выбран, умолчания нет, кассир выбирает сам. */
  mode: PayChoice | null
  /** Сомы строкой, как в полях ввода: кассир может быть на середине ввода. */
  cash: string
  noCash: string
  /**
   * Сколько дали наличными, в сомах. Может быть больше суммы чека, разница это сдача.
   * В чек уходит сумма чека (`cash`), сдача не проводится.
   */
  given: string
}

export type PaymentAction =
  | { type: 'mode'; mode: PayChoice; grandMinor: number }
  /** Сумма чека изменилась (упаковка, скидка): поля подгоняются под неё. */
  | { type: 'grand'; grandMinor: number }
  /** Ввод в смешанной оплате: второе поле дополняется до суммы чека. */
  | { type: 'editCash'; value: string; grandMinor: number }
  | { type: 'editNoCash'; value: string; grandMinor: number }
  | { type: 'editGiven'; value: string }

/** Вся сумма в поле выбранного способа; при смешанной безнал добирает остаток после наличных. */
function refill(mode: PayChoice | null, grandMinor: number, cashSom = '0'): PaymentSplit {
  const full = minorToSom(grandMinor)
  // способ не выбран: оплата заведомо не сходится
  if (mode === null) return { mode, cash: '0', noCash: '0', given: '0' }
  // по умолчанию дали ровно сумму чека, сдачи нет, пока кассир не введёт больше
  if (mode === 'cash') return { mode, cash: full, noCash: '0', given: full }
  if (mode === 'noCash') return { mode, cash: '0', noCash: full, given: '0' }
  const cashMinor = somToMinor(cashSom) ?? 0
  return {
    mode,
    cash: cashSom,
    noCash: minorToSom(Math.max(0, grandMinor - cashMinor)),
    given: '0',
  }
}

export function initPaymentSplit(grandMinor: number): PaymentSplit {
  return refill(null, grandMinor)
}

export function paymentReducer(state: PaymentSplit, a: PaymentAction): PaymentSplit {
  switch (a.type) {
    case 'mode':
      return refill(a.mode, a.grandMinor)
    case 'grand':
      // данное наличными сбрасываем: старое "дал 5000" к новому итогу не относится
      return refill(state.mode, a.grandMinor, state.cash)
    case 'editCash':
      return {
        ...state,
        cash: a.value,
        noCash: minorToSom(Math.max(0, a.grandMinor - (somToMinor(a.value) ?? 0))),
      }
    case 'editNoCash':
      return {
        ...state,
        noCash: a.value,
        cash: minorToSom(Math.max(0, a.grandMinor - (somToMinor(a.value) ?? 0))),
      }
    case 'editGiven':
      return { ...state, given: a.value }
  }
}

/** Сумма по всем способам в тыйынах; перед пробитием сверяется с суммой чека. */
export function paidMinor(s: PaymentSplit): number {
  return (somToMinor(s.cash) ?? 0) + (somToMinor(s.noCash) ?? 0)
}

/** Сдача бывает только при оплате наличными, в остальных способах платят сумму чека. */
export function changeMinor(s: PaymentSplit, grandMinor: number): number {
  if (s.mode !== 'cash') return 0
  return Math.max(0, (somToMinor(s.given) ?? 0) - grandMinor)
}

/** Если дали меньше суммы чека, пробивать нельзя: чек уйдёт на полную сумму, а в кассе будет меньше. */
export function givenEnough(s: PaymentSplit, grandMinor: number): boolean {
  if (s.mode !== 'cash') return true
  return (somToMinor(s.given) ?? 0) >= grandMinor
}
