import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, History, Phone, Search, UserPlus, UserRound } from 'lucide-react'
import { Button, ButtonSpinner, DateField, ErrorNote, Input, Modal, SearchInput, Spinner } from '@/shared/ui'
import { PERSON_GENDER_LABELS, UNIT_LABELS, dateTimeFmt, money, qtyFmt } from '@/shared/lib/format'
import { PHONE_PREFIX, isValidPhone, normalizePhone } from '@/shared/lib/phone'
import {
  createPosCustomer,
  fetchCustomerPurchases,
  searchPosCustomers,
  type PosCustomer,
  queryKeys,
} from '@/shared/api'

// поиск на бэке начинается с 3 символов
const MIN_QUERY = 3

// пустая строка: пол не указан
type GenderChoice = '' | keyof typeof PERSON_GENDER_LABELS

/**
 * Покупатель на кассе: найти, завести, посмотреть покупки, закрепить за чеком.
 * Общего списка покупателей тут нет: кассир ищет конкретного человека, а не листает базу.
 */
export function CustomerModal({
  attached,
  pickLabel = 'Закрепить',
  pickedLabel = 'Закреплён',
  onPick,
  onClose,
}: {
  /** Подпись кнопки выбора: у чека по умолчанию, у сертификата своя. */
  pickLabel?: string
  pickedLabel?: string
  /** Кто уже закреплён за чеком; показываем сразу, чтобы не искать заново. */
  attached?: PosCustomer | null
  onPick: (customer: PosCustomer) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<'search' | 'create'>('search')
  // null: показываем результаты поиска
  const [historyOf, setHistoryOf] = useState<PosCustomer | null>(null)

  const found = useQuery({
    queryKey: queryKeys.pos.customers.search(q),
    queryFn: () => searchPosCustomers(q),
    enabled: q.trim().length >= MIN_QUERY,
  })

  const rows = found.data ?? []
  const short = q.trim().length > 0 && q.trim().length < MIN_QUERY
  const nothing = q.trim().length >= MIN_QUERY && !found.isFetching && rows.length === 0

  if (historyOf) {
    return <PurchaseHistory customer={historyOf} onBack={() => setHistoryOf(null)} onClose={onClose} />
  }

  if (mode === 'create') {
    return (
      <CreateCustomer
        // набранное в поиске переносим в форму: цифры в номер, буквы в имя
        initial={q.trim()}
        onCreated={onPick}
        onBack={() => setMode('search')}
        onClose={onClose}
      />
    )
  }

  return (
    <Modal onClose={onClose} title="Покупатель" maxWidth="max-w-lg">
      <SearchInput
        // после возврата из истории покупок набранное сохраняется
        initialValue={q}
        onSearch={setQ}
        placeholder="Имя или номер телефона…"
        autoFocus
        inputClassName="h-11"
      />

      {q.trim().length === 0 &&
        (attached ? (
          <div className="mt-3">
            <p className="mb-1.5 text-xs text-muted-foreground">В чеке</p>
            <CustomerRow
              customer={attached}
              attachedId={attached.id}
              pickLabel={pickLabel}
              pickedLabel={pickedLabel}
              onHistory={setHistoryOf}
              onPick={onPick}
            />
          </div>
        ) : (
          <p className="mt-4 flex items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Введите имя или номер — нужного покупателя
          </p>
        ))}
      {short && (
        <p className="mt-4 py-8 text-center text-sm text-muted-foreground">
          Ещё пару символов — поиск начинается с {MIN_QUERY}
        </p>
      )}
      {found.isFetching && <Spinner className="mx-auto my-8" />}
      <ErrorNote error={found.error} className="mt-3" />

      {rows.length > 0 && (
        <div className="mt-3 max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
          {rows.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              attachedId={attached?.id ?? null}
              pickLabel={pickLabel}
              pickedLabel={pickedLabel}
              onHistory={setHistoryOf}
              onPick={onPick}
            />
          ))}
        </div>
      )}

      {nothing && (
        <p className="mt-4 py-6 text-center text-sm text-muted-foreground">Никого не нашли по «{q.trim()}»</p>
      )}

      <Button className="mt-4 h-11 w-full" onClick={() => setMode('create')}>
        <UserPlus className="mr-2 h-4 w-4" />
        Добавить покупателя
      </Button>
    </Modal>
  )
}

/** Строка покупателя, общая для выдачи поиска и блока "В чеке". */
function CustomerRow({
  customer,
  attachedId,
  pickLabel,
  pickedLabel,
  onHistory,
  onPick,
}: {
  customer: PosCustomer
  attachedId: string | null
  pickLabel: string
  pickedLabel: string
  onHistory: (c: PosCustomer) => void
  onPick: (c: PosCustomer) => void
}) {
  const isAttached = customer.id === attachedId
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
        isAttached ? 'border-primary bg-primary/[0.06]' : 'border-border/60'
      }`}
    >
      <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{customer.name}</span>
        <span className="block truncate text-xs text-muted-foreground">{customer.phone}</span>
      </span>
      <Button size="sm" variant="outline" onClick={() => onHistory(customer)}>
        <History className="mr-1.5 h-3.5 w-3.5" />
        Покупки
      </Button>
      <Button size="sm" disabled={isAttached} onClick={() => onPick(customer)}>
        {isAttached ? pickedLabel : pickLabel}
      </Button>
    </div>
  )
}

/** Новый покупатель у прилавка. Имя и номер обязательны, остальное по желанию. */
function CreateCustomer({
  initial,
  onCreated,
  onBack,
  onClose,
}: {
  initial: string
  onCreated: (c: PosCustomer) => void
  onBack: () => void
  onClose: () => void
}) {
  // из поиска: цифры считаем номером, остальное именем
  const startedWithDigits = /\d/.test(initial) && !/[A-Za-zА-Яа-яЁё]/.test(initial)
  const [name, setName] = useState(startedWithDigits ? '' : initial)
  const [phone, setPhone] = useState(startedWithDigits ? normalizePhone(initial) : PHONE_PREFIX)
  const [gender, setGender] = useState<GenderChoice>('')
  const [birthDate, setBirthDate] = useState('')

  const create = useMutation({
    mutationFn: () =>
      createPosCustomer({
        name: name.trim(),
        phone,
        gender: gender || null,
        birthDate: birthDate || null,
      }),
    onSuccess: onCreated,
  })

  const ready = name.trim().length > 0 && isValidPhone(phone)

  return (
    <Modal onClose={onClose} title="Новый покупатель" maxWidth="max-w-md">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Имя</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Телефон</span>
          <Input
            value={phone}
            inputMode="tel"
            placeholder="+996700112233"
            // чистим номер при наборе, иначе один человек заведётся под разными написаниями
            onChange={(e) => setPhone(normalizePhone(e.target.value))}
          />
          {/* пока в поле только префикс, ругаться рано */}
          {phone !== PHONE_PREFIX && phone.length > 0 && !isValidPhone(phone) && (
            <span className="mt-1 block text-xs text-muted-foreground">
              Только цифры, «+» — первым символом
            </span>
          )}
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Пол</span>
          <select
            className="field w-full"
            value={gender}
            onChange={(e) => setGender(e.target.value as GenderChoice)}
          >
            <option value="">Не указан</option>
            {Object.entries(PERSON_GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">Дата рождения</span>
          <DateField value={birthDate} onChange={setBirthDate} />
        </label>
      </div>

      <ErrorNote error={create.error} className="mt-3" />

      <div className="mt-4 flex gap-2">
        <Button variant="outline" className="h-11 flex-1" onClick={onBack}>
          Назад
        </Button>
        <Button className="h-11 flex-1" disabled={!ready || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? <ButtonSpinner /> : 'Создать и закрепить'}
        </Button>
      </div>
    </Modal>
  )
}

/** История покупок: подсказка продавцу, что человек брал раньше. */
function PurchaseHistory({
  customer,
  onBack,
  onClose,
}: {
  customer: PosCustomer
  onBack: () => void
  onClose: () => void
}) {
  const purchases = useQuery({
    queryKey: queryKeys.pos.purchases.byCustomer(customer.id),
    queryFn: () => fetchCustomerPurchases(customer.id),
  })
  const rows = purchases.data ?? []
  const total = rows.reduce((s, r) => s + r.sumMinor, 0)

  // раскрываем по одному: в истории бывает чеков по 20
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (docId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (!next.delete(docId)) next.add(docId)
      return next
    })

  return (
    <Modal onClose={onClose} title={`Покупки · ${customer.name}`} maxWidth="max-w-lg">
      <p className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {customer.phone}
        </span>
        {customer.birthDate && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {customer.birthDate.split('-').reverse().join('.')}
          </span>
        )}
      </p>

      {purchases.isLoading && <Spinner className="mx-auto my-8" />}
      <ErrorNote error={purchases.error} className="mt-3" />

      {!purchases.isLoading && rows.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">Покупок пока не было</p>
      )}

      {rows.length > 0 && (
        <>
          <div className="max-h-[46vh] space-y-1 overflow-y-auto pr-1">
            {rows.map((p) => {
              const open = expanded.has(p.docId)
              return (
                <div key={p.docId} className="rounded-xl border border-border/60">
                  {/* по нажатию раскрываем состав: одно число позиций мало что говорит */}
                  <button
                    type="button"
                    onClick={() => toggle(p.docId)}
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm"
                  >
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 self-center text-muted-foreground transition-transform ${
                        open ? 'rotate-90' : ''
                      }`}
                    />
                    <span className="font-medium">Чек №{p.number}</span>
                    <span className="text-xs text-muted-foreground">{dateTimeFmt(p.moment)}</span>
                    <span className="text-xs text-muted-foreground">· позиций {p.positions}</span>
                    <span className="ml-auto font-semibold tabular-nums">{money(p.sumMinor)}</span>
                  </button>
                  {open && (
                    <div className="space-y-0.5 border-t border-border/60 px-3 py-2">
                      {p.lines.map((l, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-[13px]">
                          <span className="min-w-0 flex-1 truncate">
                            {l.productName}
                            {l.gift && <span className="ml-1.5 text-xs text-muted-foreground">подарок</span>}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {qtyFmt(l.qty)} {UNIT_LABELS[l.unit]}
                          </span>
                          <span className="w-20 shrink-0 text-right tabular-nums">
                            {l.gift ? '—' : money(l.sumMinor)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-3 flex justify-between border-t border-border/60 pt-2 text-sm">
            <span className="text-muted-foreground">Всего за {rows.length} чек(ов)</span>
            <span className="font-semibold tabular-nums">{money(total)}</span>
          </p>
        </>
      )}

      <Button variant="outline" className="mt-4 h-11 w-full" onClick={onBack}>
        Назад к поиску
      </Button>
    </Modal>
  )
}
