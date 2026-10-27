import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { remainingQty } from '@/pages/pos/lib/stock'
import { fetchPosShelf, queryKeys } from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { QueryError } from '~/components/QueryError'
import { Sheet } from '~/components/Sheet'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'
import { useCart } from './cart'

/** Полка склада смены: готовые флаконы и возвращённое; на витрине их нет, продаются штуками. */
export function ShelfSheet({
  visible,
  onClose,
  warehouseId,
}: {
  visible: boolean
  onClose: () => void
  warehouseId?: string
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const lines = useCart((s) => s.lines)
  const add = useCart((s) => s.add)
  const shelf = useQuery({
    queryKey: queryKeys.pos.shelf.byWarehouse(warehouseId),
    queryFn: () => fetchPosShelf(warehouseId),
    enabled: visible,
  })
  const shelfData = shelf.data

  return (
    <Sheet visible={visible} title="Полка" onClose={onClose}>
      {shelf.isLoading ? (
        <ActivityIndicator color={t.muted} />
      ) : shelf.isError ? (
        <QueryError query={shelf} />
      ) : !shelfData || shelfData.items.length === 0 ? (
        <Text style={styles.hint}>
          На полке пусто. Сюда попадает налитое, от которого отказались, и принесённое обратно.
        </Text>
      ) : (
        shelfData.items.map((p) => {
          const left = remainingQty(lines, p)
          return (
            <Pressable
              key={p.id}
              disabled={left <= 0}
              onPress={() => {
                add(p, 1, p.priceMinor ?? 0, { warehouseId: shelfData.warehouseId })
                onClose()
              }}
              style={({ pressed }) => [styles.row, (pressed || left <= 0) && { opacity: 0.5 }]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.hint}>
                  {left <= 0 ? 'всё уже в чеке' : `${qtyFmt(left)} ${p.unit === 'ML' ? 'мл' : 'шт'}`}
                </Text>
              </View>
              <Text style={styles.rowPrice}>{p.priceMinor != null ? money(p.priceMinor) : '—'}</Text>
            </Pressable>
          )
        })
      )}
    </Sheet>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    hint: { fontSize: 13, color: t.muted },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(3.5),
      marginBottom: space(2),
    },
    rowTitle: { fontSize: 15, fontWeight: '600', color: t.ink },
    rowPrice: { fontSize: 15, fontWeight: '700', color: t.ink },
  })
