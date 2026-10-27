import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchShiftReceipts,
  voidPosReceipt,
  type AdminUser,
  type DocDto,
  type PosShift,
  queryKeys,
} from '@/shared/api'
import { dateTimeFmt, money } from '@/shared/lib/format'
import { QueryError } from '~/components/QueryError'
import { Sheet } from '~/components/Sheet'
import { useStyles, useTheme } from '~/hooks/useTheme'
import { space } from '~/theme'
import { ReceiptView } from './ReceiptView'
import { makeReceiptsStyles } from './receiptsStyles'
import { ReturnSheet } from './ReturnSheet'

/** Чеки смены: просмотр, возврат на полку и сторно своего чека. */
export function ShiftReceiptsSheet({
  visible,
  onClose,
  shift,
  user,
}: {
  visible: boolean
  onClose: () => void
  shift: PosShift
  user: AdminUser | null
}) {
  const t = useTheme()
  const styles = useStyles(makeReceiptsStyles)
  const userName = user?.displayName ?? ''
  const login = user?.login ?? ''
  const shiftId = shift.id
  const queryClient = useQueryClient()
  const [returning, setReturning] = useState<DocDto | null>(null)
  const [viewing, setViewing] = useState<DocDto | null>(null)
  const [voiding, setVoiding] = useState<DocDto | null>(null)

  const receipts = useQuery({
    queryKey: queryKeys.pos.receipts.byShift(shiftId),
    queryFn: () => fetchShiftReceipts(shiftId),
    enabled: visible,
  })

  const doVoid = useMutation({
    mutationFn: (doc: DocDto) => voidPosReceipt(shiftId, doc.id),
    onSuccess: () => {
      setVoiding(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    },
  })

  if (returning)
    return (
      <ReturnSheet
        shiftId={shiftId}
        receipt={returning}
        onBack={() => setReturning(null)}
        onDone={() => {
          setReturning(null)
          void queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
        }}
      />
    )

  if (viewing)
    return (
      <ReceiptView
        receipt={viewing}
        shift={shift}
        seller={userName || login}
        onBack={() => setViewing(null)}
      />
    )

  const list = receipts.data ?? []

  return (
    <Sheet visible={visible} title={`Чеки смены №${shift.number}`} onClose={onClose}>
      {receipts.isPending ? <ActivityIndicator color={t.ink} /> : null}
      {receipts.isError ? <QueryError query={receipts} /> : null}
      {receipts.isSuccess && list.length === 0 ? <Text style={styles.hint}>Чеков ещё нет</Text> : null}

      {list.map((d) => {
        // в createdBy отображаемое имя, поэтому сверяем и с именем, и с логином
        const mine = d.createdBy === userName || d.createdBy === login
        return (
          <View key={d.id} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.rowTitle}>
                {d.docType === 'RETURN' ? 'Возврат' : 'Чек'} №{d.number}
              </Text>
              <Text style={styles.rowSum}>{money(d.sumMinor)}</Text>
            </View>
            <Text style={styles.hint} numberOfLines={1}>
              {dateTimeFmt(d.moment)}
              {d.createdBy ? ` · ${d.createdBy}` : ''}
            </Text>
            <Text style={styles.hint} numberOfLines={1}>
              {d.lines.map((l) => l.productName).join(', ')}
            </Text>

            <View style={styles.actions}>
              <Pressable onPress={() => setViewing(d)} style={styles.action}>
                <Text style={styles.actionText}>Открыть</Text>
              </Pressable>
              {d.docType === 'SALE' ? (
                <Pressable onPress={() => setReturning(d)} style={styles.action}>
                  <Text style={styles.actionText}>На полку</Text>
                </Pressable>
              ) : null}
              {mine ? (
                <Pressable onPress={() => setVoiding(d)} hitSlop={6}>
                  <Text style={styles.void}>Сторно</Text>
                </Pressable>
              ) : null}
            </View>

            {voiding?.id === d.id ? (
              <View style={styles.confirm}>
                <Text style={styles.confirmText}>
                  Отменить {d.docType === 'RETURN' ? 'возврат' : 'чек'} №{d.number} на {money(d.sumMinor)}?
                  Товар и деньги вернутся в состояние «до чека».
                </Text>
                {doVoid.isError ? <Text style={styles.error}>Не удалось сторнировать</Text> : null}
                <View style={{ flexDirection: 'row', gap: space(2), marginTop: space(2) }}>
                  <Pressable onPress={() => setVoiding(null)} style={styles.confirmGhost}>
                    <Text style={styles.confirmGhostText}>Отмена</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => doVoid.mutate(d)}
                    disabled={doVoid.isPending}
                    style={styles.confirmDanger}
                  >
                    {doVoid.isPending ? (
                      <ActivityIndicator color={t.white} />
                    ) : (
                      <Text style={styles.confirmDangerText}>Да, сторно</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        )
      })}
    </Sheet>
  )
}
