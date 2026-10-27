import { describe, expect, it } from 'vitest'
import {
  changeMinor,
  givenEnough,
  initPaymentSplit,
  paidMinor,
  paymentReducer,
  type PaymentSplit,
} from './paymentSplit'

const GRAND = 380_000

describe('paymentSplit', () => {
  it('стартует без выбранного способа, кассир нажимает сам', () => {
    const s = initPaymentSplit(GRAND)
    expect(s).toEqual({ mode: null, cash: '0', noCash: '0', given: '0' })
    // оплата не сходится, поэтому кнопка пробития заблокирована
    expect(paidMinor(s)).toBe(0)
  })

  it('выбор способа перекладывает всю сумму', () => {
    const cash = paymentReducer(initPaymentSplit(GRAND), { type: 'mode', mode: 'cash', grandMinor: GRAND })
    expect(cash).toEqual({ mode: 'cash', cash: '3800', noCash: '0', given: '3800' })
    const noCash = paymentReducer(cash, { type: 'mode', mode: 'noCash', grandMinor: GRAND })
    expect(noCash).toEqual({ mode: 'noCash', cash: '0', noCash: '3800', given: '0' })
    // смешанная начинается со всей суммы в безнале, наличные кассир вводит сам
    const mixed = paymentReducer(noCash, { type: 'mode', mode: 'mixed', grandMinor: GRAND })
    expect(mixed).toMatchObject({ mode: 'mixed', cash: '0', noCash: '3800' })
    expect(paidMinor(mixed)).toBe(GRAND)
  })

  it('изменение суммы чека (упаковка, скидка) добирает поля, оплата всегда сходится', () => {
    let s = paymentReducer(initPaymentSplit(GRAND), { type: 'mode', mode: 'cash', grandMinor: GRAND })
    s = paymentReducer(s, { type: 'grand', grandMinor: GRAND + 3_000 })
    expect(paidMinor(s)).toBe(GRAND + 3_000)
    // данное наличными пересчитано от новой суммы, сдача от старого итога не остаётся
    expect(s.given).toBe('3830')
    expect(changeMinor(s, GRAND + 3_000)).toBe(0)
    // в смешанной наличные остаются как ввели, безнал добирает остаток
    let m: PaymentSplit = { mode: 'mixed', cash: '1000', noCash: '2800', given: '0' }
    m = paymentReducer(m, { type: 'grand', grandMinor: GRAND + 10_000 })
    expect(m.cash).toBe('1000')
    expect(paidMinor(m)).toBe(GRAND + 10_000)
  })

  it('способ не выбран: смена суммы чека ничего не заполняет', () => {
    const s = paymentReducer(initPaymentSplit(GRAND), { type: 'grand', grandMinor: GRAND + 5_000 })
    expect(s.mode).toBeNull()
    expect(paidMinor(s)).toBe(0)
  })

  it('смешанная: второе поле дополняется до суммы чека', () => {
    let s = paymentReducer(
      paymentReducer(initPaymentSplit(GRAND), { type: 'mode', mode: 'mixed', grandMinor: GRAND }),
      { type: 'editCash', value: '1500', grandMinor: GRAND },
    )
    expect(s.noCash).toBe('2300')
    expect(paidMinor(s)).toBe(GRAND)
    s = paymentReducer(s, { type: 'editNoCash', value: '3000', grandMinor: GRAND })
    expect(s.cash).toBe('800')
    expect(paidMinor(s)).toBe(GRAND)
  })

  it('перебор в смешанной не уводит второе поле в минус, расхождение видно', () => {
    const s = paymentReducer(
      paymentReducer(initPaymentSplit(GRAND), { type: 'mode', mode: 'mixed', grandMinor: GRAND }),
      { type: 'editCash', value: '5000', grandMinor: GRAND },
    )
    expect(s.noCash).toBe('0')
    expect(paidMinor(s)).toBeGreaterThan(GRAND) // окно покажет, что оплата не сходится
  })
})

describe('вносимая сумма и сдача', () => {
  const cash = (given: string): PaymentSplit => ({
    mode: 'cash',
    cash: '3800',
    noCash: '0',
    given,
  })

  it('дал больше: сдача с разницы, а в чек всё равно уходит сумма чека', () => {
    const s = paymentReducer(cash('3800'), { type: 'editGiven', value: '5000' })
    expect(changeMinor(s, GRAND)).toBe(120_000)
    expect(paidMinor(s)).toBe(GRAND) // чек не раздувается на внесённое
    expect(givenEnough(s, GRAND)).toBe(true)
  })

  it('дал ровно: сдачи нет', () => {
    expect(changeMinor(cash('3800'), GRAND)).toBe(0)
  })

  it('дал меньше суммы: пробить нельзя', () => {
    const s = paymentReducer(cash('3800'), { type: 'editGiven', value: '3000' })
    expect(givenEnough(s, GRAND)).toBe(false)
    expect(changeMinor(s, GRAND)).toBe(0)
  })

  it('пустое и битое поле считаем нулём, а не разрешаем пробить', () => {
    expect(givenEnough(paymentReducer(cash('3800'), { type: 'editGiven', value: '' }), GRAND)).toBe(false)
    expect(givenEnough(paymentReducer(cash('3800'), { type: 'editGiven', value: 'абв' }), GRAND)).toBe(false)
  })

  it('в безналичной и смешанной сдачи нет и проверка внесённого не мешает', () => {
    const noCash: PaymentSplit = { mode: 'noCash', cash: '0', noCash: '3800', given: '0' }
    expect(changeMinor(noCash, GRAND)).toBe(0)
    expect(givenEnough(noCash, GRAND)).toBe(true)
  })
})
