import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { radius, space } from '~/theme'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'

export function Field({
  label,
  style,
  ...input
}: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={t.muted} {...input} style={styles.input} />
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    field: {
      backgroundColor: t.field,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: space(4),
      paddingVertical: space(2.5),
    },
    label: { fontSize: 12, color: t.muted },
    input: { fontSize: 16, color: t.ink, paddingVertical: space(1) },
  })
