import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useKeyboardHeight } from '~/hooks/useKeyboardHeight'
import { useStyles, useTheme, type Theme } from '~/hooks/useTheme'
import { radius, space } from '~/theme'

/** Нижняя шторка со скроллом; над клавиатурой поднимается сама. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const keyboard = useKeyboardHeight()
  const t = useTheme()
  const styles = useStyles(makeStyles)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetWrap}>
        <View style={[styles.sheet, keyboard > 0 && { paddingBottom: keyboard + space(4) }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ fontSize: 20, color: t.muted }}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={{ gap: space(3), paddingBottom: space(6) }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    // шторка отдельным слоем: во flex-раскладке по углам проступает фон
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(43,45,51,0.35)' },
    sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
    sheet: {
      backgroundColor: t.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: space(5),
      maxHeight: '100%',
      gap: space(3),
      overflow: 'hidden',
    },
    sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sheetTitle: { fontSize: 18, fontWeight: '600', color: t.ink },
  })
