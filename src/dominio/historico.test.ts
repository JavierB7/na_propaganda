import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { leerCsv, numeroDeCelda, normalizarClave } from '@/dominio/csv'
import { leerHistorico } from '@/dominio/historico'

const LINEAS = [
  { id: 'l-fil', nombre: 'Filosofía' },
  { id: 'l-art', nombre: 'Arteterapia' },
  { id: 'l-lib', nombre: 'Librería' },
]

describe('lectura de CSV', () => {
  test('encabezados y filas', () => {
    const { encabezados, filas } = leerCsv('linea,semana,mensajes\nFilosofía,2026-09-07,47\n')
    assert.deepEqual(encabezados, ['linea', 'semana', 'mensajes'])
    assert.deepEqual(filas, [{ linea: 'Filosofía', semana: '2026-09-07', mensajes: '47' }])
  })

  test('comas dentro de comillas y comillas escapadas', () => {
    const { filas } = leerCsv('linea,nota\nLibrería,"Se vendieron 150, no 90"\n')
    assert.equal(filas[0]!.nota, 'Se vendieron 150, no 90')

    const { filas: otras } = leerCsv('linea,nota\nLibrería,"Dijo ""ya está"" y siguió"\n')
    assert.equal(otras[0]!.nota, 'Dijo "ya está" y siguió')
  })

  test('CRLF, punto y coma como separador, y BOM', () => {
    const { filas } = leerCsv('﻿Linea;Semana\r\nFilosofía;2026-09-07\r\n')
    assert.deepEqual(filas, [{ linea: 'Filosofía', semana: '2026-09-07' }])
  })

  test('las filas totalmente vacías se ignoran', () => {
    const { filas } = leerCsv('linea,mensajes\nFilosofía,47\n\n,\nArteterapia,31\n')
    assert.equal(filas.length, 2)
  })

  test('nombres de columna tolerantes', () => {
    assert.equal(normalizarClave('  Semana Inicio '), 'semana_inicio')
    assert.equal(normalizarClave('Inversión'), 'inversion')
  })

  test('celda vacía es nulo, no cero', () => {
    assert.equal(numeroDeCelda(''), null)
    assert.equal(numeroDeCelda('   '), null)
    assert.equal(numeroDeCelda(undefined), null)
    assert.equal(numeroDeCelda('0'), 0)
    assert.equal(numeroDeCelda('1 240'), 1240)
    assert.equal(numeroDeCelda('3,5'), 3.5)
    assert.equal(numeroDeCelda('-4'), null)
    assert.equal(numeroDeCelda('abc'), null)
  })
})

describe('lectura del histórico', () => {
  test('el total del cuaderno va al campo de total reportado', () => {
    const { validas, rechazadas } = leerHistorico(
      'linea,semana,mensajes\nFilosofía,2026-09-07,47\nArteterapia,2026-09-07,31\n',
      LINEAS,
    )

    assert.equal(rechazadas.length, 0)
    assert.equal(validas.length, 2)
    assert.equal(validas[0]!.lineaId, 'l-fil')
    assert.equal(validas[0]!.mensajesTotalReportado, 47)
    // El desglose no se inventa: no hay mensajes_meta ni comentarios.
    assert.equal(validas[0]!.semanaInicio, '2026-09-07')
  })

  test('resuelve la línea sin distinguir acentos ni mayúsculas', () => {
    const { validas } = leerHistorico('linea,semana,mensajes\nFILOSOFIA,2026-09-07,47\n', LINEAS)
    assert.equal(validas[0]!.lineaId, 'l-fil')
  })

  test('acepta nombres alternativos de columna', () => {
    const { validas } = leerHistorico(
      'Curso,Fecha,Escribieron,Visitas\nLibrería,2026-09-07,90,4200\n',
      LINEAS,
    )
    assert.equal(validas[0]!.mensajesTotalReportado, 90)
    assert.equal(validas[0]!.reproducciones, 4200)
  })

  test('una fecha que no es lunes se mueve a su lunes y queda marcada', () => {
    // 2026-09-10 es jueves.
    const { validas } = leerHistorico('linea,semana,mensajes\nFilosofía,2026-09-10,47\n', LINEAS)
    assert.equal(validas[0]!.semanaInicio, '2026-09-07')
    assert.equal(validas[0]!.semanaNormalizada, true)
  })

  test('rechaza una línea que no existe, sin tumbar el resto', () => {
    const { validas, rechazadas } = leerHistorico(
      'linea,semana,mensajes\nPodcast,2026-09-07,12\nFilosofía,2026-09-07,47\n',
      LINEAS,
    )

    assert.equal(validas.length, 1)
    assert.equal(rechazadas.length, 1)
    assert.equal(rechazadas[0]!.numero, 2)
    assert.match(rechazadas[0]!.motivo, /No existe una línea/)
  })

  test('rechaza fechas mal formadas', () => {
    const { rechazadas } = leerHistorico('linea,semana,mensajes\nFilosofía,07/09/2026,47\n', LINEAS)
    assert.equal(rechazadas.length, 1)
    assert.match(rechazadas[0]!.motivo, /AAAA-MM-DD/)
  })

  test('rechaza una fila sin ninguna cifra', () => {
    // Crearla haría ver una semana sin dato como registrada.
    const { validas, rechazadas } = leerHistorico(
      'linea,semana,mensajes\nFilosofía,2026-09-07,\n',
      LINEAS,
    )
    assert.equal(validas.length, 0)
    assert.equal(rechazadas.length, 1)
    assert.match(rechazadas[0]!.motivo, /ninguna cifra/)
  })

  test('un cero sí es una cifra y se carga', () => {
    const { validas } = leerHistorico('linea,semana,mensajes\nFilosofía,2026-09-07,0\n', LINEAS)
    assert.equal(validas.length, 1)
    assert.equal(validas[0]!.mensajesTotalReportado, 0)
  })

  test('rechaza el duplicado de línea y semana dentro del mismo archivo', () => {
    const { validas, rechazadas } = leerHistorico(
      [
        'linea,semana,mensajes',
        'Filosofía,2026-09-07,47',
        // Jueves de la misma semana: normaliza al mismo lunes.
        'Filosofía,2026-09-10,50',
      ].join('\n'),
      LINEAS,
    )

    assert.equal(validas.length, 1)
    assert.equal(rechazadas.length, 1)
    assert.match(rechazadas[0]!.motivo, /Repite la línea/)
  })

  test('las semanas ausentes del archivo simplemente no existen', () => {
    const { validas } = leerHistorico(
      ['linea,semana,mensajes', 'Filosofía,2026-08-31,44', 'Filosofía,2026-09-14,19'].join('\n'),
      LINEAS,
    )

    const semanas = validas.map((fila) => fila.semanaInicio)
    assert.deepEqual(semanas, ['2026-08-31', '2026-09-14'])
    // La semana del 7 no aparece: no es una semana de cero mensajes.
    assert.equal(semanas.includes('2026-09-07'), false)
  })

  test('la nota del cuaderno se conserva', () => {
    const { validas } = leerHistorico(
      'linea,semana,mensajes,nota\nFilosofía,2026-09-07,47,"Antes del cambio de política de Meta"\n',
      LINEAS,
    )
    assert.equal(validas[0]!.nota, 'Antes del cambio de política de Meta')
  })

  test('archivo vacío o solo con encabezados', () => {
    assert.deepEqual(leerHistorico('', LINEAS), { validas: [], rechazadas: [] })
    assert.deepEqual(leerHistorico('linea,semana,mensajes\n', LINEAS), {
      validas: [],
      rechazadas: [],
    })
  })
})
