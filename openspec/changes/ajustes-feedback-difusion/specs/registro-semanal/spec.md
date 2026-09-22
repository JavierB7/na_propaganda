# Spec Delta

## MODIFIED Requirements

### Requirement: Definición de semana

El sistema SHALL identificar cada semana por la fecha de su lunes. Una semana SHALL abarcar siete días, de lunes a domingo, ambos incluidos. La pantalla de captura SHALL abrir por defecto en la semana en curso y SHALL permitir moverse a semanas anteriores y posteriores.

La semana en curso y la fecha de hoy SHALL determinarse según el calendario de Caracas (America/Caracas), independientemente de la zona horaria del servidor o del dispositivo.

Sin una definición única de semana, dos cargas hechas el mismo jueves producen filas distintas y los totales mienten. La zona de referencia importa porque el registro se hace el domingo en la noche: si se calcula en UTC, desde las 20:00 de Caracas ya es lunes y la captura abre una semana vacía.

#### Scenario: Apertura en la semana en curso
- **WHEN** un usuario abre la pantalla de captura un jueves
- **THEN** la semana seleccionada es la que contiene ese jueves, identificada por su lunes

#### Scenario: Registro el domingo en la noche
- **WHEN** un usuario abre la pantalla de captura el domingo 13 de septiembre a las 22:00, hora de Caracas
- **THEN** la semana seleccionada es la del lunes 7 al domingo 13 de septiembre

#### Scenario: El lunes abre la semana nueva
- **WHEN** un usuario abre la pantalla de captura el lunes 14 de septiembre a las 00:30, hora de Caracas
- **THEN** la semana seleccionada es la que empieza el lunes 14 de septiembre

#### Scenario: Navegación entre semanas
- **WHEN** un usuario retrocede una semana
- **THEN** el sistema muestra los registros ya guardados de esa semana, si existen, listos para editar

#### Scenario: Dos cargas de la misma semana no duplican
- **WHEN** un usuario guarda cifras de una pieza y más tarde vuelve a la misma semana y las corrige
- **THEN** el sistema actualiza el registro existente en lugar de crear uno nuevo

### Requirement: Campos de medición

Un registro semanal SHALL poder guardar reproducciones, mensajes contados por Meta, consultas recibidas en comentarios, inversión de la semana en dólares y días activos. Todos los campos SHALL ser nullable.

Cada cifra SHALL corresponder únicamente a la semana del registro, de lunes a domingo, tal como la reporta Meta para ese rango. El sistema SHALL NOT acumular cifras entre semanas.

La inversión SHALL ser el importe gastado que reporta Meta para la semana, guardado tal cual. El sistema SHALL NOT derivarla de un presupuesto diario ni de los días activos. Los días activos SHALL estar entre 0 y 7, y son contexto: no participan en ningún cálculo.

Los nombres y la existencia real de los campos del grano pieza son una suposición pendiente de confirmar contra una captura de Meta Business Suite a nivel de anuncio. Al ser columnas planas y nullable, corregirlas es una migración trivial.

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

#### Scenario: Inversión guardada tal cual
- **WHEN** un usuario captura una inversión de 34.60 dólares y 5 días activos para una pieza
- **THEN** la inversión registrada y mostrada es 34.60 dólares
- **AND** el sistema no la multiplica ni la divide por los días activos

#### Scenario: Días activos fuera de rango
- **WHEN** se intenta guardar un registro con 8 días activos
- **THEN** el sistema rechaza el valor, porque una semana tiene como máximo siete días

#### Scenario: Una pieza en varias semanas
- **WHEN** una pieza activa se registra en tres semanas consecutivas con 12, 30 y 18 mensajes
- **THEN** cada semana conserva su propia cifra
- **AND** ninguna semana muestra la suma de las anteriores

### Requirement: Carga histórica a nivel de línea

El sistema SHALL permitir cargar registros semanales históricos a nivel de línea desde una superficie de escritorio, mediante archivo CSV o carga asistida. Esta superficie SHALL aceptar el total reportado sin desglose y campos vacíos.

La inversión en el archivo SHALL interpretarse como el gasto de la semana. La superficie SHALL NOT aceptar una columna de inversión por día.

La historia disponible en el cuaderno cubre enero a agosto de 2026 y solo a nivel de línea; no existe desglose por pieza. Las cifras del cuaderno son semanales, no acumuladas. Transcribir cientos de filas desde un teléfono no es viable, por lo que la carga histórica es una superficie distinta de la captura semanal.

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

#### Scenario: Archivo con inversión semanal
- **WHEN** un usuario carga un archivo con una columna de inversión con el valor 34.60 en una fila
- **THEN** el registro creado tiene una inversión de la semana de 34.60 dólares

#### Scenario: Archivo con inversión por día
- **WHEN** un usuario carga un archivo cuya columna de inversión está rotulada como valor por día
- **THEN** el sistema no reconoce esa columna e informa que la inversión se espera como gasto de la semana

## ADDED Requirements

### Requirement: Rango de Meta indicado en la captura

La pantalla de captura SHALL mostrar el rango de fechas, del lunes al domingo de la semana seleccionada, que el usuario debe elegir en Meta para leer las cifras.

El error más probable al transcribir es copiar las cifras con el rango por defecto de Meta, que es acumulado o de los últimos treinta días. El sistema no puede detectar ese error después de guardado. Nombrar el rango exacto en el momento de la captura es la defensa más barata.

#### Scenario: Rango visible en la semana seleccionada
- **WHEN** un usuario abre la captura de la semana que empieza el lunes 7 de septiembre
- **THEN** la pantalla indica que en Meta debe elegir del lunes 7 al domingo 13 de septiembre

#### Scenario: Rango que cruza de mes
- **WHEN** un usuario abre la captura de la semana que empieza el lunes 28 de septiembre
- **THEN** la pantalla indica que en Meta debe elegir del lunes 28 de septiembre al domingo 4 de octubre
