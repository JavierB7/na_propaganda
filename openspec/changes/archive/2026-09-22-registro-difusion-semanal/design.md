## Context

Nueva Acrópolis San Cristóbal (Venezuela) tiene un área de difusión encargada de la publicidad en redes. Su jefe, Carlos Jesús, registra las estadísticas en un cuaderno de papel: lee Meta Business Suite semana a semana y anota las cifras que después reporta.

Estado actual, reconstruido de la reunión del 25 de agosto de 2026:

- Lo que **se registra hoy** es el total de mensajes por línea y por semana. La foto del cuaderno dice literalmente `Filosofía: 47 msg / Arteterapia: 31 msg`, y el transcript confirma que ese par es el reporte semanal al director.
- Lo que **se registró antes y se perdió** es el desglose por video. El cuaderno anterior lo tenía; el actual no, porque el curso ya estaba abierto cuando empezó.
- El desglose por pieza es por tanto **disciplina nueva**, no transcripción de algo existente. Sí es transcripción del *acto de mirar*: Carlos ya consulta el dato por anuncio en Meta, solo no lo escribe.
- El número reportado es una **suma manual**: las conversaciones que Meta cuenta, más las personas que piden información en comentarios, que Meta no cuenta.
- Cada línea tiene un embudo y una escala de éxito propios, y sus interlocutores reaccionan a la misma cifra de forma opuesta. Comparar líneas entre sí produce conclusiones falsas.
- Existen tres obligaciones de reporte que hoy salen del cuaderno: conteo semanal al director, informe mensual y informe anual. Solo la primera entra en esta versión.

Restricciones:

- **Dos usuarios.** Carlos captura desde el teléfono; Javier desde escritorio. La carga real es una sesión semanal, no uso diario.
- **Uso intermitente por diseño.** Entre el cierre de un curso y la apertura del siguiente no hay nada que registrar.
- **Conectividad intermitente.** Captura móvil en Venezuela.
- **Presupuesto cero.** Planes gratuitos.
- **Usuario principal no técnico.** Cualquier fricción de captura devuelve el flujo al cuaderno.

## Goals / Non-Goals

**Goals:**

- Sacar el registro del cuaderno a un almacén compartido y durable, sin pedirle a Carlos más trabajo del que ya hace.
- Dar identidad estable y generada por el sistema a cada pieza publicitaria, para que se pueda seguir en el tiempo. Es la llave de unión de toda la memoria futura.
- Entregar valor en la primera semana: el resumen que Carlos dicta al director sale del sistema, no del papel.
- Conservar el dato plano con su procedencia intacta: nunca guardar solo una suma cuando existen sus partes.
- Aceptar dato pobre. El sistema debe seguir siendo útil cuando solo se registra el total de la línea.
- Hacer que el área sea operable por otra persona: atribución de escrituras, criterio de éxito escrito, historia consultable.

**Non-Goals:**

- Vistas de planificación, ranking histórico y análisis comparativo. Se excluyeron por decisión explícita del usuario en esta ronda.
- Informe mensual de seguidores y publicaciones por cuenta. Grano distinto (cuenta × mes), cadencia distinta, versión posterior.
- Ratio escribieron → asistieron. El denominador es de Relaciones Públicas; incorporarlo convierte esto en un sistema de dos áreas.
- Conteo mensual de colaboración de miembros. Requiere resolución de identidad entre múltiples cuentas por persona; el propio Carlos pidió que no fuera parte del sistema. Proyecto aparte.
- Demografía de audiencia. Meta ya la entrega y se consulta cuando hace falta.
- Economía del área. Todavía se reporta al fondo global de la escuela.
- Lectura automática de Meta vía Graph API. Se deja el punto de unión preparado y nada más.
- Modelado de campañas, ciclos y fases de prueba y escala. Decisión explícita: la pieza es plana.

## Decisions

### El registro semanal tiene grano flexible: la pieza es opcional

Un registro pertenece a una línea y una semana; la pieza es una referencia nullable. Sin pieza, el registro es el total agregado de la línea.

Un solo modelo cubre entonces la historia disponible (solo por línea), el futuro deseado (por pieza), y los períodos en que el desglose no se llevó. El total del resumen se calcula igual en ambos casos: sumar los registros de la línea en la semana.

*Alternativas consideradas.* **Dos tablas separadas**, una para agregados y otra para piezas: duplica la lógica de lectura y de constraints, y obliga a decidir cuál gana cuando hay ambas. **Solo grano pieza**, con una pieza sintética "sin desglose" para la historia: contamina el catálogo de piezas con entradas que no son piezas y rompe el ranking futuro. **Solo grano línea**, dejando el desglose para después: renuncia a la razón principal del proyecto.

### La regla contra doble conteo se impone en la base de datos

Para una misma línea y semana, o hay registros por pieza o hay un agregado, nunca ambos. Un índice único parcial garantiza un solo agregado por línea y semana, y otro un solo registro por pieza y semana; la exclusión entre ambos modos se impone con un trigger.

Es el costo directo de la decisión anterior. Si un agregado convive con sus piezas, el total se duplica y el número que llega al director es falso. Una regla que solo vive en la interfaz se rompe en la primera carga histórica o en la primera corrección por SQL.

*Alternativa considerada.* Validar solo en la aplicación: más simple, pero la carga histórica y las correcciones manuales entran por debajo de esa validación, que es exactamente cuando el error ocurre.

### Los mensajes se guardan en tres campos, y el total se deriva al leer

`mensajes_meta`, `consultas_comentarios` y `mensajes_total_reportado`, todos nullable. El total efectivo es `coalesce(mensajes_total_reportado, mensajes_meta + consultas_comentarios)` tratando los nulos como ausencia.

El 47 del cuaderno ya es una suma que Carlos hizo a mano, y el cuaderno no conserva las partes. El tercer campo permite cargar esa cifra sin mentir: poner 47 en `mensajes_meta` registraría como dato de Meta algo que Meta no dijo. La procedencia importa porque permite saber cuánto pesa la parte manual, que es la parte frágil.

*Alternativa considerada.* Dos campos más una bandera `desglose_desconocido`: una columna menos, pero `mensajes_meta` guarda un valor falso y cualquier consulta futura sobre rendimiento de Meta queda contaminada.

### Nulo no es cero, en el esquema y en la presentación

Todas las métricas son nullable, y las sumas y las vistas distinguen "sin dato" de "cero".

El cuaderno tiene huecos, hay campañas históricas sin desglose y Meta no siempre entrega todos los campos. Con `NOT NULL` en las métricas la carga histórica es imposible. Y presentar una semana sin registrar como una semana de cero mensajes es peor que no mostrarla: convierte un vacío en una caída inventada.

### La pieza es plana; su bandera `activo` reemplaza a la entidad campaña

No hay tabla de campañas. La pieza tiene `activo`, y eso decide si aparece en la captura de la semana.

Decisión explícita del usuario, y correcta: el ciclo real —cuatro videos lanzados, se refuerza el que funciona— se conoce, pero modelarlo agrega estructura que nadie mantendría. La bandera cubre el caso operativo con una columna. La consecuencia aceptada es que no se puede consultar "las piezas de la campaña de enero" salvo por rango de fechas de subida.

### El código de la pieza lo genera el sistema

Formato `<PREFIJO_LÍNEA>-<AAMM>-<NN>`, por ejemplo `FIL-2609-01`. Inmutable. El usuario escribe solo la descripción libre.

El problema original es precisamente el nombrado informal: "video de Isrey con Alejandro" no permite seguir una pieza. Si se le pide al usuario inventar el código, va a improvisar y el identificador se degrada — se reintroduce el problema que el sistema existe para resolver. La descripción libre cubre la necesidad humana de reconocer la pieza.

### Next.js sobre Vercel con Supabase

Next.js con App Router y Server Actions para escribir, sin capa de API propia. Supabase para Postgres, autenticación y seguridad a nivel de fila. Sin gestor de estado, sin ORM pesado, sin librería de gráficos.

Stack elegido por el usuario. Encaja: dos usuarios, escrituras poco frecuentes, cero presupuesto, y RLS resuelve autorización en la frontera correcta. La ausencia de librería de gráficos es intencional: la única lectura de esta versión es una suma.

### Dos usuarios reales, sin roles

Autenticación por enlace de acceso o proveedor de identidad, lista corta de autorizados, RLS activo en todas las tablas, y columnas de creador y último editor en cada tabla.

Dos usuarios no cuestan más que una credencial compartida. Y en un sistema cuyo propósito declarado es que el dato sobreviva a la persona —el escenario de abrir sede en otro estado con otro encargado— saber quién registró qué es parte del propósito, no un extra. Sin contraseñas propias del sistema porque el usuario principal captura desde el teléfono y no es técnico.

### La captura móvil y la carga histórica son dos superficies distintas

La pantalla semanal es móvil primero, con las piezas activas agrupadas por línea y un solo guardado. La carga histórica es de escritorio, por CSV o carga asistida, y la hace el desarrollador.

Ocho meses de historia tecleados en un teléfono no van a ocurrir. Son trabajos distintos, con frecuencia distinta y actor distinto; intentar que una pantalla sirva para ambos degrada la que se usa todas las semanas. Además, la carga histórica no bloquea el lanzamiento: esperar el inventario del cuaderno mantendría a Carlos en papel un mes más sin razón.

### La degradación de completitud es una regla, no un accidente

Tres niveles válidos: pieza con todas las métricas, pieza con mensajes solamente, total agregado de línea. Nunca se bloquea un guardado por campos faltantes ni se advierte sobre los niveles inferiores.

El desglose por pieza es la única apuesta de comportamiento del proyecto. Si el sistema lo exige, el riesgo real no es un dato pobre: es el abandono y la vuelta al cuaderno. Un dato pobre en el sistema vale más que un dato rico en papel.

### Las líneas se separan estructuralmente, no por color

Cada línea es su propia sección con su total y su unidad de éxito. No hay columna ordenable entre líneas, ni ranking entre ellas, ni total global que las sume.

Es la traducción directa de la restricción de negocio: veinte mensajes son un triunfo en arteterapia y un fracaso en librería, donde el resultado real son libros vendidos. La estructura codifica esa regla mejor que un color o una nota al pie — y un código de color por cada una de las cinco líneas sería un arcoíris decorativo que además invitaría a la comparación que queremos impedir.

La unidad de éxito se muestra pegada a las cifras, donde hace trabajo: le recuerda a quien lee que la misma cifra no significa lo mismo en cada sección. Es también el mecanismo por el que un criterio que hoy solo existe en la cabeza de Carlos queda escrito.

### Modelo de datos

```
linea
  id · nombre (único) · unidad_exito (null) · activo · orden
  creado_por · creado_en · actualizado_por · actualizado_en

pieza
  id · linea_id → linea · codigo (único, inmutable)
  descripcion · fecha_subida · activo · meta_ad_id (null)
  creado_por · creado_en · actualizado_por · actualizado_en

registro_semanal
  id · linea_id → linea · semana_inicio (lunes)
  pieza_id → pieza (NULL = agregado de línea)   ★
  reproducciones (null)
  mensajes_meta (null)
  consultas_comentarios (null)
  mensajes_total_reportado (null)   ← solo carga histórica
  inversion_usd_dia (null) · dias_activos (null)
  nota (null)
  creado_por · creado_en · actualizado_por · actualizado_en

  unique (pieza_id, semana_inicio)  where pieza_id is not null
  unique (linea_id, semana_inicio)  where pieza_id is null
  trigger: rechaza agregado si existen piezas en (linea, semana)
           rechaza pieza si existe agregado en (linea, semana)
  check: pieza_id is null or pieza.linea_id = linea_id
```

`linea_id` se guarda también en los registros de pieza, de forma redundante, para que el índice único parcial del agregado y las consultas del resumen no dependan de una unión. El `check` mantiene la coherencia con la línea de la pieza.

## Diseño visual

### Concepto

El antepasado de esta aplicación es el cuaderno, y eso manda más que cualquier referencia de producto. Cada semana es una página que se llena; el héroe de la pantalla son las cifras, no un gráfico. Nombre: **Bitácora de Difusión** — palabra que el usuario reconoce y que describe exactamente lo que reemplaza.

La señal de progreso de la semana toma su forma de una imagen que Carlos usó en la reunión: el mandala tibetano que se teje, se desteje y se vuelve a tejer, donde lo que importa es el ejercicio y no el resultado.

### Paleta

Extraída de los estilos computados de `acropolis.org` y del muestreo de píxeles del logo. El verde del logo (`#066356`) y el del sitio (`#086357`) son el mismo color, lo que ancla la paleta. El amarillo y el oliva salen del logo local.

```
--pino      #086357   estructura, cifras, botón primario
--profundo  #00453D   barra superior, estados activos
--tinta     #14261C   texto
--cromo     #F9CC06   una sola cosa: la marca de semana completa
--oliva     #A5A721   totales derivados, estado registrado
--papel     #F4F7F5   fondo — papel con tinte verde, no crema
```

Reserva: `#F39300` para el estado "sin registrar".

Regla de contraste: `--cromo` sobre fondo claro no alcanza AA, por lo que **nunca se usa como color de texto** — solo como relleno detrás de texto oscuro, o como regla y marca. El fondo es verde pálido y no crema, deliberadamente.

### Tipografía

```
Literata          cifras · títulos de línea · navegador de semana
                  serif de lectura con serifas algo slab y
                  numerales tabulares reales
Instrument Sans   etiquetas de campo · botones · ayuda · navegación
```

Las cifras van en Literata con `font-variant-numeric: tabular-nums lining-nums`, alineadas a la derecha sobre una retícula de líneas base. Ahí se concentra toda la audacia del diseño: teclear un número y verlo caer grande y alineado es lo que hace que se sienta un registro y no un formulario. Escala 15/18/22/28/40; la cifra vive en 28 en móvil y 40 en escritorio. Cuerpo por debajo de 70 caracteres.

Sin etiquetas en mayúsculas espaciadas, sin flechas añadidas al texto de los botones, sin cadenas de metadatos unidas por puntos medios, sin numeración decorativa. Los códigos de pieza son identificadores reales y por eso se muestran.

### Estructura móvil

```
┌───────────────────────────────┐
│ ⬤ Bitácora            Salir   │  barra --profundo, monograma
├───────────────────────────────┤
│  ‹    8 – 14 sep         ›    │  Literata 28, zonas de tap
│       ◆◆◆◇◇  3 de 5           │  progreso de la semana
├───────────────────────────────┤
│  Filosofía                    │  Literata 22, sentence case
│  Un curso flojo se nota aquí  │  unidad de éxito
│  ═════════════════════════    │
│  FIL-2609-01                  │
│  Isrey con Alejandro          │
│  Reproducciones      1 240    │  etiqueta izq · cifra der
│  ───────────────────────────  │
│  Mensajes               18    │
│  ───────────────────────────  │
│  Consultas en coment.    3    │
│  ───────────────────────────  │
│  Inversión         $3 × 7 d   │
│  ───────────────────────────  │
│  Total de esta pieza    21    │  oliva, subrayado cromo
├───────────────────────────────┤
│  Arteterapia                  │
│  Dos asistentes ya es triunfo │
│  ═════════════════════════    │
│  Sin piezas activas.          │
│  Registrar solo el total ›    │
├───────────────────────────────┤
│ ▓▓▓▓  Guardar semana   ▓▓▓▓   │  sticky, --pino
└───────────────────────────────┘
```

La cifra va a la derecha porque ahí llega el pulgar. Campos con `inputmode="numeric"`, objetivos de toque de 48px o más, barra de guardado fija respetando el área segura, sin modales para capturar, y navegador de semana con controles grandes en lugar de un selector de fecha.

### Estructura de escritorio

El ancho gana una tabla real y dos columnas de contexto histórico, que responden lo que Carlos hoy compara de memoria sin construir un gráfico.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ⬤  Bitácora de Difusión                          Carlos Jesús  ▾          │
├────────────────────────────────────────────────────────────────────────────┤
│  ‹   Semana del 8 al 14 de septiembre   ›              ◆◆◆◇◇  3 de 5       │
│                                                                            │
│  Filosofía                                              ┌ semanas previas ┐│
│  Un curso flojo se nota aquí                            │  1 sep   25 ago ││
│  ══════════════════════════════════════════════════════════════════════════│
│              Reprod.   Mensajes   Coment.   Inversión   │  Total   Total  ││
│  FIL-2609-01   1 240         18         3    $3 × 7 d   │     14      44  ││
│  FIL-2609-02     980         11         1    $2 × 7 d   │     19       —  ││
│  ─────────────────────────────────────────────────────────────────────────  │
│  Filosofía      2 220         29         4       $35    │     33      44  ││
│                                                                            │
│  Arteterapia                                                               │
│  Dos asistentes ya es triunfo                                              │
│  ══════════════════════════════════════════════════════════════════════════│
│  Total de línea    —          31         —         —    │     28      31  ││
└────────────────────────────────────────────────────────────────────────────┘
```

No es la pantalla móvil estirada. `Tab` recorre la fila y `Enter` baja por la columna, porque se transcribe una métrica a través de todas las piezas y no una pieza completa a la vez. Las semanas previas son de solo lectura. El guion largo marca ausencia de dato, nunca un cero.

### Movimiento

Un solo momento orquestado: al guardar, la marca de la semana se completa, `◆◆◆◇◇` → `◆◆◆◆◆`, en unos 400ms, respetando `prefers-reduced-motion`. Nada más se mueve. Sin entradas escalonadas por sección ni transiciones de hover en cada fila.

### Texto de la interfaz

Español, oración con mayúscula inicial, verbos activos, y el vocabulario que Carlos ya usa: mensajes, reproducciones, consultas en comentarios, inversión, línea, pieza, semana. "Guardar semana" confirma como "Semana guardada". Los vacíos son invitaciones a actuar: "Sin piezas activas en Filosofía. Activa una pieza o registra solo el total de la línea."

### Uso del logo

El archivo disponible es un disco con el RIF y la ciudad, ilegible a tamaño de barra de navegación. En la pantalla de acceso va el disco completo y grande; en la barra de la aplicación, solo el monograma NA en blanco sobre `--profundo`, que es lo que hace el propio sitio de la organización. Falta el monograma suelto como activo.

## Risks / Trade-offs

**Los cuatro campos del grano pieza son una suposición.** Los nombres y hasta la existencia real de reproducciones, mensajes, consultas e inversión a nivel de anuncio no se han verificado contra Meta Business Suite. → Columnas planas y nullable sobre un grano que arranca con cero filas: corregirlas es un `ALTER TABLE` trivial. Se descartó deliberadamente un `jsonb` de métricas "por flexibilidad": sonaría prudente y sería peor, porque pierde tipos, validación y consultas a cambio de evitar una migración que aquí no cuesta nada. El nombrado definitivo debe copiar las etiquetas literales de Meta, para que capturar mirando la pantalla de Meta no requiera traducción.

**Carlos puede no sostener el desglose por pieza.** Es la única apuesta de comportamiento del proyecto; todo lo demás es transcripción de lo que ya hace. → El sistema acepta el total de línea como registro válido y nunca exige el desglose. Si la disciplina no se sostiene, el sistema sigue entregando el resumen semanal, que es su valor inmediato.

**El plan gratuito de Supabase pausa proyectos inactivos.** El patrón de uso es exactamente el caso malo: semanas enteras sin sesiones entre cursos. → Tarea programada de ping con frecuencia menor al umbral, más respaldo semanal a CSV. Debe verificarse el umbral vigente antes de comprometer el plan; si el ping no basta, las alternativas son un proveedor que reanude solo o pagar.

**El plan gratuito no tiene recuperación a un punto en el tiempo.** Una fila borrada por error no tiene vuelta atrás. → Respaldo programado a CSV en destino independiente. El volumen es de decenas de filas por mes, así que el respaldo completo es trivial.

**No se sabe cuánta historia contiene el cuaderno.** La carga histórica se planteó como transcripción, pero primero es un inventario. → Se secuencia como inventariar, decidir y después transcribir; y no bloquea el lanzamiento de la captura semanal. Si la cobertura es pobre, la opción de descartar 2026 y arrancar limpio sigue disponible.

**El registro sigue dependiendo de que Carlos lea Meta a mano.** El sistema no elimina ese paso, solo el papel. → `meta_ad_id` queda preparado desde el inicio para que la automatización futura sea una unión de datos y no una remodelación.

**El cambio de política de inversión mínima de Meta partió la serie histórica.** Los datos anteriores y posteriores al cambio no son directamente comparables: es un cambio de régimen, no una tendencia. → El campo `nota` permite marcar los registros afectados durante la carga histórica. No se modela como una entidad porque solo importará cuando existan las vistas de planificación, fuera de alcance aquí.

**La contabilidad de líneas puede estar incompleta.** El transcript menciona eventos de Nueva Acrópolis y eventos culturales como categorías propias, y la lista confirmada tiene cinco. → El catálogo de líneas es configurable; Carlos confirma o agrega al abrir la aplicación.

**Los códigos de pieza no expresan campaña.** Al no modelar campañas, agrupar "las piezas de la campaña de enero" solo se puede por rango de fecha de subida. → Trade-off aceptado explícitamente a cambio de simplicidad. Si más adelante hace falta, una tabla de campañas se añade sin tocar los registros.

## Migration Plan

No hay sistema previo que migrar: el origen es papel y el cuaderno se sigue llevando en paralelo por decisión de Carlos.

1. Esquema, autenticación y RLS en Supabase. Semilla de las cinco líneas.
2. Despliegue de captura y resumen. Tareas programadas de ping y respaldo activas desde el primer despliegue.
3. Primera semana en paralelo: Carlos anota en el cuaderno y registra en el sistema. El resumen del sistema se compara con lo que él dictaría de memoria.
4. Confirmación de los campos del grano pieza contra una captura de Meta Business Suite, y ajuste de nombres y columnas si hace falta. El grano pieza tiene pocas filas en este punto.
5. Inventario del cuaderno, decisión sobre cobertura, y carga histórica de enero a agosto de 2026 a nivel de línea.

Reversión: el cuaderno sigue siendo la fuente en paralelo durante las primeras semanas, así que abandonar no pierde datos. Después de la carga histórica, el respaldo CSV es el punto de retorno.

## Open Questions

- ¿Qué campos y qué etiquetas exactas ofrece Meta Business Suite a nivel de anuncio? Es el único desconocido con consecuencias sobre el esquema. Se resuelve con una captura de pantalla.
- ¿"Visitas", "reproducciones" y "visualizaciones" son un mismo campo? El transcript usa los tres términos de forma intercambiable. Probablemente colapsan en uno con el nombre que use Meta.
- ¿Los mensajes se guardan por canal o como total? Carlos dijo que Meta entrega el total de WhatsApp, Facebook e Instagram junto, pero la tabla del informe mensual que mostró trae cifras separadas por cuenta. Posiblemente son dos fuentes distintas: métricas por cuenta frente a conversaciones a nivel de anuncio. Afecta si `mensajes_meta` necesita desglose por canal, y hoy se asume que no.
- ¿Cuántas semanas cubre realmente el cuaderno, y con qué líneas? Determina si el informe anual sale completo o parcial.
- ¿Está disponible el monograma NA como activo suelto (SVG o PNG transparente)?
- ¿Las cinco líneas confirmadas están completas, o falta alguna de las categorías que aparecen en el transcript?
