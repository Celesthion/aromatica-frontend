import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { canOpenShift } from '@/entities/staff/roles'
import {
  closeShift,
  fetchPosWarehouses,
  fetchShiftSummary,
  openShift,
  type AdminUser,
  type PosShift,
  queryKeys,
} from '@/shared/api'
import { money } from '@/shared/lib/format'
import { somToMinor } from '@/shared/lib/money'
import { AppHeader } from '~/components/AppHeader'
import { Glyph } from '~/components/Glyph'
import { useSession } from '~/features/auth/session'
import { useCart } from '~/features/pos/cart'
import { printShiftReport } from '~/features/pos/print'
import { useShift } from '~/features/pos/queries'
import { ShiftReceiptsSheet } from '~/features/pos/receipts/ShiftReceiptsSheet'
import { useKeyboardHeight } from '~/hooks/useKeyboardHeight'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, shadow, space } from '~/theme'

export default function ShiftScreen() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  // поля наличных внизу экрана, их закрывает клавиатура
  const keyboard = useKeyboardHeight()
  const user = useSession((s) => s.user)
  const shift = useShift()

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader title="Смена" subtitle={shift.data ? `№${shift.data.number} · открыта` : 'закрыта'} />
      <ScrollView
        contentContainerStyle={{
          padding: space(4),
          paddingBottom: insets.bottom + space(8) + keyboard,
          gap: space(4),
        }}
      >
        {shift.isPending ? (
          <ActivityIndicator color={t.ink} />
        ) : shift.data ? (
          <ActiveShift shift={shift.data} user={user} />
        ) : (
          <OpenShiftForm canOpen={canOpenShift(user?.role ?? '')} />
        )}
      </ScrollView>
    </View>
  )
}

function OpenShiftForm({ canOpen }: { canOpen: boolean }) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const queryClient = useQueryClient()
  const warehouses = useQuery({
    queryKey: queryKeys.pos.warehouses,
    queryFn: fetchPosWarehouses,
    enabled: canOpen,
  })
  const [warehouseId, setWarehouseId] = useState('')
  const [cash, setCash] = useState('')

  const open = useMutation({
    mutationFn: () =>
      openShift({
        warehouseId: warehouseId || undefined,
        openingCashMinor: somToMinor(cash) ?? 0,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.pos.all }),
  })

  const list = warehouses.data ?? []
  const activeId = warehouseId || list.find((w) => w.isDefault)?.id || list[0]?.id || ''

  if (!canOpen)
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Касса закрыта</Text>
        <Text style={styles.hint}>Открыть смену может администратор или старший продавец.</Text>
      </View>
    )

  return (
    <View style={[styles.card, { gap: space(4) }]}>
      <Text style={styles.cardTitle}>Открыть смену</Text>
      {warehouses.isSuccess && list.length === 0 ? (
        <Text style={styles.hint}>Вам не назначен ни один склад — обратитесь к администратору.</Text>
      ) : (
        <>
          <View style={{ gap: space(2) }}>
            <Text style={styles.label}>Склад</Text>
            {list.map((w) => {
              const on = activeId === w.id
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setWarehouseId(w.id)}
                  style={[styles.option, on && styles.optionOn]}
                >
                  <Text style={[styles.optionText, on && { color: t.primaryText }]}>{w.name}</Text>
                </Pressable>
              )
            })}
          </View>
          <View style={{ gap: space(2) }}>
            <Text style={styles.label}>Наличные в кассе на открытие</Text>
            <TextInput
              value={cash}
              onChangeText={setCash}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={t.muted}
              style={styles.input}
            />
          </View>
          <Pressable
            onPress={() => open.mutate()}
            disabled={!activeId || open.isPending}
            style={({ pressed }) => [
              styles.primary,
              (!activeId || open.isPending) && { opacity: 0.45 },
              pressed && { opacity: 0.9 },
            ]}
          >
            {open.isPending ? (
              <ActivityIndicator color={t.primaryText} />
            ) : (
              <Text style={styles.primaryText}>Открыть смену</Text>
            )}
          </Pressable>
          {open.isError ? <Text style={styles.error}>Не удалось открыть смену</Text> : null}
        </>
      )}
    </View>
  )
}

function ActiveShift({ shift, user }: { shift: PosShift; user: AdminUser | null }) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const queryClient = useQueryClient()
  const clearCart = useCart((s) => s.clear)
  const [counted, setCounted] = useState('')
  const [receiptsOpen, setReceiptsOpen] = useState(false)

  const summary = useQuery({
    queryKey: queryKeys.pos.summary.byShift(shift.id),
    queryFn: () => fetchShiftSummary(shift.id),
  })

  const close = useMutation({
    mutationFn: () => closeShift(shift.id, { countedCashMinor: somToMinor(counted) ?? 0 }),
    onSuccess: () => {
      clearCart()
      return queryClient.invalidateQueries({ queryKey: queryKeys.pos.all })
    },
  })

  const report = summary.data

  return (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Смена №{shift.number} открыта</Text>
        <Text style={styles.heroHint}>{shift.warehouseName ?? 'Склад не указан'}</Text>
        <View style={styles.heroRow}>
          <Text style={styles.heroLabel}>В кассе на открытие</Text>
          <Text style={styles.heroValue}>{money(shift.openingCashMinor)}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => setReceiptsOpen(true)}
        style={({ pressed }) => [styles.card, styles.linkCard, pressed && { opacity: 0.8 }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Чеки смены</Text>
          <Text style={styles.hint}>Возврат по чеку и сторно</Text>
        </View>
        <Glyph name="chevronRight" size={20} color={t.muted} />
      </Pressable>

      <ShiftReceiptsSheet
        visible={receiptsOpen}
        onClose={() => setReceiptsOpen(false)}
        shift={shift}
        user={user}
      />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>X-отчёт</Text>
        {summary.isPending ? (
          <ActivityIndicator color={t.ink} style={{ marginTop: space(3) }} />
        ) : report ? (
          <View style={{ gap: space(2), marginTop: space(3) }}>
            <Row label="Чеков" value={String(report.receiptsCount)} />
            <Row label="Выручка" value={money(report.revenueMinor)} />
            <Row label="Наличными" value={money(report.cashMinor)} />
            <Row label="Безнал" value={money(report.noCashMinor)} />
            <Row label={`Возвраты (${report.returnsCount})`} value={money(report.returnsMinor)} />
            <View style={styles.divider} />
            <Row label="Ожидается в кассе" value={money(report.expectedCashMinor)} strong />
            <Pressable
              onPress={() => void printShiftReport(shift, report, 'X-ОТЧЁТ')}
              style={({ pressed }) => [styles.ghost, { marginTop: space(2) }, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.ghostText}>Печать X-отчёта</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>Не удалось загрузить отчёт</Text>
        )}
      </View>

      <View style={[styles.card, { gap: space(3) }]}>
        <Text style={styles.cardTitle}>Закрыть смену</Text>
        <View style={{ gap: space(2) }}>
          <Text style={styles.label}>Пересчитанные наличные</Text>
          <TextInput
            value={counted}
            onChangeText={setCounted}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={t.muted}
            style={styles.input}
          />
        </View>
        <Pressable
          onPress={() => close.mutate()}
          disabled={counted.trim() === '' || close.isPending}
          style={({ pressed }) => [
            styles.ghost,
            (counted.trim() === '' || close.isPending) && { opacity: 0.45 },
            pressed && { opacity: 0.8 },
          ]}
        >
          {close.isPending ? (
            <ActivityIndicator color={t.ink} />
          ) : (
            <Text style={styles.ghostText}>Закрыть смену</Text>
          )}
        </Pressable>
        {close.isError ? <Text style={styles.error}>Не удалось закрыть смену</Text> : null}
      </View>
    </>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const styles = useStyles(makeStyles)
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={styles.hint}>{label}</Text>
      <Text style={[styles.rowValue, strong && { fontWeight: '700' }]}>{value}</Text>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.card,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: t.border,
      padding: space(5),
      ...shadow,
    },
    cardTitle: { fontSize: 18, fontWeight: '600', color: t.ink },
    linkCard: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
    hint: { fontSize: 14, color: t.muted },
    label: { fontSize: 13, color: t.muted },
    rowValue: { fontSize: 15, color: t.ink, fontWeight: '600' },
    divider: { height: 1, backgroundColor: t.border, marginVertical: space(1) },

    hero: {
      backgroundColor: '#2b2d33',
      borderRadius: radius.xl,
      padding: space(5),
      gap: space(1),
    },
    heroTitle: { fontSize: 18, fontWeight: '700', color: t.cream },
    heroHint: { fontSize: 13, color: 'rgba(244,245,247,0.6)' },
    heroRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: space(4),
    },
    heroLabel: { fontSize: 13, color: 'rgba(244,245,247,0.6)' },
    heroValue: { fontSize: 17, fontWeight: '700', color: t.white },

    input: {
      backgroundColor: t.field,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: space(4),
      paddingVertical: space(3),
      fontSize: 17,
      color: t.ink,
    },
    option: {
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.md,
      paddingHorizontal: space(4),
      paddingVertical: space(3),
      backgroundColor: t.field,
    },
    optionOn: { backgroundColor: t.primary, borderColor: t.ink },
    optionText: { fontSize: 15, color: t.ink, fontWeight: '500' },

    primary: {
      height: 54,
      borderRadius: radius.pill,
      backgroundColor: t.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryText: { color: t.primaryText, fontSize: 16, fontWeight: '600' },
    ghost: {
      height: 54,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostText: { color: t.ink, fontSize: 16, fontWeight: '600' },
    error: { color: t.danger, fontSize: 14 },
  })
