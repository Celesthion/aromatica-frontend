// Разлив: в чек идёт масло (его и списываем), воду клиент не оплачивает, поэтому цена мл спрея
// равна цене масла * pct / 100: масло по 100 за мл при 50 % даёт спрей по 50 за мл.

/** Мл с точностью до сотых, точнее у прилавка не налить. */
export const roundMl = (ml: number) => Math.round(ml * 100) / 100

/** Если настройка концентрации не пришла. */
export const DEFAULT_DILUTION_PCT = 50

/** Ниже этой доли масла магазин не наливает, такой спрей уже не парфюм. */
export const MIN_DILUTION_PCT = 30

/** Распив - готовый парфюм, его не разбавляем. */
export function isDilutable(kind: string): boolean {
  return kind === 'BULK'
}

export function isDilutionValid(pct: number): boolean {
  return Number.isFinite(pct) && pct >= MIN_DILUTION_PCT && pct <= 100
}

export function oilForSpray(sprayMl: number, pct: number): number {
  return roundMl((sprayMl * pct) / 100)
}

export function sprayForOil(oilMl: number, pct: number): number {
  return roundMl((oilMl * 100) / pct)
}

/** Цена мл спрея для показа; итог строки считается от масла. */
export function pricePerSprayMl(oilPriceMinor: number, pct: number): number {
  return Math.round((oilPriceMinor * pct) / 100)
}
