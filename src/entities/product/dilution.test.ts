import { describe, expect, it } from 'vitest'
import { isDilutable, isDilutionValid, oilForSpray, pricePerSprayMl, sprayForOil } from './dilution'

describe('oilForSpray', () => {
  it('пополам: половина объёма', () => {
    expect(oilForSpray(10, 50)).toBe(5)
  })

  it('чистое масло: весь объём', () => {
    expect(oilForSpray(10, 100)).toBe(10)
  })

  it('слабая концентрация: масла меньше', () => {
    expect(oilForSpray(20, 25)).toBe(5)
  })

  it('дробные миллилитры не разъезжаются', () => {
    expect(oilForSpray(5, 33)).toBe(1.65)
  })
})

describe('sprayForOil', () => {
  it('восстанавливает флакон, который унёс клиент', () => {
    expect(sprayForOil(5, 50)).toBe(10)
    expect(sprayForOil(5, 25)).toBe(20)
    expect(sprayForOil(5, 100)).toBe(5)
  })

  it('обратна oilForSpray на обычных числах', () => {
    expect(sprayForOil(oilForSpray(30, 50), 50)).toBe(30)
  })

  it('пустой остаток: нулевой флакон', () => {
    expect(sprayForOil(0, 50)).toBe(0)
  })
})

describe('pricePerSprayMl', () => {
  it('цена спрея равна цене масла в нём', () => {
    // масло 100 сом за мл, при 50% миллилитр спрея стоит 50 сом
    expect(pricePerSprayMl(10_000, 50)).toBe(5_000)
  })

  it('чистое масло: цена та же', () => {
    expect(pricePerSprayMl(10_000, 100)).toBe(10_000)
  })

  it('дробная доля округляется до тыйына', () => {
    expect(pricePerSprayMl(10_000, 33)).toBe(3_300)
  })
})

describe('isDilutionValid', () => {
  it('от тридцати до ста', () => {
    expect(isDilutionValid(30)).toBe(true)
    expect(isDilutionValid(50)).toBe(true)
    expect(isDilutionValid(100)).toBe(true)
  })

  it('ниже тридцати, ноль и больше ста не принимаем', () => {
    expect(isDilutionValid(29.99)).toBe(false)
    expect(isDilutionValid(1)).toBe(false)
    expect(isDilutionValid(0)).toBe(false)
    expect(isDilutionValid(101)).toBe(false)
    expect(isDilutionValid(-5)).toBe(false)
    expect(isDilutionValid(Number.NaN)).toBe(false)
  })
})

describe('isDilutable', () => {
  it('разбавляется только разлив', () => {
    expect(isDilutable('BULK')).toBe(true)
  })

  it('распив это готовый парфюм, его не разбавляют', () => {
    expect(isDilutable('SPLIT')).toBe(false)
    expect(isDilutable('BOTTLE')).toBe(false)
  })
})
