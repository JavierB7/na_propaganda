-- Pruebas de las garantías que sostiene la base de datos.
--
-- Se corren contra un Postgres desechable con el shim de `auth` aplicado:
--   npm run db:test
--
-- Cada prueba falla ruidosamente. Si el script termina, todo pasó.

\set ON_ERROR_STOP on

-- Supabase concede estos privilegios por defecto en el esquema public; un
-- Postgres pelado no, así que aquí se conceden para poder probar las
-- políticas actuando como `authenticated`.
grant select, insert, update, delete on all tables in schema public
  to authenticated, anon;

insert into public.usuario_autorizado (correo, nota)
values ('carlos@ejemplo.com', 'jefe del área'), ('javier@ejemplo.com', 'desarrollo')
on conflict do nothing;

select auth.simular('carlos@ejemplo.com');

-- ── 2.9 · Integridad contra doble conteo ────────────────────────────────────

do $$
declare
  v_linea uuid;
  v_pieza uuid;
  v_fallo boolean := false;
begin
  select id into v_linea from public.linea where nombre = 'Filosofía';

  insert into public.pieza (linea_id, descripcion, fecha_subida)
  values (v_linea, 'Isrey con Alejandro', '2026-09-01')
  returning id into v_pieza;

  insert into public.registro_semanal (linea_id, semana_inicio, pieza_id, mensajes_meta)
  values (v_linea, '2026-09-07', v_pieza, 18);

  -- El agregado debe ser rechazado: sumado a su pieza contaría doble.
  begin
    insert into public.registro_semanal (linea_id, semana_inicio, mensajes_meta)
    values (v_linea, '2026-09-07', 29);
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 2.9a: se aceptó un agregado con piezas ya registradas';
  end if;

  raise notice 'OK 2.9a  agregado rechazado cuando existen registros por pieza';
end
$$;

do $$
declare
  v_linea uuid;
  v_pieza uuid;
  v_fallo boolean := false;
begin
  select id into v_linea from public.linea where nombre = 'Arteterapia';

  insert into public.registro_semanal (linea_id, semana_inicio, mensajes_total_reportado)
  values (v_linea, '2026-09-07', 31);

  insert into public.pieza (linea_id, descripcion, fecha_subida)
  values (v_linea, 'Taller de mandalas', '2026-09-02')
  returning id into v_pieza;

  begin
    insert into public.registro_semanal (linea_id, semana_inicio, pieza_id, mensajes_meta)
    values (v_linea, '2026-09-07', v_pieza, 11);
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 2.9b: se aceptó una pieza con agregado ya registrado';
  end if;

  raise notice 'OK 2.9b  pieza rechazada cuando existe un agregado';
end
$$;

do $$
declare
  v_linea uuid;
  v_pieza uuid;
begin
  select id into v_linea from public.linea where nombre = 'Arteterapia';
  select id into v_pieza from public.pieza where linea_id = v_linea limit 1;

  -- Eliminar el agregado libera la semana para el desglose.
  delete from public.registro_semanal
  where linea_id = v_linea and semana_inicio = '2026-09-07' and pieza_id is null;

  insert into public.registro_semanal (linea_id, semana_inicio, pieza_id, mensajes_meta)
  values (v_linea, '2026-09-07', v_pieza, 11);

  raise notice 'OK 2.9c  eliminar el agregado permite capturar por pieza';
end
$$;

-- ── 2.4 / 2.5 · Unicidad por semana ─────────────────────────────────────────

do $$
declare
  v_linea uuid;
  v_pieza uuid;
  v_fallo boolean := false;
begin
  select id into v_linea from public.linea where nombre = 'Filosofía';
  select id into v_pieza from public.pieza where linea_id = v_linea limit 1;

  begin
    insert into public.registro_semanal (linea_id, semana_inicio, pieza_id, mensajes_meta)
    values (v_linea, '2026-09-07', v_pieza, 99);
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 2.4: se aceptó un segundo registro para la misma pieza y semana';
  end if;

  raise notice 'OK 2.4   un solo registro por pieza y semana';
end
$$;

do $$
declare
  v_linea uuid;
  v_fallo boolean := false;
begin
  select id into v_linea from public.linea where nombre = 'Librería';

  insert into public.registro_semanal (linea_id, semana_inicio, mensajes_total_reportado)
  values (v_linea, '2026-09-07', 90);

  begin
    insert into public.registro_semanal (linea_id, semana_inicio, mensajes_total_reportado)
    values (v_linea, '2026-09-07', 12);
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 2.5: se aceptó un segundo agregado para la misma línea y semana';
  end if;

  raise notice 'OK 2.5   un solo agregado por línea y semana';
end
$$;

-- ── 2.6 · Un registro de pieza lleva la línea de su pieza ───────────────────

do $$
declare
  v_filosofia uuid;
  v_libreria uuid;
  v_pieza uuid;
  v_fallo boolean := false;
begin
  select id into v_filosofia from public.linea where nombre = 'Filosofía';
  select id into v_libreria from public.linea where nombre = 'Librería';
  select id into v_pieza from public.pieza where linea_id = v_filosofia limit 1;

  begin
    insert into public.registro_semanal (linea_id, semana_inicio, pieza_id, mensajes_meta)
    values (v_libreria, '2026-09-14', v_pieza, 5);
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 2.6: se aceptó un registro cuya línea no es la de su pieza';
  end if;

  raise notice 'OK 2.6   la línea del registro debe ser la de su pieza';
end
$$;

-- ── Semana identificada por su lunes ────────────────────────────────────────

do $$
declare
  v_linea uuid;
  v_fallo boolean := false;
begin
  select id into v_linea from public.linea where nombre = 'Filoart';

  begin
    -- 2026-09-10 es jueves.
    insert into public.registro_semanal (linea_id, semana_inicio, mensajes_meta)
    values (v_linea, '2026-09-10', 3);
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA lunes: se aceptó una semana que no empieza en lunes';
  end if;

  raise notice 'OK       la semana se identifica por su lunes';
end
$$;

-- ── 4.5 · Códigos de pieza ──────────────────────────────────────────────────

do $$
declare
  v_linea uuid;
  v_a text;
  v_b text;
begin
  select id into v_linea from public.linea where nombre = 'Filosofía Café';

  insert into public.pieza (linea_id, descripcion, fecha_subida)
  values (v_linea, 'Primera del mes', '2026-09-03') returning codigo into v_a;

  insert into public.pieza (linea_id, descripcion, fecha_subida)
  values (v_linea, 'Segunda del mes', '2026-09-20') returning codigo into v_b;

  if v_a = v_b then
    raise exception 'FALLA 4.5: dos piezas de la misma línea y mes comparten código';
  end if;

  if v_a <> 'CAF-2609-01' or v_b <> 'CAF-2609-02' then
    raise exception 'FALLA 4.5: códigos inesperados % y %', v_a, v_b;
  end if;

  raise notice 'OK 4.5   códigos secuenciales por línea y mes: %, %', v_a, v_b;
end
$$;

do $$
declare
  v_pieza uuid;
  v_antes text;
  v_despues text;
begin
  select id, codigo into v_pieza, v_antes
  from public.pieza where codigo = 'CAF-2609-01';

  update public.pieza
  set codigo = 'HACK-0000-99', descripcion = 'Descripción corregida'
  where id = v_pieza;

  select codigo into v_despues from public.pieza where id = v_pieza;

  if v_despues <> v_antes then
    raise exception 'FALLA: el código cambió de % a %', v_antes, v_despues;
  end if;

  raise notice 'OK       el código de la pieza es inmutable';
end
$$;

-- ── 3.4 · Atribución ────────────────────────────────────────────────────────

do $$
declare
  v_carlos uuid := gen_random_uuid();
  v_javier uuid := gen_random_uuid();
  v_linea uuid;
  v_registro uuid;
  v_creado_por uuid;
  v_actualizado_por uuid;
begin
  insert into auth.users (id, email) values
    (v_carlos, 'carlos@ejemplo.com'), (v_javier, 'javier@ejemplo.com');

  select id into v_linea from public.linea where nombre = 'Filoart';

  perform auth.simular('carlos@ejemplo.com', v_carlos);
  insert into public.registro_semanal (linea_id, semana_inicio, mensajes_meta)
  values (v_linea, '2026-09-21', 7)
  returning id into v_registro;

  perform auth.simular('javier@ejemplo.com', v_javier);
  update public.registro_semanal set mensajes_meta = 8 where id = v_registro;

  select creado_por, actualizado_por into v_creado_por, v_actualizado_por
  from public.registro_semanal where id = v_registro;

  if v_creado_por <> v_carlos then
    raise exception 'FALLA 3.4: la autoría original no se preservó';
  end if;
  if v_actualizado_por <> v_javier then
    raise exception 'FALLA 3.4: el último editor no se registró';
  end if;

  perform auth.simular('carlos@ejemplo.com', v_carlos);
  raise notice 'OK 3.4   creador preservado, último editor actualizado';
end
$$;

-- ── Nulo no es cero ─────────────────────────────────────────────────────────

do $$
declare
  v_linea uuid;
  v_suma integer;
begin
  select id into v_linea from public.linea where nombre = 'Filoart';

  insert into public.registro_semanal (linea_id, semana_inicio, mensajes_meta)
  values (v_linea, '2026-09-28', null);

  select sum(coalesce(mensajes_total_reportado,
                      coalesce(mensajes_meta, 0) + coalesce(consultas_comentarios, 0)))
    into v_suma
  from public.registro_semanal
  where linea_id = v_linea and semana_inicio = '2026-09-28'
    and (mensajes_meta is not null
         or consultas_comentarios is not null
         or mensajes_total_reportado is not null);

  if v_suma is not null then
    raise exception 'FALLA: una semana sin dato produjo un total de % en lugar de nada', v_suma;
  end if;

  raise notice 'OK       una semana sin dato no produce un total de cero';
end
$$;

-- ── 3.6 · Seguridad a nivel de fila ─────────────────────────────────────────

do $$
declare
  v_filas integer;
begin
  set local role authenticated;

  perform auth.simular('intruso@ejemplo.com');
  select count(*) into v_filas from public.linea;
  if v_filas <> 0 then
    raise exception 'FALLA 3.6a: una cuenta no autorizada vio % líneas', v_filas;
  end if;

  select count(*) into v_filas from public.registro_semanal;
  if v_filas <> 0 then
    raise exception 'FALLA 3.6a: una cuenta no autorizada vio % registros', v_filas;
  end if;

  raise notice 'OK 3.6a  cuenta autenticada no autorizada no ve ninguna fila';
end
$$;

do $$
declare
  v_filas integer;
begin
  set local role authenticated;

  perform auth.simular(null);
  select count(*) into v_filas from public.linea;
  if v_filas <> 0 then
    raise exception 'FALLA 3.6b: sin sesión se vieron % líneas', v_filas;
  end if;

  raise notice 'OK 3.6b  sin sesión no se ve ninguna fila';
end
$$;

do $$
declare
  v_filas integer;
  v_fallo boolean := false;
begin
  set local role authenticated;

  perform auth.simular('carlos@ejemplo.com');
  select count(*) into v_filas from public.linea;
  if v_filas < 5 then
    raise exception 'FALLA 3.6c: un usuario autorizado solo vio % líneas', v_filas;
  end if;

  -- La lista de autorizados no se escribe desde la aplicación.
  begin
    insert into public.usuario_autorizado (correo) values ('colado@ejemplo.com');
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 3.6c: se pudo agregar un autorizado desde la aplicación';
  end if;

  raise notice 'OK 3.6c  usuario autorizado lee; nadie se autoriza a sí mismo';
end
$$;

-- ── 4.6 · Desactivar conserva la historia ──────────────────────────────────

do $$
declare
  v_linea uuid;
  v_pieza uuid;
  v_registros integer;
  v_fallo boolean := false;
begin
  select id into v_linea from public.linea where nombre = 'Filosofía';
  select id into v_pieza from public.pieza where linea_id = v_linea limit 1;

  update public.linea set activo = false where id = v_linea;
  update public.pieza set activo = false where id = v_pieza;

  select count(*) into v_registros
  from public.registro_semanal where linea_id = v_linea;

  if v_registros = 0 then
    raise exception 'FALLA 4.6: desactivar la línea escondió sus registros';
  end if;

  select count(*) into v_registros
  from public.registro_semanal where pieza_id = v_pieza;

  if v_registros = 0 then
    raise exception 'FALLA 4.6: desactivar la pieza escondió sus registros';
  end if;

  -- Y una línea con historia no se puede borrar: se desactiva.
  begin
    delete from public.linea where id = v_linea;
    v_fallo := true;
  exception when others then
    null;
  end;

  if v_fallo then
    raise exception 'FALLA 4.6: se pudo borrar una línea con registros';
  end if;

  update public.linea set activo = true where id = v_linea;
  update public.pieza set activo = true where id = v_pieza;

  raise notice 'OK 4.6   desactivar conserva la historia; borrar está impedido';
end
$$;

select 'Todas las pruebas de esquema pasaron.' as resultado;
