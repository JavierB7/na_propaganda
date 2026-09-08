import { NextResponse } from 'next/server'
import { cronAutorizado } from '@/lib/cron'
import { crearClienteDeServicio } from '@/lib/supabase/servidor'

/**
 * Mantiene despierto el proyecto de base de datos.
 *
 * El uso de la bitácora es intermitente por diseño: cuando un curso cierra no
 * hay nada que registrar hasta que abre el siguiente, y pueden pasar semanas
 * sin que nadie entre. Un proyecto pausado por inactividad se descubriría
 * justo el día en que se necesita el dato.
 */
export const dynamic = 'force-dynamic'

export async function GET(peticion: Request) {
  if (!cronAutorizado(peticion)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const supabase = crearClienteDeServicio()

  // Consulta trivial: solo cuenta como actividad.
  const { count, error } = await supabase
    .from('linea')
    .select('id', { count: 'exact', head: true })

  if (error) {
    console.error('[cron:ping] la base de datos no respondió:', error.message)
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }

  return NextResponse.json({ ok: true, lineas: count ?? 0, momento: new Date().toISOString() })
}
