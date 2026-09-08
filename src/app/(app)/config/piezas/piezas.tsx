'use client'

import { useActionState } from 'react'
import { crearPieza, actualizarPieza, type Resultado } from '@/acciones/catalogo'
import type { Linea, Pieza } from '@/lib/supabase/tipos'
import estilos from '../config.module.css'

function Aviso({ resultado }: { resultado: Resultado | null }) {
  if (!resultado) return null
  if (resultado.ok) return <p className={estilos.exito}>Guardado.</p>
  return <p className={estilos.error}>{resultado.error}</p>
}

export function NuevaPieza({ lineas, hoy }: { lineas: Linea[]; hoy: string }) {
  const [resultado, accion, pendiente] = useActionState<Resultado | null, FormData>(
    crearPieza,
    null,
  )

  return (
    <form action={accion} className={estilos.formulario}>
      <div className={estilos.grupo}>
        <label className={estilos.etiqueta} htmlFor="pieza-linea">
          Línea
        </label>
        <select className={estilos.seleccion} id="pieza-linea" name="linea_id" required>
          {lineas.map((linea) => (
            <option key={linea.id} value={linea.id}>
              {linea.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className={estilos.grupo}>
        <label className={estilos.etiqueta} htmlFor="pieza-fecha">
          Fecha en que se subió
        </label>
        <input
          className={estilos.campo}
          id="pieza-fecha"
          name="fecha_subida"
          type="date"
          defaultValue={hoy}
          required
        />
      </div>

      <div className={`${estilos.grupo} ${estilos.anchoCompleto}`}>
        <label className={estilos.etiqueta} htmlFor="pieza-descripcion">
          Descripción
        </label>
        <input
          className={estilos.campo}
          id="pieza-descripcion"
          name="descripcion"
          type="text"
          required
          placeholder="Isrey con Alejandro"
        />
        <span className={estilos.ayuda}>
          Como la reconocés al hablar. El código lo pone el sistema.
        </span>
      </div>

      <div className={estilos.grupo}>
        <label className={estilos.etiqueta} htmlFor="pieza-meta">
          Identificador del anuncio en Meta
        </label>
        <input
          className={estilos.campo}
          id="pieza-meta"
          name="meta_ad_id"
          type="text"
          placeholder="Opcional"
          autoComplete="off"
        />
        <span className={estilos.ayuda}>
          No hace falta hoy. Sirve para el día en que se lean las cifras de Meta
          automáticamente.
        </span>
      </div>

      <div className={estilos.anchoCompleto}>
        <Aviso resultado={resultado} />
      </div>

      <button className={estilos.boton} type="submit" disabled={pendiente}>
        {pendiente ? 'Creando' : 'Crear pieza'}
      </button>
    </form>
  )
}

export function FichaDePieza({ pieza }: { pieza: Pieza }) {
  const [resultado, accion, pendiente] = useActionState<Resultado | null, FormData>(
    actualizarPieza,
    null,
  )

  return (
    <form
      action={accion}
      className={`${estilos.ficha} ${pieza.activo ? '' : estilos.fichaInactiva}`}
    >
      <input type="hidden" name="id" value={pieza.id} />

      <div className={estilos.formulario}>
        <div className={`${estilos.grupo} ${estilos.anchoCompleto}`}>
          <span className={estilos.codigo}>{pieza.codigo}</span>
          <span className={estilos.codigoFijo}>
            El código no cambia: es la llave con la que se sigue esta pieza en el
            tiempo.
          </span>
        </div>

        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={`desc-${pieza.id}`}>
            Descripción
          </label>
          <input
            className={estilos.campo}
            id={`desc-${pieza.id}`}
            name="descripcion"
            type="text"
            defaultValue={pieza.descripcion}
            required
          />
        </div>

        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={`fecha-${pieza.id}`}>
            Fecha en que se subió
          </label>
          <input
            className={estilos.campo}
            id={`fecha-${pieza.id}`}
            name="fecha_subida"
            type="date"
            defaultValue={pieza.fecha_subida}
            required
          />
        </div>

        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={`meta-${pieza.id}`}>
            Identificador en Meta
          </label>
          <input
            className={estilos.campo}
            id={`meta-${pieza.id}`}
            name="meta_ad_id"
            type="text"
            defaultValue={pieza.meta_ad_id ?? ''}
            placeholder="Opcional"
            autoComplete="off"
          />
        </div>

        <label className={estilos.interruptor}>
          <input type="checkbox" name="activo" defaultChecked={pieza.activo} />
          <span>
            Activa — aparece en la captura de la semana
            {!pieza.activo && '. Sus registros anteriores siguen visibles'}
          </span>
        </label>

        <div className={estilos.anchoCompleto}>
          <Aviso resultado={resultado} />
        </div>

        <button className={estilos.boton} type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
