import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from 'expo-router'
import { DrawerActions } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { font, radius, space } from '~/theme'
import { Glyph } from './Glyph'

/** Шапка экрана: кнопка меню и заголовок с подписью. */
export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const navigation = useNavigation()
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + space(2) }]}>
      <Pressable
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        hitSlop={10}
        style={({ pressed }) => [styles.menu, pressed && { opacity: 0.6 }]}
      >
        <Glyph name="menu" size={22} color={t.ink} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingHorizontal: space(4),
      paddingBottom: space(3),
    },
    menu: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
    },
    title: { fontFamily: font.display, fontSize: 24, color: t.ink, letterSpacing: 0.3 },
    subtitle: { fontSize: 13, color: t.muted, marginTop: 1 },
  })
