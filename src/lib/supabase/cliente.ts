'use client'

import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@/lib/supabase/tipos'

/** Cliente de Supabase para componentes de navegador. */
export function crearClienteNavegador() {
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey)
}
