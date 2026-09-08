/**
 * Verifica el contraste de los pares de color que el sistema realmente usa,
 * y que --cromo no aparezca nunca como color de texto.
 *
 *   node scripts/contraste.mjs
 *
 * Se corre como script y no como prueba de node:test porque lee los tokens
 * del CSS: si alguien cambia un token, esto lo detecta.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const GLOBALES = join(RAIZ, 'src/app/globales.css')

// ── Tokens ─────────────────────────────────────────────────────────────────

const css = readFileSync(GLOBALES, 'utf8')
const tokens = {}
for (const [, nombre, valor] of css.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
  tokens[nombre] = valor
}

function rgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
}

function luminancia(hex) {
  const [r, g, b] = rgb(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const la = luminancia(a)
  const lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// ── Pares que el sistema usa de verdad ─────────────────────────────────────
// `grande` marca el texto de 24px o más en negrita, o 18.66px+ bold, donde el
// umbral AA es 3:1 en lugar de 4.5:1. Las cifras viven en 28px y 40px.

const PARES = [
  { texto: 'tinta', fondo: 'papel', donde: 'cuerpo de la página' },
  { texto: 'tinta-suave', fondo: 'papel', donde: 'texto secundario y unidad de éxito' },
  { texto: 'tinta-suave', fondo: 'papel-hundido', donde: 'avisos y bloques hundidos' },
  { texto: 'pino', fondo: 'papel', donde: 'cifras, enlaces, botones de texto' },
  { texto: 'pino', fondo: 'papel-hundido', donde: 'enlaces dentro de avisos' },
  { texto: 'oliva-texto', fondo: 'papel', donde: 'total derivado' },
  { texto: 'oliva-texto', fondo: 'papel-hundido', donde: 'total derivado en bloque hundido' },
  { texto: 'atencion-texto', fondo: 'papel', donde: 'estado sin registrar, pieza desactivada' },
  { texto: 'atencion-texto', fondo: 'papel-hundido', donde: 'avisos de la carga histórica' },
  { texto: 'papel', fondo: 'pino', donde: 'botón primario' },
  { texto: 'papel', fondo: 'profundo', donde: 'barra de la aplicación' },
  { texto: 'tinta', fondo: 'cromo', donde: 'texto oscuro sobre relleno amarillo' },
]

let fallas = 0

console.log('Contraste de los pares en uso\n')
for (const par of PARES) {
  const hexTexto = par.texto === 'papel' ? tokens['papel'] : tokens[par.texto]
  const hexFondo = tokens[par.fondo]

  if (!hexTexto || !hexFondo) {
    console.log(`  ?  ${par.texto} sobre ${par.fondo} — token ausente`)
    fallas += 1
    continue
  }

  const valor = ratio(hexTexto, hexFondo)
  const umbral = par.grande ? 3 : 4.5
  const pasa = valor >= umbral

  if (!pasa) fallas += 1

  console.log(
    `  ${pasa ? 'ok' : 'NO'} ${valor.toFixed(2)}:1 ` +
      `(mín ${umbral}) ${par.texto} sobre ${par.fondo} — ${par.donde}`,
  )
}

// ── --cromo nunca como color de texto ──────────────────────────────────────

function archivosCss(directorio) {
  const salida = []
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada)
    if (statSync(ruta).isDirectory()) {
      salida.push(...archivosCss(ruta))
    } else if (entrada.endsWith('.css')) {
      salida.push(ruta)
    }
  }
  return salida
}

console.log('\nUso de --cromo\n')
const malUso = []
for (const archivo of archivosCss(join(RAIZ, 'src'))) {
  const contenido = readFileSync(archivo, 'utf8')
  contenido.split('\n').forEach((linea, i) => {
    // `color:` a secas, no border-color ni background-color.
    if (/(^|[^-])color:\s*var\(--cromo\)/.test(linea)) {
      malUso.push(`${archivo.replace(`${RAIZ}/`, '')}:${i + 1} — ${linea.trim()}`)
    }
  })
}

if (malUso.length === 0) {
  console.log('  ok  no se usa como color de texto en ningún archivo')
} else {
  fallas += malUso.length
  for (const uso of malUso) console.log(`  NO  ${uso}`)
}

console.log('')
if (fallas > 0) {
  console.error(`${fallas} problema(s) de contraste.`)
  process.exit(1)
}
console.log('Todos los pares en uso alcanzan AA.')
