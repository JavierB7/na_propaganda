/**
 * Variables de entorno públicas. Viajan al navegador.
 *
 * Los datos no los protege el secreto de estas claves sino la seguridad a
 * nivel de fila en Postgres. Ver `src/lib/env.server.ts` para los secretos.
 *
 * Se leen de forma perezosa, con getters, y no al cargar el módulo: así el
 * build no depende de valores de ejecución, y si falta uno el error aparece
 * al atender la petición, diciendo exactamente qué falta.
 */

function requerido(nombre: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copiá .env.example a .env.local y llenala.`,
    )
  }
  return valor
}

export const env = {
  get supabaseUrl(): string {
    return requerido(
      'NEXT_PUBLIC_SUPABASE_URL',
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    )
  },
  get supabaseAnonKey(): string {
    return requerido(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  },
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  },
}
