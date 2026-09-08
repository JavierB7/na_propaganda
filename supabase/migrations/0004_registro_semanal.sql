-- Registro semanal de mediciones.
--
-- Grano flexible: `pieza_id` nulo significa que la fila es el total agregado
-- de la línea en esa semana. Un solo modelo cubre la historia disponible
-- (que solo existe a nivel de línea) y el desglose por pieza de aquí en
-- adelante.
--
-- Todas las métricas son nullable. Un campo vacío significa dato no
-- disponible y no se trata como cero: el cuaderno tiene huecos, hay campañas
-- históricas sin desglose y Meta no siempre entrega todos los campos.

create table public.registro_semanal (
  id uuid primary key default gen_random_uuid(),

  linea_id uuid not null references public.linea (id) on delete restrict,

  -- Fecha del lunes. Sin una definición única de semana, dos cargas del mismo
  -- jueves producen filas distintas y los totales mienten.
  semana_inicio date not null,

  -- Nulo = registro agregado de la línea.
  pieza_id uuid references public.pieza (id) on delete restrict,

  reproducciones integer,

  -- Conversaciones que Meta cuenta por bandeja.
  mensajes_meta integer,

  -- Personas que piden información en los comentarios. Meta no las cuenta y
  -- se suman a mano. Se guardan aparte para no perder la procedencia.
  consultas_comentarios integer,

  -- Solo para la carga histórica: el cuaderno conserva la cifra ya sumada y
  -- no sus partes. Poner ese total en mensajes_meta registraría como dato de
  -- Meta algo que Meta no dijo.
  mensajes_total_reportado integer,

  inversion_usd_dia numeric(10, 2),
  dias_activos integer,

  nota text,

  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_por uuid references auth.users (id) on delete set null,
  actualizado_en timestamptz not null default now(),

  -- La semana se identifica por su lunes.
  constraint registro_semana_es_lunes
    check (extract(isodow from semana_inicio) = 1),

  constraint registro_reproducciones_no_negativo
    check (reproducciones is null or reproducciones >= 0),
  constraint registro_mensajes_meta_no_negativo
    check (mensajes_meta is null or mensajes_meta >= 0),
  constraint registro_consultas_no_negativo
    check (consultas_comentarios is null or consultas_comentarios >= 0),
  constraint registro_total_reportado_no_negativo
    check (mensajes_total_reportado is null or mensajes_total_reportado >= 0),
  constraint registro_inversion_no_negativa
    check (inversion_usd_dia is null or inversion_usd_dia >= 0),
  constraint registro_dias_activos_rango
    check (dias_activos is null or (dias_activos >= 0 and dias_activos <= 366)),

  -- 2.6 — Un registro de pieza lleva la línea de su pieza.
  -- Clave foránea compuesta en lugar de un check con subconsulta: es
  -- declarativa y la impone Postgres. Con pieza_id nulo (fila agregada) no
  -- se evalúa, que es exactamente lo que hace falta.
  constraint registro_pieza_coincide_linea
    foreign key (pieza_id, linea_id)
    references public.pieza (id, linea_id)
    on delete restrict
);

-- 2.4 — Un registro por pieza y semana.
create unique index registro_pieza_semana_unico
  on public.registro_semanal (pieza_id, semana_inicio)
  where pieza_id is not null;

-- 2.5 — Un registro agregado por línea y semana.
create unique index registro_linea_semana_agregado_unico
  on public.registro_semanal (linea_id, semana_inicio)
  where pieza_id is null;

create index registro_linea_semana
  on public.registro_semanal (linea_id, semana_inicio desc);
create index registro_semana
  on public.registro_semanal (semana_inicio desc);

-- ── 2.7 Integridad contra doble conteo ──────────────────────────────────────
-- Para una misma línea y semana: o registros por pieza, o un agregado, nunca
-- ambos. Si un agregado convive con sus piezas el total se duplica y el
-- número que llega al director es falso.
--
-- Va en la base de datos y no solo en la interfaz porque la carga histórica y
-- las correcciones por SQL entran por debajo de la validación de la
-- aplicación, que es justo cuando el error ocurre.
--
-- El bloqueo consultivo serializa las escrituras de la misma línea y semana
-- para que dos inserciones simultáneas no pasen ambas la comprobación.

create or replace function public.tg_registro_sin_doble_conteo()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  perform pg_advisory_xact_lock(
    hashtext(new.linea_id::text || '|' || new.semana_inicio::text)
  );

  if new.pieza_id is null then
    if exists (
      select 1 from public.registro_semanal
      where linea_id = new.linea_id
        and semana_inicio = new.semana_inicio
        and pieza_id is not null
        and id <> new.id
    ) then
      raise exception
        'La línea ya tiene registros por pieza en la semana %. Un total '
        'agregado sumado a sus piezas contaría doble.', new.semana_inicio
        using errcode = 'integrity_constraint_violation';
    end if;
  else
    if exists (
      select 1 from public.registro_semanal
      where linea_id = new.linea_id
        and semana_inicio = new.semana_inicio
        and pieza_id is null
        and id <> new.id
    ) then
      raise exception
        'La línea ya tiene un total agregado en la semana %. Elimina el '
        'agregado antes de registrar por pieza.', new.semana_inicio
        using errcode = 'integrity_constraint_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger registro_sin_doble_conteo
  before insert or update of linea_id, semana_inicio, pieza_id
  on public.registro_semanal
  for each row execute function public.tg_registro_sin_doble_conteo();

create trigger registro_atribucion
  before insert or update on public.registro_semanal
  for each row execute function public.tg_atribucion();

comment on table public.registro_semanal is
  'Mediciones semanales. pieza_id nulo = total agregado de la línea.';
comment on column public.registro_semanal.mensajes_total_reportado is
  'Total ya sumado, solo para carga histórica sin desglose. Tiene precedencia '
  'sobre la suma de mensajes_meta y consultas_comentarios al leer.';
