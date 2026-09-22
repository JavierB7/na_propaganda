# Proposal

## Why

La primera semana de uso trajo feedback del área de difusión. Tres de sus puntos ya estaban cubiertos por el modelo: una pieza se registra semana a semana mientras está activa, la semana va de lunes a domingo, y cada semana guarda lo que Meta dice para ese rango, no un acumulado. Dos cosas sí chocan con la práctica real:

- **Carlos registra el domingo, normalmente en la noche.** La semana en curso se calcula en el servidor, que corre en UTC. Desde las 20:00 de Caracas (UTC-4) el servidor ya está en lunes y la captura abre la semana siguiente, vacía. El error pasa justo en el momento habitual de carga, y es silencioso.
- **Meta entrega el gasto de la semana, no un presupuesto por día.** Hoy la inversión se guarda como USD por día × días activos, y el sistema calcula el producto. El importe que Meta muestra para el rango lunes–domingo casi nunca coincide con presupuesto × días. Para que el producto cuadre, el usuario tendría que inventar un "por día", es decir, registrar como dato de Meta algo que Meta no dijo.

Conviene arreglarlo ahora: la columna de inversión está vacía en producción, así que el cambio de esquema no tiene costo de migración de datos. Y el próximo domingo de carga vuelve a caer en la ventana del error de zona horaria.

## What Changes

- **La semana en curso y "hoy" se calculan en la zona horaria de Caracas**, no en la del proceso. Esto aplica a la apertura de captura y resumen, al resaltado de la semana actual en el navegador y a la fecha de subida por defecto de una pieza nueva. Un domingo a las 22:00 de Caracas abre la semana que termina ese domingo.
- **BREAKING (esquema):** `inversion_usd_dia` se reemplaza por `inversion_usd`, el importe gastado según Meta para el lunes–domingo de la semana. La inversión deja de derivarse: se guarda y se muestra tal cual.
- **`dias_activos` se acota a 0–7.** Se mantiene como contexto opcional (la pieza corrió 3 de 7 días). Ya no participa en ningún cálculo.
- **La carga histórica CSV** acepta la columna de gasto semanal y deja de aceptar alias que sugieran un valor por día.
- **La captura muestra el rango exacto que hay que elegir en Meta** para la semana seleccionada (por ejemplo "lun 7 – dom 13 sep"). Es la defensa contra el error más probable: copiar cifras con el rango por defecto de Meta, que es acumulado o de 30 días.

Fuera de alcance: una vista con la historia completa de una pieza a través de sus semanas. Es útil, pero es independiente y va en un cambio aparte.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `registro-semanal`: la definición de semana fija la zona horaria de referencia; los campos de medición cambian la inversión por día por el gasto de la semana y acotan los días activos; la captura indica el rango de Meta; la carga histórica acepta el gasto semanal.
- `resumen-semanal`: el desglose por pieza muestra el gasto de la semana tal cual fue registrado, sin derivarlo.

## Impact

- **Base de datos**: migración nueva sobre `registro_semanal` (renombrar la columna y sus restricciones, acotar `dias_activos`). La columna está vacía, así que no hay datos que convertir.
- **Código**: `src/dominio/semana.ts` (cálculo de "hoy"), `src/dominio/totales.ts` (sale la derivación de inversión), `src/dominio/historico.ts` (columnas del CSV), `src/acciones/registros.ts`, `src/lib/supabase/tipos.ts`, `src/app/(app)/semana/captura.tsx`, `src/app/(app)/resumen/page.tsx`, `src/app/api/cron/respaldo/route.ts` (encabezado del CSV de respaldo), y las páginas que llaman a `semanaActual()` y `hoy()`.
- **Respaldo**: el CSV semanal cambia el nombre de una columna. Los respaldos anteriores tenían esa columna vacía.
- **Riesgo abierto**: que el importe gastado sea el campo que el área lee en Meta es una respuesta tentativa ("creo que"). Todavía falta confirmarlo con una captura de pantalla de Meta Business Suite a nivel de anuncio. La columna es nullable y arranca vacía, así que corregirla después sigue costando poco.
- **Sesgo aceptado**: si el registro se hace el domingo antes de que termine el día, las últimas horas del domingo no entran en ninguna semana, y Meta sigue ajustando la atribución de mensajes durante uno a tres días. No produce doble conteo. Se documenta y no se corrige con código: el registro sigue siendo editable al día siguiente.
