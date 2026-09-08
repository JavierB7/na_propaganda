'use server'

import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { exigirAutorizacion } from '@/lib/sesion'
import { esLunes } from '@/dominio/semana'
import { registrosDeSemana } from '@/datos/consultas'

/**
 * Guardado de la semana completa en una sola operación.
 *
 * Reglas que este módulo hace cumplir, además de las que impone la base de
 * datos:
 *
 * - Nunca se bloquea por campos vacíos. Vacío es dato no disponible.
 * - Una entrada sin ninguna cifra no crea fila. Si ya existía, se elimina:
 *   vaciar todos los campos es la forma de deshacer un registro, y así el
 *   progreso de la semana no cuenta filas sin contenido.
 */

export type EntradaDeCaptura = {
  lineaId: string
  /** Nulo = total agregado de la línea. */
  piezaId: string | null
  reproducciones: string
  mensajesMeta: string
  consultasComentarios: string
  inversionUsdDia: string
  diasActivos: string
}

export type ResultadoGuardado =
  | { ok: true; guardadas: number; eliminadas: number }
  | { ok: false; error: string }

/** Texto de un campo numérico a número, o `null` si viene vacío. */
function aNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return null

  const valor = Number(limpio)
  if (!Number.isFinite(valor) || valor < 0) return null

  return valor
}

type Metricas = {
  reproducciones: number | null
  mensajes_meta: number | null
  consultas_comentarios: number | null
  inversion_usd_dia: number | null
  dias_activos: number | null
}

function metricasDe(entrada: EntradaDeCaptura): Metricas {
  return {
    reproducciones: aNumero(entrada.reproducciones),
    mensajes_meta: aNumero(entrada.mensajesMeta),
    consultas_comentarios: aNumero(entrada.consultasComentarios),
    inversion_usd_dia: aNumero(entrada.inversionUsdDia),
    dias_activos: aNumero(entrada.diasActivos),
  }
}

function vacia(metricas: Metricas): boolean {
  return Object.values(metricas).every((valor) => valor === null)
}

export async function guardarSemana(
  semana: string,
  entradas: EntradaDeCaptura[],
): Promise<ResultadoGuardado> {
  await exigirAutorizacion()

  if (!esLunes(semana)) {
    return {
      ok: false,
      error: 'La semana debe empezar en lunes. Volvé a elegirla con las flechas.',
    }
  }

  const supabase = await crearClienteServidor()
  const existentes = await registrosDeSemana(semana)

  const claveDe = (lineaId: string, piezaId: string | null) => `${lineaId}|${piezaId ?? ''}`
  const porClave = new Map(
    existentes.map((registro) => [claveDe(registro.linea_id, registro.pieza_id), registro]),
  )

  const porInsertar: (Metricas & {
    linea_id: string
    pieza_id: string | null
    semana_inicio: string
  })[] = []
  const porActualizar: { id: string; metricas: Metricas }[] = []
  const porEliminar: string[] = []

  for (const entrada of entradas) {
    const metricas = metricasDe(entrada)
    const existente = porClave.get(claveDe(entrada.lineaId, entrada.piezaId))

    if (vacia(metricas)) {
      // Vaciar todos los campos deshace el registro.
      if (existente) porEliminar.push(existente.id)
      continue
    }

    if (existente) {
      porActualizar.push({ id: existente.id, metricas })
    } else {
      porInsertar.push({
        linea_id: entrada.lineaId,
        pieza_id: entrada.piezaId,
        semana_inicio: semana,
        ...metricas,
      })
    }
  }

  // Las eliminaciones van primero: pasar de agregado a desglose exige que el
  // agregado desaparezca antes de insertar las piezas.
  if (porEliminar.length > 0) {
    const { error } = await supabase.from('registro_semanal').delete().in('id', porEliminar)
    if (error) return { ok: false, error: mensajeDeError(error.message) }
  }

  for (const { id, metricas } of porActualizar) {
    const { error } = await supabase.from('registro_semanal').update(metricas).eq('id', id)
    if (error) return { ok: false, error: mensajeDeError(error.message) }
  }

  if (porInsertar.length > 0) {
    const { error } = await supabase.from('registro_semanal').insert(porInsertar)
    if (error) return { ok: false, error: mensajeDeError(error.message) }
  }

  revalidatePath('/semana')
  revalidatePath('/resumen')

  return {
    ok: true,
    guardadas: porActualizar.length + porInsertar.length,
    eliminadas: porEliminar.length,
  }
}

/**
 * Traduce el error de Postgres a algo que diga qué pasó y cómo resolverlo.
 * Los mensajes de los triggers ya vienen redactados para el usuario.
 */
function mensajeDeError(mensaje: string): string {
  if (mensaje.includes('registros por pieza')) {
    return 'Esta línea ya tiene registros por pieza en la semana. Un total de línea sumado a sus piezas contaría doble.'
  }
  if (mensaje.includes('total agregado')) {
    return 'Esta línea ya tiene un total de línea en la semana. Vaciá ese total antes de registrar por pieza.'
  }
  if (mensaje.includes('registro_pieza_semana_unico')) {
    return 'Alguien guardó esta misma pieza y semana mientras registrabas. Recargá la semana y revisá las cifras antes de guardar.'
  }
  if (mensaje.includes('registro_linea_semana_agregado_unico')) {
    return 'Alguien guardó el total de esta línea mientras registrabas. Recargá la semana y revisá las cifras.'
  }
  if (mensaje.includes('registro_semana_es_lunes')) {
    return 'La semana debe empezar en lunes. Volvé a elegirla con las flechas.'
  }
  return `No se pudo guardar: ${mensaje}`
}
