import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightLeft, Banknote, CreditCard, Plus, Trash2, Wallet, type LucideIcon } from 'lucide-react'
import { Button, ConfirmPanel, Field, FormDialog, Input } from '@/shared/ui'
import { somToMinorOr0 } from '@/shared/lib/money'
import { money } from '@/shared/lib/format'
import {
  createManualMovement,
  deleteManualMovement,
  fetchMoneyAccounts,
  queryKeys,
  transferMoney,
  type MoneyMovement,
} from '@/shared/api'
import { useEntityMutation } from '@/pages/admin/lib/useEntityMutation'
import { EditorModal } from '@/pages/admin/layout/EditorModal'
import { FiltersButton } from '@/pages/admin/layout/FiltersButton'
import { AccountSelect } from './AccountSelect'
import { AccountTile } from './AccountTile'
import { DebtsBlock } from './DebtsBlock'
import { MovementsJournal } from './MovementsJournal'

const ACCOUNT_ICONS: Record<string, LucideIcon> = {
  CASH: Banknote,
  BANK: CreditCard,
}

const MONEY_KEYS = [queryKeys.moneyAccounts, queryKeys.moneyMovements.all] as const

interface MovementForm {
  accountId: string
  amountSom: string
  expense: boolean
  comment: string
}

interface TransferForm {
  fromId: string
  toId: string
  amountSom: string
  comment: string
}

/** Деньги: остатки по счетам, журнал движений, ручной приход и расход. */
export function MoneyPage() {
  const [accountFilter, setAccountFilter] = useState('')
  const [form, setForm] = useState<MovementForm | null>(null)
  const [transfer, setTransfer] = useState<TransferForm | null>(null)
  const [removing, setRemoving] = useState<MoneyMovement | null>(null)

  const accounts = useQuery({
    queryKey: queryKeys.moneyAccounts,
    queryFn: fetchMoneyAccounts,
  })
  const accountList = accounts.data ?? []

  const create = useEntityMutation({
    mutationFn: () => {
      const minor = somToMinorOr0(form!.amountSom)
      return createManualMovement({
        accountId: form!.accountId,
        amountMinor: form!.expense ? -minor : minor,
        comment: form!.comment || undefined,
      })
    },
    invalidate: MONEY_KEYS,
    onDone: () => setForm(null),
  })

  const remove = useEntityMutation({
    mutationFn: deleteManualMovement,
    invalidate: MONEY_KEYS,
    onDone: () => setRemoving(null),
  })

  const doTransfer = useEntityMutation({
    mutationFn: () =>
      transferMoney({
        fromAccountId: transfer!.fromId,
        toAccountId: transfer!.toId,
        amountMinor: somToMinorOr0(transfer!.amountSom),
        comment: transfer!.comment || undefined,
      }),
    invalidate: MONEY_KEYS,
    onDone: () => setTransfer(null),
  })

  const total = accountList.reduce((s, a) => s + a.balanceMinor, 0)

  return (
    <div>
      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-2.5">
        <Button
          onClick={() =>
            setForm({
              accountId: accounts.data?.[0]?.id ?? '',
              amountSom: '',
              expense: false,
              comment: '',
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Приход / расход
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            setTransfer({
              fromId: accounts.data?.[0]?.id ?? '',
              toId: accounts.data?.[1]?.id ?? '',
              amountSom: '',
              comment: '',
            })
          }
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Перевод между счетами
        </Button>
        <FiltersButton activeCount={accountFilter ? 1 : 0}>
          <Field label="Счёт (журнал)">
            <select
              className="field w-full"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
            >
              <option value="">Все счета</option>
              {accountList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        </FiltersButton>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {accountList.map((a) => (
          <AccountTile
            key={a.id}
            icon={ACCOUNT_ICONS[a.type] ?? Wallet}
            label={a.name}
            value={money(a.balanceMinor)}
            negative={a.balanceMinor < 0}
          />
        ))}
        <AccountTile icon={Wallet} label="Всего" value={money(total)} negative={total < 0} emphasis />
      </div>

      {removing && (
        <EditorModal maxWidth="max-w-md" onClose={() => setRemoving(null)}>
          <ConfirmPanel
            className="p-0"
            icon={Trash2}
            title="Удалить движение?"
            description={
              <>
                Ручная операция «{removing.comment ?? 'без комментария'}» на{' '}
                <span className="font-medium text-foreground">{money(removing.amountMinor)}</span> будет
                удалена безвозвратно.
              </>
            }
            confirmLabel="Удалить"
            cancelLabel="Отмена"
            busy={remove.isPending}
            error={remove.error}
            onConfirm={() => remove.mutate(removing.id)}
            onCancel={() => setRemoving(null)}
          />
        </EditorModal>
      )}

      {form && (
        <FormDialog
          title="Приход / расход"
          onClose={() => setForm(null)}
          onSubmit={() => create.mutate()}
          submitLabel="Записать"
          busy={create.isPending}
          disabled={!form.accountId || !(parseFloat(form.amountSom) > 0)}
          error={create.error}
        >
          <AccountSelect
            label="Счёт"
            accounts={accountList}
            value={form.accountId}
            onChange={(accountId) => setForm({ ...form, accountId })}
          />
          <Field label="Тип">
            <select
              className="field w-full"
              value={form.expense ? 'expense' : 'income'}
              onChange={(e) => setForm({ ...form, expense: e.target.value === 'expense' })}
            >
              <option value="income">Приход (+)</option>
              <option value="expense">Расход (−)</option>
            </select>
          </Field>
          <Field label="Сумма, с">
            <Input
              inputMode="decimal"
              value={form.amountSom}
              onChange={(e) => setForm({ ...form, amountSom: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Комментарий">
            <Input
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Например: аренда за август"
            />
          </Field>
        </FormDialog>
      )}

      {transfer && (
        <FormDialog
          title="Перевод между счетами"
          onClose={() => setTransfer(null)}
          onSubmit={() => doTransfer.mutate()}
          submitLabel="Перевести"
          busy={doTransfer.isPending}
          disabled={
            !transfer.fromId ||
            !transfer.toId ||
            !(parseFloat(transfer.amountSom) > 0) ||
            transfer.fromId === transfer.toId
          }
          error={doTransfer.error}
        >
          <AccountSelect
            label="Со счёта"
            accounts={accountList}
            value={transfer.fromId}
            onChange={(fromId) => setTransfer({ ...transfer, fromId })}
          />
          <AccountSelect
            label="На счёт"
            accounts={accountList}
            value={transfer.toId}
            onChange={(toId) => setTransfer({ ...transfer, toId })}
          />
          <Field label="Сумма, с">
            <Input
              inputMode="decimal"
              value={transfer.amountSom}
              onChange={(e) => setTransfer({ ...transfer, amountSom: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Комментарий">
            <Input
              value={transfer.comment}
              onChange={(e) => setTransfer({ ...transfer, comment: e.target.value })}
              placeholder="Например: инкассация за смену"
            />
          </Field>
        </FormDialog>
      )}

      <DebtsBlock accounts={accountList} />

      <MovementsJournal accountId={accountFilter} onRemove={setRemoving} />
    </div>
  )
}
