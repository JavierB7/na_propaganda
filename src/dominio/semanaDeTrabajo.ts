/**
 * Forma de una semana: qué se espera registrar, qué hay registrado, y cómo
 * se agrupa para presentarlo.
 *
 * Este módulo es puro. No sabe de Supabase ni de React: recibe filas y
 * devuelve la estructura que la interfaz dibuja.
 */

import { totalDeRegistro, totalDeRegistros } from '@/dominio/totales'
import type { Linea, Pieza, RegistroSemanal } from '@/lib/supabase/tipos'

/**
 * Cómo está registrada una línea en una semana.
 *
 * `desglose` y `agregado` son mutuamente excluyentes: la base de datos lo
 * garantiza, porque un agregado sumado a sus piezas contaría doble.
 */
export type ModoDeLinea = 'desglose' | 'agregado' | 'vacio'

export type FilaDePieza = {
  pieza: Pieza
  registro: RegistroSemanal | null
}

export type LineaDeLaSemana = {
  linea: Linea
  modo: ModoDeLinea
  /** Piezas activas de la línea, con su registro de la semana si existe. */
  piezas: FilaDePieza[]
  /** El registro agregado de la línea, cuando el modo es `agregado`. */
  agregado: RegistroSemanal | null
  /** Total de mensajes de la línea, o `null` si no hay dato. */
  total: number | null
  /**
   * Si se puede ofrecer la captura del total agregado. Falso cuando ya hay
   * registros por pieza en esta semana.
   */
  permiteAgregado: boolean
}

export type Progreso = {
  esperadas: number
  registradas: number
  completa: boolean
}

/**
 * Arma la semana a partir de las líneas activas, sus piezas activas y los
 * registros de esa semana.
 *
 * Las piezas inactivas que tengan registro en la semana también se incluyen:
 * desactivar una pieza no debe esconder lo que ya se midió.
 */
export function armarSemana(
  lineas: readonly Linea[],
  piezas: readonly Pieza[],
  registros: readonly RegistroSemanal[],
): LineaDeLaSemana[] {
  const registrosPorPieza = new Map<string, RegistroSemanal>()
  const agregadoPorLinea = new Map<string, RegistroSemanal>()

  for (const registro of registros) {
    if (registro.pieza_id === null) {
      agregadoPorLinea.set(registro.linea_id, registro)
    } else {
      registrosPorPieza.set(registro.pieza_id, registro)
    }
  }

  return lineas
    .slice()
    .sort(porOrden)
    .map((linea) => {
      const piezasDeLinea = piezas
        .filter(
          (pieza) =>
            pieza.linea_id === linea.id &&
            (pieza.activo || registrosPorPieza.has(pieza.id)),
        )
        .sort(porFechaDescendente)
        .map((pieza) => ({
          pieza,
          registro: registrosPorPieza.get(pieza.id) ?? null,
        }))

      const conRegistro = piezasDeLinea.filter((fila) => fila.registro !== null)
      const agregado = agregadoPorLinea.get(linea.id) ?? null

      const modo: ModoDeLinea =
        conRegistro.length > 0 ? 'desglose' : agregado ? 'agregado' : 'vacio'

      const total =
        modo === 'desglose'
          ? totalDeRegistros(conRegistro.map((fila) => fila.registro!))
          : agregado
            ? totalDeRegistro(agregado)
            : null

      return {
        linea,
        modo,
        piezas: piezasDeLinea,
        agregado,
        total,
        // Ofrecer el agregado cuando no hay piezas ya registradas. La
        // interfaz no debe invitar a lo que la base de datos va a rechazar.
        permiteAgregado: conRegistro.length === 0,
      }
    })
}

/**
 * Unidades esperadas de la semana: cada pieza activa cuenta una, y cada
 * línea activa sin piezas activas cuenta una (su total agregado).
 *
 * Es la señal de si la semana está completa, y el sustituto de repasar el
 * cuaderno para ver qué falta.
 */
export function progresoDeSemana(semana: readonly LineaDeLaSemana[]): Progreso {
  let esperadas = 0
  let registradas = 0

  for (const grupo of semana) {
    const piezasActivas = grupo.piezas.filter((fila) => fila.pieza.activo)

    if (piezasActivas.length > 0) {
      esperadas += piezasActivas.length
      registradas += piezasActivas.filter((fila) => fila.registro !== null).length
    } else if (grupo.linea.activo) {
      esperadas += 1
      if (grupo.agregado !== null) registradas += 1
    }
  }

  return {
    esperadas,
    registradas,
    completa: esperadas > 0 && registradas === esperadas,
  }
}

/** Total de mensajes por línea, indexado por id de línea. */
export function totalesPorLinea(
  registros: readonly RegistroSemanal[],
): Map<string, number | null> {
  const porLinea = new Map<string, RegistroSemanal[]>()

  for (const registro of registros) {
    const acumulado = porLinea.get(registro.linea_id)
    if (acumulado) {
      acumulado.push(registro)
    } else {
      porLinea.set(registro.linea_id, [registro])
    }
  }

  const totales = new Map<string, number | null>()
  for (const [lineaId, filas] of porLinea) {
    totales.set(lineaId, totalDeRegistros(filas))
  }

  return totales
}

function porOrden(a: Linea, b: Linea): number {
  return a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es')
}

function porFechaDescendente(a: Pieza, b: Pieza): number {
  return b.fecha_subida.localeCompare(a.fecha_subida) || a.codigo.localeCompare(b.codigo)
}
