import type { Metadata } from 'next'
import { lineas, piezasParaSemana, registrosDeSemanas } from '@/datos/consultas'
import {
  armarSemana,
  progresoDeSemana,
  totalesPorLinea,
  totalesPorPieza,
} from '@/dominio/semanaDeTrabajo'
import { esLunes, semanaActual, lunesDe, semanaAnterior } from '@/dominio/semana'
import { NavegadorDeSemana } from '@/componentes/NavegadorDeSemana'
import { Captura, type SemanaPrevia } from './captura'

export const metadata: Metadata = { title: 'Registrar la semana · Bitácora' }

export default async function PaginaSemana({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const { s } = await searchParams

  // Cualquier fecha se normaliza a su lunes; sin parámetro, la semana en curso.
  const semanaInicio = s && esLunes(s) ? s : s ? lunesDe(s) : semanaActual()

  const previa1 = semanaAnterior(semanaInicio)
  const previa2 = semanaAnterior(previa1)

  const [todasLasLineas, piezas, registros] = await Promise.all([
    lineas({ soloActivas: true }),
    piezasParaSemana(semanaInicio),
    registrosDeSemanas([semanaInicio, previa1, previa2]),
  ])

  const semana = armarSemana(
    todasLasLineas,
    piezas,
    registros.filter((r) => r.semana_inicio === semanaInicio),
  )

  // Contexto de solo lectura para la tabla de escritorio: se transcribe
  // mirando lo que se registró las dos semanas anteriores.
  const previas: SemanaPrevia[] = [previa1, previa2].map((semanaPrevia) => {
    const deEsaSemana = registros.filter((r) => r.semana_inicio === semanaPrevia)
    return {
      semana: semanaPrevia,
      porLinea: Object.fromEntries(totalesPorLinea(deEsaSemana)),
      porPieza: Object.fromEntries(totalesPorPieza(deEsaSemana)),
    }
  })
  const progreso = progresoDeSemana(semana)

  return (
    <>
      <NavegadorDeSemana semana={semanaInicio} ruta="/semana" />
      <Captura
        key={semanaInicio}
        semanaInicio={semanaInicio}
        semana={semana}
        progreso={progreso}
        previas={previas}
      />
    </>
  )
}
