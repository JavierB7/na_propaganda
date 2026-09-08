import 'server-only'

import { secretoDeCron } from '@/lib/env.server'

/**
 * Autenticación de las tareas programadas.
 *
 * Las rutas de cron quedan fuera de la sesión de usuario, así que necesitan
 * su propia puerta. Vercel Cron manda `Authorization: Bearer <CRON_SECRET>`;
 * un runner externo puede mandar la misma cabecera.
 */
export function cronAutorizado(peticion: Request): boolean {
  const enviado = peticion.headers.get('authorization')
  if (!enviado) return false

  const esperado = `Bearer ${secretoDeCron()}`

  // Comparación de largo constante para no filtrar el secreto por tiempos.
  if (enviado.length !== esperado.length) return false

  let diferencia = 0
  for (let i = 0; i < esperado.length; i += 1) {
    diferencia |= enviado.charCodeAt(i) ^ esperado.charCodeAt(i)
  }

  return diferencia === 0
}
