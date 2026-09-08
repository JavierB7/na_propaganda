-- Semilla de las cinco líneas confirmadas con Carlos.
--
-- La lista puede estar incompleta: el transcript menciona además eventos de
-- Nueva Acrópolis y eventos culturales como categorías propias. Por eso el
-- catálogo es configurable y esta semilla es solo un punto de partida que
-- Carlos confirma o amplía al abrir la aplicación.
--
-- Las unidades de éxito salen de lo que él mismo dijo en la reunión. Son
-- editables; están aquí para que el campo no arranque vacío y para dejar
-- escrito un criterio que hoy solo existe en su memoria.

insert into public.linea (nombre, prefijo, orden, unidad_exito) values
  (
    'Filosofía',
    'FIL',
    10,
    'Es la matriz de la escuela: se le invierte más y se le exige más. Un curso flojo se nota aquí primero.'
  ),
  (
    'Arteterapia',
    'ART',
    20,
    'Otro embudo. Dos asistentes en la semana ya es un triunfo.'
  ),
  (
    'Filosofía Café',
    'CAF',
    30,
    'Se mide por asistencia al evento, no por inscripciones a un curso.'
  ),
  (
    'Librería',
    'LIB',
    40,
    'El resultado real son libros vendidos, no personas que escriben. Una campaña llegó a 90 mensajes y 150 libros.'
  ),
  (
    'Filoart',
    'FLA',
    50,
    'Evento macro cultural. Justifica la inversión diaria más alta del área.'
  )
on conflict do nothing;
