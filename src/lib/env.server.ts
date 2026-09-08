import 'server-only'

/**
 * Secretos. Nunca llegan al navegador — `server-only` hace que importar este
 * módulo desde un componente de cliente falle en tiempo de compilación.
 */

/** Correos autorizados, normalizados a minúsculas. */
export function usuariosAutorizados(): string[] {
  return (process.env.USUARIOS_AUTORIZADOS ?? '')
    .split(',')
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean)
}

export function estaAutorizado(correo: string | null | undefined): boolean {
  if (!correo) return false
  return usuariosAutorizados().includes(correo.trim().toLowerCase())
}

/**
 * Clave de servicio. Pasa por encima de RLS: solo para las tareas programadas
 * de respaldo y ping.
 */
export function claveDeServicio(): string {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!clave) {
    throw new Error('Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY.')
  }
  return clave
}

export function secretoDeCron(): string {
  const secreto = process.env.CRON_SECRET
  if (!secreto) {
    throw new Error('Falta la variable de entorno CRON_SECRET.')
  }
  return secreto
}
