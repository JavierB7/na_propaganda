import type { Metadata } from 'next'
import { lineas } from '@/datos/consultas'
import { Pestanias } from '../pestanias'
import { CargaHistorica } from './carga'
import estilos from './historico.module.css'

export const metadata: Metadata = { title: 'Carga histórica · Bitácora' }

const EJEMPLO = `linea,semana,mensajes,reproducciones,inversion_usd_dia,dias_activos,nota
Filosofía,2026-08-31,44,,3,7,
Arteterapia,2026-08-31,28,,2,7,
Filosofía,2026-09-07,47,,3,7,
Librería,2026-09-07,90,,7,7,Campaña de libros en venta`

export default async function PaginaHistorico() {
  const catalogo = await lineas()

  return (
    <>
      <Pestanias />

      <h1 className={estilos.titulo}>Carga histórica</h1>

      <p className={estilos.intro}>
        Para pasar al sistema lo que está en el cuaderno. Sube totales por línea
        y semana, que es el único grano con el que existe la historia — el
        desglose por pieza empieza de aquí en adelante.
      </p>

      <section className={estilos.seccion}>
        <h3 className={estilos.subtitulo}>Formato del archivo</h3>

        <div className={estilos.formato}>
          <pre>{EJEMPLO}</pre>
        </div>

        <ul className={estilos.lista}>
          <li>
            <strong>linea</strong> y <strong>semana</strong> son obligatorias. La
            línea se busca por nombre, sin importar acentos ni mayúsculas, y
            tiene que existir en configuración.
          </li>
          <li>
            <strong>semana</strong> va como AAAA-MM-DD. Si la fecha no cae en
            lunes, se mueve al lunes de esa semana y te lo avisa antes de
            cargar.
          </li>
          <li>
            <strong>mensajes</strong> es el total que ya venías reportando. Se
            guarda como cifra histórica sin desglose, porque el cuaderno
            conserva la suma y no sus partes.
          </li>
          <li>
            Las demás columnas son opcionales y se pueden dejar vacías. Vacío
            significa dato no disponible, no cero.
          </li>
          <li>
            Una semana que no aparezca en el archivo simplemente no queda
            registrada. No se inventa como semana de cero mensajes.
          </li>
          <li>
            Si una línea y semana ya tienen registros, esa fila se rechaza y se
            reporta. Nunca se sobrescribe lo que ya está cargado.
          </li>
        </ul>
      </section>

      <section className={estilos.seccion}>
        <h3 className={estilos.subtitulo}>Cargar</h3>
        <CargaHistorica lineas={catalogo.map(({ id, nombre }) => ({ id, nombre }))} />
      </section>
    </>
  )
}
