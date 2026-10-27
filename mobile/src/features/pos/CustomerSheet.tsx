import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPosCustomer,
  fetchCustomerPurchases,
  searchPosCustomers,
  type PosCustomer,
  queryKeys,
} from '@/shared/api'
import { PHONE_PREFIX, isValidPhone, normalizePhone } from '@/shared/lib/phone'
import { dateFmt, money, qtyFmt } from '@/shared/lib/format'
import { Button } from '~/components/Button'
import { Field } from '~/components/Field'
import { Glyph } from '~/components/Glyph'
import { Sheet } from '~/components/Sheet'
import { useDebounced } from '~/hooks/useDebounced'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'
import { useCart } from './cart'

/** Поиск, создание и история покупок покупателя. */
export function CustomerSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme()
  const styles = useStyles(makeStyles)
  const queryClient = useQueryClient()
  const customer = useCart((s) => s.customer)
  const setCustomer = useCart((s) => s.setCustomer)

  const [q, setQ] = useState('')
  const query = useDebounced(q.trim())
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(PHONE_PREFIX)

  useEffect(() => {
    if (!visible) {
      setQ('')
      setCreating(false)
      setName('')
      setPhone('')
      setHistoryOf(null)
    }
  }, [visible])

  const found = useQuery({
    queryKey: queryKeys.pos.customers.search(query),
    queryFn: () => searchPosCustomers(query),
    enabled: visible && query.length >= 2,
  })

  const [historyOf, setHistoryOf] = useState<PosCustomer | null>(null)
  const purchases = useQuery({
    queryKey: queryKeys.pos.purchases.byCustomer(historyOf?.id),
    queryFn: () => fetchCustomerPurchases(historyOf!.id),
    enabled: visible && !!historyOf,
  })

  const create = useMutation({
    mutationFn: () => createPosCustomer({ name: name.trim(), phone }),
    onSuccess: (c) => {
      setCustomer(c)
      setCreating(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.pos.customers.all })
    },
  })

  const phoneOk = isValidPhone(phone)
  const canCreate = name.trim().length >= 2 && phoneOk && !create.isPending

  // номер из поиска подставим в форму создания
  const prefill = useMemo(() => normalizePhone(q), [q])

  return (
    <Sheet visible={visible} title="Покупатель" onClose={onClose}>
      {/* поиск остаётся и при привязанном покупателе, чтобы заменить его без открепления */}
      {customer ? (
        <View style={styles.picked}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.name, { color: t.cream }]} numberOfLines={1}>
              {customer.name}
            </Text>
            <Text style={styles.pickedPhone}>{customer.phone}</Text>
          </View>
          <Pressable
            onPress={() => setHistoryOf(customer)}
            hitSlop={8}
            style={({ pressed }) => [styles.pickedBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.pickedBtnText}>История</Text>
          </Pressable>
          <Pressable onPress={() => setCustomer(null)} hitSlop={10}>
            <Text style={styles.unlink}>Открепить</Text>
          </Pressable>
        </View>
      ) : null}

      {historyOf ? (
        <View style={{ gap: space(2) }}>
          <View style={styles.historyHead}>
            <Text style={styles.section}>Покупки · {historyOf.name}</Text>
            <Pressable onPress={() => setHistoryOf(null)} hitSlop={10}>
              <Text style={styles.link}>Назад</Text>
            </Pressable>
          </View>
          {purchases.isPending ? (
            <ActivityIndicator color={t.ink} />
          ) : purchases.data && purchases.data.length > 0 ? (
            purchases.data.map((p) => (
              <View key={p.docId} style={styles.purchaseCard}>
                <View style={styles.purchaseHead}>
                  <Text style={styles.hint}>
                    Чек №{p.number} · {dateFmt(p.moment)}
                  </Text>
                  <Text style={styles.purchaseSum}>{money(p.sumMinor)}</Text>
                </View>
                {p.lines.map((l, i) => (
                  <View key={`${p.docId}-${i}`} style={styles.purchaseLine}>
                    <Text style={styles.purchaseName} numberOfLines={2}>
                      {l.productName}
                    </Text>
                    <Text style={styles.purchaseQty}>
                      {qtyFmt(l.qty)} {l.unit === 'ML' ? 'мл' : 'шт'}
                    </Text>
                    <Text style={styles.purchaseLineSum}>{l.gift ? 'подарок' : money(l.sumMinor)}</Text>
                  </View>
                ))}
              </View>
            ))
          ) : (
            <Text style={styles.hint}>Покупок пока нет</Text>
          )}
        </View>
      ) : creating ? (
        <View style={{ gap: space(3) }}>
          <Field
            label="Имя"
            value={name}
            onChangeText={setName}
            placeholder="Как зовут покупателя"
            autoFocus
          />
          <Field
            label="Телефон"
            value={phone}
            onChangeText={(v) => setPhone(normalizePhone(v))}
            placeholder="+996700112233"
            keyboardType="phone-pad"
          />
          {phone.length > 0 && !phoneOk ? (
            <Text style={styles.error}>Телефон — только цифры, минимум шесть</Text>
          ) : null}
          {create.isError ? <Text style={styles.error}>Не удалось сохранить</Text> : null}
          <View style={{ flexDirection: 'row', gap: space(2) }}>
            <Button variant="ghost" title="Назад" onPress={() => setCreating(false)} />
            <Button
              title="Сохранить и прикрепить"
              onPress={() => create.mutate()}
              disabled={!canCreate}
              loading={create.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={styles.search}>
            <Glyph name="search" size={18} color={t.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Имя или телефон"
              placeholderTextColor={t.muted}
              style={{ flex: 1, fontSize: 16, color: t.ink }}
              autoCorrect={false}
            />
          </View>

          {query.length >= 2 && found.isPending ? <ActivityIndicator color={t.ink} /> : null}

          {(found.data ?? []).map((c) => {
            const attached = customer?.id === c.id
            return (
              <View key={c.id} style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{c.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={styles.hint}>{c.phone}</Text>
                </View>
                <Pressable onPress={() => setHistoryOf(c)} hitSlop={8} style={styles.secondary}>
                  <Text style={styles.secondaryText}>История</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCustomer(c)}
                  disabled={attached}
                  style={({ pressed }) => [
                    styles.attach,
                    attached && { opacity: 0.45 },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.attachText}>{attached ? 'Прикреплён' : 'Прикрепить'}</Text>
                </Pressable>
              </View>
            )
          })}

          {query.length >= 2 && found.isSuccess && (found.data?.length ?? 0) === 0 ? (
            <Text style={styles.hint}>Никого не нашли — заведите нового</Text>
          ) : null}

          <Button
            title="Новый покупатель"
            onPress={() => {
              setCreating(true)
              if (/\d/.test(prefill)) setPhone(prefill)
            }}
          />
        </>
      )}
    </Sheet>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(2.5),
      backgroundColor: t.field,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.pill,
      paddingHorizontal: space(4),
      paddingVertical: space(3),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(3.5),
    },
    picked: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space(3),
      // тёмная карта в обеих темах, как чек
      backgroundColor: t.dark,
      borderRadius: radius.lg,
      padding: space(4),
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: t.cardAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: '700', color: t.ink },
    name: { fontSize: 15, fontWeight: '600', color: t.ink },
    hint: { fontSize: 13, color: t.muted },
    unlink: { fontSize: 13, color: t.cream, opacity: 0.8 },
    pickedPhone: { fontSize: 13, color: 'rgba(244,245,247,0.6)' },
    link: { fontSize: 13, color: t.accent, fontWeight: '600' },
    historyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    attach: {
      paddingHorizontal: space(3.5),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      backgroundColor: t.primary,
    },
    attachText: { color: t.primaryText, fontSize: 12, fontWeight: '600' },
    secondary: {
      paddingHorizontal: space(3),
      paddingVertical: space(2),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: t.border,
    },
    secondaryText: { color: t.ink, fontSize: 12, fontWeight: '600' },
    section: {
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: t.muted,
      marginTop: space(2),
    },
    purchaseCard: {
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: radius.lg,
      padding: space(3.5),
      gap: space(2),
    },
    purchaseHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: space(2),
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    purchaseSum: { fontSize: 14, fontWeight: '700', color: t.ink },
    purchaseLine: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
    purchaseName: { flex: 1, fontSize: 13, color: t.ink },
    purchaseQty: { fontSize: 12, color: t.muted, minWidth: 48, textAlign: 'right' },
    purchaseLineSum: { fontSize: 13, color: t.ink, minWidth: 76, textAlign: 'right' },
    pickedBtn: {
      paddingHorizontal: space(3),
      paddingVertical: space(1.5),
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(244,245,247,0.3)',
    },
    pickedBtnText: { color: t.cream, fontSize: 12, fontWeight: '600' },
    error: { fontSize: 13, color: t.danger },
  })
