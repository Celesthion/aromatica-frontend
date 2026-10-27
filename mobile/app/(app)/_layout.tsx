import { Drawer } from 'expo-router/drawer'
import { usePathname, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { DrawerContentScrollView, type DrawerContentComponentProps } from '@react-navigation/drawer'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ROLE_LABELS } from '@/entities/staff/roles'
import { Glyph, type GlyphName } from '~/components/Glyph'
import { staffName, useSession } from '~/features/auth/session'
import { OTHER_MODULES } from '~/features/home/modules'
import { useShift } from '~/features/pos/queries'
import { useStyles, useTheme, useThemeMode, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

export default function AppLayout() {
  const t = useTheme()
  const { width } = useWindowDimensions()

  return (
    <Drawer
      drawerContent={(props) => <DrawerBody {...props} />}
      // с firstRoute back() из /split уводил бы на Главную мимо кассы
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        // поверх экрана: slide на планшете сдвигал бы каталог вбок
        drawerType: 'front',
        drawerStyle: { width: Math.min(320, width * 0.86), backgroundColor: t.background },
        sceneStyle: { backgroundColor: t.background },
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="index" options={{ title: 'Главная' }} />
      <Drawer.Screen name="pos" options={{ title: 'Касса' }} />
      <Drawer.Screen name="shift" options={{ title: 'Смена' }} />
    </Drawer>
  )
}

function DrawerBody(props: DrawerContentComponentProps) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const user = useSession((s) => s.user)
  const signOut = useSession((s) => s.signOut)
  const shift = useShift()
  const mode = useThemeMode((s) => s.mode)
  const setMode = useThemeMode((s) => s.setMode)

  const name = staffName(user)
  const go = (href: string) => {
    props.navigation.closeDrawer()
    router.navigate(href)
  }

  const items: { href: string; label: string; glyph: GlyphName; badge?: string }[] = [
    { href: '/', label: 'Главная', glyph: 'home' },
    { href: '/pos', label: 'Касса', glyph: 'store' },
    {
      href: '/shift',
      label: 'Смена',
      glyph: 'clock',
      badge: shift.data ? `№${shift.data.number}` : 'закрыта',
    },
  ]

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: insets.top + space(4), paddingHorizontal: space(4) }}
      >
        <View style={styles.user}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.userRole}>{user?.role ? (ROLE_LABELS[user.role] ?? user.role) : ''}</Text>
          </View>
        </View>

        <View style={{ marginTop: space(6), gap: space(1) }}>
          {items.map((it) => {
            const active = pathname === it.href
            return (
              <Pressable
                key={it.href}
                onPress={() => go(it.href)}
                style={({ pressed }) => [styles.item, active && styles.itemOn, pressed && { opacity: 0.7 }]}
              >
                <Glyph name={it.glyph} size={20} color={active ? t.primaryText : t.ink} />
                <Text style={[styles.itemText, active && { color: t.primaryText }]}>{it.label}</Text>
                {it.badge ? (
                  <Text style={[styles.badge, active && { color: t.primaryText, opacity: 0.7 }]}>
                    {it.badge}
                  </Text>
                ) : null}
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.section}>Другие модули</Text>
        <View style={{ gap: space(1) }}>
          {OTHER_MODULES.map((m) => (
            <View key={m.key} style={[styles.item, { opacity: 0.4 }]}>
              <Glyph name={m.glyph} size={20} color={t.ink} />
              <Text style={styles.itemText}>{m.label}</Text>
              <Text style={styles.badge}>{m.hint}</Text>
            </View>
          ))}
        </View>
      </DrawerContentScrollView>

      <View style={styles.themeRow}>
        {(
          [
            ['light', 'Светлая', 'sun'],
            ['dark', 'Тёмная', 'moon'],
          ] as const
        ).map(([value, label, glyph]) => {
          // в режиме system подсвечена тема системы
          const on = mode === value || (mode === 'system' && t.isDark === (value === 'dark'))
          return (
            <Pressable
              key={value}
              onPress={() => setMode(value)}
              style={[styles.themeBtn, on && styles.themeBtnOn]}
            >
              <Glyph name={glyph} size={17} color={on ? t.primaryText : t.muted} />
              <Text style={[styles.themeText, on && { color: t.primaryText }]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>

      <Pressable
        onPress={() => void signOut()}
        style={({ pressed }) => [
          styles.exit,
          { paddingBottom: insets.bottom + space(4) },
          pressed && { opacity: 0.6 },
        ]}
      >
        <Glyph name="exit" size={20} color={t.muted} />
        <Text style={styles.exitText}>Выйти</Text>
      </Pressable>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    user: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: t.primaryText, fontSize: 18, fontWeight: '700' },
    userName: { fontSize: 17, fontWeight: '600', color: t.ink },
    userRole: { fontSize: 13, color: t.muted, marginTop: 1 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingHorizontal: space(4),
      paddingVertical: space(3.5),
      borderRadius: radius.lg,
    },
    itemOn: { backgroundColor: t.primary },
    itemText: { flex: 1, fontSize: 16, fontWeight: '500', color: t.ink },
    badge: { fontSize: 12, color: t.muted },
    section: {
      marginTop: space(7),
      marginBottom: space(2),
      marginLeft: space(4),
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: t.muted,
    },
    exit: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      paddingHorizontal: space(8),
      paddingTop: space(4),
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    exitText: { fontSize: 16, color: t.muted },
    themeRow: {
      flexDirection: 'row',
      gap: space(1),
      marginHorizontal: space(4),
      marginBottom: space(3),
      padding: space(1),
      borderRadius: radius.pill,
      backgroundColor: t.cardAlt,
    },
    themeBtn: {
      flex: 1,
      flexDirection: 'row',
      gap: space(2),
      paddingVertical: space(2.5),
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeBtnOn: { backgroundColor: t.primary },
    themeText: { fontSize: 13, fontWeight: '600', color: t.muted },
  })
