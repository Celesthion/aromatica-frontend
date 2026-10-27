import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, History, IdCard, KeyRound, Pencil } from 'lucide-react'
import { Button, ButtonSpinner, ConfirmPanel, ErrorNote, Field, Input, StatusChip } from '@/shared/ui'
import {
  fetchSellerStats,
  fetchUserActivity,
  queryKeys,
  toggleUserArchive,
  updateUser,
  type ActivityItem,
  type Role,
  type StaffUser,
  type WarehouseInfo,
} from '@/shared/api'
import { ROLE_LABELS } from '@/entities/staff/roles'
import { dateFmt } from '@/shared/lib/format'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import {
  FastView,
  FastViewHeader,
  FastViewNav,
  FastViewNavButton,
  FastViewPortal,
} from '@/pages/admin/layout/FastView'
import { PASSWORD_HINT, strongPassword } from './password'
import { ActivityFeed, StaffStats } from './StaffActivity'
import { StaffRoleFields } from './StaffRoleFields'

type StaffPanelMode = 'info' | 'activity' | 'edit' | 'password' | 'archive'

interface EditState {
  displayName: string
  role: Role
  warehouseIds: string[]
}

const USERS_KEY = [queryKeys.users.all] as const

export function warehouseNames(ids: string[], warehouses: WarehouseInfo[]): string {
  const byId = new Map(warehouses.map((w) => [w.id, w.name]))
  return ids.map((id) => byId.get(id) ?? '?').join(', ')
}

// инициалы вместо фото
function initials(u: StaffUser): string {
  const src = (u.displayName?.trim() || u.login).replace(/[^\p{L}\p{N}]/gu, ' ').trim()
  const parts = src.split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase()
}

/** Фаст-вью сотрудника: информация, история, правка, пароль и архив. */
export function StaffPanel({
  user,
  warehouses,
  onClose,
}: {
  user: StaffUser | null
  warehouses: WarehouseInfo[]
  onClose: () => void
}) {
  const userId = user?.id ?? null
  const [mode, setMode] = useState<StaffPanelMode>('info')
  // null: раздел истории ещё не выбран, ленту не грузим
  const [activitySection, setActivitySection] = useState<ActivityItem['section'] | null>(null)
  const [activityPage, setActivityPage] = useState(0)
  const [activitySize, setActivitySize] = useState(10)
  const [edit, setEdit] = useState<EditState>({ displayName: '', role: 'SELLER', warehouseIds: [] })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const passwordOk = strongPassword(password) && password === confirm

  const stats = useQuery({
    queryKey: queryKeys.sellerStats(userId),
    queryFn: () => fetchSellerStats(user!.login),
    enabled: user != null,
  })

  const activity = useQuery({
    queryKey: queryKeys.userActivity(userId, activitySection, activityPage, activitySize),
    queryFn: () => fetchUserActivity(userId!, activitySection!, activityPage, activitySize),
    enabled: user != null && mode === 'activity' && activitySection != null,
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    setMode('info')
    setActivitySection(null)
    setActivityPage(0)
  }, [userId])

  const saveEdit = useEntityMutation({
    mutationFn: () =>
      updateUser(user!.id, {
        displayName: edit.displayName,
        role: edit.role,
        warehouseIds: edit.warehouseIds,
      }),
    invalidate: USERS_KEY,
    onDone: () => setMode('info'),
  })

  const changePassword = useEntityMutation({
    mutationFn: () => updateUser(user!.id, { password }),
    invalidate: USERS_KEY,
    onDone: () => {
      setMode('info')
      setPassword('')
      setConfirm('')
    },
  })

  const archive = useEntityMutation({
    mutationFn: toggleUserArchive,
    invalidate: USERS_KEY,
    onDone: () => setMode('info'),
  })

  const enterEdit = (u: StaffUser) => {
    setEdit({ displayName: u.displayName ?? '', role: u.role, warehouseIds: u.warehouseIds })
    saveEdit.clearError()
    setMode('edit')
  }

  const enterPassword = () => {
    setPassword('')
    setConfirm('')
    changePassword.clearError()
    setMode('password')
  }

  return (
    <FastViewPortal open={user != null}>
      {user && (
        <FastView
          onClose={onClose}
          nav={
            <FastViewNav>
              <FastViewNavButton
                icon={IdCard}
                label="Основная информация"
                active={mode === 'info'}
                onClick={() => setMode('info')}
              />
              <FastViewNavButton
                icon={History}
                label="История активности"
                active={mode === 'activity'}
                onClick={() => setMode('activity')}
              />
              {!user.archived && (
                <FastViewNavButton
                  icon={Pencil}
                  label="Редактировать"
                  active={mode === 'edit'}
                  onClick={() => enterEdit(user)}
                />
              )}
              {!user.archived && (
                <FastViewNavButton
                  icon={KeyRound}
                  label="Сменить пароль"
                  active={mode === 'password'}
                  onClick={enterPassword}
                />
              )}
              <FastViewNavButton
                icon={user.archived ? ArchiveRestore : Archive}
                label={user.archived ? 'Вернуть из архива' : 'В архив'}
                active={mode === 'archive'}
                tone={user.archived ? 'success' : 'danger'}
                onClick={() => setMode('archive')}
              />
            </FastViewNav>
          }
          header={
            <FastViewHeader avatarText={initials(user)}>
              <StatusChip
                tone={user.archived ? 'archived' : 'active'}
                dot
                className="absolute left-4 top-3.5 z-10"
              >
                {user.archived ? 'в архиве' : 'активен'}
              </StatusChip>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-xl tracking-tight">
                  {user.displayName ?? user.login}
                </h2>
                <p className="truncate text-sm text-muted-foreground">@{user.login}</p>
                <span className="mt-1.5 inline-flex rounded-full bg-foreground/[0.06] px-2 py-0.5 text-xs font-medium text-foreground/80">
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
            </FastViewHeader>
          }
        >
          {mode === 'info' && (
            <>
              <div className="space-y-4 px-6 pt-5 text-sm">
                <div>
                  <span className="mb-0.5 block text-xs text-muted-foreground">Доступ к складам</span>
                  {user.role === 'ADMIN' ? (
                    <span className="text-muted-foreground">все склады</span>
                  ) : user.warehouseIds.length === 0 ? (
                    <span className="text-brand-bad">не назначены</span>
                  ) : (
                    warehouseNames(user.warehouseIds, warehouses)
                  )}
                </div>
                <div>
                  <span className="mb-0.5 block text-xs text-muted-foreground">В системе с</span>
                  {dateFmt(user.createdAt)}
                </div>
              </div>
              <StaffStats stats={stats.data} loading={stats.isLoading} />
            </>
          )}

          {mode === 'activity' && (
            <ActivityFeed
              items={activity.data?.items ?? []}
              loading={activity.isLoading}
              section={activitySection}
              onSelect={(section) => {
                setActivitySection(section)
                setActivityPage(0)
              }}
              page={activity.data?.page ?? 0}
              hasNext={activity.data?.hasNext ?? false}
              onPage={setActivityPage}
              size={activitySize}
              onSize={(size) => {
                setActivitySize(size)
                setActivityPage(0)
              }}
            />
          )}

          {mode === 'edit' && (
            <form
              className="space-y-4 px-6 py-5"
              onSubmit={(e) => {
                e.preventDefault()
                saveEdit.mutate()
              }}
            >
              <Field label="Имя">
                <Input
                  value={edit.displayName}
                  onChange={(e) => setEdit({ ...edit, displayName: e.target.value })}
                  placeholder="Например: Айгерим"
                  autoFocus
                />
              </Field>
              <StaffRoleFields
                value={edit}
                warehouses={warehouses}
                onChange={(patch) => setEdit({ ...edit, ...patch })}
              />
              <ErrorNote error={saveEdit.error} />
              <FormActions
                submitLabel="Сохранить"
                busy={saveEdit.isPending}
                onCancel={() => setMode('info')}
              />
            </form>
          )}

          {mode === 'password' && (
            <form
              className="space-y-4 px-6 py-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (passwordOk) changePassword.mutate()
              }}
            >
              <Field
                label="Новый пароль"
                hint={PASSWORD_HINT}
                hintTone={password && !strongPassword(password) ? 'error' : 'muted'}
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Повторите пароль">
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {confirm && confirm !== password && (
                  <span className="mt-1 block text-xs text-brand-bad">Пароли не совпадают</span>
                )}
              </Field>
              <ErrorNote error={changePassword.error} />
              <FormActions
                submitLabel="Сменить пароль"
                busy={changePassword.isPending}
                disabled={!passwordOk}
                onCancel={() => setMode('info')}
              />
            </form>
          )}

          {mode === 'archive' && (
            <ConfirmPanel
              tone={user.archived ? 'success' : 'danger'}
              icon={user.archived ? ArchiveRestore : Archive}
              title={user.archived ? 'Вернуть из архива?' : 'Отправить в архив?'}
              description={
                <>
                  <span className="font-medium text-foreground">@{user.login}</span>{' '}
                  {user.archived
                    ? 'снова сможет входить в систему и работать.'
                    : 'больше не сможет войти в систему. Продажи и авторство документов сохранятся; вернуть из архива можно в любой момент.'}
                </>
              }
              confirmLabel={user.archived ? 'Вернуть из архива' : 'В архив'}
              cancelLabel="Отмена"
              busy={archive.isPending}
              error={archive.error}
              onConfirm={() => archive.mutate(user)}
              onCancel={() => setMode('info')}
            />
          )}
        </FastView>
      )}
    </FastViewPortal>
  )
}

function FormActions({
  submitLabel,
  busy,
  disabled = false,
  onCancel,
}: {
  submitLabel: string
  busy: boolean
  disabled?: boolean
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <Button type="submit" className="w-full justify-center" disabled={busy || disabled}>
        {busy ? <ButtonSpinner spaced /> : null}
        {submitLabel}
      </Button>
      <Button type="button" variant="outline" className="w-full justify-center" onClick={onCancel}>
        Отмена
      </Button>
    </div>
  )
}
