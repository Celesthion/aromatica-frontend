import { describe, expect, it } from 'vitest'
import { PHONE_PREFIX, isValidPhone, normalizePhone } from './phone'

describe('normalizePhone', () => {
  it('выбрасывает пробелы и разделители', () => {
    expect(normalizePhone('+996 700 11 22 33')).toBe('+996700112233')
    expect(normalizePhone('0700-11-22-33')).toBe('0700112233')
    expect(normalizePhone('(0555) 12 34 56')).toBe('0555123456')
  })

  it('плюс оставляет только первым символом', () => {
    expect(normalizePhone('+996+700')).toBe('+996700')
    expect(normalizePhone('996+700')).toBe('996700')
  })

  it('буквы и знаки не проходят', () => {
    expect(normalizePhone('тел: 0700abc112233')).toBe('0700112233')
  })

  it('режет по тринадцати символам вместе с плюсом', () => {
    // +996700112233 - ровно предел, дальше цифры не принимаются
    expect(normalizePhone('+9967001122334455')).toBe('+996700112233')
    expect(normalizePhone('+996700112233')).toHaveLength(13)
  })

  it('без плюса предел те же тринадцать, но все они цифры', () => {
    expect(normalizePhone('9'.repeat(30))).toBe('9'.repeat(13))
  })

  it('префикс страны: валидное начало, стирается как обычный текст', () => {
    expect(normalizePhone(PHONE_PREFIX)).toBe('+996')
    expect(normalizePhone('+99')).toBe('+99')
  })

  it('пустой ввод остаётся пустым', () => {
    expect(normalizePhone('')).toBe('')
    expect(normalizePhone('+')).toBe('+')
  })
})

describe('isValidPhone', () => {
  it('нормальные номера принимает', () => {
    expect(isValidPhone('+996700112233')).toBe(true)
    expect(isValidPhone('0700112233')).toBe(true)
  })

  it('слишком короткий не принимает: это опечатка, а не номер', () => {
    expect(isValidPhone('+996')).toBe(false)
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('+')).toBe(false)
  })

  it('мусор не принимает даже после ручной вставки', () => {
    expect(isValidPhone('+996 700 112233')).toBe(false)
    expect(isValidPhone('0700-112233')).toBe(false)
  })
})
