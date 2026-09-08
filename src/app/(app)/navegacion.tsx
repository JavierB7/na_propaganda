'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import estilos from './cascaron.module.css'

const SECCIONES = [
  { href: '/semana', texto: 'Registrar' },
  { href: '/resumen', texto: 'Resumen' },
  { href: '/config', texto: 'Configuración' },
] as const

export function Navegacion() {
  const ruta = usePathname()

  return (
    <nav className={estilos.navegacion} aria-label="Secciones">
      {SECCIONES.map((seccion) => {
        const activa = ruta === seccion.href || ruta.startsWith(`${seccion.href}/`)
        return (
          <Link
            key={seccion.href}
            href={seccion.href}
            className={activa ? estilos.enlaceActivo : estilos.enlace}
            aria-current={activa ? 'page' : undefined}
          >
            {seccion.texto}
          </Link>
        )
      })}
    </nav>
  )
}
