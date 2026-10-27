/**
 * UUID v4 для меток на клиенте (связка строк одного флакона в чеке). В браузере берёт
 * crypto.randomUUID, в Hermes (мобильное приложение) его нет, там Math.random: метке хватает
 * уникальности в пределах чека.
 */
export function newUuid(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined
  if (c?.randomUUID) return c.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
