-- Sustituto del esquema `auth` de Supabase, solo para probar las migraciones
-- contra un Postgres limpio. No se aplica al proyecto real.
--
-- Supabase provee auth.users, auth.uid() y auth.jwt(); un Postgres pelado no.
-- Estas versiones leen de variables de sesión para poder simular quién está
-- autenticado durante las pruebas.

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('prueba.uid', true), '')::uuid;
$$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('prueba.jwt', true), '')::jsonb,
    '{}'::jsonb
  );
$$;

-- Roles que Supabase da por hechos en las políticas.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end
$$;

grant usage on schema public to authenticated, anon;

-- Helper de prueba: fija quién está autenticado en esta sesión.
create or replace function auth.simular(p_correo text, p_uid uuid default null)
returns void
language plpgsql
as $$
begin
  if p_correo is null then
    perform set_config('prueba.jwt', '{}', false);
    perform set_config('prueba.uid', '', false);
  else
    perform set_config('prueba.jwt', json_build_object('email', p_correo)::text, false);
    perform set_config('prueba.uid', coalesce(p_uid::text, ''), false);
  end if;
end;
$$;

-- Supabase concede esto por defecto; el shim tiene que hacerlo explícito para
-- que las políticas puedan evaluarse actuando como `authenticated`.
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid(), auth.jwt(), auth.simular(text, uuid)
  to authenticated, anon;
grant select on auth.users to authenticated;
