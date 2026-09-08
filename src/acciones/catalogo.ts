'use server'

import { revalidatePath } from 'next/cache'
import { crearClienteServidor } from '@/lib/supabase/servidor'
import { exigirAutorizacion } from '@/lib/sesion'

export type Resultado = { ok: true } | { ok: false; error: string }

/** Prefijo sugerido a partir del nombre, para no pedírselo al usuario. */
function prefijoDe(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()

  const palabras = limpio.split(/\s+/).filter(Boolean)

  // Dos o más palabras: iniciales. Una sola: sus tres primeras letras.
  const base =
    palabras.length >= 3
      ? palabras.slice(0, 3).map((p) => p[0]).join('')
      : palabras.length === 2
        ? `${palabras[0]!.slice(0, 2)}${palabras[1]![0]}`
        : (palabras[0] ?? 'LIN').slice(0, 3)

  return (base || 'LIN').slice(0, 5).padEnd(2, 'X')
}

function mensaje(texto: string): string {
  if (texto.includes('linea_nombre_unico')) {
    return 'Ya existe una línea con ese nombre, activa o desactivada.'
  }
  if (texto.includes('linea_prefijo_unico')) {
    return 'El prefijo derivado de ese nombre ya lo usa otra línea. Puedes cambiar el nombre o escribir un prefijo distinto.'
  }
  if (texto.includes('linea_prefijo_formato')) {
    return 'El prefijo debe tener entre 2 y 5 letras mayúsculas, sin espacios ni acentos.'
  }
  if (texto.includes('linea_nombre_no_vacio')) {
    return 'La línea necesita un nombre.'
  }
  if (texto.includes('pieza_descripcion_no_vacia')) {
    return 'La pieza necesita una descripción para poder reconocerla.'
  }
  if (texto.includes('violates foreign key') && texto.includes('pieza')) {
    return 'No se puede eliminar porque hay registros que dependen de esto. Puedes desactivarlo en lugar de borrarlo.'
  }
  return texto
}

// ── Líneas ─────────────────────────────────────────────────────────────────

export async function crearLinea(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  await exigirAutorizacion()

  const nombre = String(formulario.get('nombre') ?? '').trim()
  const unidadExito = String(formulario.get('unidad_exito') ?? '').trim()
  const prefijoDado = String(formulario.get('prefijo') ?? '').trim().toUpperCase()

  if (!nombre) return { ok: false, error: 'Escribe el nombre de la línea.' }

  const supabase = await crearClienteServidor()

  // Se coloca al final del orden actual.
  const { data: ultima } = await supabase
    .from('linea')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { error } = await supabase.from('linea').insert({
    nombre,
    prefijo: prefijoDado || prefijoDe(nombre),
    unidad_exito: unidadExito || null,
    orden: (ultima?.orden ?? 0) + 10,
  })

  if (error) return { ok: false, error: mensaje(error.message) }

  revalidatePath('/config')
  revalidatePath('/semana')
  return { ok: true }
}

export async function actualizarLinea(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  await exigirAutorizacion()

  const id = String(formulario.get('id') ?? '')
  const nombre = String(formulario.get('nombre') ?? '').trim()
  const unidadExito = String(formulario.get('unidad_exito') ?? '').trim()
  const orden = Number(formulario.get('orden') ?? 0)
  const activo = formulario.get('activo') === 'on'

  if (!id) return { ok: false, error: 'No se identificó la línea a modificar.' }
  if (!nombre) return { ok: false, error: 'La línea necesita un nombre.' }

  const supabase = await crearClienteServidor()
  const { error } = await supabase
    .from('linea')
    .update({
      nombre,
      unidad_exito: unidadExito || null,
      orden: Number.isFinite(orden) ? orden : 0,
      activo,
    })
    .eq('id', id)

  if (error) return { ok: false, error: mensaje(error.message) }

  revalidatePath('/config')
  revalidatePath('/semana')
  revalidatePath('/resumen')
  return { ok: true }
}

// ── Piezas ─────────────────────────────────────────────────────────────────

export async function crearPieza(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  await exigirAutorizacion()

  const lineaId = String(formulario.get('linea_id') ?? '')
  const descripcion = String(formulario.get('descripcion') ?? '').trim()
  const fechaSubida = String(formulario.get('fecha_subida') ?? '').trim()
  const metaAdId = String(formulario.get('meta_ad_id') ?? '').trim()

  if (!lineaId) return { ok: false, error: 'Elige a qué línea pertenece la pieza.' }
  if (!descripcion) {
    return { ok: false, error: 'Escribe una descripción para reconocer la pieza.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaSubida)) {
    return { ok: false, error: 'Indica la fecha en que se subió la pieza.' }
  }

  const supabase = await crearClienteServidor()

  // El código lo genera la base de datos: aquí no se envía.
  const { error } = await supabase.from('pieza').insert({
    linea_id: lineaId,
    descripcion,
    fecha_subida: fechaSubida,
    meta_ad_id: metaAdId || null,
  })

  if (error) return { ok: false, error: mensaje(error.message) }

  revalidatePath('/config')
  revalidatePath('/semana')
  return { ok: true }
}

export async function actualizarPieza(
  _previo: Resultado | null,
  formulario: FormData,
): Promise<Resultado> {
  await exigirAutorizacion()

  const id = String(formulario.get('id') ?? '')
  const descripcion = String(formulario.get('descripcion') ?? '').trim()
  const fechaSubida = String(formulario.get('fecha_subida') ?? '').trim()
  const metaAdId = String(formulario.get('meta_ad_id') ?? '').trim()
  const activo = formulario.get('activo') === 'on'

  if (!id) return { ok: false, error: 'No se identificó la pieza a modificar.' }
  if (!descripcion) {
    return { ok: false, error: 'La pieza necesita una descripción.' }
  }

  const supabase = await crearClienteServidor()
  const { error } = await supabase
    .from('pieza')
    .update({
      descripcion,
      fecha_subida: fechaSubida,
      meta_ad_id: metaAdId || null,
      activo,
    })
    .eq('id', id)

  if (error) return { ok: false, error: mensaje(error.message) }

  revalidatePath('/config')
  revalidatePath('/semana')
  revalidatePath('/resumen')
  return { ok: true }
}
