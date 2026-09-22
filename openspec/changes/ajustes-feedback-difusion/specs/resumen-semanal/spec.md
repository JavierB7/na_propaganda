# Spec Delta

## MODIFIED Requirements

### Requirement: Desglose por pieza consultable

Cuando una línea tenga registros por pieza en la semana, el resumen SHALL permitir ver el detalle de cada pieza con su código, su descripción y sus métricas capturadas. La inversión SHALL mostrarse como el gasto de la semana registrado, sin derivarlo de otros campos.

Es el dato que sirve al área para decidir qué hacer, distinto del total que se le reporta al director.

#### Scenario: Ver el detalle de una línea desglosada
- **WHEN** un usuario consulta una línea con registros por pieza
- **THEN** el sistema muestra cada pieza con su código, descripción, reproducciones, mensajes de Meta, consultas en comentarios e inversión de la semana

#### Scenario: Inversión mostrada tal cual
- **WHEN** una pieza tiene una inversión de la semana de 34.60 dólares y 5 días activos
- **THEN** el resumen muestra 34.60 dólares como inversión de esa pieza
- **AND** no presenta la inversión como un valor por día multiplicado por días

#### Scenario: Pieza sin inversión registrada
- **WHEN** una pieza no tiene inversión registrada en la semana
- **THEN** el resumen la muestra como sin dato y no como cero dólares

#### Scenario: Línea con registro agregado no ofrece desglose
- **WHEN** un usuario consulta una línea cuyo registro de la semana es agregado
- **THEN** el sistema muestra el total y señala que esa semana no tiene desglose por pieza
