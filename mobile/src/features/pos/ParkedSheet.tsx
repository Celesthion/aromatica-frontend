import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { receiptTotalMinor } from '@/pages/pos/lib/discount'
import { draftSnapshot, parseDraftPayload, withFreshProducts } from '@/pages/pos/lib/drafts'
import { createPosDraft, deletePosDraft, fetchPosCards, type PosDraft, queryKeys } from '@/shared/api'
import { dateTimeFmt, money } from '@/shared/lib/format'
import { Button } from '~/components/Button'
import { QueryError } from '~/components/QueryError'
import { Sheet } from '~/components/Sheet'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'
import { nextLineId, useCart } from './cart'
import { useDrafts } from './queries'

/** Отложенные чеки: снимок корзины в формате веба (draftSnapshot), открывается на любой кассе. */
export function ParkedSheet({
  visible,
  onClose,
  shiftId,
  warehouseId,
}: {
  visible: boolean
  onClose: () => void
  shiftId: string
  warehouseId?: string
}) {
  const queryClient = useQueryClient()
  const lines = useCart((s) => s.lines)
  const receiptDiscount = useCart((s) => s.receiptDiscount)
  const customer = useCart((s) => s.customer)
  const fromReservation = useCart((s) => s.fromReservation)
  const clear = useCart((s) => s.clear)
  const replaceAll = useCart((s) => s.replaceAll)
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const [error, setError] = useState<string | null>(null)

  const drafts = useDrafts(shiftId, visible)

  const park = useMutation({
    mutationFn: () =>
      createPosDraft(
        shiftId,
        draftSnapshot(
          lines,
          receiptDiscount,
          fromReservation,
          customer,
          receiptTotalMinor(lines, receiptDiscount),
        ),
      ),
    onSuccess: () => {
      clear()
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.byShift(shiftId) })
      onClose()
    },
  })

  // цена строки остаётся из черновика, а свежие карточки дают текущий остаток
  const resume = useMutation({
    mutationFn: async (draft: PosDraft) => {
      const payload = parseDraftPayload(draft.payload)
      const ids = [...new Set(payload.cart.map((l) => l.product.id))]
      const cards = ids.length ? await fetchPosCards(ids, warehouseId) : []
      await deletePosDraft(draft.id)
      return { payload, cards }
    },
    onSuccess: ({ payload, cards }) => {
      replaceAll({
        lines: withFreshProducts(payload.cart, cards).map((l) => ({
          ...l,
          lineId: l.lineId || nextLineId(),
        })),
        receiptDiscount: payload.receiptDiscount,
        customer: payload.customer,
        fromReservation: payload.fromReservation,
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.byShift(shiftId) })
      onClose()
    },
    onError: (e) => setError(e instanceof Error ? e.message : 'Не удалось вернуть чек'),
  })

  const drop = useMutation({
    mutationFn: (id: string) => deletePosDraft(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.drafts.byShift(shiftId) }),
  })

  const list = drafts.data ?? []

  return (
    <Sheet visible={visible} title="Отложенные чеки" onClose={onClose}>
      {lines.length > 0 ? (
        <Button
          title={`Отложить текущий чек · ${money(receiptTotalMinor(lines, receiptDiscount))}`}
          onPress={() => park.mutate()}
          loading={park.isPending}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {drafts.isPending ? <ActivityIndicator color={t.ink} /> : null}
      {drafts.isError ? <QueryError query={drafts} /> : null}
      {drafts.isSuccess && list.length === 0 ? <Text style={styles.hint}>Отложенных чеков нет</Text> : null}

      {list.map((d) => (
        <View key={d.id} style={styles.row}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={1}>
              {d.preview || `${d.positions} позиций`}
            </Text>
            <Text style={styles.hint}>
              {dateTimeFmt(d.createdAt)} · {d.positions} поз. · {money(d.sumMinor)}
            </Text>
          </View>
          <Pressable
            onPress={() => resume.mutate(d)}
            disabled={resume.isPending}
            style={({ pressed }) => [styles.action, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.actionText}>Вернуть</Text>
          </Pressable>
          <Pressable onPress={() => drop.mutate(d.id)} hitSlop={8}>
            <Text style={styles.remove}>Удалить</Text>
          </Pressable>
        </View>
      ))}
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
    action: {
      paddingHorizontal: space(3.5),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      backgroundColor: t.primary,
    },
    actionText: { color: t.primaryText, fontSize: 13, fontWeight: '600' },
    remove: { color: t.danger, fontSize: 12 },
    error: { color: t.danger, fontSize: 13 },
  })
