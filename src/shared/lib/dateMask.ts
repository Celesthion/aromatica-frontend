/** Ввод даты маской дд.мм.гггг; наружу отдаётся ISO гггг-мм-дд. */

const DIGITS = 8

const digitsOf = (s: string) => s.replace(/\D/g, '')

export function maskDate(input: string): string {
  const d = digitsOf(input).slice(0, DIGITS)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`
}

/** Не пропускает 31 февраля и 31 апреля. */
function realDate(day: number, month: number, year: number): boolean {
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

/** дд.мм.гггг в гггг-мм-дд; для пустой, неполной или несуществующей даты пустая строка. */
export function maskedToIso(masked: string): string {
  const d = digitsOf(masked)
  if (d.length !== DIGITS) return ''
  const day = Number(d.slice(0, 2))
  const month = Number(d.slice(2, 4))
  const year = Number(d.slice(4))
  if (!realDate(day, month, year)) return ''
  return `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}`
}

/** гггг-мм-дд в дд.мм.гггг для показа в поле. */
export function isoToMasked(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : ''
}

/** Введены все 8 цифр (дата может не существовать). */
export function isDateComplete(masked: string): boolean {
  return digitsOf(masked).length === DIGITS
}
