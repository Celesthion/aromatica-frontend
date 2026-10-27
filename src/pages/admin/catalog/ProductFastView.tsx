import { Archive, ArchiveRestore, Boxes, IdCard, Package, Pencil } from 'lucide-react'
import { ConfirmPanel, InfoRow, Spinner, StatusChip } from '@/shared/ui'
import type { AdminProduct, ProductUnit } from '@/shared/api'
import { UNIT_LABELS, money, qtyFmt } from '@/shared/lib/format'
import { FastView, FastViewHeader, FastViewNav, FastViewNavButton } from '@/pages/admin/layout/FastView'
import { modelTitle } from '@/pages/admin/lib/labels'

export type ProductPanel = 'info' | 'stock' | 'archive'

export interface WarehouseStock {
  id: string
  name: string
  qty: number
  unit: ProductUnit
}

export function ProductFastView({
  product,
  panel,
  onPanel,
  onEdit,
  onClose,
  kindLabel,
  stock,
  stockLoading,
  archiving,
  onArchive,
}: {
  product: AdminProduct
  panel: ProductPanel
  onPanel: (panel: ProductPanel) => void
  onEdit: () => void
  onClose: () => void
  kindLabel: (kind: string) => string
  stock: WarehouseStock[] | undefined
  stockLoading: boolean
  archiving: boolean
  onArchive: () => void
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
            icon={Boxes}
            label="Остатки по складам"
            active={panel === 'stock'}
            onClick={() => onPanel('stock')}
          />
          <FastViewNavButton icon={Pencil} label="Редактировать" onClick={onEdit} />
          <FastViewNavButton
            icon={product.archived ? ArchiveRestore : Archive}
            label={product.archived ? 'Вернуть из архива' : 'В архив'}
            active={panel === 'archive'}
            tone={product.archived ? 'success' : 'danger'}
            onClick={() => onPanel('archive')}
          />
        </FastViewNav>
      }
      header={
        <FastViewHeader icon={Package}>
          <StatusChip
            tone={product.archived ? 'archived' : 'active'}
            dot
            className="absolute left-4 top-3.5 z-10"
          >
            {product.archived ? 'в архиве' : 'активен'}
          </StatusChip>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg leading-tight tracking-tight line-clamp-2">{product.name}</h2>
            <span className="mt-1.5 inline-flex rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/80">
              {kindLabel(product.kind)} · {UNIT_LABELS[product.unit]}
              {product.volumeMl != null ? ` · ${product.volumeMl} мл` : ''}
            </span>
            {product.priceKopecks != null && (
              <div className="mt-2 font-display text-2xl tabular-nums">{money(product.priceKopecks)}</div>
            )}
          </div>
        </FastViewHeader>
      }
    >
      {panel === 'info' && (
        <div className="space-y-4 px-6 py-5 text-sm">
          <InfoRow label="Артикул">{product.article ?? '—'}</InfoRow>
          <InfoRow label="Цена">{product.priceKopecks != null ? money(product.priceKopecks) : '—'}</InfoRow>
          <InfoRow label="Форма">
            {kindLabel(product.kind)} · {UNIT_LABELS[product.unit]}
          </InfoRow>
          {product.modelName && (
            <InfoRow label="Продукт" valueClassName="min-w-0 truncate">
              {modelTitle(product.modelBrand, product.modelName)}
            </InfoRow>
          )}
          {product.description && (
            <div>
              <span className="mb-0.5 block text-xs text-muted-foreground">Описание</span>
              <p className="whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      )}

      {panel === 'stock' && (
        <div className="px-6 py-5 text-sm">
          {stockLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <div className="space-y-2">
              {(stock ?? []).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border border-brand-green/15 bg-brand-green/[0.04] px-3 py-2.5"
                >
                  <span className="min-w-0 truncate text-muted-foreground">{s.name}</span>
                  <span className={`shrink-0 tabular-nums ${s.qty < 0 ? 'font-medium text-brand-bad' : ''}`}>
                    {qtyFmt(s.qty)} {UNIT_LABELS[s.unit]}
                  </span>
                </div>
              ))}
              {(stock?.length ?? 0) === 0 && <p className="text-muted-foreground">Складов нет</p>}
            </div>
          )}
        </div>
      )}

      {panel === 'archive' && (
        <ConfirmPanel
          tone={product.archived ? 'success' : 'danger'}
          icon={product.archived ? ArchiveRestore : Archive}
          title={product.archived ? 'Вернуть из архива?' : 'Отправить в архив?'}
          description={
            <>
              <span className="font-medium text-foreground">{product.name}</span>{' '}
              {product.archived
                ? 'снова появится в каталоге и подборе.'
                : 'скроется из каталога и подбора. Остатки и история сохранятся.'}
            </>
          }
          confirmLabel={product.archived ? 'Вернуть из архива' : 'В архив'}
          cancelLabel="Отмена"
          busy={archiving}
          onConfirm={onArchive}
          onCancel={() => onPanel('info')}
        />
      )}
    </FastView>
  )
}
