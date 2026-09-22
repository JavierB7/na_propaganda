# Design

## Context

- `src/dominio/semana.ts` calcula `hoy()` con `getTimezoneOffset()` del proceso. `semanaActual()` sale de `hoy()`. Los dos se llaman desde server components (`semana/page.tsx`, `resumen/page.tsx`, `NavegadorDeSemana.tsx`, `config/piezas/page.tsx`). En Vercel ese proceso corre en UTC, y no hay `TZ` configurada.
- `registro_semanal.inversion_usd_dia` y `dias_activos` (migración `0004`) son columnas nullable. `dias_activos` tiene un check `0..366`. La inversión mostrada se deriva en `inversionDeRegistro` (`src/dominio/totales.ts`) como producto de las dos columnas. La columna de inversión está vacía en producción.
- Los tipos de Supabase (`src/lib/supabase/tipos.ts`) se mantienen a mano.
- El CSV histórico (`src/dominio/historico.ts`) mapea encabezados por alias e **ignora en silencio** las columnas desconocidas. `LecturaHistorica` solo tiene `validas` y `rechazadas`: no hay canal para avisos sobre el archivo en conjunto.
- El respaldo (`api/cron/respaldo`) exporta con `select('*')` y toma los encabezados de las claves de la primera fila. El renombre de columna se propaga solo.
- Las pruebas de esquema viven en `supabase/tests/pruebas_esquema.sql`. Las de dominio, en `src/dominio/*.test.ts`.

## Goals / Non-Goals

**Goals:**
- Una sola fuente de "hoy" en el dominio, con la zona de Caracas explícita, que dé lo mismo en servidor, cliente y pruebas.
- Que el esquema guarde la inversión como la da Meta, sin columnas derivadas ni valores inventados.
- Que la carga histórica no acepte un valor por día en silencio.

**Non-Goals:**
- Soportar varias zonas horarias o dejarla configurable. El área opera en un solo lugar.
- Detectar cifras acumuladas copiadas por error. Se previene con el rango visible, no con heurísticas.
- Vista de historia de la pieza.

## Decisions

### D1. "Hoy" con `Intl.DateTimeFormat` y `timeZone: 'America/Caracas'`

`hoy(ahora)` formatea el instante con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit', day: '2-digit' })`. `en-CA` da `YYYY-MM-DD` directo. El resto del módulo sigue en aritmética UTC sobre días de calendario, como ahora. La zona queda como constante del dominio (`ZONA_DEL_AREA`).

Alternativas descartadas:
- **Variable `TZ` en Vercel:** la corrección dependería de configuración de despliegue invisible desde el código, las pruebas locales no la verían, y el runtime puede reservar esa variable.
- **Calcular la semana en el cliente con la zona del dispositivo:** obliga a convertir las páginas en client components o a hacer un ida y vuelta, y un teléfono con la zona mal configurada rompería la semana igual.
- **Desplazar a mano -4 horas:** Venezuela ya cambió de huso antes (2007, 2016). La base de zonas de ICU sigue esos cambios sin tocar código.

Las firmas públicas (`hoy(ahora?)`, `semanaActual(ahora?)`) no cambian. Los llamadores no se tocan.

### D2. Renombrar la columna, no agregar otra

Migración `0007_inversion_semanal.sql`:
- `alter table registro_semanal rename column inversion_usd_dia to inversion_usd`
- renombrar el constraint `registro_inversion_no_negativa`. Conserva su lógica, `>= 0` sobre la columna renombrada, que Postgres sigue automáticamente.
- reemplazar `registro_dias_activos_rango` por `0..7`
- `comment on column` explicando que es el importe gastado de Meta para lunes–domingo

Alternativa descartada: agregar `inversion_usd` y eliminar la vieja. Con la columna vacía da el mismo resultado final, pero el `rename` deja más claro en el historial de migraciones que es el mismo concepto, corregido. El check de días se puede ajustar sin riesgo porque la columna está vacía: no hay filas que violen `0..7`.

### D3. Eliminar `inversionDeRegistro`

Con la inversión guardada tal cual, la función no tiene razón de existir. El resumen lee `registro.inversion_usd` y muestra `—` si es nulo. La nota "(5 × 7 días)" desaparece. Los días activos, si existen, se muestran como dato aparte.

### D4. CSV histórico: columna `inversion_usd` y aviso para columnas por día

- La columna canónica pasa a `inversion_usd`. Alias aceptados: `inversion`, `inversion_usd`, `gasto`, `importe_gastado`.
- `inversion_usd_dia` y `usd_dia` dejan de ser alias. Ignorarlos en silencio haría perder el dato sin avisar, así que `LecturaHistorica` gana un campo `avisos: string[]`. Si el encabezado trae una de esas columnas, se agrega un aviso: la inversión se espera como gasto de la semana y la columna no se cargó. Las filas se siguen cargando con el resto de sus datos.
- La plantilla o ayuda de columnas en `config/historico` se genera desde `COLUMNAS_HISTORICO`, así que se actualiza sola. Hay que mostrar los avisos en `carga.tsx`.

Alternativa descartada: rechazar el archivo entero. La regla de la carga histórica es cargar lo válido y reportar el resto, y la inversión es un dato secundario del cuaderno.

### D5. Rango de Meta en la captura

Nueva función pura `rangoParaMeta(semana)` en `semana.ts`: devuelve "del lunes 7 al domingo 13 de septiembre", y repite el mes solo si la semana cruza de mes (y el año si cruza de año, igual que `rangoLargo`). Se muestra como una línea bajo el navegador en la pantalla de captura, en móvil y en escritorio: "En Meta elige: del lunes 7 al domingo 13 de septiembre". Solo en captura: el resumen no transcribe desde Meta.

## Risks / Trade-offs

- [El importe gastado no es el campo que el área lee en Meta] → La columna es nullable y está vacía. Corregirla es otra migración trivial. Confirmar con una captura de pantalla de Meta antes de la primera semana con inversión registrada.
- [La base de zonas horarias del runtime queda desactualizada si Venezuela vuelve a cambiar de huso] → Node trae ICU completo y se actualiza con cada versión. Una prueba fija un instante conocido (domingo 22:00 VET = lunes 02:00 UTC) para detectar regresiones del cálculo, no del huso.
- [Registro el domingo antes de terminar el día: se pierden las últimas horas y la atribución tardía de Meta] → Sesgo aceptado y documentado en la propuesta. Los registros se pueden editar al día siguiente.
- [Borrador local con la clave vieja `inversionUsdDia`] → Un borrador sin guardar de antes del despliegue perdería solo ese campo al restaurarse. Nadie cargó inversión todavía, así que el impacto práctico es nulo. No se migra el borrador.

## Migration Plan

1. Aplicar `0007_inversion_semanal.sql` en Supabase. Es compatible hacia atrás solo en parte: el código viejo escribe `inversion_usd_dia` y fallaría. Aplicar la migración y desplegar el código en la misma ventana, fuera del domingo de carga.
2. Desplegar la aplicación.
3. Verificar: abrir `/semana` y confirmar que el rango de Meta aparece; guardar una inversión de prueba y verla en `/resumen`; revisar que el siguiente respaldo CSV traiga la columna `inversion_usd`.

Rollback: la migración se invierte renombrando la columna de vuelta y restaurando el check `0..366`, y se redespliega el commit anterior. El arreglo de zona horaria no toca el esquema y se revierte por separado.
