import type { Metadata, Viewport } from 'next'
import { Literata, Instrument_Sans } from 'next/font/google'
import './globales.css'

/*
 * Dos familias, claramente distintas.
 *
 * Literata carga las cifras y los títulos: es una serif de lectura, con
 * serifas algo slab y numerales tabulares reales. Instrument Sans carga la
 * interfaz. Los fallbacks de `globales.css` son caras reales, no `serif` y
 * `sans-serif` a secas, para que una carga fallida no cambie la métrica.
 */

const literata = Literata({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '600'],
  variable: '--fuente-serif',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--fuente-sans',
})

export const metadata: Metadata = {
  title: 'Bitácora de Difusión',
  description:
    'Registro semanal de publicidad del área de difusión de Nueva Acrópolis San Cristóbal',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00453D',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${literata.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
