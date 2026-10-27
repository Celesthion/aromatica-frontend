import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'
import { CTA_FILL } from './cta'

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full',
    // подписи капсом с трекингом, как в логотипе, eyebrow и шапках таблиц
    'font-medium uppercase tracking-[0.08em]',
    'bg-no-repeat bg-left [background-size:0%_100%] hover:[background-size:100%_100%]',
    'transition-all duration-300 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    '[&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-300',
    '[&:hover_svg:last-child]:translate-x-0.5',
  ),
  {
    variants: {
      variant: {
        // главное действие на токенах cta-*; на hover пробегает блик (::before),
        // ведущая иконка стоит в круглом чипе
        default: cn(
          'relative overflow-hidden text-cta-ink ![background-size:100%_100%]',
          `${CTA_FILL} backdrop-blur-xl backdrop-saturate-150`,
          'shadow-[inset_0_0_0_1.5px_var(--cta-edge),inset_0_1px_0_0_rgba(255,255,255,0.3),0_10px_24px_-12px_rgba(0,0,0,0.5)]',
          'hover:shadow-[inset_0_0_0_1.5px_var(--cta-edge),inset_0_1px_0_0_rgba(255,255,255,0.45),0_14px_30px_-12px_rgba(0,0,0,0.6)]',
          'before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full',
          'before:bg-[linear-gradient(105deg,transparent_40%,rgba(255,250,235,0.45)_50%,transparent_60%)]',
          'before:transition-transform before:duration-700 before:ease-out hover:before:translate-x-full',
          '[&_svg:first-child]:relative [&_svg:first-child]:box-content [&_svg:first-child]:rounded-full [&_svg:first-child]:bg-white/25 [&_svg:first-child]:p-1',
        ),
        destructive: cn(
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_1px_2px_0_rgba(60,10,10,0.25),0_10px_24px_-10px_rgba(200,40,40,0.5)]',
          '[&_svg:first-child]:box-content [&_svg:first-child]:rounded-full [&_svg:first-child]:bg-white/20 [&_svg:first-child]:p-1',
        ),
        outline:
          'border border-foreground/20 bg-transparent bg-gradient-to-r from-foreground to-foreground hover:text-background',
        ghost: 'normal-case tracking-normal hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-5 text-[12px]',
        sm: 'h-7 px-3.5 text-[11px]',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'
