import type { Metadata } from 'next'
import { lineas } from '@/datos/consultas'
import { Pestanias } from './pestanias'
import { NuevaLinea, FichaDeLinea } from './lineas'
import estilos from './config.module.css'

export const metadata: Metadata = { title: 'Líneas · Bitácora' }

export default async function PaginaLineas() {
  const todas = await lineas()
  const activas = todas.filter((linea) => linea.activo).length

  return (
    <>
      <Pestanias />

      <h1 className={estilos.titulo}>Líneas de difusión</h1>
      <p className={estilos.intro}>
        Las cinco que están sembradas salen de la conversación con Carlos y
        pueden estar incompletas. Cada línea tiene su propia escala de éxito, así
        que nunca se comparan entre sí.
      </p>

      <section className={estilos.seccion}>
        <h2 className={estilos.subtitulo}>
          Registradas
          <span className={estilos.conteoGrupo}>
            {activas} {activas === 1 ? 'activa' : 'activas'}
            {todas.length > activas && ` · ${todas.length - activas} desactivadas`}
          </span>
        </h2>

        {todas.length === 0 ? (
          <p className={estilos.vacio}>
            Todavía no hay líneas. Crea la primera abajo para poder registrar.
          </p>
        ) : (
          todas.map((linea) => <FichaDeLinea key={linea.id} linea={linea} />)
        )}
      </section>

      <NuevaLinea />
    </>
  )
}
