'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { guardarSemana, type EntradaDeCaptura } from '@/acciones/registros'
import { sumaDeMetrica, totalDeRegistro } from '@/dominio/totales'
import { etiquetaBreve, rangoParaMeta } from '@/dominio/semana'
import { MarcaDeSemana } from '@/componentes/MarcaDeSemana'
import type { LineaDeLaSemana, Progreso } from '@/dominio/semanaDeTrabajo'
import type { RegistroSemanal } from '@/lib/supabase/tipos'
import estilos from './captura.module.css'

type Valores = {
  reproducciones: string
  mensajesMeta: string
  consultasComentarios: string
  inversionUsd: string
  diasActivos: string
}

type Modo = 'desglose' | 'agregado'

/** Totales de una semana anterior, para las columnas de solo lectura. */
export type SemanaPrevia = {
  semana: string
  /** Total de mensajes por id de línea. Ausente: la línea no se registró. */
  porLinea: Record<string, number | null>
  /** Total de mensajes por id de pieza. Ausente: la pieza no se registró. */
  porPieza: Record<string, number | null>
}

type Previas = readonly (number | null)[]

const VACIO: Valores = {
  reproducciones: '',
  mensajesMeta: '',
  consultasComentarios: '',
  inversionUsd: '',
  diasActivos: '',
}

const CAMPOS = [
  { clave: 'reproducciones', etiqueta: 'Reproducciones' },
  { clave: 'mensajesMeta', etiqueta: 'Mensajes' },
  { clave: 'consultasComentarios', etiqueta: 'Consultas en comentarios' },
  { clave: 'inversionUsd', etiqueta: 'Inversión de la semana (USD)', ancho: true },
  { clave: 'diasActivos', etiqueta: 'Días activos' },
] as const satisfies readonly { clave: keyof Valores; etiqueta: string; ancho?: boolean }[]

function clave(lineaId: string, piezaId: string | null): string {
  return `${lineaId}|${piezaId ?? ''}`
}

function aTexto(valor: number | null): string {
  return valor === null ? '' : String(valor)
}

/** Mismo criterio que el servidor: vacío es ausencia, la coma vale como punto. */
function aNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return null
  const valor = Number(limpio)
  return Number.isFinite(valor) ? valor : null
}

/** Total en vivo de lo tecleado, con la misma regla que el servidor: nulo no es cero. */
function totalDeValores(valores: Valores): number | null {
  return totalDeRegistro({
    mensajes_meta: aNumero(valores.mensajesMeta),
    consultas_comentarios: aNumero(valores.consultasComentarios),
    mensajes_total_reportado: null,
  })
}

function desdeRegistro(registro: RegistroSemanal | null): Valores {
  if (!registro) return VACIO
  return {
    reproducciones: aTexto(registro.reproducciones),
    // Una fila histórica trae el total ya sumado y no su desglose. Se muestra
    // en el campo de mensajes para poder corregirla, pero al guardar vuelve a
    // escribirse como desglose: es la única forma de editarla sin mentir.
    mensajesMeta: aTexto(registro.mensajes_meta ?? registro.mensajes_total_reportado),
    consultasComentarios: aTexto(registro.consultas_comentarios),
    inversionUsd: aTexto(registro.inversion_usd),
    diasActivos: aTexto(registro.dias_activos),
  }
}

function estadoInicial(semana: LineaDeLaSemana[]): Record<string, Valores> {
  const estado: Record<string, Valores> = {}

  for (const grupo of semana) {
    estado[clave(grupo.linea.id, null)] = desdeRegistro(grupo.agregado)
    for (const fila of grupo.piezas) {
      estado[clave(grupo.linea.id, fila.pieza.id)] = desdeRegistro(fila.registro)
    }
  }

  return estado
}

function modosIniciales(semana: LineaDeLaSemana[]): Record<string, Modo> {
  const modos: Record<string, Modo> = {}

  for (const grupo of semana) {
    modos[grupo.linea.id] =
      grupo.modo === 'agregado'
        ? 'agregado'
        : grupo.modo === 'desglose'
          ? 'desglose'
          : grupo.piezas.some((fila) => fila.pieza.activo)
            ? 'desglose'
            : 'agregado'
  }

  return modos
}

export function Captura({
  semanaInicio,
  semana,
  progreso,
  previas,
}: {
  semanaInicio: string
  semana: LineaDeLaSemana[]
  progreso: Progreso
  previas: readonly SemanaPrevia[]
}) {
  const router = useRouter()
  const [guardando, iniciarGuardado] = useTransition()

  const [valores, setValores] = useState(() => estadoInicial(semana))
  const [modos, setModos] = useState(() => modosIniciales(semana))
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [borradorRestaurado, setBorradorRestaurado] = useState(false)
  const formulario = useRef<HTMLFormElement>(null)

  const llaveBorrador = `bitacora:borrador:${semanaInicio}`

  // Al cambiar de semana el estado se rehace desde el servidor.
  useEffect(() => {
    setValores(estadoInicial(semana))
    setModos(modosIniciales(semana))
    setError(null)
    setGuardado(false)
    setBorradorRestaurado(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaInicio])

  /*
   * Borrador local. La captura ocurre desde un teléfono con conectividad
   * intermitente: un guardado fallido no debe costar volver a teclear la
   * semana. Se lee en un efecto y no al renderizar, para no romper la
   * hidratación.
   */
  useEffect(() => {
    try {
      const crudo = window.localStorage.getItem(llaveBorrador)
      if (!crudo) return

      const guardadoLocal = JSON.parse(crudo) as {
        valores?: Record<string, Valores>
        modos?: Record<string, Modo>
      }

      if (guardadoLocal.valores) {
        setValores((previos) => ({ ...previos, ...guardadoLocal.valores }))
        setBorradorRestaurado(true)
      }
      if (guardadoLocal.modos) {
        setModos((previos) => ({ ...previos, ...guardadoLocal.modos }))
      }
    } catch {
      // Modo privado, almacenamiento lleno o datos corruptos: se ignora.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llaveBorrador])

  function recordarBorrador(
    siguientesValores: Record<string, Valores>,
    siguientesModos: Record<string, Modo>,
  ) {
    try {
      window.localStorage.setItem(
        llaveBorrador,
        JSON.stringify({ valores: siguientesValores, modos: siguientesModos }),
      )
    } catch {
      // El borrador es una comodidad, no un requisito.
    }
  }

  function cambiar(llave: string, campo: keyof Valores, valor: string) {
    // Solo dígitos, un separador decimal y nada más.
    const limpio = valor.replace(/[^\d.,]/g, '')

    setValores((previos) => {
      const siguientes = {
        ...previos,
        [llave]: { ...(previos[llave] ?? VACIO), [campo]: limpio },
      }
      recordarBorrador(siguientes, modos)
      return siguientes
    })
    setGuardado(false)
  }

  function cambiarModo(lineaId: string, modo: Modo) {
    setModos((previos) => {
      const siguientes = { ...previos, [lineaId]: modo }
      recordarBorrador(valores, siguientes)
      return siguientes
    })
    setGuardado(false)
  }

  /**
   * Enter baja por la columna. Se transcribe una métrica a través de todas
   * las piezas, no una pieza completa a la vez.
   */
  function alPresionarTecla(evento: React.KeyboardEvent<HTMLInputElement>, campo: string) {
    if (evento.key !== 'Enter') return
    evento.preventDefault()

    const form = formulario.current
    if (!form) return

    const columna = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[data-campo="${campo}"]`),
    )
    const posicion = columna.indexOf(evento.currentTarget)
    const siguiente = columna[posicion + 1]

    if (siguiente) {
      siguiente.focus()
      siguiente.select()
    } else {
      evento.currentTarget.blur()
    }
  }

  const entradas = useMemo<EntradaDeCaptura[]>(() => {
    const lista: EntradaDeCaptura[] = []

    for (const grupo of semana) {
      const modo = modos[grupo.linea.id] ?? 'desglose'

      /*
       * Se envía todo, poniendo en blanco lo que no corresponde al modo
       * elegido. Así cambiar de agregado a desglose (o al revés) se resuelve
       * en un solo guardado: la acción elimina primero y luego inserta.
       */
      const agregado = modo === 'agregado' ? valores[clave(grupo.linea.id, null)] : VACIO
      lista.push({
        lineaId: grupo.linea.id,
        piezaId: null,
        ...(agregado ?? VACIO),
      })

      for (const fila of grupo.piezas) {
        const propios =
          modo === 'desglose' ? valores[clave(grupo.linea.id, fila.pieza.id)] : VACIO
        lista.push({
          lineaId: grupo.linea.id,
          piezaId: fila.pieza.id,
          ...(propios ?? VACIO),
        })
      }
    }

    return lista
  }, [semana, modos, valores])

  function enviar(evento: React.FormEvent) {
    evento.preventDefault()
    setError(null)

    iniciarGuardado(async () => {
      const resultado = await guardarSemana(semanaInicio, entradas)

      if (!resultado.ok) {
        setError(resultado.error)
        return
      }

      try {
        window.localStorage.removeItem(llaveBorrador)
      } catch {
        // Sin consecuencia.
      }

      setBorradorRestaurado(false)
      setGuardado(true)
      router.refresh()
    })
  }

  return (
    <form ref={formulario} onSubmit={enviar}>
      <div className={estilos.cabecera}>
        <MarcaDeSemana progreso={progreso} animar={guardado} />
        <p className={estilos.rangoMeta}>
          En Meta elige: <strong>{rangoParaMeta(semanaInicio)}</strong>
        </p>
      </div>

      {semana.length === 0 && (
        <p className={estilos.vacio}>
          No hay líneas activas. Crea o activa una línea en configuración para
          empezar a registrar.
        </p>
      )}

      {semana.map((grupo) => {
        const modo = modos[grupo.linea.id] ?? 'desglose'
        const piezasActivas = grupo.piezas.filter((fila) => fila.pieza.activo)
        const registradasDePieza = grupo.piezas.filter((fila) => fila.registro !== null)

        /*
         * El selector se ofrece siempre que la línea tenga piezas, y no solo
         * cuando la semana está libre. Cambiar de modo con datos ya guardados
         * es válido: la acción elimina lo del modo anterior y escribe lo del
         * nuevo en un solo guardado. Antes el botón desaparecía justo cuando
         * hacía falta, y no había manera visible de volver al total de línea.
         */
        const puedeElegir = grupo.piezas.length > 0
        const reemplazaPiezas = modo === 'agregado' && registradasDePieza.length > 0
        const reemplazaAgregado = modo === 'desglose' && grupo.agregado !== null
        const previasDeLinea = previas.map((p) => p.porLinea[grupo.linea.id] ?? null)

        return (
          <section className={estilos.linea} key={grupo.linea.id}>
            <h2 className={estilos.nombreLinea}>{grupo.linea.nombre}</h2>
            {grupo.linea.unidad_exito && (
              <p className={estilos.unidadExito}>{grupo.linea.unidad_exito}</p>
            )}
            <div className={estilos.reglaLinea} />

            {puedeElegir && (
              <button
                type="button"
                className={estilos.cambioModo}
                onClick={() => cambiarModo(grupo.linea.id, modo === 'desglose' ? 'agregado' : 'desglose')}
              >
                {modo === 'desglose'
                  ? 'Registrar solo el total de la línea'
                  : 'Registrar pieza por pieza'}
              </button>
            )}

            {reemplazaPiezas && (
              <p className={estilos.reemplazo}>
                Al guardar, {registradasDePieza.length === 1
                  ? 'el registro de la pieza'
                  : `los ${registradasDePieza.length} registros por pieza`}{' '}
                de esta semana se reemplaza
                {registradasDePieza.length === 1 ? '' : 'n'} por un solo total de
                línea.
              </p>
            )}

            {reemplazaAgregado && (
              <p className={estilos.reemplazo}>
                Al guardar, el total de línea de esta semana se reemplaza por el
                desglose por pieza.
              </p>
            )}

            {modo === 'agregado' ? (
              <>
                {piezasActivas.length === 0 && grupo.piezas.length === 0 && (
                  <p className={estilos.vacio}>
                    Sin piezas activas en {grupo.linea.nombre}. Puedes registrar
                    el total de la línea, o activar una pieza en configuración.
                  </p>
                )}
                <div className={estilos.marco}>
                  <Fila
                    llave={clave(grupo.linea.id, null)}
                    titulo="Total de la línea"
                    subtitulo={
                      grupo.agregado?.mensajes_total_reportado !== null &&
                      grupo.agregado?.mensajes_total_reportado !== undefined
                        ? 'Cifra histórica sin desglose'
                        : 'Sin desglose por pieza'
                    }
                    valores={valores[clave(grupo.linea.id, null)] ?? VACIO}
                    alCambiar={cambiar}
                    alPresionarTecla={alPresionarTecla}
                    conEncabezado
                    tituloColumna="Línea"
                    semanasPrevias={previas}
                    previas={previasDeLinea}
                  />
                </div>
              </>
            ) : grupo.piezas.length === 0 ? (
              <p className={estilos.vacio}>
                Sin piezas en {grupo.linea.nombre}. Puedes crear una pieza en
                configuración, o registrar solo el total de la línea.
              </p>
            ) : (
              <div className={estilos.marco}>
                <Encabezado semanasPrevias={previas} />
                {grupo.piezas.map((fila) => (
                  <Fila
                    key={fila.pieza.id}
                    llave={clave(grupo.linea.id, fila.pieza.id)}
                    titulo={fila.pieza.codigo}
                    subtitulo={fila.pieza.descripcion}
                    inactiva={!fila.pieza.activo}
                    valores={valores[clave(grupo.linea.id, fila.pieza.id)] ?? VACIO}
                    alCambiar={cambiar}
                    alPresionarTecla={alPresionarTecla}
                    previas={previas.map((p) => p.porPieza[fila.pieza.id] ?? null)}
                  />
                ))}
                <FilaTotalDeLinea
                  valores={grupo.piezas.map(
                    (fila) => valores[clave(grupo.linea.id, fila.pieza.id)] ?? VACIO,
                  )}
                  previas={previasDeLinea}
                />
              </div>
            )}
          </section>
        )
      })}

      <div className={estilos.barraGuardado}>
        <p className={estilos.pista}>
          Para borrar un registro, vacía todos sus campos y guarda la semana.
        </p>

        {borradorRestaurado && (
          <p className={estilos.borrador}>
            Se recuperó lo que habías escrito y todavía no está guardado.
          </p>
        )}
        {error && <p className={estilos.error}>{error}</p>}
        {guardado && !error && <p className={estilos.confirmacion}>Semana guardada.</p>}

        <button className={estilos.guardar} type="submit" disabled={guardando}>
          {guardando ? 'Guardando' : 'Guardar semana'}
        </button>
      </div>
    </form>
  )
}

function Encabezado({
  primera = 'Pieza',
  semanasPrevias,
}: {
  primera?: string
  semanasPrevias: readonly SemanaPrevia[]
}) {
  return (
    <div className={estilos.encabezado} aria-hidden="true">
      <span>{primera}</span>
      <span className={estilos.encabezadoCifra}>Reprod.</span>
      <span className={estilos.encabezadoCifra}>Mensajes</span>
      <span className={estilos.encabezadoCifra}>Coment.</span>
      <span className={estilos.encabezadoCifra}>Inv. $</span>
      <span className={estilos.encabezadoCifra}>Días</span>
      <span className={estilos.encabezadoCifra}>Total</span>
      {semanasPrevias.map((p) => (
        <span className={estilos.encabezadoPrevia} key={p.semana}>
          {etiquetaBreve(p.semana)}
        </span>
      ))}
    </div>
  )
}

function Fila({
  llave,
  titulo,
  subtitulo,
  inactiva = false,
  valores,
  alCambiar,
  alPresionarTecla,
  conEncabezado = false,
  tituloColumna,
  semanasPrevias = [],
  previas,
}: {
  llave: string
  titulo: string
  subtitulo?: string
  inactiva?: boolean
  valores: Valores
  alCambiar: (llave: string, campo: keyof Valores, valor: string) => void
  alPresionarTecla: (evento: React.KeyboardEvent<HTMLInputElement>, campo: string) => void
  conEncabezado?: boolean
  tituloColumna?: string
  semanasPrevias?: readonly SemanaPrevia[]
  previas: Previas
}) {
  const total = totalDeValores(valores)

  return (
    <>
      {conEncabezado && <Encabezado primera={tituloColumna} semanasPrevias={semanasPrevias} />}
      <div className={estilos.fila}>
        <div className={estilos.identidad}>
          <div className={estilos.codigo}>{titulo}</div>
          {subtitulo && <div className={estilos.descripcion}>{subtitulo}</div>}
          {inactiva && <div className={estilos.inactiva}>Pieza desactivada</div>}
        </div>

        {CAMPOS.map((campo) => (
          <label className={estilos.campo} key={campo.clave}>
            <span className={estilos.etiqueta}>{campo.etiqueta}</span>
            <input
              className={'ancho' in campo && campo.ancho ? estilos.entradaAncha : estilos.entrada}
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              data-campo={campo.clave}
              value={valores[campo.clave]}
              placeholder="—"
              onChange={(evento) => alCambiar(llave, campo.clave, evento.target.value)}
              onKeyDown={(evento) => alPresionarTecla(evento, campo.clave)}
            />
          </label>
        ))}

        <div className={estilos.total}>
          <span className={estilos.totalEtiqueta}>Total de mensajes</span>
          {total === null ? (
            <span className={estilos.totalSinDato} aria-label="Sin dato">
              —
            </span>
          ) : (
            <span className={estilos.totalCifra}>{total}</span>
          )}
        </div>

        <CeldasPrevias previas={previas} />
      </div>
    </>
  )
}

/**
 * Suma de la línea en desglose, en vivo. Solo lectura: lo que se edita son
 * las piezas.
 */
function FilaTotalDeLinea({ valores, previas }: { valores: Valores[]; previas: Previas }) {
  const suma = (campo: keyof Valores) => sumaDeMetrica(valores, (v) => aNumero(v[campo]))
  const total = sumaDeMetrica(valores, totalDeValores)

  return (
    <div className={estilos.filaTotalLinea}>
      <div className={estilos.codigo}>Total de la línea</div>
      <Cifra valor={suma('reproducciones')} etiqueta="Reproducciones" />
      <Cifra valor={suma('mensajesMeta')} etiqueta="Mensajes" />
      <Cifra valor={suma('consultasComentarios')} etiqueta="Consultas en comentarios" />
      <span />
      <span />
      <Cifra valor={total} etiqueta="Total de mensajes" />
      <CeldasPrevias previas={previas} />
    </div>
  )
}

/** Totales de las semanas previas. El guion largo es ausencia, nunca cero. */
function CeldasPrevias({ previas }: { previas: Previas }) {
  return previas.map((valor, indice) => (
    <div className={estilos.previa} key={indice}>
      <span className={estilos.totalEtiqueta}>
        {indice === 0 ? 'Semana anterior' : 'Hace dos semanas'}
      </span>
      <Cifra valor={valor} />
    </div>
  ))
}

function Cifra({ valor, etiqueta }: { valor: number | null; etiqueta?: string }) {
  return (
    <span className={estilos.cifraFija}>
      {etiqueta && <span className={estilos.totalEtiqueta}>{etiqueta}</span>}
      {valor === null ? (
        <span className={estilos.sinDato} aria-label="Sin dato">
          —
        </span>
      ) : (
        valor.toLocaleString('es-VE')
      )}
    </span>
  )
}
