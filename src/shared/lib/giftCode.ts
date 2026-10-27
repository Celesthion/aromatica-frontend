/**
 * Код подарочного сертификата: 12 цифр, последняя контрольная по Луну (как GiftCodes на бэке).
 * Опечатка в цифре и перестановка соседних цифр отсекаются до запроса (Лун не ловит только 09 и 90).
 */
const CODE_RE = /^\d{12}$/

/** Пробелы между группами с бланка убираем; старые коды с дефисами не трогаем. */
export function normalizeGiftCode(raw: string): string {
  return raw.replace(/\s/g, '')
}

/** "7391 0284 5561", как на бланке. Старые коды остаются как были. */
export function formatGiftCode(code: string): string {
  const digits = normalizeGiftCode(code)
  if (!CODE_RE.test(digits)) return code
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/** Похоже ли на код нового формата: тогда контрольную цифру проверяем до запроса. */
export function looksLikeGiftCode(raw: string): boolean {
  return CODE_RE.test(normalizeGiftCode(raw))
}

export function isValidGiftCode(raw: string): boolean {
  if (!looksLikeGiftCode(raw)) return false
  const code = normalizeGiftCode(raw)
  let sum = 0
  let dbl = false // справа налево: контрольная не удваивается, следующая удваивается
  for (let i = code.length - 1; i >= 0; i--) {
    let d = Number(code[i])
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}
