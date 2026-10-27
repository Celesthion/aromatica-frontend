import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'
import { Button, ButtonSpinner, Input, ErrorNote } from '@/shared/ui'
import { UnauthorizedError, login } from '@/shared/api'

export function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [loginName, setLoginName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // сброса пароля нет: по клику показываем, к кому обратиться
  const [forgot, setForgot] = useState(false)
  const auth = useMutation({
    mutationFn: () => login(loginName, password),
    onSuccess,
  })

  return (
    <div className="flex min-h-screen">
      {/* брендовая панель: монограмма поверх двух вращающихся стеклянных плит */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden p-12 lg:flex">
        <span
          aria-hidden
          className="absolute aspect-square w-[65%] animate-orbit rounded-[28%] border border-ring/20 bg-gradient-to-br from-primary/15 to-transparent shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.15)]"
        />
        <span
          aria-hidden
          className="absolute aspect-square w-[45%] animate-orbit-back rounded-[28%] border border-ring/20 bg-gradient-to-br from-primary/15 to-transparent shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.15)]"
        />
        <span
          role="img"
          aria-label="AROMATICA"
          className="login-monogram pointer-events-none relative z-10 w-[45%] select-none"
        />
      </div>

      {/* на узком экране левой панели нет, монограмма стоит над формой */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm rounded-[22px] border border-glass-line bg-glass p-8 shadow-soft backdrop-blur-xl backdrop-saturate-150">
          <span
            role="img"
            aria-label="AROMATICA"
            className="login-monogram mx-auto mb-6 block w-20 lg:hidden"
          />
          <p className="brand-eyebrow mb-6 whitespace-nowrap text-base tracking-[0.16em] text-foreground/90 sm:text-lg sm:tracking-brand">
            Aromatica Boutique
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              auth.mutate()
            }}
          >
            <div className="relative">
              <UserRound
                aria-hidden
                className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-muted-foreground"
                strokeWidth={1.6}
              />
              <Input
                className="h-11 pl-11"
                aria-label="Логин"
                required
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="relative">
              <LockKeyhole
                aria-hidden
                className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-muted-foreground"
                strokeWidth={1.6}
              />
              <Input
                aria-label="Пароль"
                required
                className="h-11 pl-11 pr-12"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {auth.isError && (
              <ErrorNote
                error={
                  auth.error instanceof UnauthorizedError ? 'Неверный логин или пароль' : 'Сервер недоступен'
                }
              />
            )}
            <Button type="submit" className="h-11 w-full" disabled={auth.isPending}>
              {auth.isPending ? <ButtonSpinner /> : 'Войти'}
            </Button>
            <button
              type="button"
              onClick={() => setForgot((v) => !v)}
              className="mx-auto block text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Забыли пароль?
            </button>
            {forgot && (
              <p className="text-center text-xs text-muted-foreground">
                Пароль сбрасывает администратор магазина — обратитесь к нему.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
