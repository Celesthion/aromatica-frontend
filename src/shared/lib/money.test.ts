import { describe, expect, it } from 'vitest'
import {
  discountMinorForPct,
  discountPctFor,
  grossMinor,
  lineSumMinor,
  minorToSom,
  somToMinor,
  unitPriceMinor,
} from './money'

// независимая реализация HALF_UP для сверки; количество задаём тысячными, как в БД
const halfUp = (num: number, den: number) => Math.floor((num + den / 2) / den)

/** Цены на выбор: круглые сомы, половины, четверти, тыйыны. */
const PRICES = [1, 25, 50, 99, 100, 750, 1550, 2575, 12345, 30000, 50000, 3800000]

describe('grossMinor', () => {
  it('не теряет полтыйына на дробном количестве', () => {
    // см. QTY_SCALE в money.ts
    expect(grossMinor(0.29, 750)).toBe(218)
    expect(grossMinor(0.58, 25)).toBe(15)
    expect(grossMinor(2.01, 50)).toBe(101)
  })

  it('совпадает с эталонным округлением на всех сотых долях миллилитра', () => {
    const mismatched: string[] = []
    for (let units = 1; units <= 5000; units++) {
      for (const price of PRICES) {
        const ours = grossMinor(units / 100, price)
        const expected = halfUp(units * price, 100)
        if (ours !== expected) mismatched.push(`${units / 100} * ${price}: ${ours} != ${expected}`)
      }
    }
    expect(mismatched).toEqual([])
  })

  it('считает и тысячные: их допускает схема', () => {
    const mismatched: string[] = []
    for (let units = 1; units <= 3000; units++) {
      for (const price of PRICES) {
        const ours = grossMinor(units / 1000, price)
        const expected = halfUp(units * price, 1000)
        if (ours !== expected) mismatched.push(`${units / 1000} * ${price}: ${ours} != ${expected}`)
      }
    }
    expect(mismatched).toEqual([])
  })
})

describe('lineSumMinor', () => {
  it('скидка больше суммы не уводит строку в минус', () => {
    expect(lineSumMinor(1, 10_000, 15_000)).toBe(0)
  })
})

describe('unitPriceMinor', () => {
  it('совпадает с эталонным делением', () => {
    const mismatched: string[] = []
    for (let units = 1; units <= 1000; units++) {
      for (const price of PRICES) {
        for (const discount of [0, 1, 99, 5000]) {
          const ours = unitPriceMinor(units / 100, price, discount)
          // (qty * цена - скидка) / qty, scale 0, HALF_UP
          const lineSum = Math.max(0, halfUp(units * price, 100) - discount)
          const expected = halfUp(lineSum * 100, units)
          if (ours !== expected) {
            mismatched.push(`${units / 100} * ${price} - ${discount}: ${ours} != ${expected}`)
          }
        }
      }
    }
    expect(mismatched).toEqual([])
  })

  it('при нулевом количестве отдаёт цену как есть', () => {
    expect(unitPriceMinor(0, 12_345, 500)).toBe(12_345)
  })
})

describe('discountMinorForPct', () => {
  it('совпадает с эталонным расчётом скидки процентом', () => {
    const mismatched: string[] = []
    for (let units = 1; units <= 500; units++) {
      for (const price of PRICES) {
        for (const pct of [1, 2.5, 5, 7.25, 10, 13.33, 20, 50, 99.99]) {
          const ours = discountMinorForPct(units / 100, price, pct)
          const expected = Math.min(
            halfUp(units * price, 100),
            halfUp(units * price * Math.round(pct * 100), 100 * 100 * 100),
          )
          if (ours !== expected)
            mismatched.push(`${units / 100} * ${price} * ${pct}%: ${ours} != ${expected}`)
        }
      }
    }
    expect(mismatched).toEqual([])
  })

  it('скидка не превышает сумму строки', () => {
    expect(discountMinorForPct(1, 10_000, 100)).toBe(10_000)
    expect(discountMinorForPct(1, 10_000, 0)).toBe(0)
  })
})

describe('discountPctFor', () => {
  it('показывает процент с сотыми', () => {
    expect(discountPctFor(1, 10_000, 1_000)).toBe(10)
    expect(discountPctFor(3, 1_000, 100)).toBe(3.33)
  })
})

describe('сомы и тыйыны', () => {
  it('разбирает ввод с пробелами и запятой', () => {
    expect(somToMinor('1 250,50')).toBe(125_050)
    expect(somToMinor('')).toBe(0)
    expect(somToMinor('-5')).toBeNull()
    expect(somToMinor('абв')).toBeNull()
  })

  it('показывает копейки только когда они есть', () => {
    expect(minorToSom(125_000)).toBe('1250')
    expect(minorToSom(125_050)).toBe('1250.50')
  })
})
