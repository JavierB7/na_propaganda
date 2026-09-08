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
    <div className={estilos.alta}>
      <h3 className={estilos.tituloAlta}>Agregar una pieza</h3>

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
          <span className={estilos.ayuda}>
            Determina el mes del código y permite buscar la pieza por fecha.
          </span>
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
            Como la reconocés al hablar de ella. El código lo pone el sistema.
          </span>
        </div>

        <div className={`${estilos.grupo} ${estilos.anchoCompleto}`}>
          <label className={estilos.etiqueta} htmlFor="pieza-meta">
            Identificador del anuncio en Meta
          </label>
          <input
            className={estilos.campo}
            id="pieza-meta"
            name="meta_ad_id"
            type="text"
            placeholder="Opcional, se puede dejar vacío"
            autoComplete="off"
          />
          <span className={estilos.ayuda}>
            No hace falta hoy. Queda listo para el día en que las cifras de Meta
            se lean solas.
          </span>
        </div>

        <div className={estilos.anchoCompleto}>
          <Aviso resultado={resultado} />
        </div>

        <button className={estilos.boton} type="submit" disabled={pendiente}>
          {pendiente ? 'Creando' : 'Crear pieza'}
        </button>
      </form>
    </div>
  )
}

export function FichaDePieza({ pieza }: { pieza: Pieza }) {
  const [resultado, accion, pendiente] = useActionState<Resultado | null, FormData>(
    actualizarPieza,
    null,
  )

  return (
    <section
      className={`${estilos.ficha} ${pieza.activo ? '' : estilos.fichaInactiva}`}
    >
      <div className={estilos.identidad}>
        <span className={estilos.codigo}>{pieza.codigo}</span>
        <span className={estilos.descripcionFicha}>{pieza.descripcion}</span>
        {!pieza.activo && <span className={estilos.marcaInactiva}>Desactivada</span>}
      </div>

      <form action={accion} className={estilos.formulario}>
        <input type="hidden" name="id" value={pieza.id} />

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
          <span className={estilos.ayuda}>
            El código <strong>{pieza.codigo}</strong> no cambia: es la llave con
            la que se sigue esta pieza en el tiempo.
          </span>
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

        <div className={`${estilos.grupo} ${estilos.anchoCompleto}`}>
          <label className={estilos.etiqueta} htmlFor={`meta-${pieza.id}`}>
            Identificador del anuncio en Meta
          </label>
          <input
            className={estilos.campo}
            id={`meta-${pieza.id}`}
            name="meta_ad_id"
            type="text"
            defaultValue={pieza.meta_ad_id ?? ''}
            placeholder="Opcional, se puede dejar vacío"
            autoComplete="off"
          />
        </div>

        <div className={estilos.anchoCompleto}>
          <label className={estilos.interruptor}>
            <input type="checkbox" name="activo" defaultChecked={pieza.activo} />
            <span>Activa: aparece al registrar la semana</span>
          </label>
          <p className={estilos.nota}>
            Una pieza nunca se borra. Al desactivarla deja de pedirse cada
            semana, y las semanas que ya tiene registradas siguen visibles.
          </p>
        </div>

        <div className={estilos.anchoCompleto}>
          <Aviso resultado={resultado} />
        </div>

        <button className={estilos.boton} type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando' : 'Guardar cambios'}
        </button>
      </form>
    </section>
  )
}
