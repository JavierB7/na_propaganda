'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { AuthError } from '@supabase/supabase-js'
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
    return { error: 'Escribe un correo válido para recibir el enlace.' }
  }

  const supabase = await crearClienteServidor()
  const cabeceras = await headers()
  const origen =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${cabeceras.get('host') ?? 'localhost:3000'}`

  const retorno = `${origen}/acceso/callback?destino=${encodeURIComponent(destino)}`

  const { error } = await supabase.auth.signInWithOtp({
    email: correo,
    options: {
      // No se crean cuentas desde aquí: el acceso lo concede la lista de
      // autorizados, no el formulario.
      shouldCreateUser: true,
      emailRedirectTo: retorno,
    },
  })

  if (error) {
    /*
     * El motivo real va a los registros del despliegue. Sin esto, un límite
     * de envío, una URL de retorno no autorizada y una caída de red se ven
     * exactamente iguales, y no hay forma de saber cuál fue.
     */
    console.error('[acceso] signInWithOtp falló', {
      estado: error.status,
      codigo: error.code,
      mensaje: error.message,
      retorno,
    })

    return { error: mensajeDeAcceso(error) }
  }

  return { enviado: correo }
}

/**
 * Traduce el fallo a algo que diga qué pasó y qué hacer.
 *
 * El texto libre del proveedor no se muestra: esta pantalla es pública. Para
 * lo que no se reconoce se da el código, que basta para cruzarlo con los
 * registros y no revela nada de la configuración.
 */
function mensajeDeAcceso(error: AuthError): string {
  const texto = `${error.code ?? ''} ${error.message}`.toLowerCase()

  if (error.status === 429 || texto.includes('rate limit') || texto.includes('too many')) {
    return 'Se enviaron demasiados enlaces en poco tiempo. El correo de Supabase tiene un límite bajo por hora: espera un rato y vuelve a intentar.'
  }

  if (texto.includes('signups not allowed') || texto.includes('otp_disabled')) {
    return 'El proyecto de Supabase no está permitiendo crear cuentas nuevas. Hay que habilitar el proveedor de correo en Authentication → Sign In / Providers.'
  }

  if (texto.includes('redirect') || texto.includes('not allowed to') || texto.includes('url')) {
    return 'La dirección de retorno no está autorizada en Supabase. Hay que agregarla en Authentication → URL Configuration → Redirect URLs.'
  }

  if (texto.includes('invalid') && texto.includes('email')) {
    return 'Supabase rechazó ese correo. Revisa que esté bien escrito.'
  }

  if (texto.includes('smtp') || texto.includes('mail')) {
    return 'El servicio de correo de Supabase falló al enviar. Si se repite, conviene configurar un SMTP propio en Authentication → Emails.'
  }

  const codigo = error.code ?? error.status ?? 'sin código'
  return `No se pudo enviar el enlace (${codigo}). El motivo quedó en los registros del despliegue.`
}

export async function salir() {
  const supabase = await crearClienteServidor()
  await supabase.auth.signOut()
  redirect('/acceso')
}
