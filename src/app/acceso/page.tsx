import Image from 'next/image'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { sesionActual } from '@/lib/sesion'
import { FormularioDeAcceso } from './formulario'
import estilos from './acceso.module.css'

export const metadata: Metadata = { title: 'Entrar · Bitácora de Difusión' }

const AVISOS: Record<string, string> = {
  'enlace-invalido': 'Ese enlace no traía la información necesaria. Puedes solicitar uno nuevo.',
  'enlace-vencido':
    'El enlace ya venció o se usó. Cada enlace sirve una sola vez; puedes solicitar uno nuevo.',
}

export default async function Acceso({
  searchParams,
}: {
  searchParams: Promise<{ destino?: string; estado?: string }>
}) {
  const { destino, estado } = await searchParams

  if (await sesionActual()) redirect('/semana')

  const aviso = estado ? AVISOS[estado] : undefined

  return (
    <main className={estilos.pantalla}>
      <div className={estilos.tarjeta}>
        <Image
          className={estilos.insignia}
          src="/logo-na-sancristobal.png"
          alt="Nueva Acrópolis Venezuela, San Cristóbal"
          width={900}
          height={900}
          priority
        />

        <h1 className={estilos.titulo}>Bitácora de Difusión</h1>
        <p className={estilos.sub}>
          El registro semanal de la publicidad del área.
        </p>

        {aviso && <p className={estilos.aviso}>{aviso}</p>}

        <FormularioDeAcceso destino={destino ?? '/semana'} />

        <p className={estilos.pie}>
          No hay contraseña. Te llega un enlace al correo y con eso puedes
          iniciar sesión.
        </p>
      </div>
    </main>
  )
}
