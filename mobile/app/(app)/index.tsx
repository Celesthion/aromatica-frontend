import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { money } from '@/shared/lib/format'
import { AppHeader } from '~/components/AppHeader'
import { Glyph } from '~/components/Glyph'
import { staffName, useSession } from '~/features/auth/session'
import { OTHER_MODULES } from '~/features/home/modules'
import { useShift, useShiftReport } from '~/features/pos/queries'
import { useIsWide } from '~/hooks/useIsWide'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { font, radius, space } from '~/theme'

export default function HomeScreen() {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const wide = useIsWide()
  const user = useSession((s) => s.user)

  const shift = useShift()
  const summary = useShiftReport(shift.data?.id)

  const name = staffName(user).split(' ')[0]

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader title={greeting()} subtitle={name} />
      <ScrollView
        contentContainerStyle={{
          padding: space(4),
          paddingBottom: insets.bottom + space(8),
          gap: space(4),
        }}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Glyph name="store" size={22} color={t.cream} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.heroLabel}>
                {shift.data ? 'Выручка за смену' : shift.isError ? 'Нет связи' : 'Касса'}
              </Text>
              <Text style={styles.heroValue}>
                {shift.data ? money(summary.data?.revenueMinor ?? 0) : shift.isError ? '—' : 'Смена закрыта'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Касса</Text>
          <Text style={styles.heroHint}>
            {shift.data
              ? `Смена №${shift.data.number} открыта · ${summary.data?.receiptsCount ?? 0} чеков · ${shift.data.warehouseName ?? 'склад не указан'}`
              : 'Чтобы продавать, откройте смену'}
          </Text>

          <Pressable
            onPress={() => router.navigate(shift.data ? '/pos' : '/shift')}
            style={({ pressed }) => [styles.heroBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.heroBtnText}>{shift.data ? 'Открыть кассу' : 'Открыть смену'}</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>Другие модули</Text>
        <View style={[styles.grid, wide && { gap: space(4) }]}>
          {OTHER_MODULES.map((m) => (
            <View key={m.key} style={[styles.mod, { width: wide ? '31.5%' : '48%' }]}>
              <View style={[styles.modIcon, { backgroundColor: m.tint }]}>
                <Glyph name={m.glyph} size={20} color={m.stroke} />
              </View>
              <View>
                <Text style={styles.modName}>{m.label}</Text>
                <Text style={styles.modHint}>{m.hint}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    hero: {
      backgroundColor: '#2b2d33',
      borderRadius: radius.xl,
      padding: space(5),
      gap: space(2),
      shadowColor: '#1e2026',
      shadowOpacity: 0.28,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 6,
    },
    heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    heroIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroLabel: { fontSize: 12, color: 'rgba(244,245,247,0.6)' },
    heroValue: {
      fontFamily: font.display,
      fontSize: 26,
      color: t.white,
      marginTop: 2,
      letterSpacing: 0.3,
    },
    heroTitle: {
      fontFamily: font.display,
      fontSize: 24,
      color: t.cream,
      marginTop: space(3),
      letterSpacing: 0.4,
    },
    heroHint: { fontSize: 13, color: 'rgba(244,245,247,0.62)', lineHeight: 18 },
    heroBtn: {
      marginTop: space(4),
      height: 52,
      borderRadius: radius.pill,
      backgroundColor: t.cream,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // карточка смены тёмная в обеих темах, цвет не из палитры
    heroBtnText: { fontSize: 16, fontWeight: '600', color: '#2b2d33' },

    section: {
      marginTop: space(2),
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: t.muted,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3) },
    mod: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(4),
      gap: space(4),
      opacity: 0.55,
      shadowColor: t.shadowColor,
      shadowOpacity: t.shadowOpacity,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
    modIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modName: { fontSize: 15, fontWeight: '600', color: t.ink },
    modHint: { fontSize: 12, color: t.muted, marginTop: 1 },
  })
