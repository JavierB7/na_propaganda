import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { sesionActual } from '@/lib/sesion'
import { salir } from '@/acciones/acceso'
import estilos from '../acceso.module.css'

export const metadata: Metadata = { title: 'Sin acceso · Bitácora de Difusión' }

export default async function SinAcceso() {
  const sesion = await sesionActual()
  if (!sesion) redirect('/acceso')

  return (
    <main className={estilos.pantalla}>
      <div className={estilos.tarjeta}>
        <h1 className={estilos.titulo}>Esta cuenta no tiene acceso</h1>

        <p className={estilos.sub}>
          Entraste como <strong>{sesion.correo}</strong>, pero ese correo no
          está en la lista de acceso de la bitácora.
        </p>

        <p className={estilos.aviso}>
          Si te corresponde el acceso, solicita que agreguen tu correo a la
          lista. Si usas varios correos, puedes intentar con otro.
        </p>

        <form action={salir} className={estilos.formulario}>
          <button className={estilos.boton} type="submit">
            Salir e intentar con otro correo
          </button>
        </form>
      </div>
    </main>
  )
}
