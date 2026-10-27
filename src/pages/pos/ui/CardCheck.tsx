import { Check } from 'lucide-react'

export function CardCheck() {
  return (
    <span className="absolute -right-1.5 -top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow">
      <Check className="h-3 w-3" />
    </span>
  )
}
