import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { radius, space } from '~/theme'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { Glyph } from './Glyph'

/** Компактный степпер количества для строк списков. */
export function Stepper({
  value,
  onDec,
  onInc,
  style,
}: {
  value: string
  onDec: () => void
  onInc: () => void
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <View style={[styles.stepper, style]}>
      <Pressable onPress={onDec} hitSlop={8} style={styles.stepBtn}>
        <Glyph name="minus" size={16} color={t.ink} />
      </Pressable>
      <Text style={styles.stepQty}>{value}</Text>
      <Pressable onPress={onInc} hitSlop={8} style={styles.stepBtn}>
        <Glyph name="plus" size={16} color={t.ink} />
      </Pressable>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(2),
      backgroundColor: t.cardAlt,
      borderRadius: radius.pill,
    },
    stepBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    stepQty: { minWidth: 34, textAlign: 'center', color: t.ink, fontWeight: '600' },
  })
