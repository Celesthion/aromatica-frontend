import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { parseReceiptPct } from '@/pages/pos/lib/discount'
import { light as colors, radius, space } from '~/theme'
import { useCart } from '../cart'
import { checkoutStyles } from './checkoutStyles'

const DISCOUNT_PRESETS = [5, 10, 15]

/** Скидка на чек: на мобилке вводится только процентом. */
export function ReceiptDiscountField() {
  const receiptDiscount = useCart((s) => s.receiptDiscount)
  const setReceiptDiscount = useCart((s) => s.setReceiptDiscount)

  const receiptPct = receiptDiscount.mode === 'pct' ? parseReceiptPct(receiptDiscount.value) : null
  const receiptPctInput = receiptDiscount.mode === 'pct' ? receiptDiscount.value : ''
  const setReceiptPct = (value: string) => setReceiptDiscount({ mode: 'pct', value })

  return (
    <View style={styles.discountRow}>
      <Text style={checkoutStyles.rowLabel}>Скидка на чек</Text>
      <View style={styles.presets}>
        {DISCOUNT_PRESETS.map((v) => {
          const on = receiptPct === v
          return (
            <Pressable
              key={v}
              onPress={() => setReceiptPct(on ? '' : String(v))}
              style={[styles.preset, on && styles.presetOn]}
            >
              <Text style={[styles.presetText, on && { color: colors.ink }]}>{v}%</Text>
            </Pressable>
          )
        })}
        <TextInput
          value={receiptPctInput}
          onChangeText={setReceiptPct}
          placeholder="0"
          placeholderTextColor="rgba(244,245,247,0.3)"
          keyboardType="decimal-pad"
          style={styles.pctInput}
        />
        <Text style={checkoutStyles.rowLabel}>%</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space(1),
  },
  presets: { flexDirection: 'row', alignItems: 'center', gap: space(1.5) },
  preset: {
    paddingHorizontal: space(2.5),
    paddingVertical: space(1),
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  presetOn: { backgroundColor: colors.white },
  presetText: { fontSize: 12, fontWeight: '600', color: 'rgba(244,245,247,0.7)' },
  pctInput: {
    width: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: space(2),
    paddingVertical: space(1),
    color: colors.cream,
    textAlign: 'right',
    fontSize: 13,
  },
})
