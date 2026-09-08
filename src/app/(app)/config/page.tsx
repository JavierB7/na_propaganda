import type { Metadata } from 'next'
import { lineas } from '@/datos/consultas'
import { Pestanias } from './pestanias'
import { NuevaLinea, FichaDeLinea } from './lineas'
import estilos from './config.module.css'

export const metadata: Metadata = { title: 'Líneas · Bitácora' }

export default async function PaginaLineas() {
  const todas = await lineas()

  return (
    <>
      <h1 className={estilos.titulo}>Configuración</h1>
      <Pestanias />

      <p className={estilos.intro}>
        Las líneas que sembramos salen de la conversación con Carlos, y pueden
        estar incompletas. Agregá las que falten y ajustá su unidad de éxito.
      </p>

      <section className={estilos.seccion}>
        <h2 className={estilos.subtitulo}>Líneas registradas</h2>
        {todas.length === 0 ? (
          <p className={estilos.vacio}>
            Todavía no hay líneas. Creá la primera abajo.
          </p>
        ) : (
          todas.map((linea) => <FichaDeLinea key={linea.id} linea={linea} />)
        )}
      </section>

      <section className={estilos.seccion}>
        <h2 className={estilos.subtitulo}>Agregar una línea</h2>
        <NuevaLinea />
      </section>
    </>
  )
}
