import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useMutation } from '@tanstack/react-query'
import { returnItems, returnShareMinor, returnSumMinor, type ReturnItem } from '@/pages/pos/lib/returns'
import { createPosReturn, type DocDto } from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { Button } from '~/components/Button'
import { Glyph } from '~/components/Glyph'
import { Sheet } from '~/components/Sheet'
import { Stepper } from '~/components/Stepper'
import { useStyles, useTheme } from '~/hooks/useTheme'
import { space } from '~/theme'
import { makeReceiptsStyles } from './receiptsStyles'

// штучный товар можно вернуть частью, флакон только целиком
export function ReturnSheet({
  shiftId,
  receipt,
  onBack,
  onDone,
}: {
  shiftId: string
  receipt: DocDto
  onBack: () => void
  onDone: () => void
}) {
  const t = useTheme()
  const styles = useStyles(makeReceiptsStyles)
  const items = returnItems(receipt.lines)
  const [qtys, setQtys] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((it) => [it.key, it.qty])),
  )
  const [method, setMethod] = useState<'cash' | 'noCash'>('cash')

  const picked = items.map((it) => ({ item: it, qty: qtys[it.key] ?? 0 })).filter((x) => x.qty > 0)
  const total = picked.reduce((s, x) => s + returnSumMinor(x.item, x.qty), 0)
  const toggle = (it: ReturnItem) => setQtys((p) => ({ ...p, [it.key]: (p[it.key] ?? 0) > 0 ? 0 : it.qty }))

  const doReturn = useMutation({
    mutationFn: () =>
      createPosReturn(shiftId, {
        sourceReceiptId: receipt.id,
        // флакон возвращается всеми строками, воду сервер добавит сам
        lines: picked.flatMap((x) =>
          x.item.lines.map((l) => ({
            productId: l.productId,
            qty: x.item.whole ? l.qty : x.qty,
            priceMinor: l.priceMinor,
            discountMinor: x.item.whole ? l.discountMinor : returnShareMinor(l, x.qty),
            // подарок возвращается бесплатно, только на полку
            gift: l.gift || undefined,
            // без метки два одинаковых флакона в чеке не различить
            bundleId: l.bundleId ?? undefined,
          })),
        ),
        cashMinor: method === 'cash' ? total : 0,
        noCashMinor: method === 'noCash' ? total : 0,
        comment: `На полку по чеку №${receipt.number}`,
      }),
    onSuccess: onDone,
  })

  return (
    <Sheet visible title={`На полку по чеку №${receipt.number}`} onClose={onBack}>
      {items.map((it) => {
        const q = qtys[it.key] ?? 0
        return (
          <View key={it.key} style={styles.returnLine}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {it.label}
              </Text>
              <Text style={styles.hint}>
                {it.whole
                  ? (it.hint ?? 'целиком')
                  : `из ${qtyFmt(it.qty)} · ${money(it.lines[0].priceMinor)}`}
              </Text>
            </View>
            {it.whole ? (
              <Button
                variant={q > 0 ? 'primary' : 'ghost'}
                title={q > 0 ? 'На полку' : 'Не возвращаем'}
                onPress={() => toggle(it)}
              />
            ) : (
              <Stepper
                value={qtyFmt(q)}
                onDec={() => setQtys((p) => ({ ...p, [it.key]: Math.max(0, q - 1) }))}
                onInc={() => setQtys((p) => ({ ...p, [it.key]: Math.min(it.qty, q + 1) }))}
              />
            )}
          </View>
        )
      })}

      <View style={{ flexDirection: 'row', gap: space(2) }}>
        {(
          [
            ['cash', 'Наличными', 'banknote'],
            ['noCash', 'Безналом', 'card'],
          ] as const
        ).map(([key, label, glyph]) => {
          const on = method === key
          return (
            <Pressable
              key={key}
              onPress={() => setMethod(key)}
              style={[styles.method, on && styles.methodOn]}
            >
              <Glyph name={glyph} size={18} color={on ? t.primaryText : t.ink} />
              <Text style={[styles.methodText, on && { color: t.primaryText }]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.rowHead}>
        <Text style={styles.hint}>Вернуть покупателю деньгами</Text>
        <Text style={styles.total}>{money(total)}</Text>
      </View>

      {doReturn.isError ? <Text style={styles.error}>Не удалось оформить возврат</Text> : null}

      <View style={{ flexDirection: 'row', gap: space(2) }}>
        <Button variant="ghost" title="Назад" onPress={onBack} />
        <Button
          title="Положить на полку"
          onPress={() => doReturn.mutate()}
          disabled={total <= 0}
          loading={doReturn.isPending}
          style={{ flex: 1 }}
        />
      </View>
    </Sheet>
  )
}
