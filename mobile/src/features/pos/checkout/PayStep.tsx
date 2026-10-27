import type { Dispatch } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { PaymentAction, PaymentSplit } from '@/pages/pos/lib/paymentSplit'
import type { PayChoice, ProductGroup } from '@/pages/pos/lib/types'
import { money } from '@/shared/lib/format'
import { minorToSom, somToMinor } from '@/shared/lib/money'
import { Glyph, type GlyphName } from '~/components/Glyph'
import { font, light as colors, radius, space } from '~/theme'
import { checkoutStyles } from './checkoutStyles'
import { PackagingCard } from './PackagingCard'
import { ReceiptDiscountField } from './ReceiptDiscountField'
import { SummaryRow } from './SummaryRow'

const METHODS: { key: PayChoice; label: string; glyph: GlyphName }[] = [
  { key: 'cash', label: 'Наличные', glyph: 'banknote' },
  { key: 'noCash', label: 'Безнал', glyph: 'card' },
  { key: 'mixed', label: 'Смешанная', glyph: 'mix' },
]

const QUICK_CASH_ADDS = [1000, 5000]

export function PayStep({
  pkgGroups,
  pkgQty,
  onPkgQty,
  openPkg,
  onOpenPkg,
  receiptDiscountMinor,
  split,
  dispatch,
  grandTotal,
  paid,
  change,
  cashShort,
  payFailed,
}: {
  pkgGroups: ProductGroup[]
  pkgQty: Record<string, number>
  onPkgQty: (productId: string, n: number) => void
  openPkg: string | null
  onOpenPkg: (key: string | null) => void
  receiptDiscountMinor: number
  split: PaymentSplit
  dispatch: Dispatch<PaymentAction>
  grandTotal: number
  paid: number
  change: number
  cashShort: boolean
  payFailed: boolean
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: space(4), gap: space(4) }}
      keyboardShouldPersistTaps="handled"
    >
      {pkgGroups.length > 0 ? (
        <PackagingCard
          groups={pkgGroups}
          qty={pkgQty}
          onQty={onPkgQty}
          openKey={openPkg}
          onOpen={onOpenPkg}
        />
      ) : null}

      {/* скидку часто просят в последний момент */}
      <View style={checkoutStyles.payCard}>
        <ReceiptDiscountField />
        {receiptDiscountMinor > 0 ? (
          <SummaryRow
            label="Скидка"
            value={`− ${money(receiptDiscountMinor)}`}
            accent
            style={{ marginTop: space(2) }}
          />
        ) : null}
      </View>

      <View style={styles.methods}>
        {METHODS.map((m) => {
          const on = split.mode === m.key
          return (
            <Pressable
              key={m.key}
              onPress={() => {
                void Haptics.selectionAsync()
                dispatch({ type: 'mode', mode: m.key, grandMinor: grandTotal })
              }}
              style={[styles.method, on && styles.methodOn]}
            >
              <Glyph name={m.glyph} size={20} color={on ? colors.ink : colors.cream} />
              <Text style={[styles.methodText, on && { color: colors.ink }]}>{m.label}</Text>
            </Pressable>
          )
        })}
      </View>

      {split.mode === 'cash' ? (
        <View style={checkoutStyles.payCard}>
          <Text style={checkoutStyles.rowLabel}>Внесено наличными</Text>
          <TextInput
            value={split.given}
            onChangeText={(value) => dispatch({ type: 'editGiven', value })}
            keyboardType="decimal-pad"
            style={styles.bigInput}
          />
          <View style={styles.quick}>
            {QUICK_CASH_ADDS.map((add) => (
              <Pressable
                key={add}
                onPress={() =>
                  dispatch({
                    type: 'editGiven',
                    value: minorToSom((somToMinor(split.given) ?? 0) + add * 100),
                  })
                }
                style={styles.quickBtn}
              >
                <Text style={styles.quickText}>+{add.toLocaleString('ru-RU')}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => dispatch({ type: 'editGiven', value: minorToSom(grandTotal) })}
              style={styles.quickBtn}
            >
              <Text style={styles.quickText}>Без сдачи</Text>
            </Pressable>
          </View>
          <View style={styles.changeRow}>
            <Text style={checkoutStyles.rowLabel}>Сдача</Text>
            <Text style={styles.changeValue}>{money(change)}</Text>
          </View>
          {cashShort ? <Text style={styles.warn}>Внесено меньше суммы чека</Text> : null}
        </View>
      ) : null}

      {split.mode === 'mixed' ? (
        <View style={checkoutStyles.payCard}>
          <Text style={checkoutStyles.rowLabel}>Наличными</Text>
          <TextInput
            value={split.cash}
            onChangeText={(value) => dispatch({ type: 'editCash', value, grandMinor: grandTotal })}
            keyboardType="decimal-pad"
            style={styles.bigInput}
          />
          <Text style={[checkoutStyles.rowLabel, { marginTop: space(3) }]}>Картой</Text>
          <TextInput
            value={split.noCash}
            onChangeText={(value) => dispatch({ type: 'editNoCash', value, grandMinor: grandTotal })}
            keyboardType="decimal-pad"
            style={styles.bigInput}
          />
          {paid !== grandTotal ? <Text style={styles.warn}>Сумма способов не сходится с чеком</Text> : null}
        </View>
      ) : null}

      {payFailed ? <Text style={styles.warn}>Не удалось провести чек</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2.5) },
  method: {
    flexGrow: 1,
    flexBasis: '30%',
    flexDirection: 'row',
    gap: space(2),
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodOn: { backgroundColor: colors.cream, borderColor: 'transparent' },
  methodText: { fontSize: 14.5, fontWeight: '600', color: colors.cream, flexShrink: 1 },
  bigInput: {
    fontFamily: font.display,
    fontSize: 32,
    color: colors.white,
    paddingVertical: space(1),
  },
  quick: { flexDirection: 'row', gap: space(2), marginTop: space(2) },
  quickBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { color: colors.cream, fontSize: 13, fontWeight: '600' },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: space(4),
    paddingTop: space(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  changeValue: { fontFamily: font.display, fontSize: 24, color: colors.white },
  warn: { color: '#e0b878', fontSize: 13, marginTop: space(2) },
})
