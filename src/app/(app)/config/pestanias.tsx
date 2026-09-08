'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import estilos from './config.module.css'

const PESTANIAS = [
  { href: '/config', texto: 'Líneas' },
  { href: '/config/piezas', texto: 'Piezas' },
  { href: '/config/historico', texto: 'Carga histórica' },
] as const

export function Pestanias() {
  const ruta = usePathname()

  return (
    <nav className={estilos.pestanias} aria-label="Configuración">
      {PESTANIAS.map((pestania) => {
        const activa = ruta === pestania.href
        return (
          <Link
            key={pestania.href}
            href={pestania.href}
            className={activa ? estilos.pestaniaActiva : estilos.pestania}
            aria-current={activa ? 'page' : undefined}
          >
            {pestania.texto}
          </Link>
        )
      })}
    </nav>
  )
}
