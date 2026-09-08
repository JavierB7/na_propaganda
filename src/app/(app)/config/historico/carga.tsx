'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cargarHistorico, type ResultadoCarga } from '@/acciones/historico'
import { leerHistorico, type LecturaHistorica } from '@/dominio/historico'
import estilos from './historico.module.css'

/**
 * Vista previa antes de confirmar.
 *
 * El archivo se interpreta en el navegador con el mismo módulo que usa el
 * servidor, así que lo que se ve es lo que se va a cargar. La escritura la
 * hace el servidor, que además rechaza lo que choque con lo ya cargado.
 */
export function CargaHistorica({
  lineas,
}: {
  lineas: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [cargando, iniciarCarga] = useTransition()

  const [texto, setTexto] = useState<string | null>(null)
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null)
  const [lectura, setLectura] = useState<LecturaHistorica | null>(null)
  const [resultado, setResultado] = useState<ResultadoCarga | null>(null)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  async function elegirArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    setResultado(null)
    setErrorLocal(null)

    if (!archivo) {
      setTexto(null)
      setLectura(null)
      setNombreArchivo(null)
      return
    }

    try {
      const contenido = await archivo.text()
      setTexto(contenido)
      setNombreArchivo(archivo.name)
      setLectura(leerHistorico(contenido, lineas))
    } catch {
      setErrorLocal(
        'No se pudo leer el archivo. Puedes guardarlo de nuevo como CSV e intentar otra vez.',
      )
    }
  }

  function confirmar() {
    if (!texto) return
    setResultado(null)

    iniciarCarga(async () => {
      const salida = await cargarHistorico(texto)
      setResultado(salida)

      if (salida.ok && salida.cargadas > 0) {
        setTexto(null)
        setLectura(null)
        setNombreArchivo(null)
        router.refresh()
      }
    })
  }

  function descartar() {
    setTexto(null)
    setLectura(null)
    setNombreArchivo(null)
    setResultado(null)
    setErrorLocal(null)
  }

  return (
    <div>
      <div className={estilos.selector}>
        <input
          className={estilos.archivo}
          id="archivo"
          type="file"
          accept=".csv,text/csv,text/plain"
          onChange={elegirArchivo}
        />
        <label className={estilos.etiquetaArchivo} htmlFor="archivo">
          Elegir archivo CSV
        </label>
        <span
          className={
            nombreArchivo ? estilos.nombreArchivo : estilos.nombreArchivoVacio
          }
        >
          {nombreArchivo ?? 'Ningún archivo elegido'}
        </span>
      </div>

      {errorLocal && <p className={estilos.error}>{errorLocal}</p>}

      {lectura && (
        <div className={estilos.resumenCarga}>
          <p>
            {lectura.validas.length}{' '}
            {lectura.validas.length === 1 ? 'fila lista' : 'filas listas'} para
            cargar
            {lectura.rechazadas.length > 0 &&
              `, ${lectura.rechazadas.length} con problemas`}
            .
          </p>

          {lectura.validas.length > 0 && (
            <div className={estilos.marco}>
              <table className={estilos.tabla}>
                <thead>
                  <tr>
                    <th scope="col">Línea</th>
                    <th scope="col">Semana</th>
                    <th scope="col" className={estilos.numerica}>
                      Mensajes
                    </th>
                    <th scope="col" className={estilos.numerica}>
                      Reprod.
                    </th>
                    <th scope="col" className={estilos.numerica}>
                      $/día
                    </th>
                    <th scope="col" className={estilos.numerica}>
                      Días
                    </th>
                    <th scope="col">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {lectura.validas.map((fila) => (
                    <tr key={`${fila.lineaId}-${fila.semanaInicio}`}>
                      <td>{fila.lineaNombre}</td>
                      <td>
                        {fila.semanaInicio}
                        {fila.semanaNormalizada && (
                          <>
                            <br />
                            <span className={estilos.marca}>
                              La fecha del archivo no era lunes: se movió al lunes
                              de esa semana.
                            </span>
                          </>
                        )}
                      </td>
                      <Celda valor={fila.mensajesTotalReportado} />
                      <Celda valor={fila.reproducciones} />
                      <Celda valor={fila.inversionUsdDia} />
                      <Celda valor={fila.diasActivos} />
                      <td>{fila.nota ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lectura.rechazadas.length > 0 && (
            <>
              <h3 className={estilos.subtitulo}>Filas que no se van a cargar</h3>
              <div className={estilos.marco}>
                <table className={estilos.tabla}>
                  <thead>
                    <tr>
                      <th scope="col">Fila</th>
                      <th scope="col">Por qué</th>
                      <th scope="col">Contenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lectura.rechazadas.map((fila) => (
                      <tr key={`${fila.numero}-${fila.motivo}`}>
                        <td className={estilos.numerica}>{fila.numero}</td>
                        <td>{fila.motivo}</td>
                        <td>{fila.contenido}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className={estilos.acciones}>
            <button
              className={estilos.boton}
              type="button"
              onClick={confirmar}
              disabled={cargando || lectura.validas.length === 0}
            >
              {cargando
                ? 'Cargando'
                : `Cargar ${lectura.validas.length} ${
                    lectura.validas.length === 1 ? 'fila' : 'filas'
                  }`}
            </button>
            <button className={estilos.botonSecundario} type="button" onClick={descartar}>
              Elegir otro archivo
            </button>
          </div>
        </div>
      )}

      {resultado &&
        (resultado.ok ? (
          <div className={estilos.exito}>
            <p>
              Se cargaron {resultado.cargadas}{' '}
              {resultado.cargadas === 1 ? 'fila' : 'filas'}.
            </p>
            {resultado.normalizadas > 0 && (
              <p>
                {resultado.normalizadas}{' '}
                {resultado.normalizadas === 1 ? 'fecha' : 'fechas'} no venían en
                lunes y se movieron al lunes de su semana.
              </p>
            )}
            {resultado.rechazadas.length > 0 && (
              <p>
                {resultado.rechazadas.length}{' '}
                {resultado.rechazadas.length === 1 ? 'fila' : 'filas'} quedaron
                sin cargar. Están listadas arriba con el motivo.
              </p>
            )}
          </div>
        ) : (
          <p className={estilos.error}>{resultado.error}</p>
        ))}
    </div>
  )
}

function Celda({ valor }: { valor: number | null }) {
  if (valor === null) {
    return (
      <td className={estilos.ausente} aria-label="Sin dato">
        —
      </td>
    )
  }
  return <td className={estilos.numerica}>{valor}</td>
}
