import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { money } from '@/shared/lib/format'
import { Glyph, type GlyphName } from '~/components/Glyph'
import { font, light as colors, radius, space } from '~/theme'
import { checkoutStyles } from './checkoutStyles'

export type CheckoutTool = 'gifts' | 'parked' | 'shelf' | 'reservations'

export function CheckoutFooter({
  step,
  total,
  bottomInset,
  draftsCount,
  reservationsCount,
  hasLines,
  onTool,
  onToPay,
  onBack,
  canPay,
  paying,
  onPay,
}: {
  step: 'cart' | 'pay'
  total: number
  bottomInset: number
  draftsCount: number | undefined
  reservationsCount: number
  hasLines: boolean
  onTool: (tool: CheckoutTool) => void
  onToPay: () => void
  onBack: () => void
  canPay: boolean
  paying: boolean
  onPay: () => void
}) {
  return (
    <View style={[styles.footer, { paddingBottom: bottomInset + space(4) }]}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>К оплате</Text>
        <Text style={styles.totalValue}>{money(total)}</Text>
      </View>
      {step === 'cart' ? (
        <View style={{ flexDirection: 'row', gap: space(2.5) }}>
          <SquareTool glyph="gift" onPress={() => onTool('gifts')} hint="Подарки" />
          <SquareTool glyph="pause" badge={draftsCount} onPress={() => onTool('parked')} hint="Отложить" />
          <SquareTool glyph="box" onPress={() => onTool('shelf')} hint="Полка" />
          <SquareTool
            glyph="bookmark"
            badge={reservationsCount}
            onPress={() => onTool('reservations')}
            hint="Бронь"
          />
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onToPay()
            }}
            disabled={!hasLines}
            style={({ pressed }) => [
              checkoutStyles.primary,
              { flex: 1 },
              !hasLines && { opacity: 0.4 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={checkoutStyles.primaryText}>К оплате</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: space(3) }}>
          <Pressable onPress={onBack} style={styles.secondary}>
            <Text style={styles.secondaryText}>Назад</Text>
          </Pressable>
          <Pressable
            onPress={onPay}
            disabled={!canPay || paying}
            style={({ pressed }) => [
              checkoutStyles.primary,
              { flex: 1 },
              (!canPay || paying) && { opacity: 0.4 },
              pressed && { opacity: 0.9 },
            ]}
          >
            {paying ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={checkoutStyles.primaryText}>Пробить чек</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  )
}

/** Квадратная кнопка подвала: иконка, подпись и счётчик в углу. */
function SquareTool({
  glyph,
  badge,
  hint,
  onPress,
}: {
  glyph: GlyphName
  badge?: number
  hint: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.square, pressed && { opacity: 0.75 }]}>
      <Glyph name={glyph} size={22} color={colors.cream} />
      <Text style={styles.squareHint}>{hint}</Text>
      {badge ? (
        <View style={styles.squareBadge}>
          <Text style={styles.squareBadgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: space(4),
    paddingTop: space(3),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: space(3),
  },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: 'rgba(244,245,247,0.6)' },
  totalValue: { fontFamily: font.display, fontSize: 32, color: colors.white, letterSpacing: 0.5 },
  secondary: {
    height: 54,
    paddingHorizontal: space(6),
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 16, color: colors.cream },
  square: {
    width: 62,
    height: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  squareHint: { color: 'rgba(244,245,247,0.6)', fontSize: 9 },
  squareBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(1),
  },
  squareBadgeText: { color: colors.ink, fontSize: 11, fontWeight: '700' },
})
