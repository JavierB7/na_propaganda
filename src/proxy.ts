import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refresca la sesión en cada navegación y manda a la pantalla de acceso a
 * quien no tenga una.
 *
 * Este proxy no decide si el usuario está autorizado — eso lo responde la
 * base de datos. Solo distingue "con sesión" de "sin sesión", que es lo que
 * se puede saber sin consultar.
 */

const RUTAS_PUBLICAS = ['/acceso', '/api/cron']

export async function proxy(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return peticion.cookies.getAll()
        },
        setAll(porFijar: { name: string; value: string; options?: CookieOptions }[]) {
          for (const { name, value } of porFijar) {
            peticion.cookies.set(name, value)
          }
          respuesta = NextResponse.next({ request: peticion })
          for (const { name, value, options } of porFijar) {
            respuesta.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Valida el token y, de paso, lo renueva si hace falta.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ruta = peticion.nextUrl.pathname
  const esPublica = RUTAS_PUBLICAS.some(
    (publica) => ruta === publica || ruta.startsWith(`${publica}/`),
  )

  if (!user && !esPublica) {
    const destino = peticion.nextUrl.clone()
    destino.pathname = '/acceso'
    // Para devolverlo a donde iba después de entrar.
    destino.searchParams.set('destino', ruta)
    return NextResponse.redirect(destino)
  }

  return respuesta
}

export const config = {
  matcher: [
    /*
     * Todo salvo archivos estáticos e imágenes. Sin esta exclusión el
     * proxy corre en cada recurso y cuesta una llamada de red por
     * archivo.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
  ],
}
