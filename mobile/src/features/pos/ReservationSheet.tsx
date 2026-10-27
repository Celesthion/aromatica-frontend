import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NO_RECEIPT_DISCOUNT } from '@/pages/pos/lib/discount'
import {
  daysLeft,
  normalizeReservationDays,
  reservationLines,
  reservationSumMinor,
  reservationToCart,
} from '@/pages/pos/lib/reservations'
import {
  cancelReservation,
  createPosCustomer,
  createReservation,
  extendReservation,
  fetchPosSettings,
  type Reservation,
  queryKeys,
} from '@/shared/api'
import { dateFmt, money } from '@/shared/lib/format'
import { normalizePhone } from '@/shared/lib/phone'
import { Button } from '~/components/Button'
import { Field } from '~/components/Field'
import { QueryError } from '~/components/QueryError'
import { Sheet } from '~/components/Sheet'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'
import { nextLineId, useCart } from './cart'
import { isOpenReservation, useReservations } from './queries'

/** Брони: цены фиксируются со скидками, при выкупе клиент платит названную сумму. */
export function ReservationSheet({
  visible,
  onClose,
  warehouseId,
}: {
  visible: boolean
  onClose: () => void
  warehouseId?: string
}) {
  const queryClient = useQueryClient()
  const lines = useCart((s) => s.lines)
  const receiptDiscount = useCart((s) => s.receiptDiscount)
  const customer = useCart((s) => s.customer)
  const clear = useCart((s) => s.clear)
  const replaceAll = useCart((s) => s.replaceAll)
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [days, setDays] = useState('')

  const list = useReservations(warehouseId, visible)
  const settings = useQuery({
    queryKey: queryKeys.pos.settings,
    queryFn: fetchPosSettings,
    enabled: visible,
    staleTime: 10 * 60_000,
  })

  const defaultDays = settings.data?.reservationDefaultDays ?? 3
  const maxDays = settings.data?.reservationMaxDays ?? 30
  const effectiveDays = normalizeReservationDays(days, defaultDays, maxDays)

  const draftLines = reservationLines(lines, receiptDiscount)

  // бронь всегда на карточку покупателя: без него в чеке заводим новую по имени и телефону
  const create = useMutation({
    mutationFn: async () => {
      const holder =
        customer ?? (await createPosCustomer({ name: name.trim(), phone: normalizePhone(phone) }))
      return createReservation({
        warehouseId: warehouseId!,
        counterpartyId: holder.id,
        days: effectiveDays,
        lines: draftLines,
      })
    },
    onSuccess: () => {
      clear()
      setCreating(false)
      setName('')
      setPhone('')
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.reservations.all })
      onClose()
    },
  })

  const cancel = useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.reservations.all }),
  })

  const extend = useMutation({
    mutationFn: (id: string) => extendReservation(id, defaultDays),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.reservations.all }),
  })

  function sell(r: Reservation) {
    replaceAll({
      lines: reservationToCart(r).map((l) => ({ ...l, lineId: nextLineId() })),
      receiptDiscount: NO_RECEIPT_DISCOUNT,
      // покупатель брони становится покупателем чека
      customer: r.counterpartyId
        ? { id: r.counterpartyId, name: r.customerName, phone: r.phone ?? '', gender: null, birthDate: null }
        : customer,
      fromReservation: { id: r.id, name: r.customerName },
    })
    onClose()
  }

  const active = (list.data ?? []).filter(isOpenReservation)
  const now = new Date()

  return (
    <Sheet visible={visible} title="Брони" onClose={onClose}>
      {creating ? (
        <View style={{ gap: space(3) }}>
          <Field
            label="Имя клиента"
            value={name}
            onChangeText={setName}
            placeholder={customer?.name ?? 'Кому держим'}
            autoFocus
          />
          <Field
            label="Телефон"
            value={phone}
            onChangeText={(v) => setPhone(normalizePhone(v))}
            placeholder={customer?.phone ?? '+996700112233'}
            keyboardType="phone-pad"
          />
          <Field
            label={`Срок, дней (максимум ${maxDays})`}
            value={days}
            onChangeText={setDays}
            placeholder={String(defaultDays)}
            keyboardType="number-pad"
          />
          {create.isError ? <Text style={styles.error}>Не удалось создать бронь</Text> : null}
          <View style={{ flexDirection: 'row', gap: space(2) }}>
            <Button variant="ghost" title="Назад" onPress={() => setCreating(false)} />
            <Button
              title={`Забронировать на ${effectiveDays} дн. · ${money(reservationSumMinor(draftLines))}`}
              onPress={() => create.mutate()}
              disabled={!warehouseId}
              loading={create.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <>
          {lines.length > 0 ? (
            <Button title="Забронировать текущий чек" onPress={() => setCreating(true)} />
          ) : null}

          {list.isPending ? <ActivityIndicator color={t.ink} /> : null}
          {list.isError ? <QueryError query={list} /> : null}
          {list.isSuccess && active.length === 0 ? (
            <Text style={styles.hint}>Активных броней нет</Text>
          ) : null}

          {active.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {r.customerName}
                  {r.phone ? ` · ${r.phone}` : ''}
                </Text>
                <Text style={styles.hint}>
                  {r.lines.length} поз. · {money(r.sumMinor)} ·{' '}
                  {r.expired
                    ? 'срок вышел'
                    : `осталось ${daysLeft(r.expiresAt, now)} дн. (до ${dateFmt(r.expiresAt)})`}
                </Text>
                <View style={{ flexDirection: 'row', gap: space(3), marginTop: space(2) }}>
                  <Pressable onPress={() => extend.mutate(r.id)} hitSlop={6}>
                    <Text style={styles.link}>Продлить</Text>
                  </Pressable>
                  <Pressable onPress={() => cancel.mutate(r.id)} hitSlop={6}>
                    <Text style={styles.remove}>Отменить</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable
                onPress={() => sell(r)}
                style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.actionText}>Продать</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </Sheet>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(3.5),
    },
    title: { fontSize: 14, fontWeight: '600', color: t.ink },
    hint: { fontSize: 12, color: t.muted, marginTop: 2 },
    link: { fontSize: 12, color: t.accent, fontWeight: '600' },
    remove: { fontSize: 12, color: t.danger },
    action: {
      paddingHorizontal: space(4),
      paddingVertical: space(2.5),
      borderRadius: radius.pill,
      backgroundColor: t.primary,
    },
    actionText: { color: t.primaryText, fontSize: 13, fontWeight: '600' },
    error: { color: t.danger, fontSize: 13 },
  })
