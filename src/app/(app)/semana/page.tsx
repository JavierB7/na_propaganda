import type { Metadata } from 'next'
import { lineas, piezasParaSemana, registrosDeSemana } from '@/datos/consultas'
import { armarSemana, progresoDeSemana } from '@/dominio/semanaDeTrabajo'
import { esLunes, semanaActual, lunesDe } from '@/dominio/semana'
import { NavegadorDeSemana } from '@/componentes/NavegadorDeSemana'
import { Captura } from './captura'

export const metadata: Metadata = { title: 'Registrar la semana · Bitácora' }

export default async function PaginaSemana({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const { s } = await searchParams

  // Cualquier fecha se normaliza a su lunes; sin parámetro, la semana en curso.
  const semanaInicio = s && esLunes(s) ? s : s ? lunesDe(s) : semanaActual()

  const [todasLasLineas, piezas, registros] = await Promise.all([
    lineas({ soloActivas: true }),
    piezasParaSemana(semanaInicio),
    registrosDeSemana(semanaInicio),
  ])

  const semana = armarSemana(todasLasLineas, piezas, registros)
  const progreso = progresoDeSemana(semana)

  return (
    <>
      <NavegadorDeSemana semana={semanaInicio} ruta="/semana" />
      <Captura
        key={semanaInicio}
        semanaInicio={semanaInicio}
        semana={semana}
        progreso={progreso}
      />
    </>
  )
}
