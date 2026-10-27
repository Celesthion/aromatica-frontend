import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button, Card } from '@/shared/ui'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <Card className="w-full max-w-md space-y-5 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl">Страница не найдена</h1>
        <p className="text-sm text-muted-foreground">Проверьте адрес или вернитесь на главную.</p>
        <Button asChild>
          <Link to="/admin">
            <ArrowLeft />
            На главную
          </Link>
        </Button>
      </Card>
    </div>
  )
}

export function RouteErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="grid min-h-[60vh] place-items-center p-6">
      <Card className="w-full max-w-md space-y-5 p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-brand-bad" />
        <h1 className="text-2xl">Не удалось открыть страницу</h1>
        <p className="text-sm text-muted-foreground">Попробуйте загрузить её ещё раз.</p>
        <Button onClick={reset}>Повторить</Button>
      </Card>
    </div>
  )
}
