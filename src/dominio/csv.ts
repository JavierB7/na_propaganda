/**
 * Lector de CSV para la carga histórica.
 *
 * Se escribe a mano en lugar de traer una dependencia: el formato es el que
 * define este proyecto, son pocas columnas, y el archivo lo produce quien lo
 * carga. Soporta comillas dobles, comas dentro de comillas, comillas
 * escapadas duplicadas y saltos de línea CRLF.
 */

export type FilaCruda = Record<string, string>

export function leerCsv(texto: string): { encabezados: string[]; filas: FilaCruda[] } {
  const tabla = separarCsv(texto)
  if (tabla.length === 0) return { encabezados: [], filas: [] }

  const encabezados = (tabla[0] ?? []).map((celda) => normalizarClave(celda))

  const filas: FilaCruda[] = []
  for (const linea of tabla.slice(1)) {
    // Una fila totalmente vacía es separación, no dato.
    if (linea.every((celda) => celda.trim() === '')) continue

    const fila: FilaCruda = {}
    encabezados.forEach((encabezado, i) => {
      fila[encabezado] = (linea[i] ?? '').trim()
    })
    filas.push(fila)
  }

  return { encabezados, filas }
}

/** Nombres de columna tolerantes: acentos, mayúsculas y espacios da igual. */
export function normalizarClave(texto: string): string {
  return texto
    .replace(/^\ufeff/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

function separarCsv(texto: string): string[][] {
  const tabla: string[][] = []
  let fila: string[] = []
  let celda = ''
  let enComillas = false

  for (let i = 0; i < texto.length; i += 1) {
    const caracter = texto[i]

    if (enComillas) {
      if (caracter === '"') {
        if (texto[i + 1] === '"') {
          celda += '"'
          i += 1
        } else {
          enComillas = false
        }
      } else {
        celda += caracter
      }
      continue
    }

    if (caracter === '"') {
      enComillas = true
    } else if (caracter === ',' || caracter === ';') {
      fila.push(celda)
      celda = ''
    } else if (caracter === '\n') {
      fila.push(celda)
      tabla.push(fila)
      fila = []
      celda = ''
    } else if (caracter === '\r') {
      // Se ignora: el salto lo marca el \n que sigue.
    } else {
      celda += caracter
    }
  }

  if (celda !== '' || fila.length > 0) {
    fila.push(celda)
    tabla.push(fila)
  }

  return tabla
}

/** Número de una celda, o `null` si viene vacía. Vacío no es cero. */
export function numeroDeCelda(celda: string | undefined): number | null {
  if (celda === undefined) return null

  const limpio = celda.trim().replace(/\s/g, '').replace(',', '.')
  if (limpio === '') return null

  const valor = Number(limpio)
  return Number.isFinite(valor) && valor >= 0 ? valor : null
}
