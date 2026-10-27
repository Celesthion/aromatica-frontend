import { Archive, Building2, IdCard, Pencil, Phone } from 'lucide-react'
import { Button, ButtonSpinner, ConfirmPanel, DateField, ErrorNote, Field, Input } from '@/shared/ui'
import type { Counterparty, CounterpartyGender, CounterpartyType } from '@/shared/api'
import { PERSON_GENDER_LABELS } from '@/shared/lib/format'
import { normalizePhone } from '@/shared/lib/phone'
import { FastView, FastViewHeader, FastViewNav, FastViewNavButton } from '@/pages/admin/layout/FastView'
import { COUNTERPARTY_TYPE_LABELS } from '@/pages/admin/lib/labels'

export type CounterpartyPanel = 'info' | 'edit' | 'archive'

export interface CounterpartyEdit {
  name: string
  type: CounterpartyType
  phone: string
  /** '' = пол не указан. */
  gender: '' | CounterpartyGender
  /** ISO yyyy-mm-dd. */
  birthDate: string
  note: string
}

interface PendingAction {
  mutate: () => void
  isPending: boolean
  error: string | null
}

function birthLabel(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}

export function CounterpartyFastView({
  counterparty,
  panel,
  onPanel,
  onEdit,
  onArchive,
  onClose,
  edit,
  onEditChange,
  save,
  archive,
}: {
  counterparty: Counterparty
  panel: CounterpartyPanel
  onPanel: (panel: CounterpartyPanel) => void
  onEdit: () => void
  onArchive: () => void
  onClose: () => void
  edit: CounterpartyEdit
  onEditChange: (edit: CounterpartyEdit) => void
  save: PendingAction
  archive: PendingAction
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
          <FastViewNavButton
            icon={Archive}
            label="В архив"
            active={panel === 'archive'}
            tone="danger"
            onClick={onArchive}
          />
        </FastViewNav>
      }
      header={
        <FastViewHeader icon={Building2}>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl tracking-tight">{counterparty.name}</h2>
            {counterparty.phone && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                {counterparty.phone}
              </p>
            )}
            <span className="mt-1.5 inline-flex rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/80">
              {COUNTERPARTY_TYPE_LABELS[counterparty.type]}
            </span>
          </div>
        </FastViewHeader>
      }
    >
      {panel === 'info' && (
        <div className="space-y-4 px-6 py-5 text-sm">
          <div>
            <span className="mb-0.5 block text-xs text-muted-foreground">Тип</span>
            {COUNTERPARTY_TYPE_LABELS[counterparty.type]}
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-muted-foreground">Телефон</span>
            {counterparty.phone ?? '—'}
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-muted-foreground">Пол</span>
            {counterparty.gender ? PERSON_GENDER_LABELS[counterparty.gender] : '—'}
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-muted-foreground">Дата рождения</span>
            {birthLabel(counterparty.birthDate)}
          </div>
          <div>
            <span className="mb-0.5 block text-xs text-muted-foreground">Заметка</span>
            {counterparty.note ? (
              <p className="whitespace-pre-wrap">{counterparty.note}</p>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>
      )}

      {panel === 'edit' && (
        <form
          className="space-y-4 px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (edit.name.trim() && edit.phone.trim()) save.mutate()
          }}
        >
          <Field label="Название">
            <Input
              value={edit.name}
              onChange={(e) => onEditChange({ ...edit, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Тип">
            <select
              className="field w-full"
              value={edit.type}
              onChange={(e) => onEditChange({ ...edit, type: e.target.value as CounterpartyType })}
            >
              {Object.entries(COUNTERPARTY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Телефон *">
            <Input
              value={edit.phone}
              inputMode="tel"
              onChange={(e) => onEditChange({ ...edit, phone: normalizePhone(e.target.value) })}
              placeholder="+996 …"
              required
            />
          </Field>
          <Field label="Пол">
            <select
              className="field w-full"
              value={edit.gender}
              onChange={(e) => onEditChange({ ...edit, gender: e.target.value as '' | CounterpartyGender })}
            >
              <option value="">Не указан</option>
              {Object.entries(PERSON_GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Дата рождения">
            <DateField value={edit.birthDate} onChange={(iso) => onEditChange({ ...edit, birthDate: iso })} />
          </Field>
          <Field label="Заметка">
            <textarea
              className="field min-h-20 w-full"
              value={edit.note}
              onChange={(e) => onEditChange({ ...edit, note: e.target.value })}
              placeholder="необязательно"
            />
          </Field>
          <ErrorNote error={save.error} />
          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={save.isPending || !edit.name.trim() || !edit.phone.trim()}
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

      {panel === 'archive' && (
        <ConfirmPanel
          icon={Archive}
          title="Отправить в архив?"
          description={
            <>
              <span className="font-medium text-foreground">{counterparty.name}</span> скроется из
              справочника. Документы, где он указан, сохранятся.
            </>
          }
          confirmLabel="В архив"
          cancelLabel="Отмена"
          busy={archive.isPending}
          error={archive.error}
          onConfirm={() => archive.mutate()}
          onCancel={() => onPanel('info')}
        />
      )}
    </FastView>
  )
}
