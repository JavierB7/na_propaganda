'use client'

import { useActionState } from 'react'
import { enviarEnlace, type ResultadoAcceso } from '@/acciones/acceso'
import estilos from './acceso.module.css'

export function FormularioDeAcceso({ destino }: { destino: string }) {
  const [resultado, accion, pendiente] = useActionState<ResultadoAcceso | null, FormData>(
    enviarEnlace,
    null,
  )

  if (resultado && 'enviado' in resultado) {
    return (
      <p className={estilos.confirmacion}>
        Enlace enviado a <strong>{resultado.enviado}</strong>. Abrilo desde este
        mismo teléfono o computadora para entrar.
      </p>
    )
  }

  return (
    <form action={accion} className={estilos.formulario}>
      <input type="hidden" name="destino" value={destino} />

      <label className={estilos.etiqueta} htmlFor="correo">
        Tu correo
      </label>
      <input
        className={estilos.campo}
        id="correo"
        name="correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="nombre@correo.com"
        required
      />

      {resultado && 'error' in resultado && (
        <p className={estilos.aviso}>{resultado.error}</p>
      )}

      <button className={estilos.boton} type="submit" disabled={pendiente}>
        {pendiente ? 'Enviando enlace' : 'Enviar enlace de acceso'}
      </button>
    </form>
  )
}
