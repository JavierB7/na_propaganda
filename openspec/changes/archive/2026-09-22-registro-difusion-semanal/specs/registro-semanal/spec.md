## ADDED Requirements

### Requirement: Definición de semana

El sistema SHALL identificar cada semana por la fecha de su lunes. La pantalla de captura SHALL abrir por defecto en la semana en curso y SHALL permitir moverse a semanas anteriores y posteriores.

Sin una definición única de semana, dos cargas hechas el mismo jueves producen filas distintas y los totales mienten.

#### Scenario: Apertura en la semana en curso
- **WHEN** un usuario abre la pantalla de captura un jueves
- **THEN** la semana seleccionada es la que contiene ese jueves, identificada por su lunes

#### Scenario: Navegación entre semanas
- **WHEN** un usuario retrocede una semana
- **THEN** el sistema muestra los registros ya guardados de esa semana, si existen, listos para editar

#### Scenario: Dos cargas de la misma semana no duplican
- **WHEN** un usuario guarda cifras de una pieza y más tarde vuelve a la misma semana y las corrige
- **THEN** el sistema actualiza el registro existente en lugar de crear uno nuevo

### Requirement: Registro semanal con grano flexible

Un registro semanal SHALL pertenecer a una línea y a una semana, y SHALL poder estar asociado a una pieza o no estarlo. Un registro sin pieza representa el total agregado de la línea en esa semana.

Este grano flexible es lo que permite cargar la historia disponible — que solo existe a nivel de línea — y a la vez capturar el desglose por pieza de aquí en adelante, con un solo modelo.

#### Scenario: Registro asociado a una pieza
- **WHEN** un usuario captura cifras para la pieza FIL-2609-01 en la semana del 8 de septiembre
- **THEN** el sistema guarda un registro de esa pieza, esa línea y esa semana

#### Scenario: Registro agregado de línea
- **WHEN** un usuario captura únicamente el total de mensajes de la línea Arteterapia en una semana, sin piezas
- **THEN** el sistema guarda un registro de esa línea y semana sin pieza asociada

#### Scenario: Unicidad por pieza y semana
- **WHEN** ya existe un registro para una pieza en una semana
- **THEN** el sistema no permite crear un segundo registro para esa misma pieza y semana

#### Scenario: Unicidad del agregado por línea y semana
- **WHEN** ya existe un registro agregado para una línea en una semana
- **THEN** el sistema no permite crear un segundo registro agregado para esa misma línea y semana

### Requirement: Integridad contra doble conteo

Para una misma línea y semana, el sistema SHALL aceptar registros por pieza o un registro agregado de línea, pero NUNCA ambos a la vez. Esta regla SHALL imponerse en la base de datos, no solo en la interfaz.

Sin esta regla, un agregado conviviendo con sus piezas duplica el total y el número reportado al director es incorrecto.

#### Scenario: Agregado bloqueado cuando existen piezas
- **WHEN** una línea ya tiene registros por pieza en una semana
- **THEN** la interfaz no ofrece la opción de registrar el total agregado de esa línea en esa semana
- **AND** un intento de escritura directa del agregado es rechazado

#### Scenario: Pieza bloqueada cuando existe un agregado
- **WHEN** una línea ya tiene un registro agregado en una semana
- **THEN** el sistema rechaza guardar registros por pieza para esa línea y semana, e indica que primero debe eliminarse el agregado

#### Scenario: Convertir agregado en desglose
- **WHEN** un usuario elimina el registro agregado de una línea en una semana
- **THEN** el sistema permite capturar registros por pieza para esa línea y semana

### Requirement: Campos de medición

Un registro semanal SHALL poder guardar reproducciones, mensajes contados por Meta, consultas recibidas en comentarios, inversión en dólares por día y días activos. Todos los campos SHALL ser nullable.

Los nombres y la existencia real de los campos del grano pieza son una suposición pendiente de confirmar contra una captura de Meta Business Suite a nivel de anuncio. Al ser columnas planas y nullable sobre un grano que arranca sin filas, corregirlas es una migración trivial.

Un campo vacío significa dato no disponible y SHALL NOT tratarse como cero en las sumas.

#### Scenario: Guardado parcial aceptado
- **WHEN** un usuario captura solo el número de mensajes de una pieza y deja el resto vacío
- **THEN** el sistema guarda el registro sin error

#### Scenario: Nulo distinto de cero
- **WHEN** una pieza tiene reproducciones vacías y otra tiene reproducciones en cero
- **THEN** el total de reproducciones de la línea refleja únicamente el cero registrado
- **AND** el sistema no presenta la pieza sin dato como si hubiera tenido cero reproducciones

#### Scenario: Nunca bloquear el guardado
- **WHEN** un usuario intenta guardar una semana con campos incompletos en varias piezas
- **THEN** el sistema guarda lo capturado y no exige completar los campos faltantes

### Requirement: Mensajes de Meta y consultas en comentarios separados

El sistema SHALL guardar los mensajes contados por Meta y las consultas recibidas en comentarios en campos distintos, y SHALL derivar el total en tiempo de lectura. El sistema SHALL NOT guardar únicamente la suma.

El total que hoy se reporta ya es una suma hecha a mano: Meta cuenta las conversaciones iniciadas por bandeja, pero no cuenta a las personas que piden información en los comentarios de la publicación, y esas se suman aparte. Guardar solo el resultado destruye la trazabilidad y hace imposible saber cuánto pesa la parte manual.

#### Scenario: Total derivado
- **WHEN** una pieza tiene 40 mensajes de Meta y 7 consultas en comentarios
- **THEN** el total mostrado para esa pieza es 47
- **AND** ambos números originales permanecen consultables por separado

#### Scenario: Solo mensajes de Meta
- **WHEN** una pieza tiene 18 mensajes de Meta y las consultas en comentarios vacías
- **THEN** el total mostrado es 18

### Requirement: Total reportado sin desglose

Un registro semanal SHALL poder guardar un total de mensajes reportado, usado únicamente cuando el desglose entre Meta y comentarios es desconocido. El total efectivo de un registro SHALL ser el total reportado si está presente, y en su defecto la suma de mensajes de Meta y consultas en comentarios.

Este campo existe para la carga histórica: el cuaderno solo conserva la cifra final ya sumada. Poner esa cifra en el campo de mensajes de Meta sería registrar un dato falso.

#### Scenario: Fila histórica sin desglose
- **WHEN** se carga un registro histórico con total reportado 47, sin mensajes de Meta ni consultas en comentarios
- **THEN** el total efectivo del registro es 47
- **AND** el registro se distingue de uno desglosado al inspeccionarlo

#### Scenario: El desglose tiene precedencia en la captura corriente
- **WHEN** un usuario captura mensajes de Meta y consultas en comentarios en la pantalla semanal
- **THEN** el sistema no escribe el campo de total reportado

### Requirement: Degradación aceptada del grano

El sistema SHALL aceptar tres niveles de completitud como válidos: pieza con todas las métricas, pieza con mensajes solamente, y total agregado de línea. SHALL NOT exigir el nivel más completo ni advertir sobre los otros como errores.

El desglose por pieza es disciplina nueva para el área; el total por línea es lo que ya se lleva hoy. Si el sistema exige el nivel completo, el riesgo real no es un dato pobre sino el abandono y la vuelta al cuaderno.

#### Scenario: Semana registrada solo con totales de línea
- **WHEN** una semana se guarda únicamente con totales agregados de línea
- **THEN** el sistema la considera registrada y el resumen semanal funciona con normalidad

#### Scenario: Semana mixta entre líneas
- **WHEN** en una misma semana Filosofía se registra por pieza y Arteterapia por total de línea
- **THEN** el sistema guarda ambas sin advertencias y el resumen refleja cada línea correctamente

### Requirement: Progreso de la semana

La pantalla de captura SHALL mostrar cuántas de las unidades esperadas de la semana tienen registro, contando cada pieza activa y cada línea activa sin piezas activas como una unidad esperada.

Es la señal de si la semana está completa, y el sustituto de repasar el cuaderno para ver qué falta.

#### Scenario: Progreso parcial
- **WHEN** la semana espera cinco unidades y tres tienen registro guardado
- **THEN** la pantalla indica tres de cinco registradas

#### Scenario: Semana completa
- **WHEN** todas las unidades esperadas de la semana tienen registro
- **THEN** la pantalla indica la semana como completa

### Requirement: Borrador local de la captura

La pantalla de captura SHALL conservar localmente lo tecleado, asociado a la semana seleccionada, y SHALL restaurarlo si la sesión se interrumpe antes de guardar.

La captura ocurre desde un teléfono con conectividad intermitente. Un guardado fallido no debe costar volver a teclear la semana.

#### Scenario: Recuperación tras interrupción
- **WHEN** un usuario teclea cifras, la página se cierra sin guardar, y vuelve a abrir la misma semana
- **THEN** las cifras tecleadas aparecen restauradas y pendientes de guardar

#### Scenario: Borrador descartado al guardar
- **WHEN** un usuario guarda la semana correctamente
- **THEN** el borrador local de esa semana se descarta

### Requirement: Carga histórica a nivel de línea

El sistema SHALL permitir cargar registros semanales históricos a nivel de línea desde una superficie de escritorio, mediante archivo CSV o carga asistida. Esta superficie SHALL aceptar el total reportado sin desglose y campos vacíos.

La historia disponible en el cuaderno cubre enero a agosto de 2026 y solo a nivel de línea; no existe desglose por pieza. Transcribir cientos de filas desde un teléfono no es viable, por lo que la carga histórica es una superficie distinta de la captura semanal.

La carga histórica SHALL NOT bloquear la puesta en marcha de la captura semanal.

#### Scenario: Carga de un archivo histórico
- **WHEN** un usuario carga un archivo con filas de línea, semana y total reportado
- **THEN** el sistema crea un registro agregado por cada fila válida
- **AND** informa cuántas filas se cargaron

#### Scenario: Fila histórica en conflicto con un registro existente
- **WHEN** el archivo contiene una fila para una línea y semana que ya tiene registros
- **THEN** el sistema rechaza esa fila, la reporta, y carga el resto

#### Scenario: Semanas ausentes en la historia
- **WHEN** el cuaderno no tiene datos de algunas semanas del período cargado
- **THEN** esas semanas quedan sin registros
- **AND** el sistema no las presenta como semanas con cero mensajes
