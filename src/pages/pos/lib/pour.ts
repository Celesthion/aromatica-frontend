import { roundMl } from '@/entities/product/dilution'

/** Вскрытие флакона пополняет только распив. */
const SPLIT_KIND = 'SPLIT'

/**
 * Налив, когда флакон кончился раньше, чем по учёту (часть теряется на шприце и дне).
 * Кассир вводит, сколько реально налил: shortfallMl - сколько долить клиенту из нового флакона,
 * writeOffMl - сколько списать. Пример: остаток 120, просили 100, налилось 80, значит долить 20
 * и списать 40.
 */
export interface PourShortfall {
  shortfallMl: number
  /** Учётный остаток минус реально налитое. */
  writeOffMl: number
}

/** requestedMl = null, если объём ещё не выбран (флакон оказался пуст сразу). */
export function pourShortfall(
  requestedMl: number | null,
  pouredMl: number,
  availableMl: number,
): PourShortfall {
  const requested = requestedMl ?? pouredMl
  return {
    shortfallMl: roundMl(Math.max(0, requested - pouredMl)),
    writeOffMl: roundMl(Math.max(0, availableMl - pouredMl)),
  }
}

/** Ноль допустим (флакон мог оказаться пустым); больше остатка уже излишек. */
export function isPouredValid(pouredMl: number, availableMl: number): boolean {
  return Number.isFinite(pouredMl) && pouredMl >= 0 && pouredMl <= availableMl
}

interface ShortfallPlan {
  /** Сколько положить в чек по факту налитого; 0 - строку не добавляем. */
  cartMl: number
  /** Предлагать ли вскрыть следующий флакон того же аромата. */
  offerConvert: boolean
  /** Учётный остаток позиции сразу после списания. */
  qtyAfterWriteOff: number
}

/** Вскрытие предлагаем только для распива: разлив (BULK) наливают из канистры, вскрытие его не пополнит. */
export function planAfterShortfall(input: {
  kind: string
  stockQty: number
  writeOffMl: number
  pouredMl: number
}): ShortfallPlan {
  return {
    cartMl: roundMl(Math.max(0, input.pouredMl)),
    offerConvert: input.kind === SPLIT_KIND,
    qtyAfterWriteOff: roundMl(input.stockQty - input.writeOffMl),
  }
}

/** Остаток распива после вскрытия: оно пополняет тот же распив, который кончился. */
export function qtyAfterConvert(qtyAfterWriteOff: number, convertedMl: number): number {
  return roundMl(qtyAfterWriteOff + convertedMl)
}
