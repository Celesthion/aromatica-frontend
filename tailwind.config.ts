import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // семантическая палитра: CSS-переменные тёмной темы и запасные значения для светлой
        brand: {
          green: 'rgb(var(--brand-green, 58 61 68) / <alpha-value>)', // акцент: днём графит, ночью шампань
          'green-dark': 'rgb(var(--brand-green-dark, 43 45 51) / <alpha-value>)', // тёмный стоп градиента
          cream: 'rgb(var(--brand-cream, 244 245 247) / <alpha-value>)', // светлый текст на тёмных пилюлях
          ink: 'rgb(var(--brand-ink, 43 45 51) / <alpha-value>)',
          slate: 'rgb(var(--brand-slate, 127 140 164) / <alpha-value>)', // прохладный сине-серый акцент
          // слейт от светлого к плотному: подписи на тёмном, чипы, акценты, диаграммы
          'slate-soft': 'rgb(var(--brand-slate-soft, 154 166 188) / <alpha-value>)',
          'slate-deep': 'rgb(var(--brand-slate-deep, 107 119 145) / <alpha-value>)',
          'slate-mist': 'rgb(var(--brand-slate-mist, 179 189 208) / <alpha-value>)',
          'slate-pale': 'rgb(var(--brand-slate-pale, 194 199 209) / <alpha-value>)',
          'slate-fog': 'rgb(var(--brand-slate-fog, 205 210 219) / <alpha-value>)',
          // графит: тёмные карты и панели
          'graphite-panel': 'rgb(var(--brand-graphite-panel, 48 50 58) / <alpha-value>)',
          'graphite-ink': 'rgb(var(--brand-graphite-ink, 31 33 38) / <alpha-value>)',
          // статусы; *-soft: та же роль на тёмной подложке, где базовый цвет теряется
          good: 'rgb(var(--brand-good, 74 156 120) / <alpha-value>)',
          'good-soft': 'rgb(var(--brand-good-soft, 149 220 185) / <alpha-value>)',
          'good-bright': 'rgb(var(--brand-good-bright, 95 190 149) / <alpha-value>)',
          'good-deep': 'rgb(var(--brand-good-deep, 93 138 114) / <alpha-value>)',
          warn: 'rgb(var(--brand-warn, 197 138 58) / <alpha-value>)',
          'warn-soft': 'rgb(var(--brand-warn-soft, 224 184 120) / <alpha-value>)',
          bad: 'rgb(var(--brand-bad, 192 96 79) / <alpha-value>)',
          'bad-soft': 'rgb(var(--brand-bad-soft, 221 160 147) / <alpha-value>)',
        },
        // подложки превью товара и KPI-полосок, парами для градиентов; не статусы
        tint: {
          bottle: 'rgb(var(--tint-bottle, 231 234 240) / <alpha-value>)',
          'bottle-deep': 'rgb(var(--tint-bottle-deep, 215 220 230) / <alpha-value>)',
          pack: 'rgb(var(--tint-pack, 228 236 232) / <alpha-value>)',
          'pack-deep': 'rgb(var(--tint-pack-deep, 207 224 214) / <alpha-value>)',
          pour: 'rgb(var(--tint-pour, 239 230 220) / <alpha-value>)',
          'pour-deep': 'rgb(var(--tint-pour-deep, 227 211 192) / <alpha-value>)',
          slate: 'rgb(var(--tint-slate, 170 179 198) / <alpha-value>)',
          steel: 'rgb(var(--tint-steel, 143 155 179) / <alpha-value>)',
          green: 'rgb(var(--tint-green, 158 196 176) / <alpha-value>)',
          'green-deep': 'rgb(var(--tint-green-deep, 111 156 133) / <alpha-value>)',
          amber: 'rgb(var(--tint-amber, 216 180 138) / <alpha-value>)',
          'amber-deep': 'rgb(var(--tint-amber-deep, 185 138 84) / <alpha-value>)',
          gold: 'rgb(var(--tint-gold, 220 192 138) / <alpha-value>)',
        },
        // стекло и поверхности: значения задаёт тема (src/app/styles/index.css)
        glass: {
          DEFAULT: 'var(--glass)',
          strong: 'var(--glass-strong)',
          line: 'var(--glass-line)',
          // кромка плавающих панелей заметнее обычной, иначе стекло над стеклом сливается с фоном
          edge: 'var(--glass-edge)',
          // подложка плавающих панелей почти непрозрачная: под ними и так затемнение
          panel: 'var(--glass-panel)',
          // тихое стекло невыбранных пунктов меню: почти без заливки, кромка едва видна
          quiet: 'var(--glass-quiet)',
          'line-quiet': 'var(--glass-line-quiet)',
          hover: 'var(--glass-hover)',
          field: 'var(--glass-field)',
        },
        // главное действие (Button default): заливка и кромка берутся через var() в классах кнопки
        cta: { ink: 'var(--cta-ink)' },
        // активный пункт меню: три стопа металла, как у главной кнопки; текст active-ink
        nav: {
          active: 'rgb(var(--nav-active, 58 61 68) / <alpha-value>)',
          'active-light': 'rgb(var(--nav-active-light, 78 82 92) / <alpha-value>)',
          'active-dark': 'rgb(var(--nav-active-dark, 43 45 51) / <alpha-value>)',
          'active-ink': 'rgb(var(--nav-active-ink, 255 255 255) / <alpha-value>)',
        },
        surface: {
          from: 'var(--surface-from)',
          to: 'var(--surface-to)',
          // тёмные акцентные карты: в светлой теме графит, в тёмной плотное стекло
          'accent-from': 'var(--surface-accent-from)',
          'accent-to': 'var(--surface-accent-to)',
        },
        sheet: { from: 'var(--sheet-from)', to: 'var(--sheet-to)', line: 'var(--sheet-line)' },
        // токены shadcn: CSS-переменные из src/app/styles/index.css
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: 'hsl(var(--popover))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        // гарнитура логотипа с кыргызскими буквами: капители и подписи бренда, остальной текст системный
        brand: ['"Tenor Sans"', 'system-ui', 'sans-serif'],
        display: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        brand: '0.22em',
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 8px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      boxShadow: {
        // мягкие слоистые тени и верхняя световая грань (inset); значения задаёт тема
        soft: 'var(--shadow-soft)',
        'soft-sm': 'var(--shadow-soft-sm)',
        sheet: 'var(--shadow-sheet)',
      },
      keyframes: {
        // плиты за монограммой на входе: медленный оборот из своего наклона
        orbit: { from: { transform: 'rotate(-25deg)' }, to: { transform: 'rotate(335deg)' } },
        'orbit-back': { from: { transform: 'rotate(20deg)' }, to: { transform: 'rotate(-340deg)' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        orbit: 'orbit 90s linear infinite',
        'orbit-back': 'orbit-back 120s linear infinite',
      },
    },
  },
  // нужен не ради анимаций: его duration-* задаёт и animation-duration, спиннер в кнопке крутится за 0.3 с
  plugins: [tailwindcssAnimate],
}

export default config
