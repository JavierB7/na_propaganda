import Image from 'next/image'
import Link from 'next/link'
import { exigirAutorizacion } from '@/lib/sesion'
import { salir } from '@/acciones/acceso'
import { Navegacion } from './navegacion'
import estilos from './cascaron.module.css'

/**
 * Todo lo que vive bajo este layout exige sesión y autorización. La
 * autorización la responde la base de datos, con la misma función que
 * sostiene las políticas.
 */
export default async function CascaronApp({
  children,
}: {
  children: React.ReactNode
}) {
  await exigirAutorizacion()

  return (
    <>
      <header className={estilos.barra}>
        <div className={estilos.barraInterior}>
          <Link href="/semana" className={estilos.marca}>
            <Image
              className={estilos.monograma}
              src="/monograma-na.png"
              alt="Nueva Acrópolis"
              width={1921}
              height={796}
              priority
            />
            <span className={estilos.nombre}>Bitácora</span>
          </Link>

          <Navegacion />

          <form action={salir} className={estilos.formSalir}>
            <button className={estilos.salir} type="submit">
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className={estilos.pagina}>{children}</main>
    </>
  )
}
