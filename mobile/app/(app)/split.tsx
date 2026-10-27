import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import {
  DEFAULT_DILUTION_PCT,
  MIN_DILUTION_PCT,
  isDilutable,
  isDilutionValid,
  oilForSpray,
  pricePerSprayMl,
  sprayForOil,
} from '@/entities/product/dilution'
import { atomizerVolumes, atomizersForVolume, sellableAtomizers } from '@/pages/pos/lib/atomizers'
import { remainingQty } from '@/pages/pos/lib/stock'
import { fetchPosSettings, type PosProduct, queryKeys } from '@/shared/api'
import { money, qtyFmt } from '@/shared/lib/format'
import { parseDecimal } from '@/shared/lib/money'
import { newUuid } from '@/shared/lib/uuid'
import { AppHeader } from '~/components/AppHeader'
import { Button } from '~/components/Button'
import { useCart } from '~/features/pos/cart'
import { useAtomizers, useShift } from '~/features/pos/queries'
import { useSplit } from '~/features/pos/splitStore'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

/** Распив и разлив: выбор объёма и атомайзера. */
export default function SplitScreen() {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const router = useRouter()
  const product = useSplit((s) => s.product)
  const setProduct = useSplit((s) => s.setProduct)
  const lines = useCart((s) => s.lines)
  const add = useCart((s) => s.add)
  const shift = useShift()

  const [custom, setCustom] = useState('')
  // выбранный объём; пока null, идёт первый шаг
  const [ml, setMl] = useState<number | null>(null)

  const atomizers = useAtomizers(shift.data?.warehouseId, !!shift.data)
  const settings = useQuery({
    queryKey: queryKeys.pos.settings,
    queryFn: fetchPosSettings,
    staleTime: 5 * 60_000,
  })

  // текст доли хранится отдельно от значения, чтобы цены не прыгали, пока поле стирают и вводят заново
  const dilutable = !!product && isDilutable(product.kind)
  const defaultPct = settings.data?.defaultDilutionPct ?? DEFAULT_DILUTION_PCT
  const [pctText, setPctText] = useState<string | null>(null)
  const [pctValue, setPctValue] = useState<number | null>(null)
  const pct = dilutable ? (pctValue ?? defaultPct) : 100
  const pctShown = pctText ?? String(pct)
  const pctBroken = pctText != null && pctText.trim() !== '' && !isDilutionValid(parseDecimal(pctText))
  const typePct = (v: string) => {
    setPctText(v)
    const n = parseDecimal(v)
    if (isDilutionValid(n)) setPctValue(n)
  }

  // после close() эффект не должен звать back() повторно
  const closing = useRef(false)

  // открыли без товара (диплинк, восстановление): назад
  useEffect(() => {
    if (!product && !closing.current) router.back()
  }, [product, router])

  if (!product) return null

  // цена карточки за мл масла, а клиент платит за мл спрея: он дешевле на долю воды
  const perMlOil = product.priceMinor ?? 0
  const perMl = dilutable ? pricePerSprayMl(perMlOil, pct) : perMlOil
  const oilAvailable = remainingQty(lines, product)
  const available = dilutable ? sprayForOil(oilAvailable, pct) : oilAvailable
  const n = parseDecimal(custom)
  const valid = Number.isFinite(n) && n > 0 && n <= available

  const inStock = sellableAtomizers(atomizers.data ?? [], (a) => remainingQty(lines, a))
  const presets = atomizerVolumes(inStock)
  const fitting = ml != null ? atomizersForVolume(inStock, ml) : []

  const finish = (volume: number, atomizer: PosProduct | null) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // в чек уходит масло, воду дописывает сервер; общий bundleId уводит флакон на полку целиком
    const bundleId = newUuid()
    const oilMl = dilutable ? oilForSpray(volume, pct) : volume
    add(product, oilMl, perMlOil, { dilutionPct: dilutable ? pct : undefined, bundleId })
    if (atomizer) add(atomizer, 1, atomizer.priceMinor ?? 0, { bundleId })
    close()
  }

  const close = () => {
    closing.current = true
    setProduct(null)
    router.back()
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <AppHeader
        title={ml != null ? 'Во что налить' : dilutable ? 'Разлив' : 'Распив'}
        subtitle={ml != null ? `${product.name} · ${qtyFmt(ml)} мл` : product.name}
      />
      <ScrollView
        contentContainerStyle={{ padding: space(4), gap: space(3) }}
        keyboardShouldPersistTaps="handled"
      >
        {ml == null ? (
          <>
            {dilutable ? (
              <View style={[styles.field, { flexDirection: 'row', alignItems: 'center', gap: space(2) }]}>
                <Text style={styles.hint}>Доля масла</Text>
                <TextInput
                  value={pctShown}
                  onChangeText={typePct}
                  onBlur={() => setPctText(null)}
                  keyboardType="decimal-pad"
                  style={[styles.input, { width: 56, textAlign: 'right' }, pctBroken && { color: t.danger }]}
                />
                <Text style={styles.hint}>
                  % · остальное — парфюмерная вода{pctBroken ? ` · от ${MIN_DILUTION_PCT} до 100` : ''}
                </Text>
              </View>
            ) : null}
            <Text style={styles.hint}>
              {money(perMl)}/мл · хватит на {qtyFmt(available)} мл
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space(2) }}>
              {presets.map((preset) => (
                <Pressable
                  key={preset}
                  disabled={preset > available}
                  onPress={() => setMl(preset)}
                  style={({ pressed }) => [
                    styles.mlChip,
                    (pressed || preset > available) && { opacity: 0.45 },
                  ]}
                >
                  <Text style={styles.mlChipText}>{qtyFmt(preset)} мл</Text>
                  <Text style={styles.hint}>{money(Math.round(preset * perMl))}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.field}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="Свой объём, мл"
                placeholderTextColor={t.muted}
                keyboardType="decimal-pad"
                style={styles.input}
              />
            </View>
            <Button
              title={valid ? `Далее · ${qtyFmt(n)} мл · ${money(Math.round(n * perMl))}` : 'Введите объём'}
              onPress={() => setMl(n)}
              disabled={!valid}
            />
            <Button variant="ghost" title="Отмена" onPress={close} />
          </>
        ) : (
          <>
            <Pressable
              onPress={() => finish(ml, null)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Без атомайзера</Text>
                <Text style={styles.hint}>Клиент со своим флаконом</Text>
              </View>
              <Text style={styles.rowPrice}>{money(Math.round(ml * perMl))}</Text>
            </Pressable>

            {fitting.length === 0 ? (
              <Text style={styles.hint}>
                Флаконов {qtyFmt(ml)} мл нет в наличии — только «без атомайзера»
              </Text>
            ) : null}

            {fitting.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => finish(ml, a)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {a.label ?? a.name}
                  </Text>
                  <Text style={styles.hint}>остаток {qtyFmt(remainingQty(lines, a))}</Text>
                </View>
                <Text style={styles.rowPrice}>{money(Math.round(ml * perMl) + (a.priceMinor ?? 0))}</Text>
              </Pressable>
            ))}

            <Button variant="ghost" title="Назад к объёму" onPress={() => setMl(null)} />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    hint: { fontSize: 13, color: t.muted },
    mlChip: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      paddingHorizontal: space(4),
      paddingVertical: space(2.5),
      alignItems: 'center',
      minWidth: 82,
    },
    mlChipText: { fontSize: 15, fontWeight: '600', color: t.ink },
    field: {
      backgroundColor: t.field,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.pill,
      paddingHorizontal: space(4),
      paddingVertical: space(1.5),
    },
    input: { fontSize: 16, color: t.ink, paddingVertical: space(1.5) },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(4),
    },
    rowTitle: { fontSize: 15, fontWeight: '600', color: t.ink },
    rowPrice: { fontSize: 15, fontWeight: '700', color: t.ink },
  })
