import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Glyph } from '~/components/Glyph'
import { light as colors, radius, space } from '~/theme'

/** Степпер количества на тёмной карте чека. */
export function QtyStepper({
  value,
  onDec,
  onInc,
}: {
  value: string | number
  onDec: () => void
  onInc: () => void
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onDec} hitSlop={8} style={styles.stepBtn}>
        <Glyph name="minus" size={16} color={colors.cream} />
      </Pressable>
      <Text style={styles.stepQty}>{value}</Text>
      <Pressable onPress={onInc} hitSlop={8} style={styles.stepBtn}>
        <Glyph name="plus" size={16} color={colors.cream} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space(3),
    marginTop: space(2),
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: radius.pill,
    paddingHorizontal: space(2),
    paddingVertical: space(1),
  },
  stepBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepQty: { minWidth: 34, textAlign: 'center', color: colors.cream, fontWeight: '600' },
})
