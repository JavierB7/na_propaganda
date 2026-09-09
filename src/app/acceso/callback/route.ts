import { NextResponse, type NextRequest } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'

/**
 * Cambia el código del enlace o del proveedor por una sesión.
 *
 * Sirve para las dos formas de entrar: el enlace por correo y Google usan el
 * mismo flujo PKCE, así que el intercambio es el mismo.
 */
export async function GET(peticion: NextRequest) {
  const { searchParams, origin } = peticion.nextUrl

  const codigo = searchParams.get('code')
  const destino = searchParams.get('destino') ?? '/semana'

  /*
   * Cuando el proveedor rechaza, no manda `code` sino `error`. Antes se
   * trataba igual que un enlace mal formado, que es un diagnóstico falso:
   * el usuario cancelando en la pantalla de Google se veía idéntico a una
   * configuración equivocada.
   */
  const errorProveedor = searchParams.get('error')
  if (errorProveedor) {
    const descripcion = searchParams.get('error_description')
    console.error('[acceso] el proveedor rechazó el acceso', {
      error: errorProveedor,
      descripcion,
    })

    const estado =
      errorProveedor === 'access_denied' ? 'acceso-cancelado' : 'proveedor-fallo'

    return NextResponse.redirect(`${origin}/acceso?estado=${estado}`)
  }

  if (!codigo) {
    return NextResponse.redirect(`${origin}/acceso?estado=enlace-invalido`)
  }

  const supabase = await crearClienteServidor()
  const { error } = await supabase.auth.exchangeCodeForSession(codigo)

  if (error) {
    console.error('[acceso] exchangeCodeForSession falló', {
      estado: error.status,
      codigo: error.code,
      mensaje: error.message,
    })

    return NextResponse.redirect(`${origin}/acceso?estado=enlace-vencido`)
  }

  return NextResponse.redirect(`${origin}${destino}`)
}
