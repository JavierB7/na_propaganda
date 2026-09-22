## ADDED Requirements

### Requirement: Líneas de difusión configurables

El sistema SHALL mantener un catálogo de líneas de difusión. Cada línea tiene nombre, estado activo y orden de presentación. El catálogo SHALL inicializarse con Filosofía, Arteterapia, Filosofía Café, Librería y Filoart, y SHALL permitir agregar líneas nuevas sin cambios de código, porque la lista confirmada con Carlos puede estar incompleta.

Una línea nunca se elimina: se desactiva. Los registros históricos de una línea desactivada SHALL seguir siendo legibles.

#### Scenario: Catálogo inicial disponible al primer acceso
- **WHEN** un usuario autenticado abre la pantalla de configuración por primera vez
- **THEN** el sistema muestra las cinco líneas sembradas, todas activas

#### Scenario: Agregar una línea nueva
- **WHEN** un usuario crea una línea con nombre "Eventos culturales"
- **THEN** la línea queda disponible para registrar en la semana en curso y en semanas posteriores

#### Scenario: Desactivar una línea con historia
- **WHEN** un usuario desactiva una línea que tiene registros semanales
- **THEN** la línea deja de aparecer en la pantalla de captura
- **AND** sus registros anteriores siguen apareciendo en el resumen de las semanas en que fueron registrados

#### Scenario: Nombre de línea duplicado
- **WHEN** un usuario intenta crear una línea con el nombre de una línea existente, activa o inactiva
- **THEN** el sistema rechaza la operación e informa que esa línea ya existe

### Requirement: Unidad de éxito por línea

Cada línea SHALL poder guardar una unidad de éxito en texto libre, opcional, que describa qué significa un buen resultado en esa línea. El sistema SHALL mostrar ese texto junto a las cifras de la línea en la captura y en el resumen.

Este campo existe porque el criterio de éxito difiere radicalmente entre líneas — veinte mensajes son un triunfo en arteterapia y un fracaso en librería — y hoy ese criterio solo vive en la memoria del jefe del área. El sistema no interpreta ni valida este texto: lo conserva y lo muestra.

#### Scenario: Registrar la unidad de éxito
- **WHEN** un usuario guarda la unidad de éxito "Dos asistentes en la semana ya es triunfo" en la línea Arteterapia
- **THEN** ese texto aparece bajo el nombre de la línea en la pantalla de captura y en el resumen semanal

#### Scenario: Línea sin unidad de éxito
- **WHEN** una línea no tiene unidad de éxito registrada
- **THEN** la línea se muestra sin ese texto y sin espacio vacío reservado, y sigue siendo utilizable

### Requirement: Piezas con código autogenerado

El sistema SHALL mantener un catálogo de piezas publicitarias. Cada pieza pertenece a exactamente una línea y tiene código, descripción, fecha de subida, estado activo e identificador de anuncio de Meta opcional.

El código SHALL ser generado por el sistema y SHALL ser único e inmutable. El usuario nunca lo escribe. Este requisito existe porque hoy las piezas se nombran de forma informal y no se pueden seguir en el tiempo; si se le pide al usuario inventar el código, el identificador se degrada y se pierde la trazabilidad que justifica el sistema.

La descripción es texto libre y sirve para que la persona reconozca la pieza.

#### Scenario: Alta de pieza genera código
- **WHEN** un usuario crea una pieza en la línea Filosofía con descripción "Isrey con Alejandro" y fecha de subida
- **THEN** el sistema asigna un código único derivado de la línea y la fecha, sin pedirlo al usuario
- **AND** el código se muestra junto a la descripción

#### Scenario: El código no se puede editar
- **WHEN** un usuario edita una pieza existente
- **THEN** puede cambiar descripción, fecha de subida, estado activo e identificador de Meta
- **AND** el código permanece igual

#### Scenario: Dos piezas de la misma línea en el mismo mes
- **WHEN** un usuario crea dos piezas en la línea Filosofía en el mismo mes
- **THEN** el sistema asigna a cada una un código distinto

### Requirement: Estado activo de la pieza determina la captura

El estado activo de la pieza SHALL ser lo único que determina si aparece en la pantalla de captura semanal. El sistema SHALL NOT modelar campañas, ciclos ni fases de prueba y escala.

Esta decisión es deliberada: el ciclo real de una campaña — cuatro videos lanzados, se refuerza el que funciona — se conoce, y modelarlo agregaría estructura que nadie mantendría. La bandera activa cubre el caso sin costo.

#### Scenario: Pieza activa aparece en la captura
- **WHEN** una pieza está marcada como activa
- **THEN** aparece en la pantalla de captura de la semana en curso, agrupada bajo su línea

#### Scenario: Pieza desactivada deja de aparecer
- **WHEN** un usuario desactiva una pieza que tiene registros semanales
- **THEN** la pieza deja de aparecer en la captura de semanas posteriores
- **AND** sus registros anteriores permanecen intactos y visibles en el resumen de sus semanas

### Requirement: Identificador de anuncio de Meta opcional

Cada pieza SHALL poder guardar un identificador de anuncio de Meta, opcional y vacío por defecto. El sistema no lo usa en esta versión.

Existe desde el inicio para que la eventual automatización de la lectura de Meta sea una unión de datos y no una remodelación del esquema.

#### Scenario: Pieza sin identificador de Meta
- **WHEN** un usuario crea una pieza sin llenar el identificador de Meta
- **THEN** la pieza se guarda correctamente y es utilizable en la captura
