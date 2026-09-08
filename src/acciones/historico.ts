'use server'

import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { exigirAutorizacion } from '@/lib/sesion'
import { lineas, registrosDeSemanas } from '@/datos/consultas'
import { leerHistorico, type FilaRechazada } from '@/dominio/historico'

/**
 * Carga histórica a nivel de línea.
 *
 * Superficie de escritorio y aparte de la captura semanal: transcribir ocho
 * meses desde un teléfono no va a ocurrir. Y no bloquea el lanzamiento —
 * esperar el inventario del cuaderno mantendría a Carlos en papel un mes más
 * sin razón.
 *
 * Una fila cuya línea y semana ya tienen registros se rechaza y se reporta;
 * el resto se carga. Nunca se sobrescribe lo capturado.
 */

export type ResultadoCarga =
  | { ok: true; cargadas: number; rechazadas: FilaRechazada[]; normalizadas: number }
  | { ok: false; error: string }

export async function cargarHistorico(texto: string): Promise<ResultadoCarga> {
  await exigirAutorizacion()

  if (!texto.trim()) {
    return { ok: false, error: 'El archivo llegó vacío. Elegí un CSV con datos.' }
  }

  const catalogo = await lineas()
  const { validas, rechazadas } = leerHistorico(texto, catalogo)

  if (validas.length === 0) {
    return { ok: true, cargadas: 0, rechazadas, normalizadas: 0 }
  }

  // Se consultan solo las semanas que el archivo toca.
  const semanas = [...new Set(validas.map((fila) => fila.semanaInicio))]
  const existentes = await registrosDeSemanas(semanas)

  const ocupadas = new Set(
    existentes.map((registro) => `${registro.linea_id}|${registro.semana_inicio}`),
  )

  const rechazadasTotal = [...rechazadas]
  const porInsertar = []

  for (const fila of validas) {
    if (ocupadas.has(`${fila.lineaId}|${fila.semanaInicio}`)) {
      rechazadasTotal.push({
        numero: fila.numero,
        motivo: `${fila.lineaNombre} ya tiene registros en la semana del ${fila.semanaInicio}. No se sobrescribe lo que ya está cargado.`,
        contenido: `${fila.lineaNombre}, ${fila.semanaInicio}`,
      })
      continue
    }

    porInsertar.push({
      linea_id: fila.lineaId,
      pieza_id: null,
      semana_inicio: fila.semanaInicio,
      // El cuaderno conserva la cifra ya sumada, no sus partes.
      mensajes_total_reportado: fila.mensajesTotalReportado,
      mensajes_meta: null,
      consultas_comentarios: null,
      reproducciones: fila.reproducciones,
      inversion_usd_dia: fila.inversionUsdDia,
      dias_activos: fila.diasActivos,
      nota: fila.nota,
    })
  }

  if (porInsertar.length === 0) {
    return { ok: true, cargadas: 0, rechazadas: rechazadasTotal, normalizadas: 0 }
  }

  const supabase = await crearClienteServidor()
  const { error } = await supabase.from('registro_semanal').insert(porInsertar)

  if (error) {
    return {
      ok: false,
      error: `No se cargó nada: ${error.message}. Revisá el archivo y volvé a intentar.`,
    }
  }

  revalidatePath('/semana')
  revalidatePath('/resumen')
  revalidatePath('/config/historico')

  return {
    ok: true,
    cargadas: porInsertar.length,
    rechazadas: rechazadasTotal,
    normalizadas: validas.filter((fila) => fila.semanaNormalizada).length,
  }
}
