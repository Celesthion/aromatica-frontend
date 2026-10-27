import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { DocDto, PosShift } from '@/shared/api'
import { money } from '@/shared/lib/format'
import { Glyph } from '~/components/Glyph'
import { font, light as colors, radius, space } from '~/theme'
import { printReceipt } from '../print'
import { checkoutStyles } from './checkoutStyles'

/** Экран после оплаты: сдача и печать проведённого чека. */
export function DoneCard({
  change,
  doc,
  shift,
  seller,
  receiptDiscountMinor,
  onClose,
}: {
  change: number
  doc: DocDto | null
  shift: PosShift | null | undefined
  seller: string
  receiptDiscountMinor: number
  onClose: () => void
}) {
  return (
    <View style={styles.doneWrap}>
      <View style={styles.doneCard}>
        <View style={styles.doneIcon}>
          <Glyph name="check" size={30} color={colors.ink} strokeWidth={2.4} />
        </View>
        <Text style={styles.doneTitle}>Чек пробит</Text>
        {change > 0 ? (
          <>
            <Text style={styles.doneLabel}>Сдача</Text>
            <Text style={styles.doneSum}>{money(change)}</Text>
          </>
        ) : (
          <Text style={styles.doneLabel}>Оплачено без сдачи</Text>
        )}
      </View>

      {doc && shift ? (
        <View style={styles.doneActions}>
          <Pressable
            onPress={() => void printReceipt(doc, shift, seller, change, receiptDiscountMinor)}
            style={({ pressed }) => [styles.doneGhost, pressed && { opacity: 0.8 }]}
          >
            <Glyph name="receipt" size={18} color={colors.cream} />
            <Text style={styles.doneGhostText}>Печать</Text>
          </Pressable>
          <Pressable
            onPress={() => void printReceipt(doc, shift, seller, change, receiptDiscountMinor, true)}
            style={({ pressed }) => [styles.doneGhost, pressed && { opacity: 0.8 }]}
          >
            <Glyph name="box" size={18} color={colors.cream} />
            <Text style={styles.doneGhostText}>Отправить PDF</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={onClose}
        style={({ pressed }) => [checkoutStyles.primary, styles.doneBtn, pressed && { opacity: 0.9 }]}
      >
        <Text style={checkoutStyles.primaryText}>К витрине</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space(6),
    gap: space(5),
  },
  doneCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: space(2),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.xl,
    paddingVertical: space(8),
    paddingHorizontal: space(6),
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(2),
  },
  doneTitle: { fontFamily: font.display, fontSize: 24, color: colors.cream, letterSpacing: 0.4 },
  doneLabel: { fontSize: 14, color: 'rgba(244,245,247,0.6)' },
  doneSum: { fontFamily: font.display, fontSize: 40, color: colors.white, letterSpacing: 0.5 },
  doneBtn: { width: '100%', maxWidth: 380, paddingHorizontal: space(6) },
  doneActions: { flexDirection: 'row', gap: space(3), width: '100%', maxWidth: 380 },
  doneGhost: {
    flex: 1,
    flexDirection: 'row',
    gap: space(2),
    height: 50,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneGhostText: { color: colors.cream, fontSize: 14, fontWeight: '600' },
})
