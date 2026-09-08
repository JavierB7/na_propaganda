import Link from 'next/link'
import {
  rangoCorto,
  rangoLargo,
  semanaAnterior,
  semanaSiguiente,
  semanaActual,
} from '@/dominio/semana'
import estilos from './semana.module.css'

/**
 * Navegación entre semanas con controles grandes.
 *
 * Enlaces y no un selector de fecha: el movimiento habitual es una semana
 * atrás o adelante, y un date picker en un teléfono es más lento y más fácil
 * de errar.
 */
export function NavegadorDeSemana({
  semana,
  ruta,
}: {
  semana: string
  ruta: '/semana' | '/resumen'
}) {
  const actual = semanaActual()

  return (
    <div>
      <div className={estilos.navegador}>
        <Link
          className={estilos.flecha}
          href={{ pathname: ruta, query: { s: semanaAnterior(semana) } }}
          aria-label="Semana anterior"
          rel="prev"
        >
          ‹
        </Link>

        <span className={estilos.rango}>{rangoCorto(semana)}</span>
        <span className={estilos.rangoLargo}>{rangoLargo(semana)}</span>

        <Link
          className={estilos.flecha}
          href={{ pathname: ruta, query: { s: semanaSiguiente(semana) } }}
          aria-label="Semana siguiente"
          rel="next"
        >
          ›
        </Link>

        {semana !== actual && (
          <Link className={estilos.hoy} href={{ pathname: ruta, query: { s: actual } }}>
            Ir a esta semana
          </Link>
        )}
      </div>
    </div>
  )
}
