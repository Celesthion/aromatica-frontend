import { describe, expect, it } from 'vitest'
import { isDateComplete, isoToMasked, maskDate, maskedToIso } from './dateMask'

describe('maskDate', () => {
  it('расставляет точки по мере набора', () => {
    expect(maskDate('1')).toBe('1')
    expect(maskDate('12')).toBe('12')
    expect(maskDate('124')).toBe('12.4')
    expect(maskDate('1204')).toBe('12.04')
    expect(maskDate('12041988')).toBe('12.04.1988')
  })

  it('чужие точки и пробелы не мешают, считаются только цифры', () => {
    expect(maskDate('12.04.1988')).toBe('12.04.1988')
    expect(maskDate('12 04 1988')).toBe('12.04.1988')
    expect(maskDate('12/04/1988')).toBe('12.04.1988')
  })

  it('лишние цифры отбрасывает', () => {
    expect(maskDate('120419889999')).toBe('12.04.1988')
  })

  it('стирание работает как в обычном поле', () => {
    expect(maskDate('12.0')).toBe('12.0')
    expect(maskDate('12.')).toBe('12')
    expect(maskDate('')).toBe('')
  })
})

describe('maskedToIso', () => {
  it('полную дату переводит в ISO', () => {
    expect(maskedToIso('12.04.1988')).toBe('1988-04-12')
    expect(maskedToIso('01.01.2000')).toBe('2000-01-01')
  })

  it('недобранную дату наружу не отдаёт', () => {
    expect(maskedToIso('12.04.19')).toBe('')
    expect(maskedToIso('')).toBe('')
  })

  it('несуществующие даты не проходят', () => {
    // 31 февраля браузер молча превратил бы в 3 марта, а это хуже пустого поля
    expect(maskedToIso('31.02.1990')).toBe('')
    expect(maskedToIso('31.04.1990')).toBe('')
    expect(maskedToIso('00.01.1990')).toBe('')
    expect(maskedToIso('12.13.1990')).toBe('')
  })

  it('високосный год различает', () => {
    expect(maskedToIso('29.02.2000')).toBe('2000-02-29')
    expect(maskedToIso('29.02.1900')).toBe('')
  })
})

describe('isoToMasked', () => {
  it('показывает сохранённую дату по-человечески', () => {
    expect(isoToMasked('1988-04-12')).toBe('12.04.1988')
  })

  it('пустое и мусор дают пустое поле', () => {
    expect(isoToMasked('')).toBe('')
    expect(isoToMasked('1988-04')).toBe('')
  })
})

describe('isDateComplete', () => {
  it('отличает неполный ввод от полного', () => {
    expect(isDateComplete('12.04.198')).toBe(false)
    expect(isDateComplete('12.04.1988')).toBe(true)
  })
})
