import { Clock, FlaskConical, IdCard, Package } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Field, InfoRow, Input, Spinner } from '@/shared/ui'
import type { SplitInfo, StockRow } from '@/shared/api'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import { FastView, FastViewHeader, FastViewNav, FastViewNavButton } from '@/pages/admin/layout/FastView'
import { StockHistory } from './StockHistory'

export type StockPanel = 'info' | 'history' | 'convert'

export interface ConvertForm {
  pcs: string
  splitName: string
  splitPrice: string
}

export function StockFastView({
  row,
  panel,
  onPanel,
  canConvert,
  onOpenConvert,
  onClose,
  kindLabel,
  warehouseId,
  splitInfo,
  splitInfoLoading,
  needsSplit,
  form,
  onFormChange,
  converting,
  convertError,
  onConvert,
}: {
  row: StockRow
  panel: StockPanel
  onPanel: (panel: StockPanel) => void
  canConvert: boolean
  onOpenConvert: () => void
  onClose: () => void
  kindLabel: (kind: string) => string
  warehouseId: string | undefined
  splitInfo: SplitInfo | undefined
  splitInfoLoading: boolean
  needsSplit: boolean
  form: ConvertForm
  onFormChange: (patch: Partial<ConvertForm>) => void
  converting: boolean
  convertError: string | null
  onConvert: () => void
}) {
  return (
    <FastView
      onClose={onClose}
      nav={
        <FastViewNav>
          <FastViewNavButton
            icon={IdCard}
            label="Основная информация"
            active={panel === 'info'}
            onClick={() => onPanel('info')}
          />
          <FastViewNavButton
            icon={Clock}
            label="История движений"
            active={panel === 'history'}
            onClick={() => onPanel('history')}
          />
          {canConvert && (
            <FastViewNavButton
              icon={FlaskConical}
              label="Вскрыть в распив"
              active={panel === 'convert'}
              onClick={onOpenConvert}
            />
          )}
        </FastViewNav>
      }
      header={
        <FastViewHeader icon={Package}>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg leading-tight tracking-tight line-clamp-2">
              {row.productName}
            </h2>
            <span className="mt-1.5 inline-flex rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/80">
              {kindLabel(row.kind)} · {UNIT_LABELS[row.unit]}
            </span>
            <div className={`mt-2 font-display text-2xl tabular-nums ${row.qty < 0 ? 'text-brand-bad' : ''}`}>
              {qtyFmt(row.qty)} {UNIT_LABELS[row.unit]}
            </div>
          </div>
        </FastViewHeader>
      }
    >
      {panel === 'info' && (
        <div className="space-y-4 px-6 py-5 text-sm">
          <InfoRow label="Остаток" valueClassName={row.qty < 0 ? 'text-brand-bad' : undefined}>
            {qtyFmt(row.qty)} {UNIT_LABELS[row.unit]}
          </InfoRow>
          <InfoRow label="Ср. себестоимость">{money(row.avgCostMinor)}</InfoRow>
          <InfoRow label="Сумма" valueClassName="font-medium">
            {money(row.valueMinor)}
          </InfoRow>
          <InfoRow label="Форма">
            {kindLabel(row.kind)} · {UNIT_LABELS[row.unit]}
          </InfoRow>
        </div>
      )}

      {panel === 'history' && <StockHistory productId={row.productId} warehouseId={warehouseId} />}

      {panel === 'convert' && (
        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault()
            onConvert()
          }}
        >
          <p className="rounded-xl border border-brand-green/15 bg-brand-green/5 px-3 py-2.5 text-xs text-muted-foreground">
            Вскрытие переносит себестоимость флакона в распив-SKU и списывает штуки со склада. Объём распива
            берётся из карточки товара — указывать мл не нужно.
          </p>

          {splitInfoLoading ? (
            <div className="flex justify-center py-2">
              <Spinner size="sm" />
            </div>
          ) : splitInfo?.exists ? (
            <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-xs">
              Распив уже есть: <span className="font-medium">{splitInfo.name}</span>
              {splitInfo.priceMinor != null ? ` · ${money(splitInfo.priceMinor)}/мл` : ' · цена не задана'}
            </p>
          ) : needsSplit ? (
            <div className="space-y-4 rounded-xl border border-brand-green/25 bg-brand-green/[0.04] p-3">
              <p className="text-xs text-muted-foreground">
                Распива у этого аромата ещё нет — создадим его при вскрытии.
              </p>
              <Field label="Название распива">
                <Input value={form.splitName} onChange={(e) => onFormChange({ splitName: e.target.value })} />
              </Field>
              <Field label="Цена за 1 мл, с" hint="Можно задать сейчас или позже в «Товарах»">
                <Input
                  inputMode="decimal"
                  value={form.splitPrice}
                  onChange={(e) => onFormChange({ splitPrice: e.target.value })}
                  placeholder="350"
                />
              </Field>
            </div>
          ) : null}

          <Field label="Сколько штук вскрыть">
            <Input
              inputMode="decimal"
              value={form.pcs}
              onChange={(e) => onFormChange({ pcs: e.target.value })}
              autoFocus
            />
          </Field>
          <ErrorNote error={convertError} />
          <div className="flex flex-col gap-2 pt-1">
            <Button type="submit" className="w-full justify-center" disabled={converting || splitInfoLoading}>
              {converting ? <ButtonSpinner spaced /> : null}
              {needsSplit ? 'Создать распив и вскрыть' : 'Вскрыть'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => onPanel('info')}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}
    </FastView>
  )
}
