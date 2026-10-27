import { Archive, IdCard, Loader2, MapPin, Pencil, Star, Users, Warehouse } from 'lucide-react'
import { Button, ButtonSpinner, ConfirmPanel, ErrorNote, Field, InfoRow, Input } from '@/shared/ui'
import type { StaffUser, WarehouseInfo } from '@/shared/api'
import { money } from '@/shared/lib/format'
import { ROLE_LABELS } from '@/entities/staff/roles'
import { FastView, FastViewHeader, FastViewNav, FastViewNavButton } from '@/pages/admin/layout/FastView'

export type WarehousePanel = 'info' | 'edit' | 'default' | 'archive'

export interface WarehouseEdit {
  name: string
  address: string
}

interface PendingAction<T = void> {
  mutate: (arg: T) => void
  isPending: boolean
  error: string | null
}

export function WarehouseFastView({
  warehouse,
  panel,
  onPanel,
  onEdit,
  onClose,
  stockValueMinor,
  assignees,
  assigneesLoading,
  edit,
  onEditChange,
  save,
  makeDefault,
  archive,
}: {
  warehouse: WarehouseInfo
  panel: WarehousePanel
  onPanel: (panel: WarehousePanel) => void
  onEdit: () => void
  onClose: () => void
  stockValueMinor: number | undefined
  assignees: StaffUser[]
  assigneesLoading: boolean
  edit: WarehouseEdit
  onEditChange: (edit: WarehouseEdit) => void
  save: PendingAction
  makeDefault: PendingAction<string>
  archive: PendingAction<string>
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
          <FastViewNavButton icon={Pencil} label="Редактировать" active={panel === 'edit'} onClick={onEdit} />
          {!warehouse.isDefault && (
            <FastViewNavButton
              icon={Archive}
              label="В архив"
              active={panel === 'archive'}
              tone="danger"
              onClick={() => onPanel('archive')}
            />
          )}
        </FastViewNav>
      }
      header={
        <FastViewHeader icon={Warehouse}>
          {warehouse.isDefault && (
            <span className="absolute left-4 top-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-medium text-brand-green-dark">
              <Star className="h-3 w-3" />
              по умолчанию
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl leading-tight tracking-tight line-clamp-2">
              {warehouse.name}
            </h2>
            {warehouse.address && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {warehouse.address}
              </p>
            )}
            <div className="mt-2 font-display text-2xl tabular-nums">
              {stockValueMinor != null ? money(stockValueMinor) : '…'}
            </div>
            <p className="text-xs text-muted-foreground">стоимость остатков</p>
          </div>
        </FastViewHeader>
      }
    >
      {panel === 'info' && (
        <div className="space-y-4 px-6 py-5 text-sm">
          <InfoRow label="Адрес" valueClassName="min-w-0 truncate text-right">
            {warehouse.address ?? '—'}
          </InfoRow>
          <InfoRow label="Стоимость остатков" valueClassName="font-medium">
            {stockValueMinor != null ? money(stockValueMinor) : '…'}
          </InfoRow>
          <InfoRow label="Статус">{warehouse.isDefault ? 'склад по умолчанию' : 'обычный'}</InfoRow>

          <div className="border-t border-border/50 pt-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              Сотрудники ({assignees.length})
            </div>
            {assigneesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : assignees.length === 0 ? (
              <p className="text-muted-foreground">Никто не закреплён</p>
            ) : (
              <ul className="space-y-1.5">
                {assignees.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">{u.displayName ?? u.login}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground/70">
              Администраторы имеют доступ ко всем складам.
            </p>
          </div>

          {!warehouse.isDefault && (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center"
              onClick={() => onPanel('default')}
            >
              <Star className="mr-2 h-4 w-4" />
              Сделать складом по умолчанию
            </Button>
          )}
        </div>
      )}

      {panel === 'edit' && (
        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (edit.name.trim()) save.mutate()
          }}
        >
          <Field label="Название">
            <Input
              value={edit.name}
              onChange={(e) => onEditChange({ ...edit, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Адрес">
            <Input
              value={edit.address}
              onChange={(e) => onEditChange({ ...edit, address: e.target.value })}
              placeholder="Необязательно"
            />
          </Field>
          <ErrorNote error={save.error} />
          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={save.isPending || !edit.name.trim()}
            >
              {save.isPending ? <ButtonSpinner spaced /> : null}
              Сохранить
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

      {panel === 'default' && (
        <ConfirmPanel
          tone="success"
          icon={Star}
          title="Сделать складом по умолчанию?"
          description={
            <>
              <span className="font-medium text-foreground">{warehouse.name}</span> будет подставляться в
              новые документы по умолчанию.
            </>
          }
          confirmLabel="Сделать по умолчанию"
          busy={makeDefault.isPending}
          error={makeDefault.error}
          onConfirm={() => makeDefault.mutate(warehouse.id)}
          onCancel={() => onPanel('info')}
        />
      )}

      {panel === 'archive' && (
        <ConfirmPanel
          icon={Archive}
          title="Отправить в архив?"
          description={
            <>
              <span className="font-medium text-foreground">{warehouse.name}</span> скроется из выбора
              складов. Архивировать можно только склад с нулевым остатком.
            </>
          }
          confirmLabel="В архив"
          cancelLabel="Отмена"
          busy={archive.isPending}
          error={archive.error}
          onConfirm={() => archive.mutate(warehouse.id)}
          onCancel={() => onPanel('info')}
        />
      )}
    </FastView>
  )
}
