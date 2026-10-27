import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { BrandPattern } from '~/components/BrandPattern'
import { useIsWide } from '~/hooks/useIsWide'
import { useKeyboardHeight } from '~/hooks/useKeyboardHeight'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'
import { useSession } from './session'

const MONOGRAM = require('../../../assets/brand/monogram-dark.png')
const WORDMARK = require('../../../assets/brand/wordmark-light.png')

// шапка занимает треть экрана, но не больше 320: на планшете вышла бы половина
const HEADER_MIN = 240
const HEADER_MAX = 320

export function LoginScreen() {
  const signIn = useSession((s) => s.signIn)
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const { width, height } = useWindowDimensions()
  const keyboard = useKeyboardHeight()
  const wide = useIsWide()

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const passwordRef = useRef<TextInput>(null)

  const headerHeight = Math.min(Math.max(height * 0.34, HEADER_MIN), HEADER_MAX)

  async function submit() {
    if (busy || !login || !password) return
    setBusy(true)
    setError(null)
    try {
      await signIn(login.trim(), password)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      setError('Неверный логин или пароль')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setBusy(false)
    }
  }

  const canSubmit = !!login && !!password && !busy

  return (
    <View style={styles.screen}>
      <View style={{ height: headerHeight }}>
        <BrandPattern width={width} height={headerHeight} />
        <View style={styles.headerInner}>
          <View style={styles.logoTile}>
            <Image source={MONOGRAM} style={styles.monogram} resizeMode="contain" />
          </View>
          <Image source={WORDMARK} style={styles.wordmark} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.sheetWrap}>
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={[
            styles.sheetInner,
            wide && { alignSelf: 'center', width: 460 },
            keyboard > 0 && { paddingBottom: keyboard + space(6) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.label}>Логин</Text>
            <TextInput
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Пароль</Text>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={submit}
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.button,
              !canSubmit && { opacity: 0.45 },
              pressed && { transform: [{ scale: 0.985 }] },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={t.primaryText} />
            ) : (
              <Text style={styles.buttonText}>Войти</Text>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#141519' },
    headerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space(5) },
    logoTile: {
      width: 104,
      height: 104,
      borderRadius: 30,
      backgroundColor: t.field,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    monogram: { width: 52, height: 52 },
    wordmark: { width: 168, height: 22, opacity: 0.9 },

    // шторка наезжает на шапку, скруглён только левый верхний угол
    sheetWrap: { flex: 1, marginTop: -42 },
    sheet: {
      flex: 1,
      backgroundColor: t.isDark ? t.background : t.white,
      borderTopLeftRadius: 68,
      borderTopRightRadius: 0,
    },
    sheetInner: { padding: space(7), paddingTop: space(12), gap: space(4) },

    field: {
      backgroundColor: t.isDark ? t.card : '#f7f8fa',
      borderWidth: t.isDark ? 1 : 0,
      borderColor: t.border,
      borderRadius: radius.lg,
      paddingHorizontal: space(5),
      paddingVertical: space(3.5),
      shadowColor: '#465064',
      shadowOpacity: 0.06,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    label: { fontSize: 13, color: t.muted },
    input: { fontSize: 17, color: t.ink, paddingVertical: space(1.5), fontWeight: '500' },
    error: { color: t.danger, fontSize: 14, textAlign: 'center' },
    button: {
      marginTop: space(2),
      height: 58,
      borderRadius: radius.lg,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: t.primaryText, fontSize: 17, fontWeight: '600' },
  })
