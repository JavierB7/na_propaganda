-- Helpers compartidos de atribución.
--
-- Cada tabla de datos guarda quién creó la fila y quién la modificó por
-- última vez. El trigger llena esas columnas y, en UPDATE, preserva las de
-- creación: el cliente no puede reescribir quién creó un registro.

create or replace function public.tg_atribucion()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.creado_por := auth.uid();
    new.creado_en := now();
  else
    -- La autoría original es inmutable.
    new.creado_por := old.creado_por;
    new.creado_en := old.creado_en;
  end if;

  new.actualizado_por := auth.uid();
  new.actualizado_en := now();

  return new;
end;
$$;

comment on function public.tg_atribucion() is
  'Llena creado_por/creado_en en INSERT y actualizado_por/actualizado_en '
  'siempre. En UPDATE preserva la autoría original.';
