import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { radius, space } from '~/theme'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string
  onPress: () => void
  variant?: 'primary' | 'ghost'
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const base = variant === 'primary' ? styles.primary : styles.ghost
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [base, disabled && { opacity: 0.5 }, pressed && { opacity: 0.85 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? t.primaryText : t.ink} />
      ) : (
        <Text style={variant === 'primary' ? styles.primaryText : styles.ghostText}>{title}</Text>
      )}
    </Pressable>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    primary: {
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: { color: t.primaryText, fontSize: 16, fontWeight: '600' },
    ghost: {
      height: 52,
      paddingHorizontal: space(6),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostText: { color: t.ink, fontSize: 15, fontWeight: '600' },
  })
