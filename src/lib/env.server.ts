import 'server-only'

/**
 * Secretos. Nunca llegan al navegador — `server-only` hace que importar este
 * módulo desde un componente de cliente falle en tiempo de compilación.
 */

/*
 * La lista de autorizados NO vive acá. Está en la tabla `usuario_autorizado`,
 * porque es la misma que sostiene las políticas de RLS: si estuviera también
 * en una variable de entorno habría dos listas que mantener sincronizadas, y
 * la de la aplicación podría discrepar de la frontera de seguridad real.
 */

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
