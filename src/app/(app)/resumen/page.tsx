import type { Metadata } from 'next'
import Link from 'next/link'
import { lineas, piezas, registrosDeSemanas } from '@/datos/consultas'
import { armarSemana, totalesPorLinea } from '@/dominio/semanaDeTrabajo'
import {
  esLunes,
  lunesDe,
  rangoCorto,
  semanaActual,
  semanaAnterior,
} from '@/dominio/semana'
import { esTotalSinDesglose, inversionDeRegistro, totalDeRegistro } from '@/dominio/totales'
import { NavegadorDeSemana } from '@/componentes/NavegadorDeSemana'
import estilos from './resumen.module.css'

export const metadata: Metadata = { title: 'Resumen de la semana · Bitácora' }

/** Cifra o guion largo. Ausencia de dato nunca se dibuja como cero. */
function Cifra({ valor, clase }: { valor: number | null; clase?: string }) {
  if (valor === null) {
    return (
      <span className={estilos.ausente} aria-label="Sin dato">
        —
      </span>
    )
  }
  return <span className={clase ?? estilos.numerica}>{valor.toLocaleString('es-VE')}</span>
}

export default async function PaginaResumen({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}) {
  const { s } = await searchParams
  const semanaInicio = s && esLunes(s) ? s : s ? lunesDe(s) : semanaActual()

  const previa1 = semanaAnterior(semanaInicio)
  const previa2 = semanaAnterior(previa1)

  const [todasLasLineas, todasLasPiezas, registros] = await Promise.all([
    lineas({ soloActivas: true }),
    piezas(),
    registrosDeSemanas([semanaInicio, previa1, previa2]),
  ])

  const deLaSemana = registros.filter((r) => r.semana_inicio === semanaInicio)
  const semana = armarSemana(todasLasLineas, todasLasPiezas, deLaSemana)

  const totales1 = totalesPorLinea(registros.filter((r) => r.semana_inicio === previa1))
  const totales2 = totalesPorLinea(registros.filter((r) => r.semana_inicio === previa2))

  const conRegistros = semana.filter((grupo) => grupo.modo !== 'vacio')

  return (
    <>
      <NavegadorDeSemana semana={semanaInicio} ruta="/resumen" />

      <p className={estilos.intro}>
        Mensajes recibidos por línea. Cada línea tiene su propia escala: no se
        comparan entre sí.
      </p>

      {conRegistros.length === 0 ? (
        <div className={estilos.vacioSemana}>
          <h2 className={estilos.vacioTitulo}>Esta semana no tiene registros</h2>
          <p>
            Nadie cargó cifras todavía.{' '}
            <Link href={{ pathname: '/semana', query: { s: semanaInicio } }}>
              Registrar la semana
            </Link>
            .
          </p>
        </div>
      ) : (
        semana.map((grupo) => {
          const registradosDePieza = grupo.piezas
            .map((fila) => fila.registro)
            .filter((registro) => registro !== null)

          const historico =
            grupo.agregado !== null && esTotalSinDesglose(grupo.agregado)

          return (
            <section className={estilos.linea} key={grupo.linea.id}>
              <div className={estilos.encabezadoLinea}>
                <div>
                  <h2 className={estilos.nombre}>{grupo.linea.nombre}</h2>
                  {grupo.linea.unidad_exito && (
                    <p className={estilos.unidadExito}>{grupo.linea.unidad_exito}</p>
                  )}
                </div>

                <div className={estilos.totalBloque}>
                  {grupo.modo === 'vacio' ? (
                    <span className={estilos.sinRegistrar}>Sin registrar</span>
                  ) : (
                    <>
                      <span className={estilos.totalEtiqueta}>Mensajes</span>
                      <Cifra valor={grupo.total} clase={estilos.totalCifra} />
                    </>
                  )}
                </div>
              </div>

              {historico && (
                <p className={estilos.historico}>
                  Cifra histórica: total ya sumado, sin desglose entre Meta y
                  comentarios.
                </p>
              )}

              <div className={estilos.bloquePrevias}>
                <p className={estilos.tituloPrevias}>
                  Mensajes de esta línea en las semanas anteriores
                </p>
                <div className={estilos.previas}>
                  {[
                    {
                      semana: previa1,
                      cuando: 'Semana anterior',
                      total: totales1.get(grupo.linea.id),
                    },
                    {
                      semana: previa2,
                      cuando: 'Dos semanas antes',
                      total: totales2.get(grupo.linea.id),
                    },
                  ].map((previa) => (
                    <div className={estilos.previa} key={previa.semana}>
                      <span className={estilos.previaCuando}>{previa.cuando}</span>
                      <span className={estilos.previaEtiqueta}>
                        {rangoCorto(previa.semana)}
                      </span>
                      {previa.total === undefined || previa.total === null ? (
                        <span className={estilos.previaSinDato} aria-label="Sin dato">
                          —
                        </span>
                      ) : (
                        <span className={estilos.previaCifra}>
                          {previa.total.toLocaleString('es-VE')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {grupo.modo === 'desglose' && registradosDePieza.length > 0 && (
                <details className={estilos.desglose}>
                  <summary className={estilos.abrirDesglose}>
                    Ver el detalle de las {registradosDePieza.length}{' '}
                    {registradosDePieza.length === 1 ? 'pieza' : 'piezas'}
                  </summary>

                  <div className={estilos.marco}>
                    <table className={estilos.tabla}>
                      <thead>
                        <tr>
                          <th scope="col">Pieza</th>
                          <th scope="col" className={estilos.numerica}>
                            Reprod.
                          </th>
                          <th scope="col" className={estilos.numerica}>
                            Mensajes Meta
                          </th>
                          <th scope="col" className={estilos.numerica}>
                            Coment.
                          </th>
                          <th scope="col" className={estilos.numerica}>
                            Total
                          </th>
                          <th scope="col" className={estilos.numerica}>
                            Inversión
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.piezas
                          .filter((fila) => fila.registro !== null)
                          .map((fila) => {
                            const registro = fila.registro!
                            return (
                              <tr key={fila.pieza.id}>
                                <th scope="row">
                                  <span className={estilos.codigo}>{fila.pieza.codigo}</span>
                                  <br />
                                  <span className={estilos.descripcionPieza}>
                                    {fila.pieza.descripcion}
                                  </span>
                                </th>
                                <td className={estilos.numerica}>
                                  <Cifra valor={registro.reproducciones} />
                                </td>
                                <td className={estilos.numerica}>
                                  <Cifra valor={registro.mensajes_meta} />
                                </td>
                                <td className={estilos.numerica}>
                                  <Cifra valor={registro.consultas_comentarios} />
                                </td>
                                <td className={estilos.numerica}>
                                  <Cifra valor={totalDeRegistro(registro)} />
                                </td>
                                <td className={estilos.numerica}>
                                  {inversionDeRegistro(registro) === null ? (
                                    <span className={estilos.ausente} aria-label="Sin dato">
                                      —
                                    </span>
                                  ) : (
                                    <>
                                      ${inversionDeRegistro(registro)!.toFixed(2)}
                                      {registro.inversion_usd_dia !== null &&
                                        registro.dias_activos !== null && (
                                          <>
                                            {' '}
                                            <span className={estilos.descripcionPieza}>
                                              ({registro.inversion_usd_dia} × {registro.dias_activos}{' '}
                                              d)
                                            </span>
                                          </>
                                        )}
                                    </>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {grupo.modo === 'agregado' && (
                <p className={estilos.notaAgregado}>
                  Esta semana se registró como total de línea: no tiene desglose
                  por pieza.
                </p>
              )}
            </section>
          )
        })
      )}
    </>
  )
}
