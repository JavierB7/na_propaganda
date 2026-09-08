import { NextResponse, type NextRequest } from 'next/server'
import { crearClienteServidor } from '@/lib/supabase/servidor'

/** Cambia el código del enlace de acceso por una sesión. */
export async function GET(peticion: NextRequest) {
  const { searchParams, origin } = peticion.nextUrl
  const codigo = searchParams.get('code')
  const destino = searchParams.get('destino') ?? '/semana'

  if (!codigo) {
    return NextResponse.redirect(`${origin}/acceso?estado=enlace-invalido`)
  }

  const supabase = await crearClienteServidor()
  const { error } = await supabase.auth.exchangeCodeForSession(codigo)

  if (error) {
    return NextResponse.redirect(`${origin}/acceso?estado=enlace-vencido`)
  }

  return NextResponse.redirect(`${origin}${destino}`)
}
