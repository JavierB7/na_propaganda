# Tasks

## 1. Zona horaria de Caracas

- [x] 1.1 Reescribir `hoy()` en `src/dominio/semana.ts` con `Intl.DateTimeFormat` y la constante `ZONA_DEL_AREA = 'America/Caracas'` (D1), sin cambiar su firma; verificar con `npm run typecheck`
- [x] 1.2 Agregar pruebas en `src/dominio/dominio.test.ts`: domingo 13 sep 22:00 VET (`2026-09-14T02:00:00Z`) ⇒ `semanaActual` = `2026-09-07` y `hoy()` = `2026-09-13`; lunes 14 sep 00:30 VET (`2026-09-14T04:30:00Z`) ⇒ `2026-09-14`. Verificar que pasan con `npm test`, también con `TZ=UTC npm test` y con `TZ=Asia/Tokyo npm test`

## 2. Esquema: inversión semanal

- [x] 2.1 Crear `supabase/migrations/0007_inversion_semanal.sql`: renombrar `inversion_usd_dia` → `inversion_usd`, renombrar su constraint, reemplazar el check de `dias_activos` por `0..7` y agregar comentarios de columna (D2); verificar aplicándola en la base de prueba con `npm run db:test`
- [x] 2.2 Actualizar `supabase/tests/pruebas_esquema.sql`: `dias_activos = 8` se rechaza, `dias_activos = 7` se acepta, `inversion_usd` negativa se rechaza; verificar con `npm run db:test`
- [x] 2.3 Renombrar el campo en `src/lib/supabase/tipos.ts` y verificar que `npm run typecheck` señala todos los usos pendientes

## 3. Captura y resumen

- [x] 3.1 En `src/acciones/registros.ts` y `src/app/(app)/semana/captura.tsx`, renombrar `inversionUsdDia` → `inversionUsd` y cambiar la etiqueta a "Inversión de la semana (USD)"; verificar con `npm run typecheck` y guardando una inversión en `/semana` en local
- [x] 3.2 Eliminar `inversionDeRegistro` de `src/dominio/totales.ts` y sus pruebas; en `src/app/(app)/resumen/page.tsx`, mostrar `inversion_usd` tal cual, o `—` si es nulo, sin la nota "× días" (D3); verificar en `/resumen` que 34.60 con 5 días se muestra como $34.60
- [x] 3.3 Agregar `rangoParaMeta(semana)` en `src/dominio/semana.ts` con pruebas para una semana dentro del mes (7–13 sep), una que cruza de mes (28 sep – 4 oct) y una que cruza de año; verificar con `npm test`
- [ ] 3.4 Mostrar "En Meta elige: …" bajo el navegador en la captura, en móvil y escritorio (D5); verificar visualmente en `/semana` a 375 px y a ancho de escritorio, y que el contraste pasa `npm run contraste` si se usa un color nuevo

## 4. Carga histórica

- [x] 4.1 En `src/dominio/historico.ts`, cambiar la columna canónica a `inversion_usd`, con alias `inversion`, `inversion_usd`, `gasto` e `importe_gastado`; quitar `inversion_usd_dia` y `usd_dia` como alias y agregar `avisos: string[]` a `LecturaHistorica`, con un aviso si el encabezado trae alguno de los dos (D4). Verificar con pruebas en `historico.test.ts`: `inversion=34.60` carga 34.60, y `usd_dia=5` produce un aviso, carga la fila y deja la inversión nula
- [ ] 4.2 Mostrar los avisos en `src/app/(app)/config/historico/carga.tsx` y actualizar los textos de ayuda que mencionen inversión por día; verificar cargando en local un CSV con `usd_dia`

## 5. Specs, verificación y despliegue

- [x] 5.1 Buscar referencias restantes con `grep -rn "inversion_usd_dia\|inversionUsdDia\|por día" src supabase` y verificar que no queda ninguna fuera de las migraciones `0004` y `0007`
- [x] 5.2 Ejecutar `npm run typecheck`, `npm test`, `npm run db:test` y `npm run build`, y verificar que los cuatro terminan sin errores
- [ ] 5.3 Aplicar `0007` en Supabase de producción y desplegar en la misma ventana, fuera del domingo; verificar según el plan de migración de design.md (rango visible en `/semana`, inversión de prueba en `/resumen`, columna `inversion_usd` en el siguiente respaldo)
