import 'server-only'

import { crearClienteServidor } from '@/lib/supabase/servidor'
import type { Linea, Pieza, RegistroSemanal } from '@/lib/supabase/tipos'

/**
 * Lecturas del esquema. Todas pasan por el cliente con sesión, así que la
 * seguridad a nivel de fila aplica: un usuario no autorizado recibe cero
 * filas, no un error.
 */

function fallar(contexto: string, error: { message: string }): never {
  throw new Error(`${contexto}: ${error.message}`)
}

export async function lineas({ soloActivas = false } = {}): Promise<Linea[]> {
  const supabase = await crearClienteServidor()
  let consulta = supabase.from('linea').select('*').order('orden').order('nombre')

  if (soloActivas) consulta = consulta.eq('activo', true)

  const { data, error } = await consulta
  if (error) fallar('No se pudieron leer las líneas', error)
  return data ?? []
}

export async function lineaPorId(id: string): Promise<Linea | null> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.from('linea').select('*').eq('id', id).maybeSingle()
  if (error) fallar('No se pudo leer la línea', error)
  return data
}

export async function piezas({ soloActivas = false } = {}): Promise<Pieza[]> {
  const supabase = await crearClienteServidor()
  let consulta = supabase
    .from('pieza')
    .select('*')
    .order('fecha_subida', { ascending: false })
    .order('codigo')

  if (soloActivas) consulta = consulta.eq('activo', true)

  const { data, error } = await consulta
  if (error) fallar('No se pudieron leer las piezas', error)
  return data ?? []
}

export async function registrosDeSemana(semana: string): Promise<RegistroSemanal[]> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('registro_semanal')
    .select('*')
    .eq('semana_inicio', semana)

  if (error) fallar('No se pudieron leer los registros de la semana', error)
  return data ?? []
}

/** Registros de varias semanas a la vez, para las columnas de contexto. */
export async function registrosDeSemanas(
  semanas: readonly string[],
): Promise<RegistroSemanal[]> {
  if (semanas.length === 0) return []

  const supabase = await crearClienteServidor()
  const { data, error } = await supabase
    .from('registro_semanal')
    .select('*')
    .in('semana_inicio', semanas as string[])

  if (error) fallar('No se pudieron leer los registros', error)
  return data ?? []
}

/**
 * Piezas que la semana necesita: las activas, más las inactivas que ya
 * tengan registro en esa semana. Desactivar una pieza no debe esconder lo
 * que ya se midió.
 */
export async function piezasParaSemana(semana: string): Promise<Pieza[]> {
  const [todas, registros] = await Promise.all([piezas(), registrosDeSemana(semana)])

  const conRegistro = new Set(
    registros.map((registro) => registro.pieza_id).filter((id): id is string => id !== null),
  )

  return todas.filter((pieza) => pieza.activo || conRegistro.has(pieza.id))
}
