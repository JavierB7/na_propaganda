-- Acceso y seguridad a nivel de fila.
--
-- La autorización vive en la base de datos, no en la interfaz. Sin esto la
-- clave anónima del cliente expone los datos completos a cualquiera que la
-- extraiga del navegador.
--
-- No se modelan roles: los usuarios autorizados pueden todo. Lo que se
-- distingue es autorizado de no autorizado.

create table public.usuario_autorizado (
  correo text primary key,
  nota text,
  creado_en timestamptz not null default now(),

  constraint usuario_correo_normalizado check (correo = lower(btrim(correo))),
  constraint usuario_correo_formato check (correo like '%_@_%.__%')
);

comment on table public.usuario_autorizado is
  'Única fuente de verdad de quién tiene acceso. Se administra por SQL o con '
  'la clave de servicio, nunca desde la aplicación.';

-- ── ¿El llamante está autorizado? ───────────────────────────────────────────
-- SECURITY DEFINER para poder leer la tabla de autorizados sin quedar
-- atrapada en la política que ella misma sostiene. search_path fijo para que
-- no se pueda secuestrar la resolución de nombres.

create or replace function public.es_autorizado()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.usuario_autorizado
    where correo = lower(btrim(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

comment on function public.es_autorizado() is
  'Verdadero si el correo de la sesión está en usuario_autorizado. Es la '
  'frontera de autorización de todas las políticas.';

revoke all on function public.es_autorizado() from public;
grant execute on function public.es_autorizado() to authenticated, anon;

-- ── Políticas ───────────────────────────────────────────────────────────────
-- Un mismo par de políticas por tabla: leer y escribir si es_autorizado().
-- Una cuenta autenticada fuera de la lista no ve ninguna fila.

alter table public.linea enable row level security;
alter table public.pieza enable row level security;
alter table public.registro_semanal enable row level security;
alter table public.usuario_autorizado enable row level security;

create policy linea_lectura on public.linea
  for select to authenticated using (public.es_autorizado());
create policy linea_escritura on public.linea
  for all to authenticated
  using (public.es_autorizado()) with check (public.es_autorizado());

create policy pieza_lectura on public.pieza
  for select to authenticated using (public.es_autorizado());
create policy pieza_escritura on public.pieza
  for all to authenticated
  using (public.es_autorizado()) with check (public.es_autorizado());

create policy registro_lectura on public.registro_semanal
  for select to authenticated using (public.es_autorizado());
create policy registro_escritura on public.registro_semanal
  for all to authenticated
  using (public.es_autorizado()) with check (public.es_autorizado());

-- La lista de autorizados se puede leer estando autorizado, pero no se
-- escribe desde la aplicación: no hay política de insert, update ni delete,
-- así que quedan denegadas.
create policy usuario_lectura on public.usuario_autorizado
  for select to authenticated using (public.es_autorizado());
