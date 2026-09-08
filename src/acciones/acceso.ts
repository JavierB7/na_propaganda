'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { crearClienteServidor } from '@/lib/supabase/servidor'

export type ResultadoAcceso = { error: string } | { enviado: string }

/**
 * Envía el enlace de acceso.
 *
 * Sin contraseñas propias del sistema: la captura ocurre desde un teléfono y
 * el usuario principal no es técnico. Una contraseña más es una barrera de
 * abandono y un riesgo de credencial compartida.
 */
export async function enviarEnlace(
  _previo: ResultadoAcceso | null,
  formulario: FormData,
): Promise<ResultadoAcceso> {
  const correo = String(formulario.get('correo') ?? '').trim().toLowerCase()
  const destino = String(formulario.get('destino') ?? '/semana')

  if (!correo || !correo.includes('@')) {
    return { error: 'Escribí un correo válido para recibir el enlace.' }
  }

  const supabase = await crearClienteServidor()
  const cabeceras = await headers()
  const origen =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${cabeceras.get('host') ?? 'localhost:3000'}`

  const { error } = await supabase.auth.signInWithOtp({
    email: correo,
    options: {
      // No se crean cuentas desde aquí: el acceso lo concede la lista de
      // autorizados, no el formulario.
      shouldCreateUser: true,
      emailRedirectTo: `${origen}/acceso/callback?destino=${encodeURIComponent(destino)}`,
    },
  })

  if (error) {
    return {
      error:
        'No se pudo enviar el enlace. Revisá el correo e intentá de nuevo en un momento.',
    }
  }

  return { enviado: correo }
}

export async function salir() {
  const supabase = await crearClienteServidor()
  await supabase.auth.signOut()
  redirect('/acceso')
}
