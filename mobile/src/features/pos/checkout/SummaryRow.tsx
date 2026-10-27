import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { light as colors } from '~/theme'
import { checkoutStyles } from './checkoutStyles'

export function SummaryRow({
  label,
  value,
  accent,
  style,
}: {
  label: string
  value: string
  accent?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[styles.row, style]}>
      <Text style={checkoutStyles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: colors.accent }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowValue: { fontSize: 13, color: colors.cream },
})
