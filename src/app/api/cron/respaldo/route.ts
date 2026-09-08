import { NextResponse } from 'next/server'
import { cronAutorizado } from '@/lib/cron'
import { crearClienteDeServicio } from '@/lib/supabase/servidor'

/**
 * Respaldo completo en CSV.
 *
 * Los datos son pocos y son el activo entero del proyecto. El plan gratuito
 * no ofrece recuperación a un punto en el tiempo, así que una fila borrada por
 * error no tendría vuelta atrás.
 *
 * Devuelve un solo archivo con las tres tablas, una detrás de otra. El runner
 * lo guarda donde corresponda; ver el README.
 */
export const dynamic = 'force-dynamic'

const TABLAS = ['linea', 'pieza', 'registro_semanal'] as const

function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return ''

  const texto = String(valor)
  // Se entrecomilla solo lo que lo necesita.
  return /[",;\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

function aCsv(filas: Record<string, unknown>[]): string {
  if (filas.length === 0) return ''

  const columnas = Object.keys(filas[0]!)
  const lineas = [columnas.join(',')]

  for (const fila of filas) {
    lineas.push(columnas.map((columna) => celda(fila[columna])).join(','))
  }

  return lineas.join('\n')
}

export async function GET(peticion: Request) {
  if (!cronAutorizado(peticion)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const supabase = crearClienteDeServicio()
  const partes: string[] = []
  const conteos: Record<string, number> = {}

  for (const tabla of TABLAS) {
    const { data, error } = await supabase.from(tabla).select('*')

    if (error) {
      // Una falla queda visible en los registros del despliegue, y el estado
      // 502 hace que el runner la reporte en lugar de tragársela.
      console.error(`[cron:respaldo] falló la tabla ${tabla}:`, error.message)
      return NextResponse.json(
        { ok: false, tabla, error: error.message },
        { status: 502 },
      )
    }

    const filas = (data ?? []) as Record<string, unknown>[]
    conteos[tabla] = filas.length
    partes.push(`# tabla: ${tabla} (${filas.length} filas)`, aCsv(filas), '')
  }

  const fecha = new Date().toISOString().slice(0, 10)
  const contenido = [
    `# Respaldo de la Bitácora de Difusión — ${new Date().toISOString()}`,
    '',
    ...partes,
  ].join('\n')

  console.info('[cron:respaldo] listo:', JSON.stringify(conteos))

  return new NextResponse(contenido, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="bitacora-respaldo-${fecha}.csv"`,
      'x-conteos': JSON.stringify(conteos),
    },
  })
}
