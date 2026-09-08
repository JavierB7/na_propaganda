/**
 * La semana se identifica por la fecha de su lunes.
 *
 * Sin una definición única, dos cargas hechas el mismo jueves producen filas
 * distintas y los totales mienten.
 *
 * Todo se maneja como `YYYY-MM-DD` en aritmética UTC. Las fechas del sistema
 * son días de calendario, no instantes: usar la zona local haría que la
 * misma semana cambiara de nombre según dónde esté el teléfono.
 */

export type Semana = string

const MS_POR_DIA = 86_400_000

const FORMATO = /^\d{4}-\d{2}-\d{2}$/

function aUtc(fecha: string): number {
  if (!FORMATO.test(fecha)) {
    throw new Error(`Fecha inválida: ${fecha}. Se espera YYYY-MM-DD.`)
  }
  const marca = Date.parse(`${fecha}T00:00:00Z`)
  if (Number.isNaN(marca)) {
    throw new Error(`Fecha inválida: ${fecha}.`)
  }
  return marca
}

function aTexto(marca: number): string {
  return new Date(marca).toISOString().slice(0, 10)
}

/** Fecha de hoy como día de calendario, en la zona del usuario. */
export function hoy(ahora: Date = new Date()): string {
  const desplazado = ahora.getTime() - ahora.getTimezoneOffset() * 60_000
  return new Date(desplazado).toISOString().slice(0, 10)
}

/** El lunes de la semana que contiene la fecha dada. */
export function lunesDe(fecha: string): Semana {
  const marca = aUtc(fecha)
  // getUTCDay: domingo 0, lunes 1 … sábado 6.
  const dia = new Date(marca).getUTCDay()
  const diasDesdeLunes = (dia + 6) % 7
  return aTexto(marca - diasDesdeLunes * MS_POR_DIA)
}

export function semanaActual(ahora: Date = new Date()): Semana {
  return lunesDe(hoy(ahora))
}

export function esLunes(fecha: string): boolean {
  return new Date(aUtc(fecha)).getUTCDay() === 1
}

export function desplazarSemanas(semana: Semana, cantidad: number): Semana {
  return aTexto(aUtc(lunesDe(semana)) + cantidad * 7 * MS_POR_DIA)
}

export function semanaAnterior(semana: Semana): Semana {
  return desplazarSemanas(semana, -1)
}

export function semanaSiguiente(semana: Semana): Semana {
  return desplazarSemanas(semana, 1)
}

/** El domingo que cierra la semana. */
export function domingoDe(semana: Semana): string {
  return aTexto(aUtc(lunesDe(semana)) + 6 * MS_POR_DIA)
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

function partes(fecha: string): { dia: number; mes: string; anio: number } {
  const d = new Date(aUtc(fecha))
  return {
    dia: d.getUTCDate(),
    mes: MESES[d.getUTCMonth()] as string,
    anio: d.getUTCFullYear(),
  }
}

/**
 * Rango corto para el navegador móvil: "8 – 14 sep".
 * Repite el mes solo cuando la semana lo cruza.
 */
export function rangoCorto(semana: Semana): string {
  const a = partes(lunesDe(semana))
  const b = partes(domingoDe(semana))
  const mesA = a.mes.slice(0, 3)
  const mesB = b.mes.slice(0, 3)

  return a.mes === b.mes
    ? `${a.dia} – ${b.dia} ${mesB}`
    : `${a.dia} ${mesA} – ${b.dia} ${mesB}`
}

/** Rango largo para escritorio: "Semana del 8 al 14 de septiembre". */
export function rangoLargo(semana: Semana): string {
  const a = partes(lunesDe(semana))
  const b = partes(domingoDe(semana))

  if (a.mes === b.mes) {
    return `Semana del ${a.dia} al ${b.dia} de ${b.mes}`
  }
  if (a.anio === b.anio) {
    return `Semana del ${a.dia} de ${a.mes} al ${b.dia} de ${b.mes}`
  }
  return `Semana del ${a.dia} de ${a.mes} de ${a.anio} al ${b.dia} de ${b.mes} de ${b.anio}`
}

/** Etiqueta compacta para las columnas de semanas previas: "1 sep". */
export function etiquetaBreve(semana: Semana): string {
  const a = partes(lunesDe(semana))
  return `${a.dia} ${a.mes.slice(0, 3)}`
}
