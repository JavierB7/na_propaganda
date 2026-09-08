import type { Metadata } from 'next'
import Link from 'next/link'
import { lineas, piezas } from '@/datos/consultas'
import { hoy } from '@/dominio/semana'
import { Pestanias } from '../pestanias'
import { NuevaPieza, FichaDePieza } from './piezas'
import estilos from '../config.module.css'

export const metadata: Metadata = { title: 'Piezas · Bitácora' }

export default async function PaginaPiezas() {
  const [todasLasLineas, todasLasPiezas] = await Promise.all([lineas(), piezas()])
  const activas = todasLasLineas.filter((linea) => linea.activo)

  return (
    <>
      <h1 className={estilos.titulo}>Configuración</h1>
      <Pestanias />

      <p className={estilos.intro}>
        Cada pieza recibe un código del sistema y no cambia nunca. Es lo que
        permite seguir un video en el tiempo en lugar de nombrarlo de memoria.
      </p>

      {activas.length === 0 ? (
        <p className={estilos.vacio}>
          No hay líneas activas. <Link href="/config">Creá o activá una línea</Link>{' '}
          antes de agregar piezas.
        </p>
      ) : (
        <>
          <section className={estilos.seccion}>
            <h2 className={estilos.subtitulo}>Agregar una pieza</h2>
            <NuevaPieza lineas={activas} hoy={hoy()} />
          </section>

          <section className={estilos.seccion}>
            <h2 className={estilos.subtitulo}>Piezas registradas</h2>

            {todasLasPiezas.length === 0 ? (
              <p className={estilos.vacio}>
                Todavía no hay piezas. Creá la primera arriba, o registrá solo el
                total de cada línea en la pantalla de la semana.
              </p>
            ) : (
              todasLasLineas.map((linea) => {
                const suyas = todasLasPiezas.filter((pieza) => pieza.linea_id === linea.id)
                if (suyas.length === 0) return null

                return (
                  <div className={estilos.grupoLinea} key={linea.id}>
                    <h3 className={estilos.nombreGrupo}>{linea.nombre}</h3>
                    {suyas.map((pieza) => (
                      <FichaDePieza key={pieza.id} pieza={pieza} />
                    ))}
                  </div>
                )
              })
            )}
          </section>
        </>
      )}
    </>
  )
}
