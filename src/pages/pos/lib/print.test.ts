import { describe, expect, it } from 'vitest'
import type { DocDto, LineDto, PosShift, PosShiftSummary } from '@/shared/api'
import { money } from '@/shared/lib/format'
import { esc, receiptPrintout, shiftReportPrintout } from './print'
import { makeLineDto } from './testing/fixtures'

const shift: PosShift = {
  id: 's1',
  number: 7,
  status: 'OPEN',
  warehouseId: 'w1',
  warehouseName: 'Магазин',
  openedBy: 'Продавец',
  openedAt: '2026-09-09T10:00:00',
  openingCashMinor: 100_000,
  closedBy: null,
  closedAt: null,
  countedCashMinor: null,
  expectedCashMinor: null,
  comment: null,
}

describe('esc', () => {
  it('экранирует HTML-опасные символы в данных чека', () => {
    expect(esc('Товар <script> & "кавычки"')).toBe('Товар &lt;script&gt; &amp; &quot;кавычки&quot;')
  })

  it('числа и null безопасны', () => {
    expect(esc(42)).toBe('42')
    expect(esc(null)).toBe('')
    expect(esc(undefined)).toBe('')
  })
})

describe('shiftReportPrintout', () => {
  const summary = (splitWriteOffMl: number, splitWriteOffCostMinor: number): PosShiftSummary => ({
    receiptsCount: 1,
    revenueMinor: 100_000,
    cashMinor: 100_000,
    noCashMinor: 0,
    returnsCount: 0,
    returnsMinor: 0,
    expectedCashMinor: 200_000,
    avgReceiptMinor: 100_000,
    discountsMinor: 0,
    giftsCount: 0,
    giftsCostMinor: 0,
    certificatesSoldCount: 0,
    certificatesSoldMinor: 0,
    certificatesRedeemedMinor: 0,
    splitWriteOffMl,
    splitWriteOffCostMinor,
    perSeller: [],
  })

  it('печатает списанный разлив отдельной строкой', () => {
    const { body } = shiftReportPrintout(shift, summary(15, 450_000), 'X-отчёт')
    expect(body).toContain('Списан разлив (15 мл)')
    // формат денег берём у форматтера, там неразрывный пробел
    expect(body).toContain(money(450_000))
  })

  it('без потерь строки нет, пустую смену лишним не грузим', () => {
    const { body } = shiftReportPrintout(shift, summary(0, 0), 'X-отчёт')
    expect(body).not.toContain('Списан разлив')
  })
})

describe('receiptPrintout, разлив', () => {
  const oil = (over: Partial<LineDto> = {}): LineDto =>
    makeLineDto({
      id: 'l1',
      productId: 'p1',
      productName: 'Creed — Aventus · Разлив',
      productKind: 'BULK',
      qty: 5,
      priceMinor: 30_000,
      costMinor: 10_000,
      sumMinor: 150_000,
      dilutionPct: 50,
      ...over,
    })

  const doc = (lines: LineDto[]): DocDto => ({
    id: 'd1',
    docType: 'SALE',
    number: 1,
    status: 'POSTED',
    moment: '2026-09-17T12:00:00',
    warehouseId: 'w1',
    warehouseToId: null,
    counterpartyId: null,
    counterpartyName: null,
    sumMinor: 150_000,
    comment: null,
    cashMinor: 150_000,
    noCashMinor: 0,
    payAccountId: null,
    createdAt: '2026-09-17T12:00:00',
    postedAt: '2026-09-17T12:00:00',
    createdBy: null,
    lines,
  })

  it('печатает флакон клиента, а не миллилитры масла', () => {
    const { body } = receiptPrintout(doc([oil()]), shift, 'Продавец', 0)
    // 5 мл масла при 50 % - это флакон на 10 мл по 150 с за миллилитр
    expect(body).toContain('10 · 50 %')
    expect(body).toContain(money(15_000))
    expect(body).not.toContain('5 × ')
  })

  it('парфюмерную воду клиенту не печатает', () => {
    const water = oil({
      id: 'l2',
      productName: 'Парфюмерная вода',
      productKind: 'BASE',
      priceMinor: 0,
      sumMinor: 0,
      dilutionPct: null,
    })
    const { body } = receiptPrintout(doc([oil(), water]), shift, 'Продавец', 0)
    expect(body).not.toContain('Парфюмерная вода')
  })

  it('обычную строку печатает без пересчёта и процента', () => {
    const bottle = oil({
      productKind: 'BOTTLE',
      qty: 2,
      dilutionPct: null,
      priceMinor: 100_000,
      sumMinor: 200_000,
    })
    const { body } = receiptPrintout(doc([bottle]), shift, 'Продавец', 0)
    expect(body).toContain('2 × ')
    expect(body).not.toContain('%')
  })
})
