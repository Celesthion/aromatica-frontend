// Жёсткий формат (цифры и ведущий плюс): номер служит ключом клиента.
// Правило то же, что у @Pattern в PosCustomerRequest на бэке.

// максимум 13 символов вместе с плюсом: +996700112233
const MAX_LENGTH = 13
const MIN_DIGITS = 6

/**
 * Подставляется в пустое поле при открытии формы и стирается как обычный текст,
 * чтобы можно было ввести иностранный номер.
 */
export const PHONE_PREFIX = '+996'

/** Оставляет цифры и ведущий плюс, остальное выбрасывает; применяется при наборе. */
export function normalizePhone(input: string): string {
  const plus = input.trimStart().startsWith('+')
  const digits = input.replace(/\D/g, '').slice(0, plus ? MAX_LENGTH - 1 : MAX_LENGTH)
  return plus ? `+${digits}` : digits
}

/** Цифры с необязательным плюсом, не меньше MIN_DIGITS; верхнюю границу уже режет normalizePhone. */
export function isValidPhone(phone: string): boolean {
  return /^\+?\d+$/.test(phone) && phone.replace(/\D/g, '').length >= MIN_DIGITS
}
