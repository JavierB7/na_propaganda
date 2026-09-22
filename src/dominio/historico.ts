/**
 * Interpretación de un archivo histórico.
 *
 * La historia disponible en el cuaderno cubre enero a agosto de 2026 y solo a
 * nivel de línea: no existe desglose por pieza. Y el cuaderno conserva la
 * cifra final ya sumada, no sus partes — por eso el total va a
 * `mensajes_total_reportado` y no a `mensajes_meta`, que registraría como
 * dato de Meta algo que Meta no dijo.
 *
 * Módulo puro: valida y traduce, no escribe.
 */

import { leerCsv, numeroDeCelda, normalizarClave, type FilaCruda } from '@/dominio/csv'
import { esLunes, lunesDe } from '@/dominio/semana'

export type FilaHistorica = {
  numero: number
  lineaId: string
  lineaNombre: string
  semanaInicio: string
  /** Verdadero si la semana del archivo no era lunes y se movió a su lunes. */
  semanaNormalizada: boolean
  mensajesTotalReportado: number | null
  reproducciones: number | null
  /** Gasto de la semana según Meta, no un valor por día. */
  inversionUsd: number | null
  diasActivos: number | null
  nota: string | null
}

export type FilaRechazada = {
  numero: number
  motivo: string
  contenido: string
}

export type LecturaHistorica = {
  validas: FilaHistorica[]
  rechazadas: FilaRechazada[]
  /** Problemas del archivo en conjunto, que no invalidan ninguna fila. */
  avisos: string[]
}

export const COLUMNAS_HISTORICO = [
  'linea',
  'semana',
  'mensajes',
  'reproducciones',
  'inversion_usd',
  'dias_activos',
  'nota',
] as const

/** Nombres alternativos aceptados por columna. */
const ALIAS: Record<string, string> = {
  linea: 'linea',
  line: 'linea',
  curso: 'linea',
  semana: 'semana',
  semana_inicio: 'semana',
  fecha: 'semana',
  lunes: 'semana',
  mensajes: 'mensajes',
  msg: 'mensajes',
  total: 'mensajes',
  mensajes_total: 'mensajes',
  mensajes_total_reportado: 'mensajes',
  escribieron: 'mensajes',
  reproducciones: 'reproducciones',
  visitas: 'reproducciones',
  visualizaciones: 'reproducciones',
  inversion: 'inversion_usd',
  inversion_usd: 'inversion_usd',
  gasto: 'inversion_usd',
  importe_gastado: 'inversion_usd',
  dias: 'dias_activos',
  dias_activos: 'dias_activos',
  nota: 'nota',
  observacion: 'nota',
  comentario: 'nota',
}

/**
 * Encabezados de inversión por día. Ya no se aceptan: la inversión es el
 * gasto de la semana. Se avisa en lugar de ignorarlos en silencio, para que
 * el dato no se pierda sin que nadie lo note.
 */
const INVERSION_POR_DIA = ['inversion_usd_dia', 'usd_dia', 'inversion_dia']

function canonica(fila: FilaCruda): FilaCruda {
  const salida: FilaCruda = {}
  for (const [clave, valor] of Object.entries(fila)) {
    const destino = ALIAS[clave]
    if (destino && salida[destino] === undefined) salida[destino] = valor
  }
  return salida
}

/**
 * Interpreta el archivo contra el catálogo de líneas existente.
 *
 * Las líneas se resuelven por nombre, sin distinguir acentos ni mayúsculas,
 * porque el archivo lo escribe una persona a partir del cuaderno.
 */
export function leerHistorico(
  texto: string,
  lineas: readonly { id: string; nombre: string }[],
): LecturaHistorica {
  const { encabezados, filas } = leerCsv(texto)

  const avisos: string[] = []
  const porDia = encabezados.find((encabezado) => INVERSION_POR_DIA.includes(encabezado))
  if (porDia) {
    avisos.push(
      `La columna "${porDia}" no se cargó: la inversión se espera como el gasto de la semana, en una columna "inversion".`,
    )
  }

  const porNombre = new Map(
    lineas.map((linea) => [normalizarClave(linea.nombre), linea]),
  )

  const validas: FilaHistorica[] = []
  const rechazadas: FilaRechazada[] = []
  const vistas = new Map<string, number>()

  filas.forEach((cruda, indice) => {
    // +2: la primera fila del archivo son los encabezados.
    const numero = indice + 2
    const fila = canonica(cruda)
    const contenido = Object.values(cruda).filter(Boolean).join(', ')

    const nombreLinea = (fila['linea'] ?? '').trim()
    if (!nombreLinea) {
      rechazadas.push({
        numero,
        motivo: 'La fila no indica a qué línea pertenece.',
        contenido,
      })
      return
    }

    const linea = porNombre.get(normalizarClave(nombreLinea))
    if (!linea) {
      rechazadas.push({
        numero,
        motivo: `No existe una línea llamada "${nombreLinea}". Puedes crearla en configuración o corregir el nombre.`,
        contenido,
      })
      return
    }

    const fechaCruda = (fila['semana'] ?? '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaCruda)) {
      rechazadas.push({
        numero,
        motivo: 'La semana debe venir como AAAA-MM-DD.',
        contenido,
      })
      return
    }

    let semanaInicio: string
    try {
      semanaInicio = lunesDe(fechaCruda)
    } catch {
      rechazadas.push({ numero, motivo: `La fecha ${fechaCruda} no existe.`, contenido })
      return
    }

    const mensajes = numeroDeCelda(fila['mensajes'])
    const reproducciones = numeroDeCelda(fila['reproducciones'])
    const inversion = numeroDeCelda(fila['inversion_usd'])
    const dias = numeroDeCelda(fila['dias_activos'])

    // Una fila sin ninguna cifra no aporta nada, y crearla haría que una
    // semana sin dato apareciera como registrada.
    if (mensajes === null && reproducciones === null && inversion === null && dias === null) {
      rechazadas.push({
        numero,
        motivo:
          'La fila no trae ninguna cifra. Una fila vacía haría ver la semana como registrada.',
        contenido,
      })
      return
    }

    if (dias !== null && dias > 7) {
      rechazadas.push({
        numero,
        motivo: `La fila indica ${dias} días activos. Una semana tiene como máximo siete.`,
        contenido,
      })
      return
    }

    const llave = `${linea.id}|${semanaInicio}`
    const anterior = vistas.get(llave)
    if (anterior !== undefined) {
      rechazadas.push({
        numero,
        motivo: `Repite la línea ${linea.nombre} en la semana del ${semanaInicio}, ya cargada en la fila ${anterior}.`,
        contenido,
      })
      return
    }
    vistas.set(llave, numero)

    validas.push({
      numero,
      lineaId: linea.id,
      lineaNombre: linea.nombre,
      semanaInicio,
      semanaNormalizada: !esLunes(fechaCruda),
      mensajesTotalReportado: mensajes,
      reproducciones,
      inversionUsd: inversion,
      diasActivos: dias,
      nota: (fila['nota'] ?? '').trim() || null,
    })
  })

  return { validas, rechazadas, avisos }
}
