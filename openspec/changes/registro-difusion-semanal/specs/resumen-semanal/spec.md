## ADDED Requirements

### Requirement: Resumen semanal por línea

El sistema SHALL mostrar, para una semana seleccionada, el total de mensajes de cada línea activa que tenga registros. El total de una línea SHALL ser la suma de los totales efectivos de sus registros de esa semana.

Este resumen es la única lectura de la primera versión, y es exactamente lo que el jefe del área dicta cada semana en la reunión con el director: cuántos escribieron a cada curso. Es lo que convierte el sistema en útil desde la primera semana en vez de útil el año siguiente.

#### Scenario: Total de una línea con desglose por pieza
- **WHEN** la línea Filosofía tiene dos piezas registradas en la semana, con totales efectivos 18 y 11
- **THEN** el resumen muestra 29 mensajes para Filosofía

#### Scenario: Total de una línea con registro agregado
- **WHEN** la línea Arteterapia tiene un registro agregado de 31 mensajes en la semana
- **THEN** el resumen muestra 31 mensajes para Arteterapia

#### Scenario: Línea sin registros en la semana
- **WHEN** una línea activa no tiene registros en la semana seleccionada
- **THEN** el resumen la presenta como sin registrar
- **AND** NO la presenta con cero mensajes

#### Scenario: Semana sin ningún registro
- **WHEN** la semana seleccionada no tiene registros en ninguna línea
- **THEN** el resumen indica que la semana no tiene registros e invita a capturarla

### Requirement: Las líneas nunca se presentan como comparables

El resumen SHALL presentar cada línea como una sección propia, con su total y su unidad de éxito. El sistema SHALL NOT presentar los totales de distintas líneas en una misma columna ordenable, ni ordenar líneas por su total, ni calcular un total global sumando líneas.

Cada línea tiene un embudo distinto y una escala de éxito distinta: veinte mensajes son un triunfo en arteterapia y un fracaso en librería, donde el resultado real son libros vendidos. Presentarlas como comparables produce conclusiones falsas, y es el error que el sistema existe para prevenir.

#### Scenario: Sin ranking entre líneas
- **WHEN** un usuario abre el resumen de una semana con varias líneas registradas
- **THEN** las líneas se presentan en el orden configurado del catálogo
- **AND** no existe control alguno para ordenarlas por total

#### Scenario: Unidad de éxito junto a las cifras
- **WHEN** una línea tiene unidad de éxito registrada
- **THEN** el resumen muestra ese texto junto al total de la línea

#### Scenario: Sin total global
- **WHEN** un usuario abre el resumen de una semana
- **THEN** el sistema no muestra un total general que sume las líneas entre sí

### Requirement: Contexto de las dos semanas previas

El resumen SHALL mostrar, junto al total de cada línea, los totales de esa misma línea en las dos semanas inmediatamente anteriores, en modo de solo lectura.

Es la comparación que el jefe del área ya hace de memoria — esta semana catorce, la semana anterior cuarenta y cuatro — y responderla con dos cifras evita construir un gráfico.

#### Scenario: Semanas previas con datos
- **WHEN** una línea tiene registros en la semana seleccionada y en las dos anteriores
- **THEN** el resumen muestra los tres totales, identificando la semana de cada uno

#### Scenario: Semana previa sin datos
- **WHEN** una de las dos semanas anteriores no tiene registros de esa línea
- **THEN** el resumen marca esa semana como sin dato
- **AND** NO la muestra como cero

### Requirement: Desglose por pieza consultable

Cuando una línea tenga registros por pieza en la semana, el resumen SHALL permitir ver el detalle de cada pieza con su código, su descripción y sus métricas capturadas.

Es el dato que sirve al área para decidir qué hacer, distinto del total que se le reporta al director.

#### Scenario: Ver el detalle de una línea desglosada
- **WHEN** un usuario consulta una línea con registros por pieza
- **THEN** el sistema muestra cada pieza con su código, descripción, reproducciones, mensajes de Meta, consultas en comentarios e inversión

#### Scenario: Línea con registro agregado no ofrece desglose
- **WHEN** un usuario consulta una línea cuyo registro de la semana es agregado
- **THEN** el sistema muestra el total y señala que esa semana no tiene desglose por pieza
