import 'server-only'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { claveDeServicio } from '@/lib/env.server'
import type { Database } from '@/lib/supabase/tipos'

/**
 * Cliente de Supabase para Server Components y Server Actions. Actúa como el
 * usuario de la sesión, así que la seguridad a nivel de fila aplica.
 */
export async function crearClienteServidor() {
  const almacen = await cookies()

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return almacen.getAll()
      },
      setAll(porFijar: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          for (const { name, value, options } of porFijar) {
            almacen.set(name, value, options)
          }
        } catch {
          // Los Server Components no pueden escribir cookies. El middleware
          // refresca la sesión, así que aquí se puede ignorar.
        }
      },
    },
  })
}

/**
 * Cliente con clave de servicio. Pasa por encima de RLS.
 * Solo para las tareas programadas de respaldo y ping — nunca en una ruta
 * que atienda a un usuario.
 */
export function crearClienteDeServicio() {
  return createClient<Database>(env.supabaseUrl, claveDeServicio(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
