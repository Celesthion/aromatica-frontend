import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Printer, Store } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, InfoRow, Input, Modal } from '@/shared/ui'
import { somToMinor } from '@/shared/lib/money'
import { amountTone, money, qtyFmt } from '@/shared/lib/format'
import { closeShift, fetchPosWarehouses, openShift, type PosShift, queryKeys } from '@/shared/api'
import { ShiftSummaryBody, useShiftSummary } from '@/entities/shift/shiftSummary'
import { printShiftReport } from '@/pages/pos/lib/print'

export function OpenShiftScreen({ canOpen }: { canOpen: boolean }) {
  const queryClient = useQueryClient()
  const warehouses = useQuery({
    queryKey: queryKeys.pos.warehouses,
    queryFn: fetchPosWarehouses,
    enabled: canOpen,
  })
  const [warehouseId, setWarehouseId] = useState('')
  const [cash, setCash] = useState('')
  const openMutation = useMutation({
    mutationFn: () =>
      openShift({
        warehouseId: warehouseId || undefined,
        openingCashMinor: somToMinor(cash) ?? 0,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.all }),
  })
  const defaultId = warehouses.data?.find((w) => w.isDefault)?.id ?? warehouses.data?.[0]?.id ?? ''
  // без доступа ни к одному складу продавцу нечего открывать
  const noAccess = warehouses.isSuccess && (warehouses.data?.length ?? 0) === 0

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-2">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 shadow-[0_1px_3px_rgba(40,40,43,0.06),0_8px_24px_-12px_rgba(40,40,43,0.12)]">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8" strokeWidth={1.25} />
          <div>
            <h1 className="font-display text-2xl tracking-tight">Касса закрыта</h1>
            <p className="text-sm text-muted-foreground">
              {canOpen ? 'Откройте смену, чтобы пробивать чеки' : 'Ожидайте открытия смены'}
            </p>
          </div>
        </div>
        {!canOpen ? (
          <p className="mt-8 rounded-md border border-border/60 bg-secondary/50 px-3 py-3 text-sm text-muted-foreground">
            Открыть смену может администратор или старший продавец. Как смену откроют — здесь появится
            терминал, и вы сможете пробивать чеки.
          </p>
        ) : noAccess ? (
          <p className="mt-8 rounded-md border border-brand-warn/30 bg-brand-warn/10 px-3 py-3 text-sm text-brand-warn">
            Вам не назначен ни один склад. Обратитесь к администратору, чтобы получить доступ.
          </p>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              openMutation.mutate()
            }}
          >
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">Склад</span>
              <select
                className="field h-11 w-full"
                value={warehouseId || defaultId}
                onChange={(e) => setWarehouseId(e.target.value)}
              >
                {(warehouses.data ?? []).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">Наличные в ящике (размен), с</span>
              <Input
                className="h-11"
                inputMode="decimal"
                placeholder="0"
                value={cash}
                onChange={(e) => setCash(e.target.value)}
              />
            </label>
            <ErrorNote error={openMutation.error} className="mt-3" />
            <Button type="submit" className="h-11 w-full" disabled={openMutation.isPending}>
              {openMutation.isPending ? <ButtonSpinner /> : 'Открыть смену'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export function SummaryModal({ shift, onClose }: { shift: PosShift; onClose: () => void }) {
  const summary = useShiftSummary(shift.id)
  const report = summary.data

  return (
    <Modal align="center" onClose={onClose} title={`X-отчёт · смена №${shift.number}`}>
      <ShiftSummaryBody shift={shift} />
      {report && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => printShiftReport(shift, report, 'X-отчёт')}
        >
          <Printer className="mr-2 h-4 w-4" />
          Печать
        </Button>
      )}
    </Modal>
  )
}

export function CloseShiftModal({ shift, onClose }: { shift: PosShift; onClose: () => void }) {
  const queryClient = useQueryClient()
  const summary = useShiftSummary(shift.id)
  const [counted, setCounted] = useState('')
  const [comment, setComment] = useState('')
  const countedMinor = somToMinor(counted)
  const expected = summary.data?.expectedCashMinor
  const diff = countedMinor != null && expected != null ? countedMinor - expected : null

  const closeMutation = useMutation({
    mutationFn: () => closeShift(shift.id, { countedCashMinor: countedMinor ?? 0, comment: comment || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.all }),
  })

  return (
    <Modal align="center" onClose={onClose} title={`Закрытие смены №${shift.number}`}>
      {summary.data && (
        <div className="space-y-2 text-sm">
          <InfoRow label="Выручка за смену">{money(summary.data.revenueMinor)}</InfoRow>
          <InfoRow label="Нал в ящике (расчёт)" valueClassName="font-semibold">
            {money(summary.data.expectedCashMinor)}
          </InfoRow>
          {/* потери по разливу видны сразу, а не при разборе склада */}
          {summary.data.splitWriteOffMl > 0 && (
            <InfoRow label={`Списан разлив (${qtyFmt(summary.data.splitWriteOffMl)} мл)`}>
              <span className="text-brand-warn">−{money(summary.data.splitWriteOffCostMinor)}</span>
            </InfoRow>
          )}
        </div>
      )}
      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block text-muted-foreground">Фактически пересчитано, с</span>
        <Input
          className="h-11"
          inputMode="decimal"
          value={counted}
          onChange={(e) => setCounted(e.target.value)}
          autoFocus
        />
      </label>
      {diff != null && diff !== 0 && (
        <p className={`mt-2 text-sm ${amountTone(diff)}`}>
          {diff < 0 ? 'Недостача' : 'Излишек'}: {money(Math.abs(diff))} — запишется корректировкой по счёту
          «Наличные»
        </p>
      )}
      <label className="mt-3 block text-sm">
        <span className="mb-1.5 block text-muted-foreground">Комментарий</span>
        <Input value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>
      <ErrorNote error={closeMutation.error} className="mt-3" />
      <Button
        className="mt-5 h-11 w-full"
        disabled={countedMinor == null || closeMutation.isPending}
        onClick={() => closeMutation.mutate()}
      >
        {closeMutation.isPending ? <ButtonSpinner /> : 'Закрыть смену'}
      </Button>
    </Modal>
  )
}
