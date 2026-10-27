import { describe, expect, it } from 'vitest'
import { formatGiftCode, isValidGiftCode, normalizeGiftCode } from './giftCode'

// 79927398713 - классический пример из описания алгоритма Луна, дополнен нулём до 12 цифр
const VALID = '079927398713'

describe('giftCode', () => {
  it('убирает пробелы, чужие коды не меняет', () => {
    expect(normalizeGiftCode(' 0799 2739 8713 ')).toBe(VALID)
    expect(normalizeGiftCode('GC-1001')).toBe('GC-1001')
  })

  it('форматирует группами по четыре, чужие коды не трогает', () => {
    expect(formatGiftCode(VALID)).toBe('0799 2739 8713')
    expect(formatGiftCode('GC-1001')).toBe('GC-1001')
  })

  it('принимает верный код, ловит опечатку и перестановку', () => {
    expect(isValidGiftCode(VALID)).toBe(true)
    expect(isValidGiftCode('0799 2739 8713')).toBe(true)
    expect(isValidGiftCode('079927398714')).toBe(false)
    expect(isValidGiftCode('079927398173')).toBe(false)
    expect(isValidGiftCode('12345')).toBe(false)
  })
})
