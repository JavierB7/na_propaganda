'use client'

import { useActionState } from 'react'
import { crearLinea, actualizarLinea, type Resultado } from '@/acciones/catalogo'
import type { Linea } from '@/lib/supabase/tipos'
import estilos from './config.module.css'

function Aviso({ resultado }: { resultado: Resultado | null }) {
  if (!resultado) return null
  if (resultado.ok) return <p className={estilos.exito}>Guardado.</p>
  return <p className={estilos.error}>{resultado.error}</p>
}

export function NuevaLinea() {
  const [resultado, accion, pendiente] = useActionState<Resultado | null, FormData>(
    crearLinea,
    null,
  )

  return (
    <form action={accion} className={estilos.formulario}>
      <div className={estilos.grupo}>
        <label className={estilos.etiqueta} htmlFor="nueva-nombre">
          Nombre de la línea
        </label>
        <input
          className={estilos.campo}
          id="nueva-nombre"
          name="nombre"
          type="text"
          required
          placeholder="Eventos culturales"
        />
      </div>

      <div className={estilos.grupo}>
        <label className={estilos.etiqueta} htmlFor="nueva-prefijo">
          Prefijo del código
        </label>
        <input
          className={estilos.campo}
          id="nueva-prefijo"
          name="prefijo"
          type="text"
          maxLength={5}
          placeholder="Se deduce del nombre"
          autoCapitalize="characters"
        />
        <span className={estilos.ayuda}>
          Abre el código de cada pieza de la línea. Entre 2 y 5 letras. Si lo
          dejás vacío, se deduce del nombre.
        </span>
      </div>

      <div className={`${estilos.grupo} ${estilos.anchoCompleto}`}>
        <label className={estilos.etiqueta} htmlFor="nueva-unidad">
          Unidad de éxito
        </label>
        <textarea
          className={estilos.area}
          id="nueva-unidad"
          name="unidad_exito"
          placeholder="Qué significa un buen resultado en esta línea"
        />
        <span className={estilos.ayuda}>
          Se muestra junto a las cifras. Sirve para que quien lea sepa que la
          misma cantidad no significa lo mismo en cada línea.
        </span>
      </div>

      <div className={estilos.anchoCompleto}>
        <Aviso resultado={resultado} />
      </div>

      <button className={estilos.boton} type="submit" disabled={pendiente}>
        {pendiente ? 'Creando' : 'Crear línea'}
      </button>
    </form>
  )
}

export function FichaDeLinea({ linea }: { linea: Linea }) {
  const [resultado, accion, pendiente] = useActionState<Resultado | null, FormData>(
    actualizarLinea,
    null,
  )

  return (
    <form
      action={accion}
      className={`${estilos.ficha} ${linea.activo ? '' : estilos.fichaInactiva}`}
    >
      <input type="hidden" name="id" value={linea.id} />

      <div className={estilos.formulario}>
        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={`nombre-${linea.id}`}>
            Nombre
          </label>
          <input
            className={estilos.campo}
            id={`nombre-${linea.id}`}
            name="nombre"
            type="text"
            defaultValue={linea.nombre}
            required
          />
          <span className={estilos.codigoFijo}>
            Prefijo <span className={estilos.codigo}>{linea.prefijo}</span> — no
            cambia, porque los códigos ya emitidos no cambian.
          </span>
        </div>

        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={`orden-${linea.id}`}>
            Orden
          </label>
          <input
            className={estilos.campo}
            id={`orden-${linea.id}`}
            name="orden"
            type="number"
            inputMode="numeric"
            defaultValue={linea.orden}
          />
          <span className={estilos.ayuda}>
            Menor primero. Define en qué orden aparecen las líneas.
          </span>
        </div>

        <div className={`${estilos.grupo} ${estilos.anchoCompleto}`}>
          <label className={estilos.etiqueta} htmlFor={`unidad-${linea.id}`}>
            Unidad de éxito
          </label>
          <textarea
            className={estilos.area}
            id={`unidad-${linea.id}`}
            name="unidad_exito"
            defaultValue={linea.unidad_exito ?? ''}
          />
        </div>

        <label className={estilos.interruptor}>
          <input type="checkbox" name="activo" defaultChecked={linea.activo} />
          <span>
            Activa
            {!linea.activo && ' — sus registros anteriores siguen visibles'}
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
