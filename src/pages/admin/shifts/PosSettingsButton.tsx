import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import { Button, ButtonSpinner, ErrorNote, Field, Input, Modal } from '@/shared/ui'
import { fetchPosSettings, me, queryKeys, updateSetting } from '@/shared/api'
import { MIN_DILUTION_PCT } from '@/entities/product/dilution'

const MAX_RESERVATION_DAYS = 60
const MAX_PERCENT = 100

interface SettingsForm {
  reservationDays: string
  reservationMaxDays: string
  maxDiscountPct: string
  dilutionPct: string
}

/** Настройки кассы для ADMIN: сроки брони, потолок скидки продавца и доля масла в разливе. */
export function PosSettingsButton() {
  const session = useQuery({ queryKey: queryKeys.me, queryFn: me, staleTime: 5 * 60_000 })
  const settings = useQuery({
    queryKey: queryKeys.pos.settings,
    queryFn: fetchPosSettings,
    enabled: session.data?.role === 'ADMIN',
    staleTime: 5 * 60_000,
  })
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<SettingsForm | null>(null)
  const values = form && {
    reservationDays: Number(form.reservationDays),
    reservationMaxDays: Number(form.reservationMaxDays),
    maxDiscountPct: Number(form.maxDiscountPct),
    dilutionPct: Number(form.dilutionPct),
  }

  const save = useMutation({
    mutationFn: async () => {
      await updateSetting('reservation.default_days', values!.reservationDays)
      await updateSetting('reservation.max_days', values!.reservationMaxDays)
      await updateSetting('pos.max_seller_discount_pct', values!.maxDiscountPct)
      // последний ответ уже содержит все свежие значения
      return updateSetting('pos.default_dilution_pct', values!.dilutionPct)
    },
    onSuccess: (fresh) => {
      queryClient.setQueryData(queryKeys.pos.settings, fresh)
      setOpen(false)
    },
  })

  if (session.data?.role !== 'ADMIN') return null

  // без загруженных настроек форма затёрла бы их значениями-заглушками
  const openModal = () => {
    if (!settings.data) return
    setForm({
      reservationDays: String(settings.data.reservationDefaultDays),
      reservationMaxDays: String(settings.data.reservationMaxDays),
      maxDiscountPct: String(settings.data.maxSellerDiscountPct),
      dilutionPct: String(settings.data.defaultDilutionPct),
    })
    save.reset()
    setOpen(true)
  }
  const valid =
    values != null &&
    values.reservationDays >= 1 &&
    values.reservationMaxDays >= values.reservationDays &&
    values.reservationMaxDays <= MAX_RESERVATION_DAYS &&
    values.maxDiscountPct >= 0 &&
    values.maxDiscountPct <= MAX_PERCENT &&
    values.dilutionPct >= MIN_DILUTION_PCT &&
    values.dilutionPct <= MAX_PERCENT

  return (
    <>
      <Button variant="outline" disabled={!settings.data} onClick={openModal}>
        <Bookmark className="mr-2 h-4 w-4" />
        Настройки кассы
      </Button>
      {open && form && (
        <Modal align="center" maxWidth="max-w-sm" onClose={() => setOpen(false)} title="Настройки кассы">
          <div className="space-y-3">
            <Field label="Срок по умолчанию, дней">
              <Input
                inputMode="numeric"
                value={form.reservationDays}
                onChange={(e) => setForm({ ...form, reservationDays: e.target.value })}
              />
            </Field>
            <Field label={`Максимальный срок брони, дней (до ${MAX_RESERVATION_DAYS})`}>
              <Input
                inputMode="numeric"
                value={form.reservationMaxDays}
                onChange={(e) => setForm({ ...form, reservationMaxDays: e.target.value })}
              />
            </Field>
            <Field label="Макс. скидка продавца, % (админ — без потолка)">
              <Input
                inputMode="numeric"
                value={form.maxDiscountPct}
                onChange={(e) => setForm({ ...form, maxDiscountPct: e.target.value })}
              />
            </Field>
            <Field
              label={`Доля масла в разливе по умолчанию, % (от ${MIN_DILUTION_PCT}; продавец правит в продаже)`}
            >
              <Input
                inputMode="numeric"
                value={form.dilutionPct}
                onChange={(e) => setForm({ ...form, dilutionPct: e.target.value })}
              />
            </Field>
            <ErrorNote error={save.error} />
            <Button className="w-full" disabled={!valid || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? <ButtonSpinner /> : 'Сохранить'}
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
