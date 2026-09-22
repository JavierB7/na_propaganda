## ADDED Requirements

### Requirement: Acceso restringido a usuarios autorizados

El sistema SHALL exigir autenticación para toda lectura y escritura. El acceso SHALL limitarse a una lista corta de usuarios autorizados, inicialmente dos: el jefe del área de difusión y el desarrollador. Un usuario autenticado que no esté autorizado SHALL NOT ver ningún dato.

No se modelan roles. Ambos usuarios pueden hacer todo. Dos usuarios reales no cuestan más que una credencial compartida, y en un sistema cuyo propósito es que el dato sobreviva a la persona, saber quién registró qué es parte del propósito.

#### Scenario: Acceso sin sesión
- **WHEN** una persona sin sesión abre cualquier pantalla del sistema
- **THEN** el sistema la envía a la pantalla de acceso y no expone datos

#### Scenario: Usuario autorizado
- **WHEN** un usuario de la lista de autorizados inicia sesión
- **THEN** accede a la captura, al resumen y a la configuración sin restricciones entre sí

#### Scenario: Usuario autenticado no autorizado
- **WHEN** una persona se autentica con una cuenta que no está autorizada
- **THEN** el sistema le niega el acceso a los datos y muestra un mensaje que explica que su cuenta no tiene acceso

### Requirement: Autenticación sin contraseñas gestionadas por el usuario

El acceso SHALL hacerse mediante enlace de acceso por correo o proveedor de identidad, sin que el usuario cree ni recuerde una contraseña propia del sistema.

La captura ocurre desde un teléfono y el usuario principal no es técnico. Una contraseña más es una barrera de abandono y un riesgo de credencial compartida.

#### Scenario: Acceso por enlace
- **WHEN** un usuario autorizado solicita acceso con su correo
- **THEN** el sistema le envía un enlace de acceso y la sesión queda establecida al abrirlo

#### Scenario: Sesión persistente
- **WHEN** un usuario ya autenticado vuelve a abrir la aplicación en el mismo dispositivo
- **THEN** la sesión sigue activa y no se le pide autenticarse de nuevo

### Requirement: Aislamiento en la base de datos

Toda tabla SHALL tener seguridad a nivel de fila activa, con políticas que concedan lectura y escritura solo a usuarios autorizados. Las políticas SHALL ser la frontera de autorización; la interfaz SHALL NOT ser el único control.

Sin esto, la clave pública del cliente expone los datos completos a cualquiera que la extraiga del navegador.

#### Scenario: Seguridad a nivel de fila activa en todas las tablas
- **WHEN** se inspecciona el esquema de la base de datos
- **THEN** todas las tablas de datos tienen seguridad a nivel de fila activa

#### Scenario: Lectura directa sin sesión válida
- **WHEN** se consulta la base de datos con la clave pública del cliente y sin sesión de un usuario autorizado
- **THEN** la consulta no devuelve filas

### Requirement: Atribución de escrituras

Cada registro semanal, línea y pieza SHALL guardar qué usuario lo creó y qué usuario lo modificó por última vez, con su fecha y hora. Esta información SHALL ser consultable.

Responde la pregunta que aparece en cuanto dos personas registran sobre el mismo dato, y sostiene el escenario de relevo del encargado del área.

#### Scenario: Creación atribuida
- **WHEN** un usuario guarda un registro semanal nuevo
- **THEN** el registro queda con ese usuario y ese momento como creador

#### Scenario: Corrección atribuida
- **WHEN** un usuario corrige un registro creado por otro
- **THEN** el registro conserva su creador original y actualiza quién lo modificó por última vez y cuándo

### Requirement: Respaldo periódico de los datos

El sistema SHALL producir un respaldo completo de los datos en formato CSV de manera programada y al menos semanal, en un destino independiente de la base de datos.

Los datos son pocos y son el activo entero del proyecto. El plan gratuito no ofrece recuperación a un punto en el tiempo, y una fila borrada por error no tendría vuelta atrás.

#### Scenario: Respaldo programado
- **WHEN** se cumple el momento programado del respaldo
- **THEN** el sistema exporta líneas, piezas y registros semanales a CSV en el destino de respaldo

#### Scenario: Respaldo fallido
- **WHEN** una ejecución del respaldo falla
- **THEN** la falla queda registrada de forma visible para el desarrollador

### Requirement: Continuidad del proyecto ante inactividad

El sistema SHALL contar con una tarea programada que mantenga activo el proyecto de base de datos con una consulta periódica, con frecuencia menor al umbral de pausa por inactividad del plan contratado.

El uso es intermitente por diseño: cuando un curso cierra no hay registro hasta que abre el siguiente, y pueden pasar semanas sin que nadie entre. Un proyecto pausado se descubriría justo el día en que se necesita el dato.

#### Scenario: Sin actividad de usuarios
- **WHEN** transcurren varias semanas sin que ningún usuario inicie sesión
- **THEN** la tarea programada sigue ejecutándose y el proyecto de base de datos permanece disponible

#### Scenario: Verificación de disponibilidad
- **WHEN** un usuario vuelve a entrar después de un período largo de inactividad
- **THEN** la aplicación carga y los datos históricos están disponibles
