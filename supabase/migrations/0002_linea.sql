-- Líneas de difusión.
--
-- Una línea nunca se elimina: se desactiva, para que sus registros históricos
-- sigan siendo legibles. El nombre es único incluso entre líneas inactivas.
--
-- `prefijo` es el fragmento que abre el código de las piezas de la línea
-- (FIL-2609-01). Se guarda en la tabla en lugar de derivarse del nombre
-- porque el nombre se puede corregir y el código de una pieza es inmutable.

create table public.linea (
  id uuid primary key default gen_random_uuid(),

  nombre text not null,
  prefijo text not null,

  -- Qué significa un buen resultado en esta línea. Texto libre: el sistema
  -- lo conserva y lo muestra junto a las cifras, no lo interpreta.
  unidad_exito text,

  activo boolean not null default true,
  orden integer not null default 0,

  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users (id) on delete set null,
  actualizado_en timestamptz not null default now(),

  constraint linea_nombre_no_vacio check (length(btrim(nombre)) > 0),
  constraint linea_prefijo_formato check (prefijo ~ '^[A-Z]{2,5}$')
);

-- Unicidad insensible a mayúsculas y a espacios de borde: "Librería" y
-- "libreria " son la misma línea para el usuario.
create unique index linea_nombre_unico
  on public.linea (lower(btrim(nombre)));

create unique index linea_prefijo_unico
  on public.linea (prefijo);

create index linea_activo_orden on public.linea (activo, orden, nombre);

create trigger linea_atribucion
  before insert or update on public.linea
  for each row execute function public.tg_atribucion();

comment on table public.linea is
  'Líneas de difusión. Cada una tiene su propio embudo y su propia escala de '
  'éxito; nunca se comparan entre sí.';
comment on column public.linea.unidad_exito is
  'Criterio de éxito en texto libre. Veinte mensajes son un triunfo en '
  'arteterapia y un fracaso en librería.';
comment on column public.linea.prefijo is
  'Prefijo inmutable para los códigos de pieza de esta línea.';
