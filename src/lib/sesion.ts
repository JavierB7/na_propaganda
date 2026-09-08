import 'server-only'

import { redirect } from 'next/navigation'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type Sesion = {
  usuarioId: string
  correo: string
}

/**
 * Sesión del usuario, o `null` si no hay.
 *
 * `getUser` valida el token contra Supabase en lugar de confiar en la cookie,
 * que es manipulable.
 */
export async function sesionActual(): Promise<Sesion | null> {
  const supabase = await crearClienteServidor()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user?.email) return null

  return { usuarioId: data.user.id, correo: data.user.email }
}

/**
 * Sesión de un usuario autorizado, o redirección.
 *
 * La autorización la responde la base de datos con la misma función que
 * sostiene todas las políticas, así que la interfaz y la frontera de
 * seguridad no pueden discrepar.
 */
export async function exigirAutorizacion(): Promise<Sesion> {
  const sesion = await sesionActual()
  if (!sesion) redirect('/acceso')

  const supabase = await crearClienteServidor()
  const { data: autorizado } = await supabase.rpc('es_autorizado')

  if (autorizado !== true) redirect('/acceso/sin-acceso')

  return sesion
}
