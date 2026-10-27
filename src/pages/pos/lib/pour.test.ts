import { describe, expect, it } from 'vitest'
import { isPouredValid, planAfterShortfall, pourShortfall, qtyAfterConvert } from './pour'

describe('pourShortfall', () => {
  it('остаток равен запросу: нехватка и хвост совпадают', () => {
    // по учёту 100, просят 100, налилось 80
    expect(pourShortfall(100, 80, 100)).toEqual({ shortfallMl: 20, writeOffMl: 20 })
  })

  it('остаток больше запроса: хвост больше нехватки', () => {
    // по учёту 120, просят 100, налилось 80: долить 20, списать 40
    expect(pourShortfall(100, 80, 120)).toEqual({ shortfallMl: 20, writeOffMl: 40 })
  })

  it('флакон был пуст: списывается весь остаток', () => {
    expect(pourShortfall(50, 0, 30)).toEqual({ shortfallMl: 50, writeOffMl: 30 })
  })

  it('вышло ровно сколько просили, но флакон кончился: хвост есть, нехватки нет', () => {
    expect(pourShortfall(100, 100, 115)).toEqual({ shortfallMl: 0, writeOffMl: 15 })
  })

  it('дробные миллилитры не разъезжаются на копейки', () => {
    expect(pourShortfall(10.3, 10, 10.3)).toEqual({ shortfallMl: 0.3, writeOffMl: 0.3 })
  })

  it('вышло больше запрошенного: нехватки нет, отрицательной не бывает', () => {
    expect(pourShortfall(50, 60, 90).shortfallMl).toBe(0)
  })
})

describe('isPouredValid', () => {
  it('ноль допустим: пошёл наливать, а флакон уже пустой', () => {
    expect(isPouredValid(0, 100)).toBe(true)
  })

  it('весь остаток допустим', () => {
    expect(isPouredValid(100, 100)).toBe(true)
  })

  it('больше остатка не принимаем: это излишек, а не нехватка', () => {
    expect(isPouredValid(120, 100)).toBe(false)
  })

  it('отрицательное и нечисло не принимаем', () => {
    expect(isPouredValid(-1, 100)).toBe(false)
    expect(isPouredValid(Number.NaN, 100)).toBe(false)
  })
})

describe('pourShortfall без выбранного объёма', () => {
  it('объём не выбран: доливать нечего, хвост есть', () => {
    // флакон оказался пуст сразу, объём клиенту ещё не называли
    expect(pourShortfall(null, 0, 30)).toEqual({ shortfallMl: 0, writeOffMl: 30 })
  })

  it('объём не выбран, но что-то вышло: нехватки всё равно нет', () => {
    expect(pourShortfall(null, 12, 30)).toEqual({ shortfallMl: 0, writeOffMl: 18 })
  })
})

describe('planAfterShortfall', () => {
  const plan = (kind: string, pouredMl: number, writeOffMl = 20, stockQty = 100) =>
    planAfterShortfall({ kind, stockQty, writeOffMl, pouredMl })

  it('распиву предлагаем вскрыть следующий флакон', () => {
    expect(plan('SPLIT', 80).offerConvert).toBe(true)
  })

  it('разливу вскрытие не предлагаем, он приходит завозом', () => {
    expect(plan('BULK', 80).offerConvert).toBe(false)
  })

  it('незнакомая форма вскрытия не получает', () => {
    expect(plan('GOODS', 80).offerConvert).toBe(false)
  })

  it('налитое уходит в чек по факту', () => {
    expect(plan('SPLIT', 80).cartMl).toBe(80)
  })

  it('ничего не вышло: строку в чек не кладём', () => {
    expect(plan('SPLIT', 0, 100).cartMl).toBe(0)
  })

  it('остаток после списания равен учётному минус хвост', () => {
    expect(plan('SPLIT', 80, 20, 100).qtyAfterWriteOff).toBe(80)
  })

  it('дробные миллилитры не разъезжаются', () => {
    expect(plan('SPLIT', 9.7, 0.3, 10).qtyAfterWriteOff).toBe(9.7)
  })
})

describe('qtyAfterConvert', () => {
  it('вскрытие доливает тот же распив', () => {
    // списали остаток (было 100, стало 80), вскрыли флакон на 75, стало 155
    expect(qtyAfterConvert(80, 75)).toBe(155)
  })

  it('дробные миллилитры не разъезжаются', () => {
    expect(qtyAfterConvert(9.7, 0.2)).toBe(9.9)
  })
})
