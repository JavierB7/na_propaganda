## 1. Andamiaje del proyecto

- [x] 1.1 Inicializar proyecto Next.js con App Router y TypeScript en la raíz del repositorio
- [x] 1.2 Configurar variables de entorno para Supabase y documentarlas en un `.env.example`
- [x] 1.3 Crear proyecto de Supabase y conectar cliente de servidor y de navegador
- [x] 1.4 Cargar Literata e Instrument Sans desde Google Fonts con fallbacks reales
- [x] 1.5 Definir los tokens de color y la escala tipográfica como variables CSS globales según `design.md`
- [ ] 1.6 Configurar despliegue en Vercel desde la rama principal

## 2. Esquema de datos

- [x] 2.1 Crear migración con la tabla `linea` (nombre único, unidad_exito nullable, activo, orden, columnas de atribución)
- [x] 2.2 Crear migración con la tabla `pieza` (linea_id, codigo único e inmutable, descripcion, fecha_subida, activo, meta_ad_id nullable, atribución)
- [x] 2.3 Crear migración con la tabla `registro_semanal` con todas las métricas nullable, `pieza_id` nullable, `linea_id` redundante, `mensajes_total_reportado`, `nota` y atribución
- [x] 2.4 Añadir índice único parcial `(pieza_id, semana_inicio)` para registros de pieza
- [x] 2.5 Añadir índice único parcial `(linea_id, semana_inicio)` para registros agregados de línea
- [x] 2.6 Añadir `check` que exige que `pieza.linea_id` coincida con `registro_semanal.linea_id`
- [x] 2.7 Implementar trigger que rechaza un agregado si ya existen registros de pieza en esa línea y semana, y viceversa
- [x] 2.8 Escribir semilla con las cinco líneas: Filosofía, Arteterapia, Filosofía Café, Librería, Filoart
- [x] 2.9 Verificar en base de datos que un agregado y registros de pieza no pueden coexistir en la misma línea y semana

## 3. Acceso y seguridad

- [ ] 3.1 Configurar autenticación de Supabase con enlace de acceso por correo, sin contraseñas propias del sistema
- [x] 3.2 Crear mecanismo de lista de usuarios autorizados y negar datos a cuentas autenticadas no autorizadas
- [x] 3.3 Activar seguridad a nivel de fila en las tres tablas y escribir políticas de lectura y escritura para usuarios autorizados
- [x] 3.4 Poblar automáticamente las columnas de creador y último editor en cada escritura
- [x] 3.5 Implementar middleware que envía a la pantalla de acceso a quien no tenga sesión
- [x] 3.6 Verificar con la clave pública del cliente y sin sesión autorizada que ninguna consulta devuelve filas

## 4. Catálogo de líneas y piezas

- [x] 4.1 Pantalla de configuración de líneas: listar, crear, editar nombre, unidad de éxito, orden y estado activo
- [x] 4.2 Rechazar nombres de línea duplicados, incluidos los de líneas inactivas
- [x] 4.3 Implementar generación del código de pieza con formato `<PREFIJO_LÍNEA>-<AAMM>-<NN>`, único e inmutable
- [x] 4.4 Pantalla de piezas: listar por línea, crear con descripción y fecha de subida, editar todo salvo el código, activar y desactivar
- [x] 4.5 Verificar que dos piezas de la misma línea en el mismo mes reciben códigos distintos
- [x] 4.6 Verificar que desactivar una línea o una pieza conserva sus registros históricos visibles

## 5. Lógica de dominio compartida

- [x] 5.1 Implementar utilidad de semana: resolver el lunes de una fecha dada, formatear el rango y navegar entre semanas
- [x] 5.2 Implementar cálculo del total efectivo de un registro con precedencia de `mensajes_total_reportado` sobre la suma, tratando nulos como ausencia
- [x] 5.3 Implementar suma por línea y semana que distingue ausencia de cero
- [x] 5.4 Implementar cálculo de unidades esperadas de la semana: cada pieza activa y cada línea activa sin piezas activas

## 6. Captura semanal

- [x] 6.1 Pantalla de captura móvil primero, con piezas activas agrupadas por línea y la unidad de éxito bajo cada nombre de línea
- [x] 6.2 Navegador de semana con controles grandes, abierto por defecto en la semana en curso, que carga los registros existentes para editar
- [x] 6.3 Campos numéricos con `inputmode="numeric"`, objetivos de toque de 48px o más, etiqueta a la izquierda y cifra a la derecha
- [x] 6.4 Total derivado por pieza visible en vivo mientras se teclea
- [x] 6.5 Opción de registrar solo el total de la línea, oculta cuando la línea ya tiene registros de pieza en esa semana
- [x] 6.6 Guardado único de toda la semana mediante Server Action, con actualización de registros existentes en lugar de duplicarlos
- [x] 6.7 Aceptar guardados parciales sin bloquear ni advertir por campos vacíos
- [x] 6.8 Barra de guardado fija respetando el área segura del dispositivo
- [x] 6.9 Indicador de progreso de la semana con la marca de completitud
- [x] 6.10 Borrador local por semana en `localStorage`, restaurado al reabrir y descartado al guardar con éxito
- [x] 6.11 Estados vacíos redactados como invitación a actuar, según el texto de `design.md`
- [x] 6.12 Mensajes de error que dicen qué pasó y cómo resolverlo, en la voz de la interfaz

## 7. Captura en escritorio

- [x] 7.1 Disposición de tabla para pantallas anchas, con piezas como filas y métricas como columnas
- [x] 7.2 Fila de total por línea y separación estructural entre líneas, sin columna comparable entre ellas
- [x] 7.3 Navegación por teclado donde `Tab` recorre la fila y `Enter` baja por la columna
- [x] 7.4 Columnas de solo lectura con los totales de las dos semanas previas, mostrando guion largo cuando no hay dato
- [x] 7.5 Verificar que la tabla desplaza horizontalmente en su propio contenedor y que el cuerpo de la página nunca lo hace

## 8. Resumen semanal

- [x] 8.1 Pantalla de resumen con el total de mensajes por línea para la semana seleccionada
- [x] 8.2 Mostrar la unidad de éxito de cada línea junto a su total
- [x] 8.3 Presentar las líneas en el orden configurado, sin control de ordenamiento por total y sin total global
- [x] 8.4 Marcar como sin registrar, no como cero, las líneas activas sin registros en la semana
- [x] 8.5 Mostrar los totales de las dos semanas previas por línea, con marca de ausencia de dato
- [x] 8.6 Desglose por pieza consultable cuando la línea tiene registros de pieza, con código, descripción y métricas
- [x] 8.7 Señalar que no hay desglose disponible cuando el registro de la semana es agregado
- [x] 8.8 Estado vacío cuando la semana no tiene ningún registro

## 9. Carga histórica

- [x] 9.1 Definir y documentar el formato CSV de carga histórica a nivel de línea, con `mensajes_total_reportado` y campos vacíos permitidos
- [x] 9.2 Superficie de escritorio para cargar el archivo, con vista previa antes de confirmar
- [x] 9.3 Crear un registro agregado por fila válida e informar cuántas filas se cargaron
- [x] 9.4 Rechazar e informar las filas cuya línea y semana ya tienen registros, cargando el resto
- [x] 9.5 Verificar que las semanas ausentes en el archivo quedan sin registros y no se presentan como cero
- [ ] 9.6 Inventariar el cuaderno con Carlos: cuántas semanas cubre y qué líneas incluye, antes de transcribir

## 10. Operación

- [x] 10.1 Tarea programada de respaldo semanal que exporta líneas, piezas y registros a CSV en destino independiente
- [x] 10.2 Registrar de forma visible las fallas de la tarea de respaldo
- [x] 10.3 Verificar el umbral vigente de pausa por inactividad del plan de Supabase
- [x] 10.4 Tarea programada de ping con frecuencia menor a ese umbral, y verificación de que mantiene el proyecto disponible
- [x] 10.5 Documentar en el README el arranque local, las variables de entorno y las tareas programadas

## 11. Acabado y verificación

- [x] 11.1 Preparar el activo del monograma NA y usarlo en la barra de la aplicación; disco completo en la pantalla de acceso
- [x] 11.2 Aplicar numerales tabulares y alineación a la derecha en todas las cifras
- [x] 11.3 Implementar la única animación del sistema: la marca de la semana completándose al guardar, respetando `prefers-reduced-motion`
- [x] 11.4 Verificar contraste de todos los pares de color y que `--cromo` nunca se use como color de texto
- [x] 11.5 Verificar foco visible en todos los controles y recorrido completo con teclado
- [ ] 11.6 Verificar la captura en un teléfono real y confirmar que registrar una semana toma menos de dos minutos
- [x] 11.7 Verificar que el zoom al 200% no rompe la tabla de escritorio
- [ ] 11.8 Confirmar los campos del grano pieza contra una captura de Meta Business Suite y ajustar nombres de columnas si hace falta
