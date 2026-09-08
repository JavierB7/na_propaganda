## Why

El área de difusión de Nueva Acrópolis San Cristóbal lleva sus estadísticas en un cuaderno de papel de Carlos Jesús (jefe del área). Ese cuaderno es la única memoria de qué publicidad funcionó, y con él se alimentan tres reportes recurrentes: el conteo semanal al profe Ricardo, el informe mensual y el informe anual. Dos consecuencias: el dato no sobrevive a la persona ni al cuaderno, y para responder "¿cuál video dio más resultado?" hay que volver a revisar Meta Business Suite anuncio por anuncio.

El cuaderno anterior sí tenía el desglose por video; se perdió. Este cambio reemplaza el cuaderno por un registro compartido y persistente, de manera que la planificación de campañas se apoye en historia y no en memoria, y que el área siga siendo operable si cambia el encargado.

## What Changes

- **Nueva aplicación web** (Bitácora de Difusión), móvil primero y usable en escritorio, para que Carlos y Javier registren las estadísticas semanales de publicidad. Reemplaza la propuesta previa de hacerlo en Excel.
- **Catálogo de líneas de difusión** (Filosofía, Arteterapia, Filosofía Café, Librería, Filoart) con pantalla de configuración para agregar o desactivar líneas. Cada línea guarda su *unidad de éxito* en texto libre: 20 mensajes significan cosas distintas en librería y en filosofía, y ese criterio hoy solo existe en la cabeza de Carlos.
- **Catálogo de piezas** (videos y creativos) con **código autogenerado** por el sistema. Hoy se nombran informalmente ("video de Isrey con Alejandro"), lo que impide seguir una pieza en el tiempo. La pieza es plana: no se modela campaña ni fases de test/escala.
- **Captura semanal** de reproducciones, mensajes de Meta, consultas recibidas en comentarios, e inversión (USD por día × días activos).
- **Grano flexible**: el registro semanal acepta pieza o solo línea. Hoy Carlos únicamente lleva el total por línea; el desglose por pieza es disciplina nueva. El sistema nunca bloquea un guardado por falta de desglose — peor dato es mejor que volver al cuaderno.
- **Mensajes en dos campos separados, no la suma**. El 47 que Carlos reporta ya es una suma manual: lo que Meta cuenta más las personas que preguntan en comentarios, que Meta no cuenta. Guardar solo el total destruye la trazabilidad.
- **Un solo reporte de lectura en v1**: el resumen semanal por línea, que es exactamente lo que Carlos le dicta al profe Ricardo cada semana. Sin dashboard, sin gráficos.
- **Carga histórica de enero–agosto 2026** a nivel de línea, en superficie de escritorio (CSV o carga asistida), no por teléfono. Habilita el informe anual.
- **Acceso para dos usuarios reales** con RLS activo, sin roles. Ambos pueden todo, pero cada fila queda atribuida.
- **Operación**: respaldo semanal a CSV y ping programado contra la pausa por inactividad del plan gratuito de Supabase. El uso es intermitente por diseño — entre cursos pasan semanas sin que nadie entre.

Fuera de alcance en esta versión: ranking histórico y vistas de planificación, informe mensual de seguidores y publicaciones por cuenta, ratio escribieron→asistieron (el denominador es de Relaciones Públicas), conteo mensual de colaboración de miembros (proyecto aparte), demografía (Meta ya la da), economía del área (todavía va al fondo global de la escuela).

## Capabilities

### New Capabilities

- `catalogo-difusion`: Líneas de difusión y piezas publicitarias. Alta, edición y desactivación de líneas; unidad de éxito por línea; alta de piezas con código autogenerado, fecha de subida, línea, estado activo e identificador opcional de anuncio de Meta para automatización futura.
- `registro-semanal`: Captura de mediciones semanales contra pieza o contra línea, definición de semana, reglas de grano y degradación aceptada, separación de mensajes de Meta y consultas en comentarios, integridad contra doble conteo, y carga histórica a nivel de línea.
- `resumen-semanal`: Lectura del total de mensajes por línea para una semana dada, con las dos semanas previas como contexto, y la unidad de éxito de cada línea visible junto a sus cifras. Las líneas nunca se presentan como comparables entre sí.
- `acceso-y-operacion`: Autenticación de dos usuarios sin roles, aislamiento por RLS, atribución de escrituras, respaldo periódico de datos y mantenimiento del proyecto contra la pausa por inactividad.

### Modified Capabilities

Ninguna. El repositorio no tiene especificaciones previas.

## Impact

- **Repositorio**: proyecto nuevo. Hoy solo contiene el transcript de la reunión, el logo y el andamiaje de OpenSpec.
- **Stack**: Next.js (App Router) desplegado en Vercel; Supabase para Postgres, autenticación y RLS. Tipografías Literata e Instrument Sans desde Google Fonts.
- **Dependencias externas**: cuenta de Supabase (plan gratuito), cuenta de Vercel, y un programador de tareas (GitHub Actions o Vercel Cron) para respaldo y ping.
- **Datos**: volumen mínimo — decenas de filas por mes. El activo es la historia acumulada, no el tamaño.
- **Riesgo abierto**: los cuatro campos del grano pieza (reproducciones, mensajes, consultas en comentarios, inversión) son **suposición** hasta confirmarlos contra una captura de pantalla de Meta Business Suite a nivel de anuncio. Se asumen columnas planas y nullable, de modo que corregirlas sea un ALTER TABLE sobre un grano que arranca sin filas.
- **Riesgo abierto**: no se sabe cuántas semanas cubre realmente el cuaderno. La carga histórica empieza por inventariar el cuaderno y decidir después; no bloquea el lanzamiento.
- **Apuesta de comportamiento**: que Carlos sostenga el registro por pieza. Todo lo demás es transcripción de lo que ya hace hoy.
- **Activo pendiente**: el monograma NA suelto (SVG o PNG transparente). El logo disponible es un disco con RIF y ciudad, ilegible a tamaño de barra de navegación.
