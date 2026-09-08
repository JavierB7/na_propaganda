-- Piezas publicitarias (videos y creativos).
--
-- La pieza es plana: no hay entidad campaña. `activo` es lo único que decide
-- si aparece en la captura de la semana.
--
-- El código lo genera el sistema y es inmutable. El usuario nunca lo escribe:
-- el problema que este sistema resuelve es precisamente el nombrado informal
-- ("video de Isrey con Alejandro"), y pedirle al usuario inventar el código
-- reintroduce ese problema. La descripción libre cubre la necesidad humana de
-- reconocer la pieza.

create table public.pieza (
  id uuid primary key default gen_random_uuid(),
  linea_id uuid not null references public.linea (id) on delete restrict,

  codigo text not null,
  descripcion text not null,
  fecha_subida date not null,

  activo boolean not null default true,

  -- Vacío en esta versión. Existe desde el inicio para que automatizar la
  -- lectura de Meta más adelante sea una unión de datos y no una remodelación.
  meta_ad_id text,

  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users (id) on delete set null,
  actualizado_en timestamptz not null default now(),

  constraint pieza_descripcion_no_vacia check (length(btrim(descripcion)) > 0),
  constraint pieza_codigo_unico unique (codigo),

  -- Permite la clave foránea compuesta desde registro_semanal, que garantiza
  -- de forma declarativa que un registro de pieza lleve la línea de su pieza.
  constraint pieza_id_linea_unico unique (id, linea_id)
);

create index pieza_linea_activo on public.pieza (linea_id, activo, fecha_subida desc);

-- ── Generación del código ───────────────────────────────────────────────────
-- Formato: <PREFIJO>-<AAMM>-<NN>, por ejemplo FIL-2609-01.
-- El bloque secuencial cuenta dentro de la línea y el mes de subida.
--
-- El bloqueo consultivo serializa las inserciones de la misma línea y mes,
-- para que dos altas simultáneas no calculen el mismo secuencial. La
-- restricción de unicidad sobre `codigo` queda como última red.

create or replace function public.tg_pieza_codigo()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_prefijo text;
  v_aamm text;
  v_siguiente integer;
begin
  if tg_op = 'UPDATE' then
    -- El código es inmutable. Se ignora cualquier intento de cambiarlo en
    -- lugar de fallar, para que editar la descripción no requiera reenviar
    -- el código exacto.
    new.codigo := old.codigo;
    return new;
  end if;

  select prefijo into v_prefijo
  from public.linea
  where id = new.linea_id;

  if v_prefijo is null then
    raise exception 'La línea % no existe.', new.linea_id;
  end if;

  v_aamm := to_char(new.fecha_subida, 'YYMM');

  perform pg_advisory_xact_lock(hashtext(v_prefijo || v_aamm));

  select coalesce(max(substring(codigo from '([0-9]+)$')::integer), 0) + 1
    into v_siguiente
  from public.pieza
  where linea_id = new.linea_id
    and codigo like v_prefijo || '-' || v_aamm || '-%';

  new.codigo := v_prefijo || '-' || v_aamm || '-' || lpad(v_siguiente::text, 2, '0');

  return new;
end;
$$;

-- Antes que el trigger de atribución no importa: tocan columnas distintas.
create trigger pieza_codigo
  before insert or update on public.pieza
  for each row execute function public.tg_pieza_codigo();

create trigger pieza_atribucion
  before insert or update on public.pieza
  for each row execute function public.tg_atribucion();

comment on table public.pieza is
  'Piezas publicitarias. Planas por decisión: la bandera activo reemplaza a '
  'la entidad campaña.';
comment on column public.pieza.codigo is
  'Generado por el sistema e inmutable. Es la llave de unión de la memoria '
  'histórica del área.';
