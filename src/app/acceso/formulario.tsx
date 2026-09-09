'use client'

import { useActionState } from 'react'
import { enviarEnlace, entrarConGoogle, type ResultadoAcceso } from '@/acciones/acceso'
import estilos from './acceso.module.css'

/**
 * Dos maneras de entrar.
 *
 * Google va primero porque es la buena para el uso real: un toque en el
 * teléfono, sin depender del correo. El enlace queda como respaldo para quien
 * no tenga cuenta de Google.
 *
 * Cualquiera de las dos entra; quién ve datos lo decide la lista de
 * autorizados en la base de datos, no la forma de entrar.
 */
export function FormularioDeAcceso({ destino }: { destino: string }) {
  return (
    <div className={estilos.opciones}>
      <AccesoConGoogle destino={destino} />

      <p className={estilos.separador}>
        <span>o con un enlace al correo</span>
      </p>

      <AccesoPorCorreo destino={destino} />
    </div>
  )
}

function AccesoConGoogle({ destino }: { destino: string }) {
  const [resultado, accion, pendiente] = useActionState<ResultadoAcceso | null, FormData>(
    entrarConGoogle,
    null,
  )

  return (
    <form action={accion}>
      <input type="hidden" name="destino" value={destino} />

      <button className={estilos.botonGoogle} type="submit" disabled={pendiente}>
        <MarcaGoogle />
        {pendiente ? 'Abriendo Google' : 'Continuar con Google'}
      </button>

      {resultado && 'error' in resultado && (
        <p className={estilos.aviso}>{resultado.error}</p>
      )}
    </form>
  )
}

function AccesoPorCorreo({ destino }: { destino: string }) {
  const [resultado, accion, pendiente] = useActionState<ResultadoAcceso | null, FormData>(
    enviarEnlace,
    null,
  )

  if (resultado && 'enviado' in resultado) {
    return (
      <p className={estilos.confirmacion}>
        Enlace enviado a <strong>{resultado.enviado}</strong>. Ábrelo desde
        este mismo teléfono o computadora para iniciar sesión.
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

      <button className={estilos.botonSecundario} type="submit" disabled={pendiente}>
        {pendiente ? 'Enviando enlace' : 'Enviar enlace de acceso'}
      </button>
    </form>
  )
}

/** Marca de Google en sus colores. No se recolorea ni se deforma. */
function MarcaGoogle() {
  return (
    <svg
      className={estilos.marcaGoogle}
      viewBox="0 0 18 18"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
