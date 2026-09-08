/**
 * Tipos del esquema. Escritos a mano para que coincidan con
 * `supabase/migrations/`. Regenerables con:
 *   supabase gen types typescript --project-id <id> > src/lib/supabase/tipos.ts
 *
 * Nota sobre nulos: toda métrica es `number | null`, y `null` significa dato
 * no disponible — nunca cero.
 */

export type Atribucion = {
  creado_por: string | null
  creado_en: string
  actualizado_por: string | null
  actualizado_en: string
}

export type Linea = Atribucion & {
  id: string
  nombre: string
  prefijo: string
  unidad_exito: string | null
  activo: boolean
  orden: number
}

export type Pieza = Atribucion & {
  id: string
  linea_id: string
  /** Generado por la base de datos e inmutable. */
  codigo: string
  descripcion: string
  fecha_subida: string
  activo: boolean
  meta_ad_id: string | null
}

export type RegistroSemanal = Atribucion & {
  id: string
  linea_id: string
  /** Fecha del lunes, en formato ISO. */
  semana_inicio: string
  /** Nulo = total agregado de la línea. */
  pieza_id: string | null
  reproducciones: number | null
  mensajes_meta: number | null
  consultas_comentarios: number | null
  /** Solo carga histórica: total ya sumado, sin desglose conocido. */
  mensajes_total_reportado: number | null
  inversion_usd_dia: number | null
  dias_activos: number | null
  nota: string | null
}

export type UsuarioAutorizado = {
  correo: string
  nota: string | null
  creado_en: string
}

type SoloLectura<T> = {
  Row: T
  Insert: never
  Update: never
  Relationships: []
}

type Tabla<T, Requeridos extends keyof T, Generados extends keyof T> = {
  Row: T
  Insert: Pick<T, Requeridos> & Partial<Omit<T, Requeridos | Generados>>
  Update: Partial<Omit<T, Generados>>
  /* supabase-js lo exige en cada tabla; sin esto la inferencia cae a `never`. */
  Relationships: []
}

type ColumnasGeneradas = 'id' | keyof Atribucion

export type Database = {
  public: {
    Tables: {
      linea: Tabla<Linea, 'nombre' | 'prefijo', ColumnasGeneradas>
      // `codigo` lo genera un trigger: nunca se envía ni se actualiza.
      pieza: Tabla<
        Pieza,
        'linea_id' | 'descripcion' | 'fecha_subida',
        ColumnasGeneradas | 'codigo'
      >
      registro_semanal: Tabla<
        RegistroSemanal,
        'linea_id' | 'semana_inicio',
        ColumnasGeneradas
      >
      usuario_autorizado: SoloLectura<UsuarioAutorizado>
    }
    /*
     * `{ [_ in never]: never }` y no `Record<string, never>`: el segundo dice
     * que CUALQUIER nombre resuelve a `never`, y entonces la búsqueda de una
     * tabla en las vistas colapsa los tipos de Insert y Update a `never`.
     */
    Views: { [_ in never]: never }
    Functions: {
      es_autorizado: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
