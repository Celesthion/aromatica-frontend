// те же правила, что у PasswordPolicy на сервере
export const PASSWORD_HINT = 'Минимум 8 символов, заглавная и строчная буквы, цифра и символ'

export function strongPassword(p: string): boolean {
  return p.length >= 8 && /\p{Ll}/u.test(p) && /\p{Lu}/u.test(p) && /\d/.test(p) && /[^\p{L}\d]/u.test(p)
}
