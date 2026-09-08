import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  lunesDe,
  esLunes,
  semanaActual,
  semanaAnterior,
  semanaSiguiente,
  domingoDe,
  rangoCorto,
  rangoLargo,
  etiquetaBreve,
} from '@/dominio/semana'
import {
  totalDeRegistro,
  totalDeRegistros,
  esTotalSinDesglose,
  sumaDeMetrica,
  inversionDeRegistro,
} from '@/dominio/totales'
import { armarSemana, progresoDeSemana, totalesPorLinea } from '@/dominio/semanaDeTrabajo'
import type { Linea, Pieza, RegistroSemanal } from '@/lib/supabase/tipos'

// ── Ayudas de construcción ────────────────────────────────────────────────

const atribucion = {
  creado_por: null,
  creado_en: '2026-09-08T00:00:00Z',
  actualizado_por: null,
  actualizado_en: '2026-09-08T00:00:00Z',
}

function linea(parcial: Partial<Linea> & Pick<Linea, 'id' | 'nombre'>): Linea {
  return {
    prefijo: 'XXX',
    unidad_exito: null,
    activo: true,
    orden: 0,
    ...atribucion,
    ...parcial,
  }
}

function pieza(parcial: Partial<Pieza> & Pick<Pieza, 'id' | 'linea_id'>): Pieza {
  return {
    codigo: 'XXX-2609-01',
    descripcion: 'Una pieza',
    fecha_subida: '2026-09-01',
    activo: true,
    meta_ad_id: null,
    ...atribucion,
    ...parcial,
  }
}

function registro(
  parcial: Partial<RegistroSemanal> & Pick<RegistroSemanal, 'id' | 'linea_id'>,
): RegistroSemanal {
  return {
    semana_inicio: '2026-09-07',
    pieza_id: null,
    reproducciones: null,
    mensajes_meta: null,
    consultas_comentarios: null,
    mensajes_total_reportado: null,
    inversion_usd_dia: null,
    dias_activos: null,
    nota: null,
    ...atribucion,
    ...parcial,
  }
}

// ── Semana ────────────────────────────────────────────────────────────────

describe('semana', () => {
  test('el lunes de un jueves es el lunes de esa misma semana', () => {
    // 2026-09-10 es jueves; su lunes es el 2026-09-07.
    assert.equal(lunesDe('2026-09-10'), '2026-09-07')
  })

  test('el lunes de un lunes es él mismo', () => {
    assert.equal(lunesDe('2026-09-07'), '2026-09-07')
  })

  test('el lunes de un domingo es el lunes anterior, no el siguiente', () => {
    // 2026-09-13 es domingo: cierra la semana que abrió el 7.
    assert.equal(lunesDe('2026-09-13'), '2026-09-07')
  })

  test('cruza el fin de mes y el fin de año', () => {
    assert.equal(lunesDe('2026-03-01'), '2026-02-23')
    assert.equal(lunesDe('2027-01-01'), '2026-12-28')
  })

  test('esLunes distingue el lunes del resto', () => {
    assert.equal(esLunes('2026-09-07'), true)
    assert.equal(esLunes('2026-09-10'), false)
  })

  test('la semana en curso es el lunes de hoy', () => {
    // Un jueves a media tarde en Caracas (UTC-4).
    const jueves = new Date('2026-09-10T18:30:00Z')
    assert.equal(semanaActual(jueves), '2026-09-07')
  })

  test('navegar semanas no se descuadra en el cambio de mes', () => {
    assert.equal(semanaAnterior('2026-09-07'), '2026-08-31')
    assert.equal(semanaSiguiente('2026-08-31'), '2026-09-07')
    assert.equal(domingoDe('2026-09-07'), '2026-09-13')
  })

  test('rango corto: repite el mes solo si la semana lo cruza', () => {
    assert.equal(rangoCorto('2026-09-07'), '7 – 13 sep')
    assert.equal(rangoCorto('2026-08-31'), '31 ago – 6 sep')
  })

  test('rango largo para escritorio', () => {
    assert.equal(rangoLargo('2026-09-07'), 'Semana del 7 al 13 de septiembre')
    assert.equal(
      rangoLargo('2026-08-31'),
      'Semana del 31 de agosto al 6 de septiembre',
    )
    assert.equal(
      rangoLargo('2026-12-28'),
      'Semana del 28 de diciembre de 2026 al 3 de enero de 2027',
    )
  })

  test('etiqueta breve para las columnas de semanas previas', () => {
    assert.equal(etiquetaBreve('2026-09-01'), '31 ago')
    assert.equal(etiquetaBreve('2026-08-31'), '31 ago')
  })

  test('rechaza fechas mal formadas', () => {
    assert.throws(() => lunesDe('08/09/2026'))
    assert.throws(() => lunesDe('2026-13-45'))
  })
})

// ── Totales ───────────────────────────────────────────────────────────────

describe('totales de mensajes', () => {
  test('suma lo de Meta y lo de comentarios: 40 + 7 = 47', () => {
    assert.equal(
      totalDeRegistro({
        mensajes_meta: 40,
        consultas_comentarios: 7,
        mensajes_total_reportado: null,
      }),
      47,
    )
  })

  test('solo Meta, sin consultas en comentarios', () => {
    assert.equal(
      totalDeRegistro({
        mensajes_meta: 18,
        consultas_comentarios: null,
        mensajes_total_reportado: null,
      }),
      18,
    )
  })

  test('sin ningún dato de mensajes el total es nulo, no cero', () => {
    assert.equal(
      totalDeRegistro({
        mensajes_meta: null,
        consultas_comentarios: null,
        mensajes_total_reportado: null,
      }),
      null,
    )
  })

  test('un cero registrado sí es cero', () => {
    assert.equal(
      totalDeRegistro({
        mensajes_meta: 0,
        consultas_comentarios: null,
        mensajes_total_reportado: null,
      }),
      0,
    )
  })

  test('el total reportado tiene precedencia sobre la suma', () => {
    // Fila histórica: el cuaderno solo conserva el 47 ya sumado.
    assert.equal(
      totalDeRegistro({
        mensajes_meta: null,
        consultas_comentarios: null,
        mensajes_total_reportado: 47,
      }),
      47,
    )
  })

  test('un registro histórico se distingue de uno desglosado', () => {
    const historico = {
      mensajes_meta: null,
      consultas_comentarios: null,
      mensajes_total_reportado: 47,
    }
    const desglosado = {
      mensajes_meta: 40,
      consultas_comentarios: 7,
      mensajes_total_reportado: null,
    }

    assert.equal(esTotalSinDesglose(historico), true)
    assert.equal(esTotalSinDesglose(desglosado), false)
  })

  test('la suma de varios registros ignora los que no traen dato', () => {
    assert.equal(
      totalDeRegistros([
        { mensajes_meta: 18, consultas_comentarios: 3, mensajes_total_reportado: null },
        { mensajes_meta: 11, consultas_comentarios: null, mensajes_total_reportado: null },
        { mensajes_meta: null, consultas_comentarios: null, mensajes_total_reportado: null },
      ]),
      32,
    )
  })

  test('si ningún registro trae dato, la suma es nula', () => {
    assert.equal(
      totalDeRegistros([
        { mensajes_meta: null, consultas_comentarios: null, mensajes_total_reportado: null },
        { mensajes_meta: null, consultas_comentarios: null, mensajes_total_reportado: null },
      ]),
      null,
    )
  })

  test('una colección vacía da nulo, no cero', () => {
    assert.equal(totalDeRegistros([]), null)
  })

  test('suma de una métrica cualquiera con la misma regla de nulos', () => {
    const filas = [{ reproducciones: 1240 }, { reproducciones: null }, { reproducciones: 980 }]
    assert.equal(sumaDeMetrica(filas, (f) => f.reproducciones), 2220)
    assert.equal(
      sumaDeMetrica([{ reproducciones: null }], (f) => f.reproducciones),
      null,
    )
  })

  test('la inversión necesita los dos factores', () => {
    assert.equal(inversionDeRegistro({ inversion_usd_dia: 3, dias_activos: 7 }), 21)
    assert.equal(inversionDeRegistro({ inversion_usd_dia: 3, dias_activos: null }), null)
    assert.equal(inversionDeRegistro({ inversion_usd_dia: null, dias_activos: 7 }), null)
  })
})

// ── Forma de la semana ────────────────────────────────────────────────────

describe('armado de la semana', () => {
  const filosofia = linea({ id: 'l-fil', nombre: 'Filosofía', prefijo: 'FIL', orden: 10 })
  const arteterapia = linea({
    id: 'l-art',
    nombre: 'Arteterapia',
    prefijo: 'ART',
    orden: 20,
    unidad_exito: 'Dos asistentes ya es triunfo',
  })

  test('las líneas salen en el orden configurado, no por total', () => {
    const armada = armarSemana([arteterapia, filosofia], [], [])
    assert.deepEqual(
      armada.map((g) => g.linea.nombre),
      ['Filosofía', 'Arteterapia'],
    )
  })

  test('línea con desglose: total sumado de sus piezas', () => {
    const p1 = pieza({ id: 'p-1', linea_id: 'l-fil', codigo: 'FIL-2609-01' })
    const p2 = pieza({ id: 'p-2', linea_id: 'l-fil', codigo: 'FIL-2609-02' })

    const armada = armarSemana(
      [filosofia],
      [p1, p2],
      [
        registro({ id: 'r-1', linea_id: 'l-fil', pieza_id: 'p-1', mensajes_meta: 18 }),
        registro({ id: 'r-2', linea_id: 'l-fil', pieza_id: 'p-2', mensajes_meta: 11 }),
      ],
    )

    assert.equal(armada[0]!.modo, 'desglose')
    assert.equal(armada[0]!.total, 29)
    // Con piezas ya registradas, no se ofrece el agregado: la base de datos
    // lo rechazaría por doble conteo.
    assert.equal(armada[0]!.permiteAgregado, false)
  })

  test('línea con agregado: total de la fila sin pieza', () => {
    const armada = armarSemana(
      [arteterapia],
      [],
      [registro({ id: 'r-3', linea_id: 'l-art', mensajes_total_reportado: 31 })],
    )

    assert.equal(armada[0]!.modo, 'agregado')
    assert.equal(armada[0]!.total, 31)
    assert.equal(armada[0]!.piezas.length, 0)
  })

  test('línea sin registros queda vacía con total nulo, no cero', () => {
    const armada = armarSemana([arteterapia], [], [])
    assert.equal(armada[0]!.modo, 'vacio')
    assert.equal(armada[0]!.total, null)
    assert.equal(armada[0]!.permiteAgregado, true)
  })

  test('semana mixta: una línea por pieza y otra por total', () => {
    const p1 = pieza({ id: 'p-1', linea_id: 'l-fil' })
    const armada = armarSemana(
      [filosofia, arteterapia],
      [p1],
      [
        registro({ id: 'r-1', linea_id: 'l-fil', pieza_id: 'p-1', mensajes_meta: 29 }),
        registro({ id: 'r-2', linea_id: 'l-art', mensajes_meta: 31 }),
      ],
    )

    assert.equal(armada[0]!.modo, 'desglose')
    assert.equal(armada[1]!.modo, 'agregado')
  })

  test('una pieza desactivada con registro sigue visible', () => {
    const apagada = pieza({ id: 'p-9', linea_id: 'l-fil', activo: false })

    const conRegistro = armarSemana(
      [filosofia],
      [apagada],
      [registro({ id: 'r-9', linea_id: 'l-fil', pieza_id: 'p-9', mensajes_meta: 4 })],
    )
    assert.equal(conRegistro[0]!.piezas.length, 1)

    const sinRegistro = armarSemana([filosofia], [apagada], [])
    assert.equal(sinRegistro[0]!.piezas.length, 0)
  })

  test('las piezas de una línea no se mezclan con las de otra', () => {
    const armada = armarSemana(
      [filosofia, arteterapia],
      [pieza({ id: 'p-1', linea_id: 'l-fil' }), pieza({ id: 'p-2', linea_id: 'l-art' })],
      [],
    )
    assert.equal(armada[0]!.piezas[0]!.pieza.id, 'p-1')
    assert.equal(armada[1]!.piezas[0]!.pieza.id, 'p-2')
  })
})

describe('progreso de la semana', () => {
  const filosofia = linea({ id: 'l-fil', nombre: 'Filosofía', orden: 10 })
  const arteterapia = linea({ id: 'l-art', nombre: 'Arteterapia', orden: 20 })
  const libreria = linea({ id: 'l-lib', nombre: 'Librería', orden: 30 })

  test('tres de cinco: dos piezas de tres, más una línea sin piezas', () => {
    const piezas = [
      pieza({ id: 'p-1', linea_id: 'l-fil' }),
      pieza({ id: 'p-2', linea_id: 'l-fil' }),
      pieza({ id: 'p-3', linea_id: 'l-fil' }),
      pieza({ id: 'p-4', linea_id: 'l-art' }),
    ]
    const registros = [
      registro({ id: 'r-1', linea_id: 'l-fil', pieza_id: 'p-1', mensajes_meta: 1 }),
      registro({ id: 'r-2', linea_id: 'l-fil', pieza_id: 'p-2', mensajes_meta: 2 }),
      registro({ id: 'r-3', linea_id: 'l-lib', mensajes_meta: 9 }),
    ]

    const progreso = progresoDeSemana(
      armarSemana([filosofia, arteterapia, libreria], piezas, registros),
    )

    // Esperadas: 3 piezas de Filosofía + 1 de Arteterapia + 1 agregado de Librería.
    assert.deepEqual(progreso, { esperadas: 5, registradas: 3, completa: false })
  })

  test('semana completa', () => {
    const piezas = [pieza({ id: 'p-1', linea_id: 'l-fil' })]
    const registros = [
      registro({ id: 'r-1', linea_id: 'l-fil', pieza_id: 'p-1', mensajes_meta: 5 }),
      registro({ id: 'r-2', linea_id: 'l-art', mensajes_meta: 3 }),
    ]

    const progreso = progresoDeSemana(armarSemana([filosofia, arteterapia], piezas, registros))
    assert.deepEqual(progreso, { esperadas: 2, registradas: 2, completa: true })
  })

  test('una semana sin nada esperado no cuenta como completa', () => {
    assert.deepEqual(progresoDeSemana([]), {
      esperadas: 0,
      registradas: 0,
      completa: false,
    })
  })

  test('una pieza inactiva con registro no infla lo esperado', () => {
    const armada = armarSemana(
      [filosofia],
      [pieza({ id: 'p-1', linea_id: 'l-fil', activo: false })],
      [registro({ id: 'r-1', linea_id: 'l-fil', pieza_id: 'p-1', mensajes_meta: 5 })],
    )
    // Sin piezas activas, lo esperado de la línea es su agregado, que no está.
    assert.deepEqual(progresoDeSemana(armada), {
      esperadas: 1,
      registradas: 0,
      completa: false,
    })
  })
})

describe('totales por línea', () => {
  test('agrupa e ignora los registros sin dato', () => {
    const totales = totalesPorLinea([
      registro({ id: 'r-1', linea_id: 'l-fil', pieza_id: 'p-1', mensajes_meta: 18 }),
      registro({ id: 'r-2', linea_id: 'l-fil', pieza_id: 'p-2', mensajes_meta: 11 }),
      registro({ id: 'r-3', linea_id: 'l-art', mensajes_total_reportado: 31 }),
      registro({ id: 'r-4', linea_id: 'l-lib' }),
    ])

    assert.equal(totales.get('l-fil'), 29)
    assert.equal(totales.get('l-art'), 31)
    // Registrada pero sin cifra: nulo, no cero.
    assert.equal(totales.get('l-lib'), null)
    // Nunca registrada: ausente del mapa.
    assert.equal(totales.has('l-caf'), false)
  })
})
