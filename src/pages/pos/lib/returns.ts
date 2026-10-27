import type { LineDto } from '@/shared/api'
import { lineSumMinor, sumLinesMinor } from '@/shared/lib/money'
import { sprayForOil } from '@/entities/product/dilution'
import { isCustomerLine } from '@/entities/shift/receiptLines'

/**
 * Позиция чека, которую можно положить на полку. Штучный товар возвращают построчно,
 * налив только целым флаконом: масло, вода и атомайзер несут общую метку связки, сервер собирает
 * из них одну вещь. Воду клиент не покупал, её не показываем, сервер добавит по метке сам.
 */
export interface ReturnItem {
  /** id строки чека или метка связки. */
  key: string
  label: string
  /** У связки, например "флакон 10 мл · 50 %". */
  hint: string | null
  /** Строки чека, которые уйдут в запрос при выборе позиции. */
  lines: LineDto[]
  /** Связку возвращают целиком, количество не меняется. */
  whole: boolean
  /** Сколько продано, больше штучного не вернуть. */
  qty: number
}

function bundleHint(liquid: LineDto | undefined): string | null {
  if (!liquid) return null
  if (liquid.dilutionPct != null) {
    return `флакон ${sprayForOil(liquid.qty, liquid.dilutionPct)} мл · ${liquid.dilutionPct} %`
  }
  return `флакон ${liquid.qty} мл`
}

export function returnItems(lines: LineDto[]): ReturnItem[] {
  const items: ReturnItem[] = []
  const seen = new Set<string>()
  for (const l of lines) {
    if (l.bundleId == null) {
      if (isCustomerLine(l)) {
        items.push({ key: l.id, label: l.productName, hint: null, lines: [l], whole: false, qty: l.qty })
      }
      continue
    }
    if (seen.has(l.bundleId)) continue
    seen.add(l.bundleId)
    const bundle = lines.filter((x) => x.bundleId === l.bundleId)
    const shown = bundle.filter(isCustomerLine)
    const liquid = bundle.find((x) => x.dilutionPct != null) ?? bundle.find((x) => x.productKind === 'SPLIT')
    items.push({
      key: l.bundleId,
      label: (liquid ?? shown[0] ?? l).productName,
      hint: bundleHint(liquid),
      lines: shown,
      whole: true,
      qty: 1,
    })
  }
  return items
}

/** У связки возвращаем всю её сумму. */
export function returnSumMinor(item: ReturnItem, qty: number): number {
  if (item.whole) return sumLinesMinor(item.lines)
  const l = item.lines[0]
  return lineSumMinor(qty, l.priceMinor, returnShareMinor(l, qty))
}

/** Скидка задана на всю строку, на возвращаемую часть приходится её доля. */
export function returnShareMinor(l: LineDto, qty: number): number {
  return Math.round((l.discountMinor * qty) / l.qty)
}
