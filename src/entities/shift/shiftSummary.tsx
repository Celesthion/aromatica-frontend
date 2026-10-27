import { useQuery } from '@tanstack/react-query'
import { InfoRow, Spinner } from '@/shared/ui'
import { fetchShiftReceipts, fetchShiftSummary, queryKeys, type DocDto, type PosShift } from '@/shared/api'
import { amountTone, money, qtyFmt } from '@/shared/lib/format'
import { isCustomerLine } from './receiptLines'

/** Сводка смены (X-отчёт). Касса и админка используют один ключ, чтобы кэш был общий. */
export function useShiftSummary(shiftId: string) {
  return useQuery({
    queryKey: queryKeys.pos.summary.byShift(shiftId),
    queryFn: () => fetchShiftSummary(shiftId),
  })
}

export function useShiftReceipts(shiftId: string) {
  return useQuery({
    queryKey: queryKeys.pos.receipts.byShift(shiftId),
    queryFn: () => fetchShiftReceipts(shiftId),
  })
}

/** Позиции чека одной строкой для списка чеков в кассе и админке. */
export function receiptLinesSummary(d: DocDto): string {
  return d.lines
    .filter(isCustomerLine)
    .map((l) => `${l.productName} × ${qtyFmt(l.qty)}`)
    .join(', ')
}

/** Расхождение наличных (факт минус расчёт) с цветом по знаку. */
export function ShiftDiff({ shift }: { shift: PosShift }) {
  if (shift.countedCashMinor == null || shift.expectedCashMinor == null) return <span>—</span>
  const diff = shift.countedCashMinor - shift.expectedCashMinor
  if (diff === 0) return <span className={amountTone(0)}>0</span>
  return (
    <span className={amountTone(diff)}>
      {diff > 0 ? '+' : '−'}
      {money(Math.abs(diff))}
    </span>
  )
}

/** Содержимое X-отчёта; общее для кассы (модалка) и админки (фаст-вью смен). */
export function ShiftSummaryBody({
  shift,
  showCounted,
  className,
}: {
  shift: PosShift
  /** Показывать факт и расхождение. Нужно для закрытых смен в админке. */
  showCounted?: boolean
  className?: string
}) {
  const summary = useShiftSummary(shift.id)
  if (!summary.data) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Spinner size="sm" />
      </div>
    )
  }
  const report = summary.data
  return (
    <div className={className}>
      <div className="space-y-1.5 text-sm">
        <InfoRow label="Чеков">{report.receiptsCount}</InfoRow>
        <InfoRow label="Выручка" valueClassName="font-semibold">
          {money(report.revenueMinor)}
        </InfoRow>
        {report.receiptsCount > 0 && <InfoRow label="Средний чек">{money(report.avgReceiptMinor)}</InfoRow>}
      </div>

      <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 text-sm">
        <InfoRow label="Наличными">{money(report.cashMinor)}</InfoRow>
        <InfoRow label="Переводом">{money(report.noCashMinor)}</InfoRow>
        {report.returnsCount > 0 && (
          <InfoRow label={`Возвратов (${report.returnsCount})`}>−{money(report.returnsMinor)}</InfoRow>
        )}
      </div>

      {/* сертификаты не входят в выручку: продажа это аванс, погашение наоборот, иначе деньги посчитаются дважды */}
      {(report.certificatesSoldCount > 0 || report.certificatesRedeemedMinor > 0) && (
        <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 text-sm">
          {report.certificatesSoldCount > 0 && (
            <InfoRow label={`Продано сертификатов (${report.certificatesSoldCount})`}>
              {money(report.certificatesSoldMinor)}{' '}
              <span className="text-xs text-muted-foreground">не выручка</span>
            </InfoRow>
          )}
          {report.certificatesRedeemedMinor > 0 && (
            <InfoRow label="Погашено сертификатами">
              {money(report.certificatesRedeemedMinor)}{' '}
              <span className="text-xs text-muted-foreground">без денег в кассу</span>
            </InfoRow>
          )}
        </div>
      )}

      {/* скидки и подарки: прямой убыток, больше нигде не виден */}
      {(report.discountsMinor > 0 || report.giftsCount > 0 || report.splitWriteOffMl > 0) && (
        <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 text-sm">
          {report.discountsMinor > 0 && <InfoRow label="Скидки">−{money(report.discountsMinor)}</InfoRow>}
          {report.giftsCount > 0 && (
            <InfoRow label={`Подарки (${report.giftsCount})`}>
              −{money(report.giftsCostMinor)}{' '}
              <span className="text-xs text-muted-foreground">по себестоимости</span>
            </InfoRow>
          )}
          {/* разлив, кончившийся раньше учёта, тоже убыток; видно, у кого флаконы пустеют быстрее */}
          {report.splitWriteOffMl > 0 && (
            <InfoRow label={`Списан разлив (${qtyFmt(report.splitWriteOffMl)} мл)`}>
              −{money(report.splitWriteOffCostMinor)}{' '}
              <span className="text-xs text-muted-foreground">по себестоимости</span>
            </InfoRow>
          )}
        </div>
      )}

      <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 text-sm">
        <InfoRow label="Размен">{money(shift.openingCashMinor)}</InfoRow>
        <InfoRow label="Нал в ящике (расчёт)" valueClassName="font-semibold">
          {money(report.expectedCashMinor)}
        </InfoRow>
        {showCounted && (
          <>
            <InfoRow label="Нал (факт)">
              {shift.countedCashMinor != null ? money(shift.countedCashMinor) : '—'}
            </InfoRow>
            <InfoRow label="Расхождение">
              <ShiftDiff shift={shift} />
            </InfoRow>
          </>
        )}
      </div>

      {report.perSeller.length > 1 && (
        <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 text-sm">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            По продавцам
          </div>
          {report.perSeller.map((p) => (
            <InfoRow key={p.login} label={`${p.name} · ${p.receiptsCount} чек.`}>
              {money(p.revenueMinor)}
              {p.returnsMinor > 0 && (
                <span className="ml-1 text-xs text-brand-bad">−{money(p.returnsMinor)}</span>
              )}
              {p.writeOffMl > 0 && (
                <span className="ml-1 text-xs text-brand-warn">разлив −{qtyFmt(p.writeOffMl)} мл</span>
              )}
            </InfoRow>
          ))}
        </div>
      )}

      {shift.comment && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <span className="mb-0.5 block text-xs text-muted-foreground">Комментарий</span>
          <p className="whitespace-pre-wrap text-sm">{shift.comment}</p>
        </div>
      )}
    </div>
  )
}
