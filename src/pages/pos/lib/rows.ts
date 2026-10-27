import type { CartLine } from './types'

interface PaidRow {
  kind: 'line'
  line: CartLine
  /** Индекс в корзине, по нему правят и удаляют. */
  index: number
}

/** Строки одного набора-подарка показываются и удаляются вместе. */
export interface GiftRow {
  kind: 'gift'
  groupId: string
  items: { line: CartLine; index: number }[]
}

export interface CartRows {
  paid: PaidRow[]
  gifts: GiftRow[]
}

/**
 * Раскладывает корзину по блокам чека: строки одного набора-подарка собираются в блок с общей
 * кнопкой удаления. Склеиваем только подряд идущие строки, порядок в чеке задаёт кассир.
 * Упаковка в блоки не попадает.
 */
export function cartRows(cart: CartLine[]): CartRows {
  const rows: (PaidRow | GiftRow)[] = []
  cart.forEach((line, index) => {
    if (line.isPackaging) return
    if (!line.isGift || !line.giftGroupId) {
      rows.push({ kind: 'line', line, index })
      return
    }
    const open = rows[rows.length - 1]
    if (open?.kind === 'gift' && open.groupId === line.giftGroupId) open.items.push({ line, index })
    else rows.push({ kind: 'gift', groupId: line.giftGroupId, items: [{ line, index }] })
  })
  return {
    paid: rows.filter((r): r is PaidRow => r.kind === 'line'),
    gifts: rows.filter((r): r is GiftRow => r.kind === 'gift'),
  }
}
