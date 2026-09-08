# Bitácora de Difusión

Registro semanal de la publicidad del área de difusión de Nueva Acrópolis San
Cristóbal. Reemplaza el cuaderno de papel donde hoy vive la única memoria de
qué publicidad funcionó.

Dos usuarios: el jefe del área captura desde el teléfono, el desarrollador
carga la historia y mantiene el sistema. La carga real es una sesión semanal,
no uso diario.

- Contexto y decisiones: `openspec/changes/registro-difusion-semanal/`
- Transcript de la reunión que originó todo: `docs/meetings/meeting_25_agosto.txt`

## Arranque local

Requiere Node 20.9 o superior. **Node 22 recomendado**: `@supabase/supabase-js`
ya avisa que dejará de soportar Node 20.

```bash
npm install
cp .env.example .env.local   # y llenar los valores
npm run dev                  # http://localhost:3000
```

### Variables de entorno

Todas están documentadas en `.env.example`. Las que hay que conseguir:

| Variable | Dónde sale |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Igual. **Secreta**: pasa por encima de RLS |
| `NEXT_PUBLIC_SITE_URL` | URL del despliegue, para el enlace de acceso |
| `CRON_SECRET` | `openssl rand -hex 32` |

Las dos primeras viajan al navegador y no son secretas: lo que protege los
datos es la seguridad a nivel de fila en Postgres, no que la clave sea difícil
de conseguir.

## Base de datos

Las migraciones están en `supabase/migrations/`, numeradas y pensadas para
aplicarse en orden. Se pueden pegar en el editor SQL de Supabase o aplicar con
la CLI de Supabase.

```
0001_atribucion.sql        helper que llena creado_por / actualizado_por
0002_linea.sql             líneas de difusión
0003_pieza.sql             piezas, con código autogenerado e inmutable
0004_registro_semanal.sql  mediciones + integridad contra doble conteo
0005_acceso.sql            lista de autorizados y políticas RLS
0006_semilla_lineas.sql    las cinco líneas confirmadas con Carlos
```

Después de aplicarlas, hay que dar acceso a los usuarios. La lista vive en la
base de datos y no en la aplicación, porque es la misma que sostiene las
políticas:

```sql
insert into public.usuario_autorizado (correo, nota) values
  ('carlos@ejemplo.com', 'jefe del área de difusión'),
  ('javier@ejemplo.com', 'desarrollo');
```

### Pruebas del esquema

Las garantías que sostiene la base de datos se prueban contra un Postgres 16
desechable en Docker. No toca el proyecto de Supabase ni ningún contenedor que
ya esté corriendo.

```bash
npm run db:test        # levanta, migra y corre las pruebas
npm run db:test:down   # borra el contenedor
```

Cubre: integridad contra doble conteo en las dos direcciones, unicidad por
pieza y por línea, que un registro de pieza lleve la línea de su pieza, que la
semana empiece en lunes, códigos secuenciales e inmutables, atribución de
escrituras, que nulo no sea cero, y que RLS niegue todo a quien no esté
autorizado.

`supabase/tests/shim_auth.sql` reemplaza el esquema `auth` de Supabase para
poder probar contra un Postgres pelado. **Solo para pruebas.**

## Pruebas de dominio

```bash
npm test        # node:test sobre la lógica pura
npm run typecheck
```

## Despliegue

Vercel, desde la rama principal. Además de las variables de entorno, hay que
configurar dos tareas programadas:

### Ping contra la pausa por inactividad

`vercel.json` ya declara un cron diario a `/api/cron/ping`.

El plan gratuito de Supabase pausa proyectos con baja actividad en un período
de 7 días. El uso de la bitácora es intermitente **por diseño**: cuando un
curso cierra no hay nada que registrar hasta que abre el siguiente, y pueden
pasar semanas sin que nadie entre. Sin este ping, el proyecto se pausa y el
problema se descubre justo el día en que se necesita el dato.

Vive en Vercel Cron y no en GitHub Actions a propósito: los workflows
programados de GitHub se deshabilitan tras 60 días de inactividad del
repositorio, que es exactamente el escenario del que hay que protegerse.

### Respaldo semanal

`.github/workflows/respaldo.yml` descarga el respaldo y lo comita en
`respaldos/`. Necesita dos secretos del repositorio:

- `URL_APP` — la URL del despliegue, sin barra final
- `CRON_SECRET` — el mismo valor que en Vercel

Se comita al repositorio en lugar de guardarse como artefacto porque los
artefactos expiran, y porque el commit cuenta como actividad del repositorio y
mantiene vivo el propio workflow.

El plan gratuito de Supabase no tiene recuperación a un punto en el tiempo:
este archivo es el único punto de retorno si se borra una fila por error.

## Estructura

```
src/
  dominio/       lógica pura, con pruebas. No sabe de Supabase ni de React
  datos/         lecturas del esquema
  acciones/      Server Actions: lo único que escribe
  componentes/   piezas compartidas de interfaz
  app/
    acceso/      enlace de acceso por correo, sin contraseñas
    (app)/
      semana/    captura semanal — la pantalla que decide si se usa o no
      resumen/   la única lectura: total de mensajes por línea
      config/    líneas, piezas y carga histórica
    api/cron/    ping y respaldo
  proxy.ts       refresca la sesión y manda a acceso a quien no tenga
supabase/
  migrations/    esquema
  tests/         pruebas del esquema y shim de auth
```

## Reglas del sistema que conviene no romper

Están especificadas en `openspec/changes/registro-difusion-semanal/specs/`,
pero estas cuatro explican la mayoría del código:

1. **Nulo no es cero.** Un campo vacío es dato no disponible. Una semana sin
   registrar no es una semana de cero mensajes; presentarla así convierte una
   ausencia en una caída inventada.
2. **Los mensajes se guardan en partes, no como suma.** Meta cuenta las
   conversaciones por bandeja, pero no a quien pide información en los
   comentarios, y esas se suman a mano. `mensajes_total_reportado` existe solo
   para la historia del cuaderno, que conserva la suma y no sus partes.
3. **Las líneas nunca se comparan entre sí.** Veinte mensajes son un triunfo en
   arteterapia y un fracaso en librería, donde el resultado real son libros
   vendidos. Por eso no hay ranking entre líneas, ni columna ordenable, ni
   total global.
4. **Nunca se bloquea un guardado por campos vacíos.** El desglose por pieza es
   disciplina nueva para el área. Si el sistema lo exige, el riesgo no es un
   dato pobre: es el abandono y la vuelta al cuaderno.

## Pendiente de confirmar

Los cuatro campos del grano pieza (reproducciones, mensajes, consultas en
comentarios, inversión) son una **suposición** hasta verlos contra una captura
de Meta Business Suite a nivel de anuncio. Son columnas planas y nullable sobre
un grano que arranca sin filas, así que corregirlas es un `ALTER TABLE`
trivial. Cuando se confirmen, conviene usar las etiquetas literales de Meta
para que capturar mirando esa pantalla no requiera traducir nada.
