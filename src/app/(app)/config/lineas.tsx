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
    <div className={estilos.alta}>
      <h3 className={estilos.tituloAlta}>Agregar una línea</h3>

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
            Abre el código de cada pieza de la línea, como FIL en FIL-2609-01.
            Entre 2 y 5 letras.
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
            Se muestra junto a las cifras, para que quien las lea sepa que la
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
    </div>
  )
}

export function FichaDeLinea({ linea }: { linea: Linea }) {
  const [resultado, accion, pendiente] = useActionState<Resultado | null, FormData>(
    actualizarLinea,
    null,
  )

  return (
    <section
      className={`${estilos.ficha} ${linea.activo ? '' : estilos.fichaInactiva}`}
    >
      <div className={estilos.identidad}>
        <h3 className={estilos.nombreFicha}>{linea.nombre}</h3>
        <span className={estilos.codigo}>{linea.prefijo}</span>
        {!linea.activo && <span className={estilos.marcaInactiva}>Desactivada</span>}
      </div>

      <form action={accion} className={estilos.formulario}>
        <input type="hidden" name="id" value={linea.id} />

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
          <span className={estilos.ayuda}>
            El prefijo <strong>{linea.prefijo}</strong> no cambia aunque se
            corrija el nombre: los códigos ya emitidos son permanentes.
          </span>
        </div>

        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={`orden-${linea.id}`}>
            Orden
          </label>
          <input
            className={estilos.campoCorto}
            id={`orden-${linea.id}`}
            name="orden"
            type="number"
            inputMode="numeric"
            defaultValue={linea.orden}
          />
          <span className={estilos.ayuda}>
            Menor primero. Define en qué orden aparecen las líneas al registrar
            y en el resumen.
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
            placeholder="Qué significa un buen resultado en esta línea"
          />
        </div>

        <div className={estilos.anchoCompleto}>
          <label className={estilos.interruptor}>
            <input type="checkbox" name="activo" defaultChecked={linea.activo} />
            <span>Activa: aparece al registrar la semana</span>
          </label>
          <p className={estilos.nota}>
            Una línea nunca se borra. Al desactivarla deja de aparecer al
            registrar, y sus semanas ya cargadas siguen visibles en el resumen.
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
