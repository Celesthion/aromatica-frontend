import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import {
  fetchGiftKindProducts,
  fetchPosGiftRules,
  type PosGiftRule,
  type PosItem,
  type PosProduct,
  queryKeys,
} from '@/shared/api'
import { earnedGiftCount, usedGiftCount } from '@/pages/pos/lib/gifts'
import type { CartLine } from '@/pages/pos/lib/types'
import { money, qtyFmt } from '@/shared/lib/format'
import { Button } from '~/components/Button'
import { QueryError } from '~/components/QueryError'
import { Sheet } from '~/components/Sheet'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'
import { nextGiftGroupId, nextLineId, paidGoodsMinor, useCart } from './cart'

/** Подарки по акциям: сколько положено, считает earnedGiftCount из pos/lib. */
export function GiftSheet({
  visible,
  onClose,
  warehouseId,
}: {
  visible: boolean
  onClose: () => void
  warehouseId?: string
}) {
  const lines = useCart((s) => s.lines)
  const addGiftGroup = useCart((s) => s.addGiftGroup)
  const t = useTheme()
  const styles = useStyles(makeStyles)

  const rules = useQuery({
    queryKey: queryKeys.pos.giftRules.byWarehouse(warehouseId),
    queryFn: () => fetchPosGiftRules(warehouseId),
    enabled: visible,
  })

  // пороги считаются от платной суммы без скидки чека, как на бэкенде
  const paid = useMemo(() => paidGoodsMinor(lines), [lines])

  // набор в процессе выдачи: собранные строки и очередь позиций с выбором товара
  const [pending, setPending] = useState<{
    rule: PosGiftRule
    groupId: string
    lines: CartLine[]
    queue: PosItem[]
  } | null>(null)

  function startRule(rule: PosGiftRule) {
    const groupId = nextGiftGroupId()
    const fixed: CartLine[] = []
    const queue: PosItem[] = []
    for (const item of rule.items) {
      if (item.product) {
        fixed.push({
          lineId: nextLineId(),
          product: item.product,
          qty: item.qty,
          priceMinor: 0,
          discountMinor: 0,
          isGift: true,
          giftRuleId: rule.id,
          giftGroupId: groupId,
        })
      } else {
        queue.push(item)
      }
    }
    if (queue.length === 0) {
      addGiftGroup(fixed)
      onClose()
      return
    }
    setPending({ rule, groupId, lines: fixed, queue })
  }

  function resolve(product: PosProduct) {
    if (!pending) return
    const [item, ...rest] = pending.queue
    const line: CartLine = {
      lineId: nextLineId(),
      product,
      qty: item.qty,
      priceMinor: 0,
      discountMinor: 0,
      isGift: true,
      giftRuleId: pending.rule.id,
      giftGroupId: pending.groupId,
    }
    const collected = [...pending.lines, line]
    if (rest.length === 0) {
      addGiftGroup(collected)
      setPending(null)
      onClose()
      return
    }
    setPending({ ...pending, lines: collected, queue: rest })
  }

  if (pending)
    return (
      <KindPicker
        item={pending.queue[0]}
        warehouseId={warehouseId}
        visible={visible}
        onBack={() => setPending(null)}
        onPick={resolve}
      />
    )

  const list = rules.data ?? []

  return (
    <Sheet visible={visible} title="Подарки" onClose={onClose}>
      {rules.isPending ? <ActivityIndicator color={t.ink} /> : null}
      {rules.isError ? <QueryError query={rules} /> : null}
      {rules.isSuccess && list.length === 0 ? <Text style={styles.hint}>Активных акций нет</Text> : null}

      {list.map((r) => {
        const earned = earnedGiftCount(r, lines, paid)
        const used = usedGiftCount(lines, r.id)
        const left = earned - used
        return (
          <Pressable
            key={r.id}
            disabled={left <= 0}
            onPress={() => startRule(r)}
            style={({ pressed }) => [styles.row, (left <= 0 || pressed) && { opacity: 0.55 }]}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title}>{r.name}</Text>
              <Text style={styles.hint}>{bundleText(r.items)}</Text>
              <Text style={[styles.hint, { marginTop: 2 }]}>
                {left > 0
                  ? `Положено ${earned}, выдано ${used} — можно добавить ${left}`
                  : earned > 0
                    ? `Все ${earned} уже в чеке`
                    : `Условие не выполнено · в чеке ${money(paid)}`}
              </Text>
            </View>
            {left > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{left}</Text>
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </Sheet>
  )
}

function KindPicker({
  item,
  warehouseId,
  visible,
  onBack,
  onPick,
}: {
  item: PosItem
  warehouseId?: string
  visible: boolean
  onBack: () => void
  onPick: (p: PosProduct) => void
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const products = useQuery({
    queryKey: queryKeys.pos.giftProducts.list(item.kind, warehouseId),
    queryFn: () => fetchGiftKindProducts(item.kind!, warehouseId),
    enabled: visible && !!item.kind,
  })

  return (
    <Sheet visible={visible} title={`Подарок · ${item.kindName ?? item.kind ?? 'товар'}`} onClose={onBack}>
      <Text style={styles.hint}>
        Выберите {qtyFmt(item.qty)} · {item.kindName ?? item.kind}
      </Text>
      {products.isPending ? <ActivityIndicator color={t.ink} /> : null}
      {(products.data ?? []).map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onPick(p)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title} numberOfLines={2}>
              {p.name}
            </Text>
            <Text style={styles.hint}>
              Остаток {qtyFmt(p.qty)}
              {p.unit === 'ML' ? ' мл' : ' шт'}
            </Text>
          </View>
        </Pressable>
      ))}
      <Button variant="ghost" title="Назад" onPress={onBack} />
    </Sheet>
  )
}

function bundleText(items: PosItem[]): string {
  return items
    .map((i) =>
      i.product
        ? `${i.product.name} ×${qtyFmt(i.qty)}`
        : `${qtyFmt(i.qty)} · ${i.kindName ?? i.kind ?? 'любой товар'}`,
    )
    .join(' + ')
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
    badge: {
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space(1.5),
    },
    badgeText: { color: t.primaryText, fontSize: 13, fontWeight: '700' },
  })
