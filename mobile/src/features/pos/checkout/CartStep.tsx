import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { money } from '@/shared/lib/format'
import { Glyph } from '~/components/Glyph'
import { light as colors, radius, space } from '~/theme'
import { useCart } from '../cart'
import { CartLineRow } from './CartLineRow'
import { ReceiptDiscountField } from './ReceiptDiscountField'
import { SummaryRow } from './SummaryRow'

export function CartStep({
  openLine,
  onToggleLine,
  onToShelf,
  shelfPending,
  subtotal,
  lineDiscount,
  receiptDiscountMinor,
}: {
  openLine: string | null
  onToggleLine: (lineId: string) => void
  onToShelf: (bundleId: string) => void
  shelfPending: boolean
  subtotal: number
  lineDiscount: number
  receiptDiscountMinor: number
}) {
  const lines = useCart((s) => s.lines)
  const fromReservation = useCart((s) => s.fromReservation)
  const setFromReservation = useCart((s) => s.setFromReservation)

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: space(4), paddingBottom: space(6) }}
      keyboardShouldPersistTaps="handled"
    >
      {fromReservation ? (
        <View style={styles.banner}>
          <Glyph name="bookmark" size={16} color={colors.cream} />
          <Text style={styles.bannerText} numberOfLines={1}>
            Чек по брони: {fromReservation.name}
          </Text>
          <Pressable onPress={() => setFromReservation(null)} hitSlop={10}>
            <Glyph name="close" size={14} color="rgba(244,245,247,0.6)" />
          </Pressable>
        </View>
      ) : null}

      {lines.length === 0 ? <Text style={styles.empty}>Чек пуст — добавьте товар с витрины</Text> : null}

      {lines.map((l) => (
        <CartLineRow
          key={l.lineId}
          line={l}
          open={openLine === l.lineId}
          onToggle={() => onToggleLine(l.lineId)}
          onToShelf={onToShelf}
          shelfPending={shelfPending}
        />
      ))}

      {lines.length > 0 ? (
        <View style={styles.summary}>
          <SummaryRow label={`Позиции · ${lines.length}`} value={money(subtotal)} />
          {lineDiscount > 0 ? (
            <SummaryRow label="Скидка по позициям" value={`− ${money(lineDiscount)}`} accent />
          ) : null}
          <ReceiptDiscountField />
          {receiptDiscountMinor > 0 ? (
            <SummaryRow label="− по скидке чека" value={`− ${money(receiptDiscountMinor)}`} accent />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  empty: { color: 'rgba(244,245,247,0.55)', textAlign: 'center', marginTop: space(10) },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(2),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    paddingHorizontal: space(3),
    paddingVertical: space(2.5),
    marginBottom: space(3),
  },
  bannerText: { flex: 1, color: colors.cream, fontSize: 13 },
  summary: {
    marginTop: space(4),
    paddingTop: space(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: space(2),
  },
})
