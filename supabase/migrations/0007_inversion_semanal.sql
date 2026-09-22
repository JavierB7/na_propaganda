-- La inversión se guarda como la da Meta: el importe gastado en el rango
-- lunes–domingo de la semana.
--
-- Antes se guardaba un valor por día y se multiplicaba por los días activos.
-- Meta no entrega ese número para un rango: entrega el gasto. Pedir un "por
-- día" obligaba a inventar un dato para que el producto cuadrara, que es
-- registrar como dato de Meta algo que Meta no dijo.
--
-- Rename y no columna nueva: es el mismo concepto, corregido. La columna
-- estaba vacía cuando se aplicó esta migración.

alter table public.registro_semanal
  rename column inversion_usd_dia to inversion_usd;

-- El check sigue a la columna renombrada; solo se le cambia el nombre para
-- que no mienta.
alter table public.registro_semanal
  rename constraint registro_inversion_no_negativa to registro_inversion_usd_no_negativa;

-- Una semana tiene siete días. Los días activos son contexto: no entran en
-- ningún cálculo.
alter table public.registro_semanal
  drop constraint registro_dias_activos_rango;

alter table public.registro_semanal
  add constraint registro_dias_activos_rango
    check (dias_activos is null or (dias_activos >= 0 and dias_activos <= 7));

comment on column public.registro_semanal.inversion_usd is
  'Importe gastado en USD según Meta para el lunes–domingo de la semana. Se '
  'guarda tal cual; no se deriva de un presupuesto diario.';
comment on column public.registro_semanal.dias_activos is
  'Días con entrega dentro de la semana (0 a 7). Contexto; no participa en '
  'ningún cálculo.';
