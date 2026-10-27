/**
 * Деньги в тыйынах (1 сом = 100); формулы и округление HALF_UP те же, что в CostMath на бэке,
 * количество в БД numeric(14,3), процент numeric(5,2).
 * Скидка строки хранится суммой, процент нужен только для ввода и показа.
 */

/** "1 250,50" в 125050 тыйын; пусто даёт 0, не число или отрицательное - null. */
export function somToMinor(value: string): number | null {
  const norm = value.replace(/\s/g, '').replace(',', '.')
  if (norm === '') return 0
  const n = Number(norm)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

/** Как somToMinor, но некорректный ввод считаем нулём (для необязательных полей). */
export function somToMinorOr0(value: string): number {
  return somToMinor(value) ?? 0
}

/** Число из поля ввода с запятой или точкой; пусто даёт 0, мусор NaN. */
export function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'))
}

export function minorToSom(minor: number): string {
  return minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2)
}

// qty дробное (мл разлива): во float 0.29 * 750 = 217.49999999999997, бэк даёт 218 и отклонил бы чек,
// поэтому считаем целыми в тысячных, как в БД
const QTY_SCALE = 1000

/** Целочисленное HALF_UP. */
function halfUp(num: number, den: number): number {
  return num >= 0 ? Math.floor((num + den / 2) / den) : -Math.floor((-num + den / 2) / den)
}

function qtyUnits(qty: number): number {
  return Math.round(qty * QTY_SCALE)
}

/** qty * цена без скидки. */
export function grossMinor(qty: number, priceMinor: number): number {
  return halfUp(qtyUnits(qty) * priceMinor, QTY_SCALE)
}

/** Сумма строки: qty * цена - скидка, не ниже нуля. */
export function lineSumMinor(qty: number, priceMinor: number, discountMinor: number): number {
  return Math.max(0, grossMinor(qty, priceMinor) - discountMinor)
}

/** Сумма строк, каждая считается через lineSumMinor. */
export function sumLinesMinor(lines: { qty: number; priceMinor: number; discountMinor: number }[]): number {
  return lines.reduce((s, l) => s + lineSumMinor(l.qty, l.priceMinor, l.discountMinor), 0)
}

/**
 * Цена единицы после скидки. Нужна там, где скидку вписывают в цену (бронь фиксирует то,
 * что назвали клиенту); при нулевом количестве возвращает цену как есть.
 */
export function unitPriceMinor(qty: number, priceMinor: number, discountMinor: number): number {
  if (!(qty > 0)) return priceMinor
  return halfUp(lineSumMinor(qty, priceMinor, discountMinor) * QTY_SCALE, qtyUnits(qty))
}

/** Скидка суммой из процента: qty * цена * pct / 100. */
export function discountMinorForPct(qty: number, priceMinor: number, pct: number): number {
  if (!(pct > 0)) return 0
  // процент хранится с сотыми, поэтому тоже считаем целыми
  const exact = halfUp(qtyUnits(qty) * priceMinor * Math.round(pct * 100), QTY_SCALE * 100 * 100)
  return Math.min(grossMinor(qty, priceMinor), exact)
}

/** Процент по сумме скидки (2 знака) только для показа, считать по нему нельзя. */
export function discountPctFor(qty: number, priceMinor: number, discountMinor: number): number {
  const gross = grossMinor(qty, priceMinor)
  if (!(discountMinor > 0) || gross <= 0) return 0
  return halfUp(discountMinor * 100 * 100, gross) / 100
}
