import type { Progreso } from '@/dominio/semanaDeTrabajo'
import estilos from './semana.module.css'

/**
 * Cuántas de las unidades esperadas de la semana están registradas.
 *
 * Es el sustituto de repasar el cuaderno para ver qué falta. Cuando la
 * semana cierra, los rombos pasan al amarillo — el único lugar donde ese
 * color aparece, y nunca como texto.
 */
export function MarcaDeSemana({
  progreso,
  animar = false,
}: {
  progreso: Progreso
  animar?: boolean
}) {
  const { esperadas, registradas, completa } = progreso

  if (esperadas === 0) {
    return (
      <p className={estilos.marca}>
        Nada esperado esta semana. Puedes activar una pieza o una línea en
        configuración.
      </p>
    )
  }

  // Con muchas unidades la fila de rombos deja de leerse de un vistazo.
  const conRombos = esperadas <= 14

  return (
    <p className={`${estilos.marca} ${animar ? estilos.tejiendo : ''}`}>
      {conRombos && (
        <span className={estilos.rombos} aria-hidden="true">
          {Array.from({ length: esperadas }, (_, i) => (
            <span
              key={i}
              className={
                i < registradas
                  ? completa
                    ? `${estilos.rombo} ${estilos.romboCompleta}`
                    : `${estilos.rombo} ${estilos.romboLleno}`
                  : estilos.rombo
              }
              style={animar && i < registradas ? { animationDelay: `${i * 60}ms` } : undefined}
            />
          ))}
        </span>
      )}
      <span>
        {completa
          ? `Semana completa: ${registradas} de ${esperadas}`
          : `${registradas} de ${esperadas} registradas`}
      </span>
    </p>
  )
}
