import { pricePerSprayMl, sprayForOil } from '@/entities/product/dilution'
import { isCustomerLine } from '@/entities/shift/receiptLines'
import type { DocDto, PosShift, PosShiftSummary } from '@/shared/api'
import { dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'

const BRAND_NAME = 'StoreHub'

/** Экранирует данные чека, чтобы имя товара с "<" не ломало разметку. */
export function esc(s: string | number | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Строка чека "слева - справа"; значения уже экранированы вызывающим. */
const row = (left: string, right?: string | number, extra = '') =>
  `<div class="row${extra ? ` ${extra}` : ''}"><span>${left}</span>${right === undefined ? '' : `<span>${right}</span>`}</div>`

/**
 * HTML-документ чека под ленту 80 мм. Браузер печатает его через iframe,
 * мобильное приложение рендерит в PDF, разметка общая.
 */
export function printDocument(title: string, bodyHtml: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  body { font: 12px/1.45 ui-monospace, Menlo, monospace; width: 72mm; margin: 0 auto; color: #000; }
  h1 { font-size: 14px; text-align: center; margin: 0 0 2px; letter-spacing: 2px; }
  .c { text-align: center; } .r { text-align: right; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row span:first-child { flex: 1; }
  hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  .total { font-size: 14px; font-weight: 700; }
</style></head><body>${bodyHtml}</body></html>`
}

/** Скрытый iframe, а не window.open: его не режут блокировщики попапов. */
function openPrintWindow(title: string, bodyHtml: string) {
  const frame = document.createElement('iframe')
  Object.assign(frame.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  })
  frame.srcdoc = printDocument(title, bodyHtml)
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    // убираем, когда диалог печати уже точно закрыт
    setTimeout(() => frame.remove(), 60_000)
  }
  document.body.appendChild(frame)
}

/** Заголовок и тело чека, общие для веба и мобильного приложения. */
export function receiptPrintout(
  doc: DocDto,
  shift: PosShift,
  seller: string,
  changeMinor: number,
  receiptDiscountMinor = 0,
): { title: string; body: string } {
  const isReturn = doc.docType === 'RETURN'
  const lines = doc.lines
    // воду не печатаем: она бесплатна и в документе только ради склада и себестоимости
    .filter(isCustomerLine)
    .map((l) => {
      // в строке разлива лежит масло, а печатаем флакон, который получил клиент, и цену его миллилитра
      const qty = l.dilutionPct != null ? sprayForOil(l.qty, l.dilutionPct) : l.qty
      const price = l.dilutionPct != null ? pricePerSprayMl(l.priceMinor, l.dilutionPct) : l.priceMinor
      const pct = l.dilutionPct != null ? ` · ${qtyFmt(l.dilutionPct)} %` : ''
      const discount = l.discountMinor ? ` −${money(l.discountMinor)}` : ''
      return `${row(esc(l.productName))}
${row(`${qtyFmt(qty)}${pct} × ${money(price)}${discount}`, money(l.sumMinor))}`
    })
    .join('')
  const pays = [
    doc.cashMinor ? row('Наличными', money(doc.cashMinor)) : '',
    doc.noCashMinor ? row('Переводом', money(doc.noCashMinor)) : '',
    changeMinor > 0 ? row('Сдача', money(changeMinor)) : '',
  ].join('')
  return {
    title: `${isReturn ? 'Возврат' : 'Чек'} №${doc.number}`,
    body: `<h1>${BRAND_NAME}</h1>
<p class="c">${isReturn ? 'ВОЗВРАТ' : 'ТОВАРНЫЙ ЧЕК'} №${esc(doc.number)}</p>
<p class="c">${dateTimeFmt(doc.moment)} · смена №${esc(shift.number)}</p>
<hr>${lines}<hr>
${receiptDiscountMinor > 0 ? row('Скидка на чек', `−${money(receiptDiscountMinor)}`) : ''}
${row(isReturn ? 'ВОЗВРАЩЕНО' : 'ИТОГО', money(doc.sumMinor), 'total')}
${pays}<hr>
<p class="c">Продавец: ${esc(seller)}</p>
<p class="c">Спасибо за покупку!</p>`,
  }
}

export function printReceipt(
  doc: DocDto,
  shift: PosShift,
  seller: string,
  changeMinor: number,
  receiptDiscountMinor = 0,
) {
  const { title, body } = receiptPrintout(doc, shift, seller, changeMinor, receiptDiscountMinor)
  openPrintWindow(title, body)
}

/** Отчёт по смене (X/Z), тот же макет для веба и мобильного приложения. */
export function shiftReportPrintout(
  shift: PosShift,
  s: PosShiftSummary,
  title: string,
): { title: string; body: string } {
  const sellers =
    s.perSeller.length > 1
      ? `<hr><p class="c">ПО ПРОДАВЦАМ</p>${s.perSeller
          .map((p) => row(`${esc(p.name)} (${p.receiptsCount})`, money(p.revenueMinor)))
          .join('')}`
      : ''
  return {
    title: `${title} · смена №${shift.number}`,
    body: `<h1>${BRAND_NAME}</h1>
<p class="c">${esc(title)} · смена №${esc(shift.number)}</p>
<p class="c">${esc(shift.warehouseName)}</p>
<hr>
${row('Чеков', s.receiptsCount)}
${row('Выручка', money(s.revenueMinor), 'total')}
<hr>
${row('Наличными', money(s.cashMinor))}
${row('Переводом', money(s.noCashMinor))}
${s.returnsCount ? row(`Возвратов (${s.returnsCount})`, `−${money(s.returnsMinor)}`) : ''}
${s.splitWriteOffMl > 0 ? row(`Списан разлив (${qtyFmt(s.splitWriteOffMl)} мл)`, `−${money(s.splitWriteOffCostMinor)}`) : ''}
<hr>
${row('Размен на начало', money(shift.openingCashMinor))}
${row('Нал в ящике (расчёт)', money(s.expectedCashMinor), 'total')}
${sellers}
<hr>
<p class="c">Открыл: ${esc(shift.openedBy)} · ${dateTimeFmt(shift.openedAt)}</p>`,
  }
}

export function printShiftReport(shift: PosShift, s: PosShiftSummary, title: string) {
  const doc = shiftReportPrintout(shift, s, title)
  openPrintWindow(doc.title, doc.body)
}
