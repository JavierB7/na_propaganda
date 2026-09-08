/**
 * Cálculo de totales de mensajes.
 *
 * Dos reglas gobiernan todo este módulo:
 *
 * 1. El total reportado tiene precedencia sobre la suma. El 47 del cuaderno
 *    ya es una suma hecha a mano y el cuaderno no conserva sus partes.
 * 2. Nulo no es cero. Un campo vacío significa dato no disponible; una
 *    semana sin registrar no es una semana de cero mensajes. Presentar un
 *    vacío como cero convierte una ausencia en una caída inventada.
 */

export type MensajesDeRegistro = {
  mensajes_meta: number | null
  consultas_comentarios: number | null
  mensajes_total_reportado: number | null
}

/**
 * Total efectivo de un registro, o `null` si no hay ningún dato de mensajes.
 *
 * Meta cuenta las conversaciones que entran por bandeja, pero no cuenta a
 * quien pide información en los comentarios; esas se suman aparte.
 */
export function totalDeRegistro(registro: MensajesDeRegistro): number | null {
  if (registro.mensajes_total_reportado !== null) {
    return registro.mensajes_total_reportado
  }

  const { mensajes_meta: meta, consultas_comentarios: comentarios } = registro

  if (meta === null && comentarios === null) return null

  return (meta ?? 0) + (comentarios ?? 0)
}

/** Verdadero si el registro trae la cifra ya sumada, sin desglose conocido. */
export function esTotalSinDesglose(registro: MensajesDeRegistro): boolean {
  return registro.mensajes_total_reportado !== null
}

/**
 * Suma de una colección de registros, o `null` si ninguno aporta dato.
 *
 * `null` propaga la ausencia hacia arriba: una línea sin ningún registro con
 * mensajes se muestra como sin dato, no como cero.
 */
export function totalDeRegistros(
  registros: readonly MensajesDeRegistro[],
): number | null {
  let suma: number | null = null

  for (const registro of registros) {
    const total = totalDeRegistro(registro)
    if (total === null) continue
    suma = (suma ?? 0) + total
  }

  return suma
}

/**
 * Suma de una métrica cualquiera sobre los registros, con la misma regla:
 * si ningún registro trae el dato, el resultado es `null`.
 */
export function sumaDeMetrica<T>(
  registros: readonly T[],
  metrica: (registro: T) => number | null,
): number | null {
  let suma: number | null = null

  for (const registro of registros) {
    const valor = metrica(registro)
    if (valor === null) continue
    suma = (suma ?? 0) + valor
  }

  return suma
}

/** Inversión total de un registro: dólares por día × días activos. */
export function inversionDeRegistro(registro: {
  inversion_usd_dia: number | null
  dias_activos: number | null
}): number | null {
  const { inversion_usd_dia: porDia, dias_activos: dias } = registro
  if (porDia === null || dias === null) return null
  return porDia * dias
}
