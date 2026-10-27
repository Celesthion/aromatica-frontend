import { StyleSheet, Text, View } from 'react-native'
import { useStyles, type Theme } from '~/hooks/useTheme'
import { space } from '~/theme'

/** Строка ошибки загрузки с кнопкой повтора. */
export function QueryError({ query }: { query: { refetch: () => unknown } }) {
  const styles = useStyles(makeStyles)
  return (
    <View style={styles.errRow}>
      <Text style={[styles.hint, { flex: 1 }]}>Не удалось загрузить</Text>
      <Text style={styles.retry} onPress={() => void query.refetch()}>
        Повторить
      </Text>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    hint: { fontSize: 14, color: t.muted },
    errRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(2) },
    retry: { color: t.ink, fontWeight: '700', fontSize: 14 },
  })
